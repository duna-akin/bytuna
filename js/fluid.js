import { gridFor } from "./logic.js";
import { VS, SPLAT, ADVECT, DIVERGENCE, CURL, VORTICITY, PRESSURE, GRADIENT, SCALE, INK } from "./shaders.js";

// GPU stable fluids. The "ink" map stores how far the ink now at each texel has
// travelled from home; the scene samples the name through it.
export function createFluid(G, cfg) {
  const { gl } = G;
  const P = {
    splat: G.program(VS, SPLAT), advect: G.program(VS, ADVECT), divergence: G.program(VS, DIVERGENCE),
    curl: G.program(VS, CURL), vorticity: G.program(VS, VORTICITY), pressure: G.program(VS, PRESSURE),
    gradient: G.program(VS, GRADIENT), scale: G.program(VS, SCALE), ink: G.program(VS, INK),
  };
  let vel, prs, div, crl, ink, ok = false, aspect = 1;
  const queue = [];

  function resize(W, H) {
    for (const t of [vel, prs, div, crl, ink]) G.free(t);
    const [sw, sh] = gridFor(cfg.simRes, W, H), [mw, mh] = gridFor(cfg.mapRes, W, H);
    vel = G.pingpong(sw, sh); prs = G.pingpong(sw, sh); div = G.target(sw, sh); crl = G.target(sw, sh);
    ink = G.pingpong(mw, mh);
    ok = vel.ok && prs.ok && div.ok && crl.ok && ink.ok;
    aspect = W / H;
    if (!ok) console.warn("float render targets unavailable; stirring disabled");
  }

  const splat = (x, y, vx, vy, radius = cfg.radius) => { queue.push([x, y, vx, vy, radius]); };

  function step(dt, calm) {
    if (!ok) { queue.length = 0; return; }
    gl.disable(gl.BLEND);
    let u;
    for (const [x, y, vx, vy, r] of queue.splice(0, 32)) {
      u = G.use(P.splat);
      gl.uniform1i(u.uTarget, G.bind(0, vel.read.tex));
      gl.uniform1f(u.aspect, aspect); gl.uniform1f(u.radius, r);
      gl.uniform2f(u.point, x, y); gl.uniform3f(u.value, vx, vy, 0);
      G.run(P.splat, vel.write); vel.swap();
    }
    u = G.use(P.curl); gl.uniform1i(u.uVelocity, G.bind(0, vel.read.tex)); G.run(P.curl, crl);
    u = G.use(P.vorticity);
    gl.uniform1i(u.uVelocity, G.bind(0, vel.read.tex)); gl.uniform1i(u.uCurl, G.bind(1, crl.tex));
    gl.uniform1f(u.curl, cfg.curl * calm.curl); gl.uniform1f(u.dt, dt);
    G.run(P.vorticity, vel.write); vel.swap();
    u = G.use(P.divergence); gl.uniform1i(u.uVelocity, G.bind(0, vel.read.tex)); G.run(P.divergence, div);
    u = G.use(P.scale); gl.uniform1i(u.uTexture, G.bind(0, prs.read.tex)); gl.uniform1f(u.value, .8);
    G.run(P.scale, prs.write); prs.swap();
    u = G.use(P.pressure); gl.uniform1i(u.uDivergence, G.bind(1, div.tex));
    for (let i = 0; i < cfg.pressureIters; i++) {
      gl.uniform1i(u.uPressure, G.bind(0, prs.read.tex));
      G.run(P.pressure, prs.write); prs.swap();
    }
    u = G.use(P.gradient);
    gl.uniform1i(u.uPressure, G.bind(0, prs.read.tex)); gl.uniform1i(u.uVelocity, G.bind(1, vel.read.tex));
    G.run(P.gradient, vel.write); vel.swap();
    u = G.use(P.advect);
    gl.uniform1i(u.uVelocity, G.bind(0, vel.read.tex)); gl.uniform1i(u.uSource, G.bind(0, vel.read.tex));
    gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, calm.dissipation);
    G.run(P.advect, vel.write); vel.swap();
    u = G.use(P.ink);
    gl.uniform1i(u.uVelocity, G.bind(0, vel.read.tex)); gl.uniform1i(u.uDisp, G.bind(1, ink.read.tex));
    gl.uniform2fv(u.velTexel, vel.texel); gl.uniform1f(u.dt, dt); gl.uniform1f(u.relax, Math.exp(-calm.relax * dt));
    G.run(P.ink, ink.write); ink.swap();
  }

  return { resize, splat, step, get ok() { return ok; }, get inkTex() { return ok ? ink.read.tex : null; } };
}
