import { AUDIO } from "./config.js";
import { scrollProgress } from "./logic.js";
import { createAudio } from "./audio.js";

// The mute button, the first-gesture unlock, scroll crossfade and hidden-tab pause.
export function setupSound(button, on) {
  const audio = createAudio({ cfg: AUDIO });
  const progress = () => scrollProgress(scrollY, document.documentElement.scrollHeight - innerHeight);
  const sync = () => button.setAttribute("aria-pressed", String(audio.muted));
  sync();
  button.hidden = false;

  // Browsers only let audio start inside a real gesture, and which events count differs
  // (Escape never does; iOS prefers touchend). Keep trying on every gesture until it runs.
  const gestures = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  const unlock = async () => {
    audio.unlock();
    audio.setProgress(progress());
    await audio.resume();
    if (audio.state === "running") for (const g of gestures) removeEventListener(g, unlock, true);
  };
  for (const g of gestures) addEventListener(g, unlock, true);

  button.addEventListener("click", () => { audio.setMuted(!audio.muted); sync(); });
  addEventListener("scroll", () => audio.setProgress(progress()), { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? audio.suspend() : audio.resume()));
  on("stir", speed => audio.swish(speed, performance.now() / 1000));
  on("stone", () => audio.plop());
  return audio;
}
