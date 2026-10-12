"""Measure real frame rate (normal mode, real clock) for 5 seconds.

Usage: .venv/bin/python tools/perf.py [--headed] [--size 1440x900] [--phone]
Headless runs use software WebGL and only show relative cost; use --headed for real GPU numbers.
"""
import argparse
import functools
import http.server
import statistics
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tests" / "e2e"))
from conftest import CHROMIUM_ARGS, QuietHandler  # noqa: E402

FRAMES = """() => new Promise(done => {
  const ts = [];
  const f = t => { ts.push(t); ts.length < 300 ? requestAnimationFrame(f) : done(ts); };
  requestAnimationFrame(f);
})"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--headed", action="store_true")
    ap.add_argument("--size", default="1440x900")
    ap.add_argument("--phone", action="store_true")
    a = ap.parse_args()
    w, h = (390, 844) if a.phone else map(int, a.size.split("x"))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not a.headed, args=[] if a.headed else CHROMIUM_ARGS)
        page = browser.new_page(viewport={"width": w, "height": h}, is_mobile=a.phone, has_touch=a.phone)
        page.goto(f"http://127.0.0.1:{httpd.server_port}/index.html")
        page.wait_for_timeout(1500)
        for label, y in (("hero", 0), ("beach", 10 ** 6)):
            page.evaluate(f"scrollTo(0, {y})")
            page.wait_for_timeout(300)
            ts = page.evaluate(FRAMES)
            gaps = sorted(b - a for a, b in zip(ts, ts[1:]))
            print(f"{label:6} median {1000 / statistics.median(gaps):5.1f} fps   p95 frame {gaps[int(len(gaps) * .95)]:5.1f} ms")
        browser.close()
    httpd.shutdown()


if __name__ == "__main__":
    main()
