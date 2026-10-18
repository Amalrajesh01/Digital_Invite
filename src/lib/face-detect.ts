import cascade from "./face-cascade.json";

/**
 * A small face finder: the classic Viola–Jones detector run with OpenCV's stump-based frontal-face Haar cascade
 * (src/lib/face-cascade.json, converted by scripts/dev/make-face-cascade.mjs; Intel/OpenCV BSD-style licence — see
 * assets/CREDITS-face-cascade.txt). It needs no network and no native code, runs on a grey-scale copy of the picture, and is
 * good on ordinary front-facing portraits. It will miss a face that is turned away, tiny, or hidden — callers must have a
 * fallback. Pure function: server-, browser- and test-safe.
 */
interface Cascade { size: number; features: number[][][]; stages: { t: number; s: number[][] }[] }
const C = cascade as unknown as Cascade;

export interface Box { x: number; y: number; size: number; neighbours: number }

/** Face boxes (x, y = top-left corner, size = side, in pixels of the picture passed in), best first. */
export function detectBoxes(gray: Uint8Array | Uint8ClampedArray, w: number, h: number, minNeighbours = 3): Box[] {
  const W1 = w + 1;
  const ii = new Int32Array(W1 * (h + 1));
  const sq = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0, rowSq = 0;
    for (let x = 0; x < w; x++) {
      const v = gray[y * w + x];
      row += v; rowSq += v * v;
      ii[(y + 1) * W1 + x + 1] = ii[y * W1 + x + 1] + row;
      sq[(y + 1) * W1 + x + 1] = sq[y * W1 + x + 1] + rowSq;
    }
  }
  const rect = (a: Int32Array | Float64Array, x: number, y: number, rw: number, rh: number) => a[(y + rh) * W1 + x + rw] - a[y * W1 + x + rw] - a[(y + rh) * W1 + x] + a[y * W1 + x];

  const found: { x: number; y: number; s: number }[] = [];
  const base = C.size;
  for (let scale = 1; base * scale <= Math.min(w, h); scale *= 1.18) {
    const win = Math.round(base * scale);
    // this scale's rectangles, with the first rectangle's weight re-balanced so a flat patch sums to zero (as OpenCV does)
    const scaled = C.features.map((f) => {
      const r = f.map(([rx, ry, rw, rh, wt]) => ({ x: Math.round(rx * scale), y: Math.round(ry * scale), w: Math.round(rw * scale), h: Math.round(rh * scale), wt }));
      let other = 0;
      for (let k = 1; k < r.length; k++) other += r[k].wt * r[k].w * r[k].h;
      const a0 = r[0].w * r[0].h;
      if (a0 > 0) r[0].wt = -other / a0;
      return r;
    });
    const area = win * win, inv = 1 / area;
    const step = Math.max(1, Math.round(win / 12));
    for (let y = 0; y + win <= h; y += step) {
      for (let x = 0; x + win <= w; x += step) {
        const mean = rect(ii, x, y, win, win) * inv;
        const v = rect(sq, x, y, win, win) * inv - mean * mean;
        const norm = v > 0 ? Math.sqrt(v) : 1;
        let pass = true;
        for (const stage of C.stages) {
          let total = 0;
          for (const [fi, thr, left, right] of stage.s) {
            let f = 0;
            for (const r of scaled[fi]) f += r.wt * rect(ii, x + r.x, y + r.y, r.w, r.h);
            total += f * inv < thr * norm ? left : right;
          }
          if (total < stage.t) { pass = false; break; }
        }
        if (pass) found.push({ x, y, s: win });
      }
    }
  }

  // overlapping detections of one face are grouped; a real face is found many times, a false alarm once or twice
  const groups: { x: number; y: number; s: number; n: number }[] = [];
  for (const d of found) {
    const cx = d.x + d.s / 2, cy = d.y + d.s / 2;
    const g = groups.find((o) => Math.abs(o.x + o.s / 2 - cx) < o.s * 0.3 && Math.abs(o.y + o.s / 2 - cy) < o.s * 0.3 && d.s < o.s * 1.4 && d.s > o.s / 1.4);
    if (g) { g.x = (g.x * g.n + d.x) / (g.n + 1); g.y = (g.y * g.n + d.y) / (g.n + 1); g.s = (g.s * g.n + d.s) / (g.n + 1); g.n++; }
    else groups.push({ x: d.x, y: d.y, s: d.s, n: 1 });
  }
  return groups.filter((g) => g.n >= minNeighbours).map((g) => ({ x: g.x, y: g.y, size: g.s, neighbours: g.n })).sort((a, b) => b.neighbours * b.size - a.neighbours * a.size);
}
