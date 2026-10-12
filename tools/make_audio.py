"""Synthesize the site's sounds with ffmpeg + plain Python (no samples, so no licence questions).

Writes audio/{river,surf,swish,plop}.{webm,mp3}. Loops are made seamless by
crossfading their tail into their head.
"""
import array
import math
import random
import subprocess
import tempfile
import wave
from pathlib import Path

SR = 48_000
OUT = Path(__file__).resolve().parents[1] / "audio"


def noise(seconds, color, filters, seed):
    """Filtered noise from ffmpeg as a list of floats in [-1, 1]."""
    cmd = ["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", f"anoisesrc=d={seconds}:c={color}:r={SR}:a=0.5:seed={seed}",
           "-af", filters, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return [v / 32768 for v in array.array("h", raw)]


def seamless(x, fade_s):
    """Equal-power crossfade of the last fade_s seconds into the first, returning len(x) - fade samples."""
    f = int(fade_s * SR)
    body = x[:len(x) - f]
    for i in range(f):
        w = i / f * math.pi / 2
        body[i] = body[i] * math.sin(w) + x[len(x) - f + i] * math.cos(w)
    return body


def normalize(x, peak):
    m = max(abs(v) for v in x) or 1
    return [v / m * peak for v in x]


def write(name, x, bitrate_opus="48k", bitrate_mp3="64k"):
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / f"{name}.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(array.array("h", (int(max(-1, min(1, v)) * 32767) for v in x)).tobytes())
        for ext, codec, rate in (("webm", "libopus", bitrate_opus), ("mp3", "libmp3lame", bitrate_mp3)):
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", codec, "-b:a", rate,
                            str(OUT / f"{name}.{ext}")], check=True)


def river():
    x = noise(23, "brown", "highpass=f=70,lowpass=f=900,tremolo=f=0.25:d=0.25", seed=7)
    return normalize(seamless(x, 3), .7)


def surf():
    x = noise(27, "pink", "highpass=f=120,lowpass=f=1400", seed=11)
    # three waves per 24 s loop (period 8 s divides the loop, so the crossfade lines up)
    env = [.18 + .82 * max(0.0, math.sin(2 * math.pi * (i / SR) / 8)) ** 3 for i in range(len(x))]
    return normalize(seamless([a * b for a, b in zip(x, env)], 3), .7)


def swish():
    x = noise(.7, "pink", "bandpass=f=1100:width_type=h:w=900", seed=3)
    n = len(x)
    env = [min(1, (i / SR) / .08) * math.exp(-max(0, i / SR - .08) * 6) * min(1, (n - i) / (SR * .05)) for i in range(n)]
    return normalize([a * b for a, b in zip(x, env)], .8)


def plop():
    rng = random.Random(5)
    out, phase = [], 0.0
    for i in range(int(.35 * SR)):
        t = i / SR
        f = 520 + 700 * (1 - math.exp(-t * 40))  # a bubble's pitch rises quickly as it closes
        phase += 2 * math.pi * f / SR
        tone = math.sin(phase) * math.exp(-t * 14)
        click = rng.uniform(-1, 1) * math.exp(-t * 300) * .5
        out.append(tone + click)
    return normalize(out, .85)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, make in (("river", river), ("surf", surf), ("swish", swish), ("plop", plop)):
        write(name, make())
        print(name, "ok")
