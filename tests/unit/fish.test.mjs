import { test } from "node:test";
import assert from "node:assert/strict";
import { createFish } from "../../js/fish.js";

function env(over = {}) {
  return {
    W: 1000, H: 700, nameRect: { x: 250, y: 200, w: 500, h: 220 },
    ptr: { x: -1e4, y: -1e4, lastMove: -10 },
    ripples: [], drags: [],
    ripple(x, y, s) { this.ripples.push([x, y, s]); },
    drag(...a) { this.drags.push(a); },
    ...over,
  };
}

test("the fish flees a moving pointer and splashes", () => {
  const f = createFish({ random: () => .5 });
  Object.assign(f.state, { x: 500, y: 300, a: 0, v: 115 });
  const e = env();
  e.ptr = { x: 440, y: 300, lastMove: 10 }; // just behind the fish, so fleeing means speeding ahead
  const d0 = Math.hypot(f.state.x - e.ptr.x, f.state.y - e.ptr.y);
  for (let i = 0; i < 20; i++) f.step(10 + i / 60, 1 / 60, e);
  assert.ok(f.state.scaredUntil > 10);
  assert.ok(f.state.v > 300, `speed ${f.state.v}`);
  assert.ok(Math.hypot(f.state.x - e.ptr.x, f.state.y - e.ptr.y) > d0);
  assert.ok(e.ripples.some(([, , s]) => s === .55));
});

test("left alone, the fish stays around the river and its skeleton stays finite", () => {
  const f = createFish();
  const e = env();
  for (let i = 0; i < 3000; i++) {
    f.step(i / 30, 1 / 30, e);
    assert.ok(f.state.x > -400 && f.state.x < e.W + 400, `x=${f.state.x}`);
    assert.ok(f.state.y > -400 && f.state.y < e.H + 400, `y=${f.state.y}`);
  }
  assert.ok(f.points.every(Number.isFinite));
});

test("the fish drags the water it swims through", () => {
  const f = createFish();
  Object.assign(f.state, { x: 500, y: 300 });
  const e = env();
  f.step(1, 1 / 30, e);
  assert.ok(e.drags.length > 0);
  assert.ok(e.drags[0].every(Number.isFinite));
});
