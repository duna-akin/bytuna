import { FLUID } from "./config.js";
import { angleTo } from "./logic.js";

// A quiet top-down silhouette in the river: wanders through the name, flees the pointer.
// World coordinates (page px). Skeleton: 8 spine nodes, 2 tail tips, 2 fins -> [x, y, r] x 12.
export function createFish({ coarse = false, random = Math.random } = {}) {
  const s = { x: -100, y: 0, a: 0, v: 120, phase: 0, target: null, retarget: 0, scaredUntil: 0, lastWake: 0 };
  const points = new Float32Array(36);

  function pickTarget(t, env) {
    const r = env.nameRect;
    const side = random() < .5 ? -1 : 1;
    s.target = {
      x: env.W / 2 + side * (env.W * (.25 + random() * .3)),
      y: r.y + r.h * (.15 + random() * .7) + (random() < .25 ? (random() - .5) * env.H * .6 : 0),
    };
    s.retarget = t + 4 + random() * 4;
  }

  function step(t, dt, env) {
    const { W, H, ptr } = env;
    const L = Math.max(42, Math.min(96, W * .052));
    const m = 80;
    const dxm = s.x - ptr.x, dym = s.y - ptr.y;
    const dm = Math.hypot(dxm, dym) || 1;
    if (dm < 150 + L && t - ptr.lastMove < .25 && t > s.scaredUntil - .5) {
      if (t > s.scaredUntil) env.ripple(s.x, s.y, .55);
      s.scaredUntil = t + .9;
      s.target = { x: s.x + dxm / dm * 500, y: s.y + dym / dm * 500 };
      s.retarget = t + 1.2;
    }
    const scared = t < s.scaredUntil;
    if (!s.target || t > s.retarget || Math.hypot(s.target.x - s.x, s.target.y - s.y) < 60) pickTarget(t, env);
    let want = Math.atan2(s.target.y - s.y, s.target.x - s.x);
    if (!scared && (s.x < -m || s.x > W + m || s.y < -m || s.y > H + m)) want = Math.atan2(H / 2 - s.y, W / 2 - s.x);
    s.a = angleTo(s.a, want, (scared ? 7 : 1.6) * dt);
    const vt = (scared ? 620 : 115) * (coarse ? .8 : 1);
    s.v += (vt - s.v) * Math.min(1, dt * (scared ? 6 : 1.2));
    s.x += Math.cos(s.a) * s.v * dt;
    s.y += Math.sin(s.a) * s.v * dt;
    s.phase += dt * (5 + s.v * .028);
    if (s.v > 260 && t - s.lastWake > .12) { env.ripple(s.x, s.y, .12); s.lastWake = t; }
    else if (t - s.lastWake > 1.4) { env.ripple(s.x - Math.cos(s.a) * L * .8, s.y - Math.sin(s.a) * L * .8, .05); s.lastWake = t; }
    env.drag(s.x, s.y, Math.cos(s.a), Math.sin(s.a), s.v * dt);

    const ca = Math.cos(s.a), sa = Math.sin(s.a);
    const amp = L * .07 * Math.min(1.6, .6 + s.v / 300);
    const toWorld = (lx, ly) => [s.x + lx * ca - ly * sa, s.y + lx * sa + ly * ca];
    const local = [];
    for (let i = 0; i < 8; i++) {
      const u = i / 7;
      const lx = -u * L * .82;
      const ly = Math.sin(s.phase - u * 3.2) * amp * u * u;
      const r = L * (.03 + .1 * Math.pow(Math.sin(Math.min(1, u * 1.25 + .06) * Math.PI), .75));
      local.push([lx, ly]);
      points.set([...toWorld(lx, ly), Math.max(r, L * .018)], i * 3);
    }
    const [tx, ty] = local[7], [px, py] = local[6];
    const ta = Math.atan2(ty - py, tx - px);
    for (const [k, side] of [[8, 1], [9, -1]]) {
      const aa = ta + side * .7;
      points.set([...toWorld(tx + Math.cos(aa) * L * .24, ty + Math.sin(aa) * L * .24), L * .01], k * 3);
    }
    const [fx, fy] = local[2];
    const flap = Math.sin(s.phase * .5) * .2;
    for (const [k, side] of [[10, 1], [11, -1]]) {
      const aa = Math.PI - side * (1.15 + flap);
      points.set([...toWorld(fx + Math.cos(aa) * L * .17, fy + Math.sin(aa) * L * .17), L * .012], k * 3);
    }
  }

  return { state: s, points, step };
}

// Wires the fish into the page: hidden when motion is reduced; drags ink when on screen.
export function fishFeature(ctx, splat) {
  const fish = createFish({ coarse: ctx.coarse });
  fish.state.y = ctx.H * .4;
  const env = {
    W: 0, H: 0, nameRect: null, ptr: ctx.ptr,
    ripple: (x, y, s) => ctx.ripples.add(x, y, s),
    drag(x, y, dx, dy, dist) {
      const sy = y - scrollY;
      if (x > 0 && x < env.W && sy > 0 && sy < env.H) {
        const k = dist * FLUID.force / env.H * .35;
        splat(x / env.W, 1 - sy / env.H, dx * k, -dy * k, .0012);
      }
    },
  };
  return {
    update(t, dt) {
      ctx.F.fishOn = ctx.still ? 0 : 1;
      if (ctx.still) return;
      env.W = ctx.W; env.H = ctx.H; env.nameRect = ctx.world.nameRect;
      fish.step(t, dt, env);
      ctx.F.fishPts = fish.points;
    },
    state() { return { fishOn: ctx.F.fishOn === 1, fish: { x: fish.state.x, y: fish.state.y } }; },
  };
}
