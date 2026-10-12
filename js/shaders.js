// GLSL sources, ported verbatim from docs/superpowers/mockups/river-site-prototype.html.
export const VS = `#version 300 es
in vec2 a; uniform vec2 texel; out vec2 vUv, vL, vR, vT, vB;
void main(){
  vUv = a * .5 + .5;
  vL = vUv - vec2(texel.x, 0.); vR = vUv + vec2(texel.x, 0.);
  vT = vUv + vec2(0., texel.y); vB = vUv - vec2(0., texel.y);
  gl_Position = vec4(a, 0., 1.);
}`;
export const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 o;
`;
export const SPLAT = HEAD + `uniform sampler2D uTarget; uniform float aspect, radius; uniform vec2 point; uniform vec3 value;
void main(){ vec2 p = vUv - point; p.x *= aspect; o = vec4(texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * value, 1.); }`;
export const ADVECT = HEAD + `uniform sampler2D uVelocity, uSource; uniform vec2 texel; uniform float dt, dissipation;
void main(){ vec2 c = vUv - dt * texture(uVelocity, vUv).xy * texel; o = vec4(texture(uSource, c).xy / (1. + dissipation * dt), 0., 1.); }`;
export const DIVERGENCE = HEAD + `uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x, T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y;
  o = vec4(.5 * (R - L + T - B), 0., 0., 1.);
}`;
export const CURL = HEAD + `uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y, T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
  o = vec4(.5 * (R - L - T + B), 0., 0., 1.);
}`;
export const VORTICITY = HEAD + `uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
void main(){
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
  vec2 f = .5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 1e-4; f *= curl * C; f.y *= -1.;
  o = vec4(clamp(texture(uVelocity, vUv).xy + f * dt, -1000., 1000.), 0., 1.);
}`;
export const PRESSURE = HEAD + `uniform sampler2D uPressure, uDivergence;
void main(){
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * .25, 0., 0., 1.);
}`;
export const GRADIENT = HEAD + `uniform sampler2D uPressure, uVelocity;
void main(){
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0., 1.);
}`;
export const SCALE = HEAD + `uniform sampler2D uTexture; uniform float value;
void main(){ o = value * texture(uTexture, vUv); }`;
export const INK = HEAD + `uniform sampler2D uVelocity, uDisp; uniform vec2 velTexel; uniform float dt, relax;
void main(){
  vec2 c = vUv - dt * texture(uVelocity, vUv).xy * velTexel;
  vec2 d = texture(uDisp, c).xy + (c - vUv);
  o = vec4(d * relax, 0., 1.);
}`;

// The whole world in one pass. Screen point p looks at world point w = p + (0, scroll).
// World, top to bottom: deep river (the name) -> shallows -> shoreline -> beach.
export const SCENE = HEAD + `
uniform sampler2D uTex, uDispMap, uBeachTex;
uniform vec2 uSize; uniform float uGlDpr, uTime, uFlow, uAmbient, uScroll, uNameVis;
uniform float uShore, uDeepEnd, uBeachTop;
uniform vec4 uHoverRect; uniform float uHoverAmt;
uniform vec4 uBottle; uniform float uBottleScale;
uniform vec4 uRip[16];
uniform vec3 uFish[12];
uniform float uFishOn;
uniform vec3 uBg0, uBg1, uText, uText2, uCaus, uFishCol, uGlow;
uniform float uCausBg, uCausText, uSpec, uDisp, uTextA, uRefract, uGlowAmt, uGrain, uVig;

const vec3 LIGHT = vec3(-.4472, -.6261, .5367); // normalize(-.5, -.7, .6)

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float hash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise2(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3. - 2.*f);
  return mix(mix(hash2(i), hash2(i+vec2(1,0)), u.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), u.x), u.y);
}
float fbm2(vec2 p){ // rotated octaves hide the grid
  float v = 0., a = .5; mat2 m = mat2(.8, .6, -.6, .8);
  for (int i = 0; i < 4; i++) { v += a * noise2(p); p = m * p * 2.03; a *= .5; }
  return v;
}
float smin(float a, float b, float k){ float h = clamp(.5 + .5*(b - a)/k, 0., 1.); return mix(b, a, h) - k*h*(1. - h); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

float H(vec2 p){
  vec2 q = p / 280.;
  float h = noise(q + vec2(-uFlow*.10, 0.)) * .6
          + noise(q*2.3 + vec2(5.2, 1.3) + vec2(-uFlow*.17, uFlow*.02)) * .28
          + noise(q*5.1 + vec2(1.7, 9.2) + vec2(-uFlow*.31, 0.)) * .12;
  h *= 26.;
  for (int i = 0; i < 16; i++) {
    vec4 r = uRip[i];
    float age = uTime - r.z;
    if (age < 0. || age > 3.5) continue;
    float d = length(p - r.xy);
    float x = d - age * 300.;
    float s = 26. + age * 30.;
    h += r.w * 5.5 * sin(x * .075) * exp(-x*x / (2.*s*s)) * exp(-age*1.1) / (1. + d*.004);
  }
  return h;
}
float caustic(vec2 uv, float t){
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.;
  vec2 i = p; float c = 1.; float inten = .005;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1. - (3.5 / float(n+1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1. / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.; c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.);
}
float seg(vec2 p, vec2 a, vec2 b, float ra, float rb){
  vec2 pa = p - a, ba = b - a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.);
  return length(pa - ba*t) - mix(ra, rb, t);
}
float fishD(vec2 p){
  float d = 1e5;
  for (int i = 0; i < 7; i++) d = min(d, seg(p, uFish[i].xy, uFish[i+1].xy, uFish[i].z, uFish[i+1].z));
  d = min(d, seg(p, uFish[7].xy, uFish[8].xy, uFish[7].z, uFish[8].z));
  d = min(d, seg(p, uFish[7].xy, uFish[9].xy, uFish[7].z, uFish[9].z));
  d = min(d, seg(p, uFish[2].xy, uFish[10].xy, uFish[2].z*.35, uFish[10].z));
  d = min(d, seg(p, uFish[2].xy, uFish[11].xy, uFish[2].z*.35, uFish[11].z));
  return d;
}
float letters(vec2 q, float k){
  vec4 s = texture(uTex, q / uSize);
  return mix(s.r, min(1., s.g * 1.15), k);
}

// ---- shoreline: waves lap in and out; every ~14s a bigger one runs further up the sand
float swash(float t){ return 46. * pow(max(0., sin(t * .45)), 3.) + 10. * sin(t * 1.3); }
float shoreBase(float x, float t){ return uShore + 16. * sin(x / 170. + t * .7) + 8. * sin(x / 63. - t * 1.1); }
float shoreAt(float x, float t){ return shoreBase(x, t) + swash(t); }
// how far up the beach the water has been lately (wet sand, washed carvings)
float reachAt(float x, float t){ return max(shoreAt(x, t), shoreBase(x, t) + swash(t - 1.6) - 4.); }

vec3 sand(vec2 w){
  float n = fbm2(w / 110.) * .75 + noise2(w / 9.) * .25;
  vec3 c = mix(vec3(.80, .71, .55), vec3(.92, .86, .72), n);
  return c * (.95 + .09 * hash(floor(w)));
}

// ---- the bottle, in its own frame: +x toward the cork, units ~ px at scale 1
float bottleD(vec2 lp){
  float b = seg(lp, vec2(-44., 0.), vec2(14., 0.), 17., 17.);
  b = smin(b, seg(lp, vec2(14., 0.), vec2(34., 0.), 17., 7.), 7.);
  b = smin(b, seg(lp, vec2(34., 0.), vec2(52., 0.), 6.5, 6.5), 3.);
  b = min(b, seg(lp, vec2(50., 0.), vec2(53.5, 0.), 8., 8.));
  return b;
}
float corkD(vec2 lp){ return seg(lp, vec2(53.5, 0.), vec2(63., 0.), 6., 6.3); }

void main(){
  vec2 p = vec2(gl_FragCoord.x, uSize.y*uGlDpr - gl_FragCoord.y) / uGlDpr;
  vec2 w = p + vec2(0., uScroll);
  float t = uAmbient; // light, waves and foam; frozen when motion is reduced

  float sy = shoreAt(w.x, t);
  float edge = sy - w.y;                         // > 0 in water
  float water = smoothstep(-1.5, 1.5, edge);

  float e = 1.5;
  float h0 = H(w);
  vec2 g = vec2(H(w + vec2(e, 0.)) - h0, H(w + vec2(0., e)) - h0) / e;
  vec2 off = g * uRefract * water;

// ---- water: deep teal over the river, clear turquoise over sand near the shore
  float depth = clamp(edge / max(sy - uDeepEnd, 1.), 0., 1.);
  float cz = caustic((w + off*1.5) / 420., t*.35 + 23.);
  vec3 deepC = mix(uBg0, uBg1, smoothstep(0., 1., p.y / uSize.y)) + uCaus * cz * uCausBg;
  vec3 bottom = sand(w + off * 1.4) * vec3(.74, .86, .84);
  vec3 shallowC = mix(bottom * (.78 + cz * 1.15), vec3(.2, .66, .66), .26);
  vec3 waterC = mix(shallowC, deepC, smoothstep(0., 1., pow(depth, .55)));
  float foam = smoothstep(16., 0., edge) * (.55 + .45 * fbm2(w / 10. + vec2(t * .9, 0.)));
  foam += smoothstep(.52, .7, fbm2(w / 22. + vec2(t * .25, t * .4))) * smoothstep(80., 8., edge) * .4;
  waterC = mix(waterC, vec3(.95, .98, .97), clamp(foam, 0., 1.) * .85);

// ---- beach: dry sand, darker where the last waves reached
  float reach = reachAt(w.x, t);
  vec3 sandC = sand(w) * mix(1., .76, smoothstep(70., 0., w.y - reach));
  vec3 col = mix(sandC, waterC, water);

// ---- words written in the sand (R crisp, G soft)
  if (w.y > uBeachTop - 20.) {
    vec2 bu = vec2(w.x / uSize.x, (w.y - uBeachTop) / uSize.y) + off / uSize * .6;
    vec4 bt = texture(uBeachTex, bu);
    if (bt.g > .002) {
      vec2 px = 1.5 / uSize;
      vec2 gt = vec2(texture(uBeachTex, bu + vec2(px.x, 0.)).g - texture(uBeachTex, bu - vec2(px.x, 0.)).g,
                     texture(uBeachTex, bu + vec2(0., px.y)).g - texture(uBeachTex, bu - vec2(0., px.y)).g);
      float washed = smoothstep(-10., 40., reach - w.y);       // waves soften the carving
      vec4 hr = uHoverRect;
      float hov = uHoverAmt * step(hr.x, w.x) * step(w.x, hr.z) * step(hr.y, w.y) * step(w.y, hr.w);
      float carve = (1. - .7 * washed) * (1. + .8 * hov);
      vec3 n = normalize(vec3(gt * 2.6 * carve, 1.));
      float shade = 1. + (dot(n, LIGHT) - LIGHT.z) * .9;      // walls of the groove catch / lose light
      col *= clamp(shade, .72, 1.18);
      col *= 1. - (bt.r * .1 + bt.g * .06) * carve;              // damp, shadowed groove floor
    }
  }

// ---- message in a bottle
  {
    vec4 B = uBottle;
    float sc = uBottleScale * (1. + .07 * B.w);
    mat2 toLocal = rot(-B.z);
    vec2 lp = toLocal * (w - B.xy) / sc;
    vec2 so = toLocal * vec2(9. + B.w * 12., 13. + B.w * 16.) / sc;
    float ds = bottleD(lp - so) * sc;
    col *= 1. - .33 * smoothstep(10. + B.w * 8., -6., ds);
    float dg = bottleD(lp) * sc, dc = corkD(lp) * sc;
    if (min(dg, dc) < 2.) {
      vec2 gl2 = vec2(bottleD(lp + vec2(.5, 0.)) - bottleD(lp), bottleD(lp + vec2(0., .5)) - bottleD(lp)) * 2.;
      vec2 gw = rot(B.z) * gl2;
      float inside = clamp(-dg / (17. * sc), 0., 1.);
      vec3 n = normalize(vec3(gw * (1. - inside) * 1.8, .4 + inside));
      vec3 behind = mix(sandC, waterC, water * .7);
      behind = mix(behind, sand(w + gw * 16.), .5);
      vec3 glass = mix(behind, vec3(.5, .8, .72), .42);
      float paper = smoothstep(1., -1., seg(lp, vec2(-36., 1.5), vec2(12., 1.5), 8.5, 8.5) * sc);
      glass = mix(glass, vec3(.96, .92, .82), paper * .78);
      glass = mix(glass, vec3(.55, .32, .2), paper * smoothstep(2., .8, abs(lp.x + 10.)) * .7);
      float diff = .78 + .32 * dot(n, LIGHT);
      float spec = pow(max(dot(reflect(-LIGHT, n), vec3(0., 0., 1.)), 0.), 28.) * .95;
      float rim = smoothstep(-3.5, 0., dg) * .32;
      glass = glass * diff + spec + rim;
      col = mix(col, glass, smoothstep(1., -1., dg) * .93);
      vec3 cork = vec3(.6, .43, .27) * (.78 + .35 * noise(lp * .7)) * (.82 + .3 * dot(n, LIGHT));
      col = mix(col, cork, smoothstep(1., -1., dc));
    }
  }

// ---- the fish, a quiet silhouette in the river
  if (uFishOn > .5) {
    float fd = fishD(w + off*.6);
    col = mix(col, uFishCol * (.85 + .25*cz), smoothstep(1., -1., fd) * .55 * water);
  }

// ---- the name, made of water; the current carries it off as you scroll away
  if (uNameVis > .001) {
    vec2 dd = texture(uDispMap, vec2(p.x / uSize.x, 1. - p.y / uSize.y)).xy;
    vec2 dpx = vec2(dd.x * uSize.x, -dd.y * uSize.y);
    float dm = length(dpx);
    float k = smoothstep(4., 90., dm);
    vec2 q = p + off + dpx + vec2(0., uScroll);
    vec2 uv = q / uSize;
    vec4 t0 = texture(uTex, uv);
    col += uGlow * t0.b * uGlowAmt * uNameVis;
    float mr = letters(q - off*uDisp, k), mg = letters(q, k), mb = letters(q + off*uDisp, k);
    vec2 px = 1. / uSize;
    float gx = texture(uTex, uv + vec2(2., 0.)*px).g - texture(uTex, uv - vec2(2., 0.)*px).g;
    float gy = texture(uTex, uv + vec2(0., 2.)*px).g - texture(uTex, uv - vec2(0., 2.)*px).g;
    vec3 N = normalize(vec3(-g*.9 - vec2(gx, gy)*6.*(1. - .7*k), 1.));
    float diff = clamp(dot(N, LIGHT), 0., 1.);
    float spec = pow(clamp(dot(reflect(-LIGHT, N), vec3(0., 0., 1.)), 0., 1.), 40.);
    float stretch = length(vec2(length(dFdx(dpx)), length(dFdy(dpx)))) / uGlDpr;
    float dilute = (1. - .75 * smoothstep(30., 260., dm)) / (1. + .45 * stretch);
    vec3 tc = mix(uText, uText2, diff * (1. - .55*k)) + (uCaus*cz*uCausText + spec*uSpec) * (1. - .6*k);
    col = mix(col, tc, vec3(mr, mg, mb) * uTextA * dilute * uNameVis);
  }

  vec3 Nw = normalize(vec3(-g*1.4, 1.));
  col += pow(clamp(dot(reflect(-LIGHT, Nw), vec3(0., 0., 1.)), 0., 1.), 90.) * uSpec * .35 * water;

  vec2 vq = p / uSize - .5;
  col *= mix(1., .8, clamp(length(vq * vec2(1., .8)) * uVig, 0., 1.));
  col += (hash(p + fract(uAmbient)*100.) - .5) * uGrain;
  o = vec4(col, 1.);
}`;
