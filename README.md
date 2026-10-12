# bytuna

A river you can stir. Tuna's personal site: plain HTML/CSS plus a few small
ES modules that render the water with WebGL2. No framework, no build step.

## Run it

    python3 -m http.server 8000

Open http://localhost:8000. To try it on a phone on the same Wi-Fi, run
`python3 -m http.server 8000 --bind 0.0.0.0` and open `http://<your-computer-ip>:8000`.

## Develop

    python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt && .venv/bin/playwright install chromium
    node --test tests/unit/          # pure logic
    .venv/bin/pytest -q              # the page, in headless Chromium

Useful URLs: `?debug` (deterministic clock + `window.__hero`), `?nogl` (no-WebGL fallback).

Tools: `tools/capture.py {hero,stir,scroll,beach}` renders frame sheets and an mp4,
`tools/perf.py --headed` measures frame rate, `tools/make_audio.py` regenerates the sounds,
`tools/fetch_fonts.py` re-downloads the self-hosted fonts.

Design: `docs/superpowers/specs/2026-10-11-river-site-design.md`.
