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

// A swish marks the start of a stir stroke. Feed it every pointer speed (px/s) with its
// time (s); it returns a gain when a stroke begins, else 0. Slow drift never reaches the
// onset, a continuous stroke fires once, and it re-arms only after the pointer slows or rests.
export function createSwishTrigger({ onset = 700, release = 300, refractory = .5, tau = .08, rest = .25 } = {}) {
  let smooth = 0, lastT = null, lastFire = -Infinity, armed = true;
  return (speed, t) => {
    const dt = lastT === null ? Infinity : Math.max(0, t - lastT);
    lastT = t;
    if (dt > rest) armed = true; // no events for a while: the pointer was still
    const k = 1 - Math.exp(-dt / tau);
    smooth += (speed - smooth) * k;
    if (smooth < release) armed = true;
    if (!armed || smooth < onset || t - lastFire < refractory) return 0;
    armed = false;
    lastFire = t;
    return swishGain(smooth);
  };
}

export function readMuted(storage, key) {
  try { return storage?.getItem(key) === "1"; } catch { return false; }
}

export function writeMuted(storage, key, muted) {
  try { storage?.setItem(key, muted ? "1" : "0"); } catch { /* private mode: keep it in memory only */ }
}
