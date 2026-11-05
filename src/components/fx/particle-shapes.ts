/** Unit coordinates centered on each illustration. Cache them once per particle. */
export function storyShape(index: number, count: number, depth: number) {
  const turn = (index / count) * Math.PI * 2;
  const tilt = ((index % 3) - 1) * 0.72;
  const orbitX = Math.cos(turn) * (0.34 + depth * 0.012);
  const orbitY = Math.sin(turn) * (0.12 + depth * 0.012);
  const side = index % 2 ? 1 : -1;
  const u = (Math.floor(index / 2) % 113) / 112;
  const sheet = (index % 9) / 8;
  // Layered curved sheets radiate from the central spine of an open book.
  const edge = index % 7 === 0;
  const bookX = side * (edge ? 0.34 : u * 0.34);
  const bookY = edge ? -0.12 + u * 0.31 : -0.02 - Math.sin(u * 2.2) * 0.13 + sheet * 0.28;
  return {
    orbitX: orbitX * Math.cos(tilt) - orbitY * Math.sin(tilt),
    orbitY: orbitX * Math.sin(tilt) + orbitY * Math.cos(tilt),
    bookX,
    bookY,
  };
}

function easeBetween(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function storyWeights(progress: number) {
  const orbit = easeBetween(progress, 0.06, 0.32) * (1 - easeBetween(progress, 0.46, 0.7));
  const book = easeBetween(progress, 0.67, 0.91);
  return { field: 1 - orbit - book, orbit, book };
}
