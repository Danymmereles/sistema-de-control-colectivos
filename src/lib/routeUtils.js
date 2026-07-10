export function buildPath(originalDist, deviations, w, h, padding) {
  const detourPx = 50;
  const totalDetourWidth = deviations.length * detourPx;
  const mainW = w - 2 * padding - totalDetourWidth;
  const kmToPx = originalDist > 0 ? mainW / originalDist : 0;
  const cy = h / 2;
  const segs = [];
  let x = padding, dist = 0;

  for (const dev of [...deviations].sort((a, b) => a.startKm - b.startKm)) {
    if (dev.startKm > dist) {
      const sd = dev.startKm - dist;
      segs.push({ x1: x, y1: cy, x2: x + sd * kmToPx, y2: cy, d: sd, s: dist });
      x += sd * kmToPx;
      dist = dev.startKm;
    }
    const side = dev.detourKm / 3;
    segs.push({ x1: x, y1: cy, x2: x, y2: cy - detourPx, d: side, s: dist });
    segs.push({ x1: x, y1: cy - detourPx, x2: x + detourPx, y2: cy - detourPx, d: side, s: dist + side });
    x += detourPx;
    segs.push({ x1: x, y1: cy - detourPx, x2: x, y2: cy, d: side, s: dist + 2 * side });
    dist += dev.detourKm;
  }
  if (dist < originalDist) {
    const sd = originalDist - dist;
    segs.push({ x1: x, y1: cy, x2: x + sd * kmToPx, y2: cy, d: sd, s: dist });
  }
  return { segs, cy };
}

export function busPos(segs, dist) {
  for (const s of segs) {
    if (dist >= s.s && dist <= s.s + s.d) {
      const t = s.d > 0 ? (dist - s.s) / s.d : 0;
      return { x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t };
    }
  }
  const last = segs[segs.length - 1];
  return last ? { x: last.x2, y: last.y2 } : { x: 0, y: 0 };
}