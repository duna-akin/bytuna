"""Record deterministic frames of the site for review (contact sheet + mp4).

Usage: .venv/bin/python tools/capture.py SCENARIO [--out captures] [--size 1280x720]
Scenarios: hero, stir, scroll, beach
"""
import argparse
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


def scenario_frames(site, name):
    """Yield after each frame that should be saved."""
    page = site.page
    if name == "hero":
        for _ in range(24):
            site.advance(.125)
            yield
    elif name == "stir":
        b = site.box("#name")
        y = b["y"] + b["height"] * .55
        site.advance(.5)
        page.mouse.move(b["x"], y)
        for i in range(12):
            page.mouse.move(b["x"] + b["width"] * (i + 1) / 12, y + (20 if i % 2 else -20))
            site.advance(1 / 30)
            yield
        for _ in range(20):
            site.advance(.15)
            yield
    elif name == "scroll":
        total = page.evaluate("document.documentElement.scrollHeight - innerHeight")
        for i in range(17):
            site.scroll_to(total * i / 16)
            site.advance(.1)
            yield
    elif name == "beach":
        site.scroll_to(10 ** 6)
        for _ in range(28):
            site.advance(.5)
            yield
    else:
        raise SystemExit(f"unknown scenario {name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scenario")
    ap.add_argument("--out", default="captures")
    ap.add_argument("--size", default="1280x720")
    a = ap.parse_args()
    w, h = map(int, a.size.split("x"))
    out = ROOT / a.out / a.scenario
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.png"):
        f.unlink()
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        browser = p.chromium.launch(args=CHROMIUM_ARGS)
        page = browser.new_page(viewport={"width": w, "height": h})
        site = Site(page, f"http://127.0.0.1:{httpd.server_port}").open("?debug")
        for i, _ in enumerate(scenario_frames(site, a.scenario)):
            page.evaluate("__hero.region(0, 0, 1, 1)")  # render the current moment
            page.screenshot(path=str(out / f"frame-{i:03d}.png"))
        browser.close()
    httpd.shutdown()
    frames = str(out / "frame-%03d.png")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "8", "-i", frames,
                    "-pix_fmt", "yuv420p", str(out / f"{a.scenario}.mp4")], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", frames,
                    "-vf", "scale=400:-1,tile=4x4", "-frames:v", "1", str(out / "sheet.png")], check=True)
    print(out / "sheet.png")


if __name__ == "__main__":
    main()
