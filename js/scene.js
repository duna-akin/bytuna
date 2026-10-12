import { VS, SCENE } from "./shaders.js";

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);

// The whole world in one full-screen pass. Screen point p shows world point p + (0, scroll).
export function createScene(G, theme) {
  const { gl } = G;
  const prog = G.program(VS, SCENE);
  const zero = G.texture(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));

  const u = G.use(prog);
  gl.uniform3fv(u.uBg0, hex(theme.bg0)); gl.uniform3fv(u.uBg1, hex(theme.bg1));
  gl.uniform3fv(u.uText, hex(theme.text)); gl.uniform3fv(u.uText2, hex(theme.text2));
  gl.uniform3fv(u.uCaus, hex(theme.caus)); gl.uniform3fv(u.uFishCol, hex(theme.fish)); gl.uniform3fv(u.uGlow, hex(theme.glow));
  gl.uniform1f(u.uCausBg, theme.causBg); gl.uniform1f(u.uCausText, theme.causText);
  gl.uniform1f(u.uSpec, theme.spec); gl.uniform1f(u.uDisp, theme.disp); gl.uniform1f(u.uTextA, theme.textA);
  gl.uniform1f(u.uRefract, theme.refract); gl.uniform1f(u.uGlowAmt, theme.glowAmt); gl.uniform1f(u.uGrain, theme.grain);
  gl.uniform1f(u.uVig, theme.vig);

  function setLayout(L) {
    const u = G.use(prog);
    gl.uniform2f(u.uSize, L.W, L.H);
    gl.uniform1f(u.uGlDpr, L.glDpr);
    gl.uniform1f(u.uShore, L.shore);
    gl.uniform1f(u.uDeepEnd, L.deepEnd);
    gl.uniform1f(u.uBeachTop, L.beachTop);
    gl.uniform1f(u.uBottleScale, L.bottleScale);
  }

  function render(f) {
    const u = G.use(prog);
    gl.uniform1i(u.uTex, G.bind(0, f.nameTex));
    gl.uniform1i(u.uDispMap, G.bind(1, f.inkTex || zero));
    gl.uniform1i(u.uBeachTex, G.bind(2, f.beachTex));
    gl.uniform1f(u.uTime, f.time);
    gl.uniform1f(u.uFlow, f.flow);
    gl.uniform1f(u.uAmbient, f.ambient);
    gl.uniform1f(u.uScroll, f.scroll);
    gl.uniform1f(u.uNameVis, f.nameVis);
    gl.uniform4fv(u.uHoverRect, f.hoverRect);
    gl.uniform1f(u.uHoverAmt, f.hoverAmt);
    gl.uniform4fv(u.uBottle, f.bottle);
    gl.uniform4fv(u.uRip, f.ripples);
    gl.uniform3fv(u.uFish, f.fishPts);
    gl.uniform1f(u.uFishOn, f.fishOn);
    G.run(prog, null);
  }

  return { setLayout, render };
}
