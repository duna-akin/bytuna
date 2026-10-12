import { equalPowerGains, readMuted, writeMuted } from "./logic.js";

const safeStorage = () => { try { return window.localStorage; } catch { return null; } };

// River murmur at the top crossfades into surf at the beach; swishes and plops on top.
// Nothing is created until the first user gesture (browsers block audio before that).
export function createAudio({ cfg, base = "audio/", storage = safeStorage() }) {
  let ctx = null, master, riverGain, surfGain, buffers = null, progress = 0;
  let muted = readMuted(storage, cfg.storageKey);
  const ext = new Audio().canPlayType('audio/webm; codecs="opus"') ? "webm" : "mp3";

  const load = async name => {
    const res = await fetch(`${base}${name}.${ext}`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return ctx.decodeAudioData(await res.arrayBuffer());
  };

  function fadeTo(v, secs) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(v, t + secs);
  }

  function loop(buffer, dest) {
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.loop = true;
    s.connect(dest);
    s.start();
  }

  function applyProgress() {
    if (!ctx) return;
    const [r, s] = equalPowerGains(progress);
    riverGain.gain.setTargetAtTime(r, ctx.currentTime, .15);
    surfGain.gain.setTargetAtTime(s, ctx.currentTime, .15);
  }

  function unlock() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    riverGain = ctx.createGain();
    surfGain = ctx.createGain();
    riverGain.connect(master);
    surfGain.connect(master);
    applyProgress();
    Promise.all(cfg.names.map(load))
      .then(([river, surf, swish, plop]) => {
        buffers = { river, surf, swish, plop };
        loop(river, riverGain);
        loop(surf, surfGain);
        fadeTo(muted ? 0 : cfg.volume, cfg.fadeIn);
      })
      .catch(err => console.warn("audio unavailable:", err));
  }

  function oneShot(buffer, gain, rate) {
    if (!ctx || !buffer || muted) return;
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g).connect(master);
    s.start();
  }

  return {
    unlock,
    setProgress(p) { progress = p; applyProgress(); },
    swish(gain) { oneShot(buffers?.swish, gain, .9 + Math.random() * .2); },
    plop() { oneShot(buffers?.plop, .8, 2 ** ((Math.random() * 400 - 200) / 1200)); },
    setMuted(v) {
      muted = v;
      writeMuted(storage, cfg.storageKey, v);
      if (buffers) fadeTo(v ? 0 : cfg.volume, .4);
    },
    suspend() { ctx?.suspend(); },
    resume() { return ctx ? ctx.resume() : Promise.resolve(); },
    get muted() { return muted; },
    get started() { return !!ctx; },
    get state() { return ctx ? ctx.state : "none"; },
    get ready() { return !!buffers; },
    get level() { return master ? master.gain.value : 0; },
  };
}
