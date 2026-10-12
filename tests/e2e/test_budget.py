from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_code_weight_under_120kb():
    files = [ROOT / "index.html", ROOT / "styles.css", *sorted((ROOT / "js").glob("*.js"))]
    total = sum(f.stat().st_size for f in files if f.exists())
    assert total < 120_000, f"HTML+CSS+JS is {total} bytes"


def test_fonts_are_self_hosted_and_small(new_page, server):
    page, errors = new_page()
    sizes, external = {}, []

    def on_response(resp):
        url = resp.url
        if "fonts.googleapis" in url or "fonts.gstatic" in url:
            external.append(url)
        if url.endswith(".woff2"):
            sizes[url] = len(resp.body())

    page.on("response", on_response)
    page.goto(f"{server}/index.html")
    page.evaluate("document.fonts.ready.then(() => true)")
    page.wait_for_load_state("networkidle")
    assert external == []
    assert sizes, "no self-hosted fonts were loaded"
    assert sum(sizes.values()) < 150_000, sizes
    turkish = page.evaluate("document.fonts.load('400 16px Fraunces', 'ışğçöü').then(fs => fs.map(f => f.status))")
    assert turkish and all(s == "loaded" for s in turkish), turkish
    assert errors == []
