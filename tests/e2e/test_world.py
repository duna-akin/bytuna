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
