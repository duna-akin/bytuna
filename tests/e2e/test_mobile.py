PHONE = {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True}


def test_beach_items_never_overlap(new_page, server):
    boxes_js = """() => Object.fromEntries(['#gh', '#li', '#mail', '.addr'].map(s => {
        const r = document.querySelector(s).getBoundingClientRect();
        return [s, [r.left, r.top + scrollY, r.right, r.bottom + scrollY]];
    }))"""
    for w, h in ((320, 568), (360, 640), (375, 667), (390, 844), (412, 915), (720, 450), (1280, 720)):
        page, errors = new_page(viewport={"width": w, "height": h})
        page.goto(f"{server}/index.html")
        page.evaluate("document.fonts.ready.then(() => true)")
        page.focus("#mail")  # reveals the address where it actually shows
        page.wait_for_timeout(600)
        boxes = page.evaluate(boxes_js)
        names = list(boxes)
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                ax0, ay0, ax1, ay1 = boxes[a]
                bx0, by0, bx1, by1 = boxes[b]
                overlap = min(ax1, bx1) > max(ax0, bx0) and min(ay1, by1) > max(ay0, by0)
                assert not overlap, f"{a} overlaps {b} at {w}x{h}: {boxes[a]} vs {boxes[b]}"
        assert errors == []


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


TOUCH = """([kind, x, y]) => document.body.dispatchEvent(new PointerEvent(kind, {
    bubbles: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x, clientY: y }))"""


def test_touch_scroll_does_not_drop_stones(new_page, server):
    page, errors = new_page(**PHONE)
    page.goto(f"{server}/index.html?debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    page.evaluate("window.__stones = 0; __hero.on('stone', () => window.__stones++)")
    for kind, y in (("pointerdown", 600), ("pointermove", 560), ("pointermove", 480), ("pointercancel", 480)):
        page.evaluate(TOUCH, [kind, 200, y])  # a swipe the browser turns into a scroll
    assert page.evaluate("window.__stones") == 0
    for kind in ("pointerdown", "pointerup"):  # a tap
        page.evaluate(TOUCH, [kind, 200, 600])
    assert page.evaluate("window.__stones") == 1
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
