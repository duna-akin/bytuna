// Hovering or focusing a word deepens its carving; the bottle lifts out of the sand.
export function beachFeature(ctx) {
  let hoverIdx = -1, bottleHover = false, shown = [0, 0, 0, 0];

  ctx.els.words.forEach((el, i) => {
    const on = () => { hoverIdx = i; };
    const off = () => { if (hoverIdx === i) hoverIdx = -1; };
    for (const [ev, fn] of [["pointerenter", on], ["pointerleave", off], ["focus", on], ["blur", off]]) el.addEventListener(ev, fn);
  });
  for (const [ev, v] of [["pointerenter", true], ["pointerleave", false], ["focus", true], ["blur", false]]) {
    ctx.els.bottle.addEventListener(ev, () => { bottleHover = v; });
  }

  return {
    update(t, dt) {
      const F = ctx.F;
      F.hoverAmt += ((hoverIdx >= 0 ? 1 : 0) - F.hoverAmt) * Math.min(1, dt * 8);
      if (hoverIdx >= 0) shown = ctx.world.rects[hoverIdx] || shown;
      F.hoverRect = shown;
      F.bottleLift += ((bottleHover ? 1 : 0) - F.bottleLift) * Math.min(1, dt * 7);
    },
    state() { return { hoverIdx, hoverAmt: ctx.F.hoverAmt, bottleLift: ctx.F.bottleLift }; },
  };
}
