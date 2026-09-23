#!/bin/bash
# Double-click me to start Solmere (and the LAN co-op server).
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js is required" message "Install Node.js from https://nodejs.org, then double-click Play.command again. (You can also open index.html directly for single-player.)"'
  exit 1
fi
PORT=8080
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
( sleep 1; open "http://localhost:$PORT" ) &
node server.js $PORT
