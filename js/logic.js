// Pure helpers: no DOM, no WebGL, so they run under node --test.

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// While you stir, the ink barely remembers home. Once you stop, the water calms
// (swirls die down) and the ink flows back into the letters.
export function calmness(idle, velDissipation) {
  const s = clamp((idle - .4) / 1.2, 0, 1);
  return { relax: .35 + s * 2.2, dissipation: velDissipation + s * 3.5, curl: 1 - s };
}

export const nameVisibility = (scrollY, vh, { fadeStart, fadeLength }) =>
  1 - clamp((scrollY - vh * fadeStart) / (vh * fadeLength), 0, 1);

export function gridFor(res, W, H) {
  const aspect = W / H;
  return aspect >= 1 ? [Math.round(res * aspect), res] : [res, Math.round(res / aspect)];
}

export function angleTo(cur, want, maxStep) {
  let d = want - cur;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return cur + clamp(d, -maxStep, maxStep);
}

export function capFlick(mx, my, cap) {
  const len = Math.hypot(mx, my);
  if (!len) return [0, 0];
  const c = Math.min(1, cap / len);
  return [mx * c, my * c];
}

export const rippleStrength = speed => clamp(speed / 2600, .06, .35);

export const scrollProgress = (scrollY, maxScroll) => (maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1) : 0);

export function equalPowerGains(p) {
  const q = clamp(p, 0, 1) * Math.PI / 2;
  return [Math.cos(q), Math.sin(q)];
}

export const swishGain = speed => clamp(speed / 1500, 0, 1) * .5;

export function readMuted(storage, key) {
  try { return storage?.getItem(key) === "1"; } catch { return false; }
}

export function writeMuted(storage, key, muted) {
  try { storage?.setItem(key, muted ? "1" : "0"); } catch { /* private mode: keep it in memory only */ }
}
