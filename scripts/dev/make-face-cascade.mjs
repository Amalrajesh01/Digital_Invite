// Converts OpenCV's haarcascade_frontalface_default.xml (Intel License Agreement for Open Source Computer Vision Library, a
// BSD-style licence: redistribution is allowed with the notice kept) into the compact JSON that src/lib/face-cascade.json holds.
//   curl -L -o /tmp/face.xml https://raw.githubusercontent.com/opencv/opencv/4.x/data/haarcascades/haarcascade_frontalface_default.xml
//   node scripts/dev/make-face-cascade.mjs /tmp/face.xml src/lib/face-cascade.json
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
const xml = readFileSync(src, "utf8");
const num = (s) => Number.parseFloat(s);
const r5 = (n) => Math.round(n * 1e5) / 1e5;

const featuresXml = xml.slice(xml.indexOf("<features>"), xml.indexOf("</features>"));
const features = [...featuresXml.matchAll(/<rects>([\s\S]*?)<\/rects>/g)].map((m) =>
  [...m[1].matchAll(/<_>\s*([-\d.e+ ]+?)\s*<\/_>/g)].map((r) => r[1].trim().split(/\s+/).map(num)).map(([x, y, w, h, wt]) => [x, y, w, h, wt]),
);

const stagesXml = xml.slice(xml.indexOf("<stages>"), xml.indexOf("</stages>"));
const stages = stagesXml.split("<stageThreshold>").slice(1).map((chunk) => {
  const thr = num(chunk.slice(0, chunk.indexOf("</stageThreshold>")));
  const stumps = [...chunk.matchAll(/<internalNodes>\s*([-\d.e+ ]+?)\s*<\/internalNodes>\s*<leafValues>\s*([-\d.e+ ]+?)\s*<\/leafValues>/g)].map((m) => {
    const n = m[1].trim().split(/\s+/).map(num); // 0 -1 featureIndex threshold
    const l = m[2].trim().split(/\s+/).map(num);
    return [n[2], r5(n[3]), r5(l[0]), r5(l[1])];
  });
  return { t: r5(thr), s: stumps };
});

console.log(`${stages.length} stages, ${stages.reduce((n, s) => n + s.s.length, 0)} stumps, ${features.length} features`);
writeFileSync(out, JSON.stringify({ size: 24, features, stages }));
