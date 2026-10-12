import { FLUID, SCROLL } from "./config.js";
import { calmness, capFlick, rippleStrength } from "./logic.js";
import { createFluid } from "./fluid.js";

// Pointer and scroll input that moves water: stirring the name, stones, and the
// current that carries the name downstream as you scroll away.
export function createStirring(ctx) {
  const pick = v => (Array.isArray(v) ? v[ctx.coarse ? 1 : 0] : v);
  const cfg = Object.fromEntries(Object.entries(FLUID).map(([k, v]) => [k, pick(v)]));
  const fluid = createFluid(ctx.G, cfg);
  const { ptr } = ctx;
  let px = null, py = null, lx = 0, ly = 0, lastRip = 0, lastScroll = scrollY, active = true;

  addEventListener("pointermove", e => {
    const t = ctx.now();
    const wx = e.clientX, wy = e.clientY + scrollY;
    const d = Math.hypot(wx - lx, wy - ly);
    const speed = d / Math.max(t - ptr.lastMove, 1 / 120);
    if (px !== null && ctx.nameVis > .05) {
      const mx = e.clientX - px, my = e.clientY - py;
      if (Math.hypot(mx, my) < 400) {
        const [cx, cy] = capFlick(mx, my, cfg.flickCap);
        if (cx || cy) fluid.splat(e.clientX / ctx.W, 1 - e.clientY / ctx.H, cx / ctx.H * cfg.force, -cy / ctx.H * cfg.force);
      }
      ctx.emit("stir", speed);
    }
    px = e.clientX; py = e.clientY;
    ptr.x = wx; ptr.y = wy; ptr.lastMove = t;
    if (d > 26 && t - lastRip > .04) {
      ctx.ripples.add(wx, wy, rippleStrength(speed));
      lx = wx; ly = wy; lastRip = t;
    }
  });

  // a dropped stone: a ring of outward pushes plus a big ripple
  function stone(x, y) {
    if (ctx.nameVis > .05) {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        fluid.splat((x + Math.cos(a) * 26) / ctx.W, 1 - (y + Math.sin(a) * 26) / ctx.H, Math.cos(a) * 560, -Math.sin(a) * 560, .0014);
      }
    }
    ctx.ripples.add(x, y + scrollY, 1.1);
    ctx.emit("stone");
  }

  addEventListener("pointerdown", e => {
    if (e.target.closest("a, button")) return;
    px = e.clientX; py = e.clientY;
    ptr.x = e.clientX; ptr.y = e.clientY + scrollY; ptr.lastMove = ctx.now();
    stone(e.clientX, e.clientY);
  });
  const lift = e => { if (e.pointerType !== "mouse") px = null; };
  addEventListener("pointerup", lift);
  addEventListener("pointercancel", lift);
  addEventListener("pointerout", e => { if (!e.relatedTarget) px = null; }); // left the window

  addEventListener("scroll", () => {
    const d = scrollY - lastScroll;
    lastScroll = scrollY;
    if (d > 0 && scrollY < ctx.H * SCROLL.pushUntil) {
      const r = ctx.els.name.getBoundingClientRect();
      const k = Math.min(d, 60) / ctx.H * cfg.force * 1.4;
      for (let i = 0; i < 6; i++) {
        const x = r.left + r.width * (i + .5) / 6, y = r.top + r.height * (.25 + Math.random() * .5);
        fluid.splat(x / ctx.W, 1 - y / ctx.H, k, -k * .15, .004);
      }
      ctx.lastScrollT = ctx.now();
    }
  }, { passive: true });

  return {
    splat: fluid.splat,
    resize() { fluid.resize(ctx.W, ctx.H); },
    update(t, dt) {
      active = scrollY < ctx.H * SCROLL.fluidUntil;
      if (active) fluid.step(dt, calmness(Math.min(t - ptr.lastMove, t - ctx.lastScrollT), cfg.velDissipation));
      ctx.F.inkTex = fluid.inkTex;
    },
    state() { return { fluidOK: fluid.ok, fluidActive: active }; },
  };
}
