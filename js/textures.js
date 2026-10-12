// The HTML is the source of truth: measure the real elements and draw matching textures.

export const docRect = el => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
};

const fontOf = (cs, size) => `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
const nameCanvas = document.createElement("canvas");
const beachCanvas = document.createElement("canvas");

function surface(canvas, W, H, dpr) {
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const c = canvas.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.globalCompositeOperation = "source-over";
  c.fillStyle = "#000";
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "lighter";
  c.textAlign = "center";
  c.textBaseline = "middle";
  return c;
}

// The name at its resting place (page coords): R crisp, G soft, B wide glow.
export async function drawName(G, tex, el, W, H, dpr) {
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize);
  const font = fontOf(cs, size);
  try { await document.fonts.load(font, el.textContent); } catch { /* canvas falls back to the next family */ }
  const c = surface(nameCanvas, W, H, dpr);
  c.font = font;
  if ("letterSpacing" in c) c.letterSpacing = (parseFloat(cs.letterSpacing) || 0) + "px";
  const r = docRect(el);
  const x = r.x + r.w / 2, y = r.y + r.h / 2 + size * .04;
  for (const [color, blur] of [["#ff0000", 0], ["#00ff00", size * .05], ["#0000ff", size * .16]]) {
    c.filter = blur ? `blur(${blur}px)` : "none";
    c.fillStyle = color;
    c.fillText(el.textContent, x, y);
  }
  c.filter = "none";
  G.upload(tex, nameCanvas);
}

// Words in the sand, in the beach section's own frame: R crisp groove, G soft groove.
export async function drawBeach(G, tex, words, beachTop, W, H, dpr, pad) {
  const cs = getComputedStyle(words[0]);
  const size = parseFloat(cs.fontSize);
  const font = fontOf(cs, size);
  try { await document.fonts.load(font, words.map(w => w.textContent).join(" ")); } catch { /* fallback family */ }
  const c = surface(beachCanvas, W, H, dpr);
  c.font = font;
  const rects = [];
  for (const el of words) {
    const r = docRect(el);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2 - beachTop;
    const rot = (parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0) * Math.PI / 180;
    for (const [color, blur] of [["#ff0000", 0], ["#00ff00", size * .07]]) {
      c.save();
      c.translate(cx, cy + size * .06);
      c.rotate(rot);
      c.filter = blur ? `blur(${blur}px)` : "none";
      c.fillStyle = color;
      c.fillText(el.textContent, 0, 0);
      c.restore();
    }
    rects.push([r.x - pad, r.y - pad, r.x + r.w + pad, r.y + r.h + pad]);
  }
  c.filter = "none";
  G.upload(tex, beachCanvas);
  return rects;
}
