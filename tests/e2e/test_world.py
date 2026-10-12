def name_box(site):
    b = site.box("#name")
    return b["x"] + b["width"] * .1, b["y"] + b["height"] * .3, b["width"] * .8, b["height"] * .4


def test_name_renders_as_bright_water(site):
    site.open("?debug")
    site.freeze()
    site.advance(.2)
    assert site.state()["gl"] is True
    name = site.lum(*name_box(site))
    b = site.box("#name")
    water = site.lum(4, b["y"], 40, b["height"])
    assert name > water + 25, (name, water)


def test_beach_words_are_carved_into_sand(site):
    site.open("?debug")
    site.freeze()
    site.scroll_to(10_000)
    site.advance(.2)
    w = site.box("#gh")
    carved = site.grid(w["x"], w["y"], w["width"], w["height"], 2)
    plain = site.grid(w["x"], w["y"] + w["height"] * 1.6, w["width"], w["height"] * .6, 2)
    assert site.std(carved) > site.std(plain) * 1.5, (site.std(carved), site.std(plain))


def test_bottle_is_drawn(site):
    site.open("?debug")
    site.freeze()
    site.scroll_to(10_000)
    site.advance(.2)
    b = site.box("#mail")
    bottle = site.grid(b["x"], b["y"], b["width"], b["height"], 2)
    vw, vh = site.page.viewport_size["width"], site.page.viewport_size["height"]
    sand = site.grid(vw - 130, vh - 80, 110, 60, 2)  # clear sand, away from both words
    assert site.std(bottle) > site.std(sand) * 2, (site.std(bottle), site.std(sand))


def test_nogl_shows_plain_html(new_page, server):
    page, errors = new_page()
    page.goto(f"{server}/index.html?nogl&debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    assert page.evaluate("__hero.state().gl") is False
    assert not page.evaluate("document.body.classList.contains('gl')")
    assert page.eval_on_selector("#name", "e => getComputedStyle(e).color") != "rgba(0, 0, 0, 0)"
    assert page.is_hidden("#water")
    assert errors == []


def html_fallback_showing(page):
    return page.evaluate("""() => !document.body.classList.contains('gl')
        && document.querySelector('#water').hidden
        && getComputedStyle(document.querySelector('#name')).color !== 'rgba(0, 0, 0, 0)'""")


def test_lost_webgl_context_brings_back_the_html(new_page, server):
    page, errors = new_page()
    page.goto(f"{server}/index.html?debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    page.evaluate("document.querySelector('#water').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()")
    page.wait_for_timeout(100)
    assert html_fallback_showing(page)
    assert errors == []


def test_fluid_shader_failure_falls_back_to_html(new_page, server):
    page, errors = new_page()
    page.add_init_script("""
        const compile = WebGL2RenderingContext.prototype.compileShader;
        const source = WebGL2RenderingContext.prototype.shaderSource;
        const broken = new WeakSet();
        WebGL2RenderingContext.prototype.shaderSource = function (s, src) {
          if (src.includes('uCurl')) broken.add(s);   // the vorticity pass fails on this "driver"
          return source.call(this, s, broken.has(s) ? 'not glsl' : src);
        };
    """)
    page.goto(f"{server}/index.html?debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    assert html_fallback_showing(page)
    assert all("uCurl" not in e for e in errors), errors  # a warning, not an uncaught error


def test_name_stays_visible_while_fonts_load(new_page, server):
    page, errors = new_page()
    page.route("**/*.woff2", lambda route: (page.wait_for_timeout(3000), route.continue_()))
    page.goto(f"{server}/index.html?debug", wait_until="commit")
    page.wait_for_timeout(800)
    assert not page.evaluate("document.body.classList.contains('gl')")
    assert page.eval_on_selector("#name", "e => getComputedStyle(e).color") != "rgba(0, 0, 0, 0)"
    page.wait_for_function("window.__hero && window.__hero.ready", timeout=20_000)
    assert page.evaluate("document.body.classList.contains('gl')")
    assert errors == []


def test_canvas_matches_the_visible_viewport_not_100vh(new_page, server):
    # phones: 100vh is the height *without* the address bar, innerHeight the height you actually see
    page, errors = new_page()
    page.add_init_script("addEventListener('DOMContentLoaded', () => { const s = document.createElement('style');"
                         " s.textContent = 'canvas#water { height: 110vh; }'; document.head.append(s); })")
    page.goto(f"{server}/index.html?debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    css_h, inner_h, buf_h = page.evaluate("[document.querySelector('#water').getBoundingClientRect().height, innerHeight,"
                                          " document.querySelector('#water').height]")
    assert css_h == inner_h == buf_h, (css_h, inner_h, buf_h)
    assert errors == []


def test_address_bar_height_changes_keep_the_stir(site):
    site.open("?debug")
    resets = site.state()["fluidResets"]
    site.page.set_viewport_size({"width": 720, "height": 415})  # ~8% shorter: an address bar appearing
    site.page.wait_for_function("__hero.state().layouts > 1")
    assert site.state()["fluidResets"] == resets
    site.page.set_viewport_size({"width": 600, "height": 415})  # a real resize still rebuilds the grid
    site.page.wait_for_function("__hero.state().layouts > 2")
    assert site.state()["fluidResets"] == resets + 1


def test_resize_realigns_world(site):
    site.open("?debug")
    before = site.state()["layouts"]
    site.page.set_viewport_size({"width": 560, "height": 480})
    site.page.wait_for_function(f"__hero.state().layouts > {before}")
    site.freeze()
    site.advance(.2)
    assert site.state()["canvas"] == [560, 480]
    name = site.lum(*name_box(site))
    b = site.box("#name")
    assert name > site.lum(4, b["y"], 30, b["height"]) + 25


def test_extreme_viewports_fit(new_page, server):
    for vp in ({"width": 2560, "height": 900}, {"width": 844, "height": 390}):
        page, errors = new_page(viewport=vp)
        page.goto(f"{server}/index.html?debug")
        page.wait_for_function("window.__hero && window.__hero.ready")
        n = page.locator("#name").bounding_box()
        assert n["x"] >= 0 and n["x"] + n["width"] <= vp["width"], (vp, n)
        page.evaluate("scrollTo(0, 1e5)")
        for sel in ("#gh", "#li", "#mail"):
            b = page.locator(sel).bounding_box()
            assert 0 <= b["x"] and b["x"] + b["width"] <= vp["width"], (vp, sel, b)
            assert 0 <= b["y"] and b["y"] + b["height"] <= vp["height"], (vp, sel, b)
        assert errors == []
