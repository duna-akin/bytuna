import json
import subprocess
from pathlib import Path

AUDIO = Path(__file__).resolve().parents[2] / "audio"
EXPECTED = {"river": 20.0, "surf": 24.0, "swish": .7, "plop": .35}


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(json.loads(out)["format"]["duration"])


def test_every_sound_exists_in_both_formats_with_expected_length():
    for name, secs in EXPECTED.items():
        for ext in ("webm", "mp3"):
            f = AUDIO / f"{name}.{ext}"
            assert f.exists(), f
            assert abs(duration(f) - secs) < .15, (f, duration(f))


def test_audio_budget_per_format():
    for ext in ("webm", "mp3"):
        total = sum((AUDIO / f"{n}.{ext}").stat().st_size for n in EXPECTED)
        assert total <= 600_000, (ext, total)


def test_credits_recorded():
    text = (AUDIO / "CREDITS.md").read_text()
    for name in EXPECTED:
        assert name in text
