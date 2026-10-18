/**
 * Automatic framing for the walking figures' head photographs.
 *
 * A head photo is any photograph the person uploads: a tight close-up, a head-and-shoulders portrait, a couple's picture.
 * The figure's head is a small circle, so the face is found (src/lib/face-detect.ts) and scaled to fill it. Nothing is sent
 * anywhere. It misses faces that are turned away or tiny, which is why the editor keeps a switch to turn the automatic fit
 * off and a zoom to nudge it. Pure functions: browser-, server- and test-safe.
 */
export interface Face { /** centre of the face and hair, 0–1 of the picture */ x: number; y: number; /** width of the face, 0–1 of the picture's width */ size: number }

/**
 * The head (face and hair) found in a picture, from the detector's face box: the box is the face from brow to chin, so the
 * head is a little wider and sits a little higher. Null when there is no face.
 */
export function headFromBox(box: { x: number; y: number; size: number } | null | undefined, w: number, h: number): Face | null {
  if (!box) return null;
  return { x: (box.x + box.size / 2) / w, y: Math.max(0, (box.y + box.size / 2 - box.size * 0.1) / h), size: Math.min(1, (box.size * 1.4) / w) };
}

/** Where to centre the picture, and how far to zoom so the face fills the head circle with a little air around it. */
export function fitFor(face: Face | null): { fx: number; fy: number; zoom: number } | null {
  if (!face) return null;
  // PhotoHead draws the picture 4·radius·zoom wide in a circle of 2·radius: the head should span about 82% of the circle
  const zoom = (0.82 * 2) / (4 * face.size);
  return { fx: face.x, fy: face.y, zoom: Math.min(6, Math.max(0.4, zoom)) };
}
