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

  const unlock = () => {
    audio.unlock();
    audio.setProgress(progress());
    removeEventListener("pointerdown", unlock, true);
    removeEventListener("keydown", unlock, true);
  };
  addEventListener("pointerdown", unlock, true);
  addEventListener("keydown", unlock, true);

  button.addEventListener("click", () => { audio.setMuted(!audio.muted); sync(); });
  addEventListener("scroll", () => audio.setProgress(progress()), { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? audio.suspend() : audio.resume()));
  on("stir", speed => audio.swish(speed, performance.now() / 1000));
  on("stone", () => audio.plop());
  return audio;
}
