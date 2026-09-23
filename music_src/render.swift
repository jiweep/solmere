// Offline MIDI stem renderer: drives Apple's AUMIDISynth (GS sound bank) sample-accurately
// and writes 32-bit float stereo WAVs. Usage: render <job.json>
//   job = { sampleRate, stems: [ { out, program, bankMSB, bankLSB, channel, length, events: [[t, status, d1, d2], ...] } ] }
import Foundation
import AVFoundation
import AudioToolbox

struct Stem: Decodable { let out: String; let program: Int; let bankMSB: Int; let bankLSB: Int; let channel: Int; let length: Double; let events: [[Double]] }
struct Job: Decodable { let sampleRate: Double; let stems: [Stem]; let bank: String? }

let args = CommandLine.arguments
guard args.count > 1, let data = FileManager.default.contents(atPath: args[1]) else { print("usage: render job.json"); exit(1) }
let job = try JSONDecoder().decode(Job.self, from: data)
let sr = job.sampleRate

func renderStem(_ st: Stem) throws {
  let engine = AVAudioEngine()
  let desc = AudioComponentDescription(componentType: kAudioUnitType_MusicDevice, componentSubType: kAudioUnitSubType_MIDISynth, componentManufacturer: kAudioUnitManufacturer_Apple, componentFlags: 0, componentFlagsMask: 0)
  let synth = AVAudioUnitMIDIInstrument(audioComponentDescription: desc)
  engine.attach(synth)
  let fmt = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 2)!
  engine.connect(synth, to: engine.mainMixerNode, format: fmt)
  let au = synth.audioUnit
  let bankPath = job.bank ?? "/System/Library/Components/CoreAudio.component/Contents/Resources/gs_instruments.dls"
  var bankURL: Unmanaged<CFURL> = Unmanaged.passRetained(URL(fileURLWithPath: bankPath) as CFURL)
  let bst = AudioUnitSetProperty(au, AudioUnitPropertyID(kMusicDeviceProperty_SoundBankURL), kAudioUnitScope_Global, 0, &bankURL, UInt32(MemoryLayout<Unmanaged<CFURL>>.size))
  if bst != noErr { print("sound bank load failed:", bst) }
  try engine.enableManualRenderingMode(.offline, format: fmt, maximumFrameCount: 4096)
  try engine.start()
  let ch = UInt8(st.channel)
  func midi(_ s: UInt8, _ a: UInt8, _ b: UInt8) { MusicDeviceMIDIEvent(au, UInt32(s), UInt32(a), UInt32(b), 0) }
  // preload the instrument, then select it
  var on: UInt32 = 1
  AudioUnitSetProperty(au, AudioUnitPropertyID(kAUMIDISynthProperty_EnablePreload), kAudioUnitScope_Global, 0, &on, 4)
  midi(0xB0 | ch, 0, UInt8(st.bankMSB)); midi(0xB0 | ch, 32, UInt8(st.bankLSB)); midi(0xC0 | ch, UInt8(st.program), 0)
  on = 0
  AudioUnitSetProperty(au, AudioUnitPropertyID(kAUMIDISynthProperty_EnablePreload), kAudioUnitScope_Global, 0, &on, 4)
  midi(0xB0 | ch, 0, UInt8(st.bankMSB)); midi(0xB0 | ch, 32, UInt8(st.bankLSB)); midi(0xC0 | ch, UInt8(st.program), 0)
  midi(0xB0 | ch, 91, 0); midi(0xB0 | ch, 93, 0)  // dry: reverb/chorus are applied in the mixer
  let total = AVAudioFrameCount(st.length * sr)
  let out = try AVAudioFile(forWriting: URL(fileURLWithPath: st.out), settings: [AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: sr, AVNumberOfChannelsKey: 2, AVLinearPCMBitDepthKey: 32, AVLinearPCMIsFloatKey: true], commonFormat: .pcmFormatFloat32, interleaved: false)
  let buf = AVAudioPCMBuffer(pcmFormat: engine.manualRenderingFormat, frameCapacity: 4096)!
  let evs = st.events.sorted { $0[0] < $1[0] }
  var ei = 0
  var frame: AVAudioFrameCount = 0
  let block: AVAudioFrameCount = 256
  while frame < total {
    let n = min(block, total - frame)
    // sample-accurate: every event due inside this block is sent with its frame offset
    while ei < evs.count && Int((evs[ei][0] * sr).rounded()) < Int(frame + n) {
      let e = evs[ei]; let status = UInt8(Int(e[1])) | ch
      let off = max(0, Int((e[0] * sr).rounded()) - Int(frame))
      MusicDeviceMIDIEvent(au, UInt32(status), UInt32(Int(e[2])), UInt32(Int(e.count > 3 ? e[3] : 0)), UInt32(off))
      ei += 1
    }
    let r = try engine.renderOffline(n, to: buf)
    if r != .success { print("render status", r.rawValue); break }
    try out.write(from: buf)
    frame += n
  }
  engine.stop()
}
for st in job.stems { try renderStem(st) }
print("rendered \(job.stems.count) stems")
