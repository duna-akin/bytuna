import { THEME, SCROLL, WORLD, FROZEN_TIME } from "./config.js";
import { nameVisibility } from "./logic.js";
import { createGL } from "./gl.js";
import { createScene } from "./scene.js";
import { createRipples } from "./ripples.js";
import { drawName, drawBeach, docRect } from "./textures.js";
import { createStirring } from "./stirring.js";
import { fishFeature } from "./fish.js";
import { beachFeature } from "./beach.js";
import { setupSound } from "./sound.js";

const params = new URLSearchParams(location.search);
const DEBUG = params.has("debug");
const $ = s => document.querySelector(s);
const els = { canvas: $("#water"), name: $("#name"), beach: $("#beach"), words: [$("#gh"), $("#li")], bottle: $("#mail") };

// Under ?debug, time only moves when a test calls __hero.advance(), so frames are reproducible.
const t0 = performance.now();
let manualT = 0;
const now = DEBUG ? () => manualT : () => (performance.now() - t0) / 1000;

const listeners = {};
const ctx = {
  els, now, debug: DEBUG,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  coarse: matchMedia("(pointer: coarse)").matches,
  frozen: false,
  W: innerWidth, H: innerHeight, glDpr: 1, layouts: 0,
  world: { beachTop: 0, shore: 0, deepEnd: 0, nameRect: { x: 0, y: 0, w: 1, h: 1 }, bottle: [0, 0, 0], bottleScale: 1, rects: [] },
  ptr: { x: -1e4, y: -1e4, lastMove: -10 },
  lastScrollT: -10,
  features: [],
  on: (name, fn) => (listeners[name] ||= []).push(fn),
  emit: (name, ...args) => listeners[name]?.forEach(fn => fn(...args)),
  get still() { return this.reduced || this.frozen; },
  get nameVis() { return nameVisibility(scrollY, this.H, SCROLL); },
};

boot();

function boot() {
  const audio = setupSound(document.querySelector("#sound"), ctx.on);
  ctx.features.push({ state: () => ({ audio: { started: audio.started, muted: audio.muted, state: audio.state, ready: audio.ready } }) });

  const G = params.has("nogl") ? null : createGL(els.canvas);
  if (!G) return htmlFallback();
  let scene, lost = false;
  try {
    scene = createScene(G, THEME);
    ctx.G = G;
    ctx.ripples = createRipples(now);
    ctx.F = { inkTex: null, hoverRect: [0, 0, 0, 0], hoverAmt: 0, bottleLift: 0, fishPts: new Float32Array(36), fishOn: 0 };
    const stirring = createStirring(ctx);
    ctx.features.push(stirring);
    ctx.features.push(fishFeature(ctx, stirring.splat));
    ctx.features.push(beachFeature(ctx));
  } catch (err) {
    console.warn("WebGL unavailable:", err);
    return htmlFallback();
  }
  // mobile browsers drop GL contexts (backgrounded tabs, GPU resets): show the plain page instead
  els.canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); lost = true; htmlFallback(); });

  const nameTex = G.texture(1, 1), beachTex = G.texture(1, 1);
  const texDpr = Math.min(devicePixelRatio || 1, ctx.coarse ? 1.5 : 2);

  async function layout() {
    if (lost) return;
    ctx.W = innerWidth;
    ctx.H = innerHeight;
    ctx.glDpr = Math.min(devicePixelRatio || 1, ctx.coarse ? 1 : 1.5);
    els.canvas.width = Math.round(ctx.W * ctx.glDpr);
    els.canvas.height = Math.round(ctx.H * ctx.glDpr);
    const w = ctx.world;
    w.beachTop = docRect(els.beach).y;
    w.shore = w.beachTop + ctx.H * WORLD.shoreFrac;
    w.deepEnd = ctx.H * WORLD.deepEndFrac;
    w.nameRect = docRect(els.name);
    const b = docRect(els.bottle);
    w.bottle = [b.x + b.w / 2, b.y + b.h / 2, WORLD.bottleAngleDeg * Math.PI / 180];
    w.bottleScale = b.w / WORLD.bottleUnits;
    scene.setLayout({ W: ctx.W, H: ctx.H, glDpr: ctx.glDpr, shore: w.shore, deepEnd: w.deepEnd, beachTop: w.beachTop, bottleScale: w.bottleScale });
    for (const f of ctx.features) f.resize?.(ctx);
    await drawName(G, nameTex, els.name, ctx.W, ctx.H, texDpr);
    w.rects = await drawBeach(G, beachTex, els.words, w.beachTop, ctx.W, ctx.H, texDpr, WORLD.wordPad);
    ctx.layouts++;
  }
  ctx.redraw = layout;

  function tick(t, dt) {
    const ambient = ctx.still ? FROZEN_TIME : t;
    for (const f of ctx.features) f.update?.(t, dt, ctx);
    const F = ctx.F;
    const [bx, by, ba] = ctx.world.bottle;
    const rock = Math.sin(ambient * .9) * .03 + F.bottleLift * Math.sin(ambient * 3.1) * .04;
    scene.render({
      ...F, nameTex, beachTex,
      time: t, flow: ambient, ambient,
      scroll: scrollY, nameVis: ctx.nameVis,
      ripples: ctx.ripples.data,
      bottle: [bx, by, ba + rock, F.bottleLift],
    });
  }

  let last = now();
  function frame() {
    if (lost) return;
    const t = now();
    tick(t, Math.min(1 / 30, t - last)); // a long pause (hidden tab) must not become one giant step
    last = t;
    requestAnimationFrame(frame);
  }

  addEventListener("resize", layout);
  if (DEBUG) window.__hero = debugApi(G, tick);
  document.fonts.ready.then(layout).then(() => {
    if (lost) return;
    // the HTML name stays visible until the water can draw it (slow fonts must not blank the hero)
    tick(now(), 0);
    document.body.classList.add("gl");
    if (DEBUG) window.__hero.ready = true;
    else requestAnimationFrame(frame);
  });
}

// Without (or after losing) WebGL, the HTML itself is the page: visible name, plain links.
function htmlFallback() {
  els.canvas.hidden = true;
  document.body.classList.remove("gl");
  if (DEBUG) window.__hero = { ready: true, state: () => featureState({ gl: false }) };
}

function featureState(base) {
  for (const f of ctx.features) Object.assign(base, f.state?.());
  return base;
}

function debugApi(G, tick) {
  const { gl, canvas } = G;
  // render the current moment, then read it back before the browser clears the buffer
  function read(x, y, w, h) {
    tick(manualT, 0);
    const d = ctx.glDpr;
    const rx = Math.max(0, Math.round(x * d));
    const ry = Math.max(0, Math.round(canvas.height - (y + h) * d));
    const rw = Math.max(1, Math.min(canvas.width - rx, Math.round(w * d)));
    const rh = Math.max(1, Math.min(canvas.height - ry, Math.round(h * d)));
    const px = new Uint8Array(rw * rh * 4);
    gl.readPixels(rx, ry, rw, rh, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return { px, rw, rh, d };
  }
  return {
    ready: false,
    advance(seconds, fps = 30) {
      const n = Math.max(1, Math.round(seconds * fps));
      for (let i = 0; i < n; i++) { manualT += 1 / fps; tick(manualT, 1 / fps); }
    },
    freeze(on = true) { ctx.frozen = on; },
    on: ctx.on,
    region(x, y, w, h) {
      const { px } = read(x, y, w, h);
      const s = [0, 0, 0];
      for (let i = 0; i < px.length; i += 4) { s[0] += px[i]; s[1] += px[i + 1]; s[2] += px[i + 2]; }
      return s.map(v => v / (px.length / 4));
    },
    grid(x, y, w, h, step = 4) {
      const { px, rw, rh, d } = read(x, y, w, h);
      const st = Math.max(1, Math.round(step * d));
      const out = [];
      for (let j = 0; j < rh; j += st) for (let i = 0; i < rw; i += st) {
        const k = (j * rw + i) * 4;
        out.push(.2126 * px[k] + .7152 * px[k + 1] + .0722 * px[k + 2]);
      }
      return out;
    },
    state() {
      return featureState({ gl: true, layouts: ctx.layouts, nameVis: ctx.nameVis, scroll: scrollY, still: ctx.still, canvas: [canvas.width, canvas.height] });
    },
    async setSandFont(family, weight = 600, style = "italic") {
      const r = document.documentElement.style;
      r.setProperty("--sand-font", family);
      r.setProperty("--sand-weight", String(weight));
      r.setProperty("--sand-style", style);
      await document.fonts.ready;
      await ctx.redraw();
    },
  };
}
