def test_fish_swims(site):
    site.open("?debug")
    site.advance(.1)
    a = site.state()["fish"]
    site.advance(2, fps=15)
    b = site.state()["fish"]
    assert site.state()["fishOn"] is True
    assert abs(a["x"] - b["x"]) + abs(a["y"] - b["y"]) > 50


def test_reduced_motion_hides_fish_and_stills_water(new_page, server):
    page, errors = new_page(reduced_motion="reduce")
    page.goto(f"{server}/index.html?debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    page.evaluate("__hero.advance(.5)")
    a = page.evaluate("__hero.grid(0, 0, 200, 200, 8)")
    page.evaluate("__hero.advance(1)")
    b = page.evaluate("__hero.grid(0, 0, 200, 200, 8)")
    assert page.evaluate("__hero.state().fishOn") is False
    assert sum(abs(x - y) for x, y in zip(a, b)) / len(a) < 1
    assert errors == []
