/** Synthesised ambient music for the demo (original, royalty-free): a tanpura-like drone with a slow bell arpeggio. */
const SR = 22050;

function bell(buf: Float32Array, start: number, freq: number, dur: number, amp: number) {
  const n = Math.min(Math.floor(dur * SR), buf.length - start);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 2.2) * Math.min(1, t * 60);
    const v = Math.sin(2 * Math.PI * freq * t) + 0.42 * Math.sin(2 * Math.PI * freq * 2.005 * t) * Math.exp(-t * 3) + 0.2 * Math.sin(2 * Math.PI * freq * 3.01 * t) * Math.exp(-t * 5);
    buf[start + i] += v * env * amp;
  }
}

function drone(buf: Float32Array, freq: number, amp: number) {
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const lfo = 0.65 + 0.35 * Math.sin(2 * Math.PI * 0.11 * t + freq);
    buf[i] += (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 2 * t) + 0.25 * Math.sin(2 * Math.PI * freq * 3 * t)) * amp * lfo;
  }
}

function reverb(buf: Float32Array) {
  const taps = [[0.043, 0.36], [0.079, 0.28], [0.131, 0.2], [0.197, 0.14], [0.283, 0.09]];
  const out = new Float32Array(buf);
  for (const [d, g] of taps) {
    const off = Math.floor(d * SR);
    for (let i = off; i < buf.length; i++) out[i] += buf[i - off] * g;
  }
  return out;
}

function toWav(buf: Float32Array): Buffer {
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const gain = peak ? 0.7 / peak : 1;
  const fade = Math.floor(SR * 1.6);
  const data = Buffer.alloc(44 + buf.length * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + buf.length * 2, 4); data.write("WAVE", 8); data.write("fmt ", 12);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 2, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write("data", 36); data.writeUInt32LE(buf.length * 2, 40);
  for (let i = 0; i < buf.length; i++) {
    const f = Math.min(1, i / fade, (buf.length - i) / fade);
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(buf[i] * gain * f * 32767))), 44 + i * 2);
  }
  return data;
}

const HZ = (semi: number) => 261.63 * Math.pow(2, semi / 12);
/** Mohanam-like pentatonic: S R2 G3 P D2 (C D E G A). */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

export function makeAmbientWav(seconds = 44): Buffer {
  const buf = new Float32Array(SR * seconds);
  drone(buf, HZ(-24), 0.16);
  drone(buf, HZ(-17), 0.1);
  const pattern = [0, 2, 3, 5, 4, 3, 2, 1, 0, 2, 4, 6, 5, 4, 3, 2];
  const step = 0.62;
  for (let k = 0, t = 0.4; t < seconds - 3; k++, t += step) {
    const idx = pattern[k % pattern.length] + (k % 32 >= 16 ? 1 : 0);
    bell(buf, Math.floor(t * SR), HZ(SCALE[idx % SCALE.length] + (idx >= SCALE.length ? 12 : 0)), 2.6, 0.22);
    if (k % 4 === 0) bell(buf, Math.floor(t * SR), HZ(SCALE[0] - 12), 3.5, 0.12);
  }
  return toWav(reverb(buf));
}

/** A tiny original melody for the "guess the song" round: [semitone-index, beats]. */
export function makeMelodyWav(notes: [number, number][], bpm = 96): Buffer {
  const beat = 60 / bpm;
  const total = notes.reduce((s, [, b]) => s + b, 0) * beat + 2.2;
  const buf = new Float32Array(Math.ceil(SR * total));
  let t = 0.15;
  for (const [n, b] of notes) {
    bell(buf, Math.floor(t * SR), HZ(SCALE[Math.abs(n) % SCALE.length] + (n < 0 ? -12 : 0)), 1.6, 0.3);
    t += b * beat;
  }
  return toWav(reverb(buf));
}
