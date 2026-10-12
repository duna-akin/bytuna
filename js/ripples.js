// Ring buffer of ripples in world coordinates: [x, y, birth time, strength] x 16.
export function createRipples(now, count = 16) {
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) data[i * 4 + 2] = -100;
  let idx = 0;
  return {
    data,
    add(x, y, strength) {
      data.set([x, y, now(), strength], idx * 4);
      idx = (idx + 1) % count;
    },
  };
}
