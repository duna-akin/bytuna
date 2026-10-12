"""Render the beach with each candidate sand font and tile them into one comparison image."""
import functools
import http.server
import subprocess
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tests" / "e2e"))
from harness import Site  # noqa: E402
from conftest import CHROMIUM_ARGS, QuietHandler  # noqa: E402

CANDIDATES = [  # (label, css family, weight, style, google family spec)
    ("1-fraunces-italic", '"Fraunces"', 600, "italic", None),
    ("2-instrument-serif", '"Instrument Serif"', 400, "italic", "Instrument+Serif:ital@1"),
    ("3-jetbrains-mono", '"JetBrains Mono"', 500, "normal", "JetBrains+Mono:wght@500"),
    ("4-gloria-hallelujah", '"Gloria Hallelujah"', 400, "normal", "Gloria+Hallelujah"),
]


def main():
    out = ROOT / "captures" / "sand-fonts"
    out.mkdir(parents=True, exist_ok=True)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        browser = p.chromium.launch(args=CHROMIUM_ARGS)
        for label, family, weight, style, spec in CANDIDATES:
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            site = Site(page, f"http://127.0.0.1:{httpd.server_port}").open("?debug")
            if spec:  # comparison only: load the candidate from Google Fonts
                page.add_style_tag(url=f"https://fonts.googleapis.com/css2?family={spec}&display=block")
            page.evaluate("([f, w, s]) => __hero.setSandFont(f, w, s)", [family, weight, style])
            site.freeze()
            site.scroll_to(10 ** 6)
            site.advance(.2)
            page.evaluate("__hero.region(0, 0, 1, 1)")
            page.screenshot(path=str(out / f"{label}.png"))
            page.close()
        browser.close()
    httpd.shutdown()
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-pattern_type", "glob", "-i", str(out / "[0-9]-*.png"),
                    "-vf", "scale=640:-1,tile=2x2", "-frames:v", "1", str(out / "comparison.png")], check=True)
    print(out / "comparison.png")


if __name__ == "__main__":
    main()
