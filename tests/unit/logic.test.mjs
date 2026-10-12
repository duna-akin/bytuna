import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calmness, nameVisibility, gridFor, angleTo, capFlick, rippleStrength,
  scrollProgress, equalPowerGains, swishGain, readMuted, writeMuted,
} from "../../js/logic.js";
import { SCROLL, FLUID } from "../../js/config.js";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test("calmness: stirring keeps ink loose, stillness pulls it home", () => {
  assert.deepEqual(calmness(0, FLUID.velDissipation), { relax: .35, dissipation: 1.6, curl: 1 });
  const still = calmness(10, FLUID.velDissipation);
  close(still.relax, 2.55); close(still.dissipation, 5.1); close(still.curl, 0);
});

test("nameVisibility fades between 8% and 58% of a viewport", () => {
  close(nameVisibility(0, 1000, SCROLL), 1);
  close(nameVisibility(80, 1000, SCROLL), 1);
  close(nameVisibility(330, 1000, SCROLL), .5);
  close(nameVisibility(580, 1000, SCROLL), 0);
  close(nameVisibility(5000, 1000, SCROLL), 0);
});

test("gridFor keeps the short side at res", () => {
  assert.deepEqual(gridFor(128, 1600, 900), [228, 128]);
  assert.deepEqual(gridFor(128, 400, 800), [128, 256]);
});

test("angleTo turns the short way and respects the step", () => {
  const wrapped = angleTo(3, -3, 10);       // turns across ±π (+0.28 rad), not the long way round
  close(Math.cos(wrapped), Math.cos(-3)); close(Math.sin(wrapped), Math.sin(-3));
  assert.ok(wrapped > 3, "should turn the short way");
  close(angleTo(0, 1, .25), .25);
  close(angleTo(0, -1, .25), -.25);
});

test("capFlick limits a single movement", () => {
  assert.deepEqual(capFlick(100, 0, 36), [36, 0]);
  assert.deepEqual(capFlick(10, 0, 36), [10, 0]);
  assert.deepEqual(capFlick(0, 0, 36), [0, 0]);
});

test("rippleStrength stays within [.06, .35]", () => {
  close(rippleStrength(0), .06); close(rippleStrength(1e6), .35);
});

test("scrollProgress handles a page that cannot scroll", () => {
  close(scrollProgress(100, 0), 0); close(scrollProgress(50, 100), .5); close(scrollProgress(500, 100), 1);
});

test("equalPowerGains keeps total power constant", () => {
  assert.deepEqual(equalPowerGains(0).map(v => +v.toFixed(6)), [1, 0]);
  const [r, s] = equalPowerGains(.5);
  close(r * r + s * s, 1); close(r, s);
  close(equalPowerGains(2)[1], 1);
});

test("swishGain grows with speed and caps at .5", () => {
  close(swishGain(0), 0); close(swishGain(750), .25); close(swishGain(1e5), .5);
});

test("mute preference survives broken storage", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(readMuted(broken, "k"), false);
  assert.doesNotThrow(() => writeMuted(broken, "k", true));
  assert.equal(readMuted(null, "k"), false);
  const m = new Map();
  const mem = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  writeMuted(mem, "k", true); assert.equal(readMuted(mem, "k"), true);
  writeMuted(mem, "k", false); assert.equal(readMuted(mem, "k"), false);
});
