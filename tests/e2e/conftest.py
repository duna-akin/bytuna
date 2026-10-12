import functools
import http.server
import threading
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

from harness import Site

ROOT = Path(__file__).resolve().parents[2]
CHROMIUM_ARGS = ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@pytest.fixture(scope="session")
def server():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{httpd.server_port}"
    httpd.shutdown()


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch(args=CHROMIUM_ARGS)
        yield b
        b.close()


@pytest.fixture
def new_page(browser):
    """Factory: new_page(viewport=..., **context options) -> (page, errors)."""
    contexts = []

    def make(viewport=None, **kwargs):
        ctx = browser.new_context(viewport=viewport or {"width": 720, "height": 450}, device_scale_factor=1, **kwargs)
        contexts.append(ctx)
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        return page, errors

    yield make
    for c in contexts:
        c.close()


@pytest.fixture
def site(new_page, server):
    page, errors = new_page()
    yield Site(page, server)
    assert errors == [], f"console errors: {errors}"
