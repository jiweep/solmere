#!/usr/bin/env node
// ============================================================================
//  SOLMERE — local game server + LAN co-op relay. Zero dependencies.
//  Usage:  node server.js [port]      (default 8080)
//  Then open http://localhost:PORT on this machine, and
//  http://<this machine's LAN IP>:PORT on your friend's machine.
// ============================================================================
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const PORT = +(process.argv[2] || process.env.PORT || 8080);
const ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain' };

function lanIPs() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  return out;
}
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/net-info') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ips: lanIPs(), port: PORT, rooms: [...rooms.entries()].map(([k, v]) => ({ code: k, players: [...v].map(c => c.name) })) })); return; }
  let p = path.normalize(path.join(ROOT, url === '/' ? 'index.html' : url));
  if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.stat(p, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(p).pipe(res);
  });
});

// ------------------------------------------------------------ WebSocket ---
const rooms = new Map(); // code -> Set<client>
let nextId = 1;
function wsSend(sock, str) {
  if (sock.destroyed) return;
  const payload = Buffer.from(str, 'utf8'); const n = payload.length;
  let head;
  if (n < 126) head = Buffer.from([0x81, n]);
  else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(n, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
  try { sock.write(Buffer.concat([head, payload])); } catch (e) { }
}
function wsControl(sock, op, data = Buffer.alloc(0)) { try { sock.write(Buffer.concat([Buffer.from([0x80 | op, data.length]), data])); } catch (e) { } }
function broadcast(client, msg, includeSelf = false) {
  const room = rooms.get(client.room); if (!room) return;
  const s = typeof msg === 'string' ? msg : JSON.stringify(msg);
  for (const c of room) if (includeSelf || c !== client) wsSend(c.sock, s);
}
function leave(client) {
  const room = rooms.get(client.room); if (!room) return;
  room.delete(client);
  broadcast(client, { t: 'peer_left', id: client.id, name: client.name });
  if (!room.size) rooms.delete(client.room);
  console.log(`[link] ${client.name} left room ${client.room}`);
  client.room = null;
}
server.on('upgrade', (req, sock) => {
  if (req.headers.upgrade !== 'websocket' || !req.url.startsWith('/ws')) { sock.destroy(); return; }
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  sock.setNoDelay(true);
  const client = { id: nextId++, sock, room: null, name: 'Tamer', alive: true };
  let buf = Buffer.alloc(0), frag = [];
  sock.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const fin = buf[0] & 0x80, op = buf[0] & 0x0f, masked = buf[1] & 0x80; let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      const mOff = off; if (masked) off += 4;
      if (buf.length < off + len) return;
      let data = buf.slice(off, off + len);
      if (masked) { const m = buf.slice(mOff, mOff + 4); data = Buffer.from(data); for (let i = 0; i < data.length; i++) data[i] ^= m[i & 3]; }
      buf = buf.slice(off + len);
      if (op === 8) { wsControl(sock, 8); sock.end(); return; }
      if (op === 9) { wsControl(sock, 10, data); continue; }
      if (op === 10) { client.alive = true; continue; }
      if (op === 1 || op === 0) {
        frag.push(data);
        if (!fin) continue;
        const text = Buffer.concat(frag).toString('utf8'); frag = [];
        let msg; try { msg = JSON.parse(text); } catch (e) { continue; }
        handle(client, msg, text);
      }
    }
  });
  const bye = () => { if (client.room) leave(client); };
  sock.on('close', bye); sock.on('error', bye); sock.on('end', bye);
});
function handle(client, msg, raw) {
  if (msg.t === 'join') {
    if (client.room) leave(client);
    const code = String(msg.room || 'SOLMERE').toUpperCase().slice(0, 12);
    let room = rooms.get(code);
    if (!room) { room = new Set(); rooms.set(code, room); }
    if (room.size >= 2) { wsSend(client.sock, JSON.stringify({ t: 'join_fail', reason: 'That room already has two players.' })); return; }
    client.name = String(msg.name || 'Tamer').slice(0, 12); client.room = code;
    const others = [...room].map(c => ({ id: c.id, name: c.name }));
    room.add(client);
    wsSend(client.sock, JSON.stringify({ t: 'joined', id: client.id, room: code, peers: others, host: others.length === 0 }));
    broadcast(client, { t: 'peer_joined', id: client.id, name: client.name });
    console.log(`[link] ${client.name} joined room ${code} (${room.size}/2)`);
    return;
  }
  if (!client.room) return;
  // everything else is relayed verbatim to the other player(s) in the room
  msg.from = client.id;
  broadcast(client, msg);
}
setInterval(() => { for (const room of rooms.values()) for (const c of room) { if (!c.alive) { c.sock.destroy(); continue; } c.alive = false; wsControl(c.sock, 9); } }, 20000);

server.listen(PORT, '0.0.0.0', () => {
  const ips = lanIPs();
  console.log('\n  ☀  SOLMERE is running!\n');
  console.log(`  Play on this machine:   http://localhost:${PORT}`);
  for (const ip of ips) console.log(`  Co-op partner (LAN):    http://${ip}:${PORT}`);
  console.log('\n  Both players open the game, then choose  Menu ▸ Link (Co-op)  and join the same room code.');
  console.log('  Press Ctrl+C to stop the server.\n');
});
server.on('error', e => { if (e.code === 'EADDRINUSE') { console.error(`Port ${PORT} is in use. Try: node server.js ${PORT + 1}`); process.exit(1); } throw e; });
