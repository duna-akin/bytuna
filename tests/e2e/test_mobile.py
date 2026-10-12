PHONE = {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True}


def test_phone_layout_and_resolution(new_page, server):
    page, errors = new_page(**PHONE)
    page.goto(f"{server}/index.html?debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    size = page.eval_on_selector("#name", "e => parseFloat(getComputedStyle(e).fontSize)")
    assert abs(size - 390 * .37) < 1
    assert page.eval_on_selector("#name", "e => getComputedStyle(e).touchAction") == "none"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert page.evaluate("__hero.state().canvas") == [390, 844]  # coarse pointers render at DPR 1
    assert errors == []


def test_tap_drops_a_stone(new_page, server):
    page, errors = new_page(**PHONE)
    page.goto(f"{server}/index.html?debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    page.evaluate("__hero.freeze(); __hero.advance(.5)")
    b = page.locator("#name").bounding_box()
    grid = f"__hero.grid({b['x']}, {b['y']}, {b['width']}, {b['height']}, 6)"
    base = page.evaluate(grid)
    page.touchscreen.tap(b["x"] + b["width"] * .4, b["y"] + b["height"] * .5)
    page.evaluate("__hero.advance(.3)")
    after = page.evaluate(grid)
    assert sum(abs(x - y) for x, y in zip(base, after)) / len(base) > 6
    assert errors == []
