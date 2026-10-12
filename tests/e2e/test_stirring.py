def name_grid(site):
    b = site.box("#name")
    return site.grid(b["x"], b["y"], b["width"], b["height"], 6)


def drag_through_name(site, steps=12, wiggle=20):
    b = site.box("#name")
    y = b["y"] + b["height"] * .55
    site.page.mouse.move(b["x"] + b["width"] * .1, y)
    for i in range(steps):
        site.page.mouse.move(b["x"] + b["width"] * (.1 + .8 * (i + 1) / steps), y + (wiggle if i % 2 else -wiggle))
        site.advance(1 / 30)


def test_stirring_scrambles_then_reassembles(site):
    site.open("?debug")
    site.freeze()
    site.advance(.5)
    base = name_grid(site)
    drag_through_name(site)
    stirred = name_grid(site)
    site.advance(5, fps=10)
    settled = name_grid(site)
    assert site.state()["fluidOK"] is True
    assert site.mad(base, stirred) > 12, site.mad(base, stirred)
    assert site.mad(base, settled) < 3, site.mad(base, settled)


def test_flick_across_screen_recovers(site):
    site.open("?debug")
    site.freeze()
    site.advance(.5)
    base = name_grid(site)
    b = site.box("#name")
    for _ in range(3):  # single-event jumps corner to corner across the whole name
        site.page.mouse.move(b["x"] + 5, b["y"] + 5)
        site.page.mouse.move(b["x"] + b["width"] - 5, b["y"] + b["height"] - 5)
        site.advance(1 / 30)
    flung = name_grid(site)
    assert all(0 <= v <= 255 for v in flung)
    # the flick cap turns a full-width jump into a small nudge: it registers, but cannot fling the word
    assert .2 < site.mad(base, flung) < 6, site.mad(base, flung)
    site.advance(5, fps=10)
    assert site.mad(base, name_grid(site)) < 3


def test_stone_pushes_ink_and_ripples(site):
    site.open("?debug")
    site.freeze()
    site.advance(.5)
    base = name_grid(site)
    b = site.box("#name")
    site.page.mouse.click(b["x"] + b["width"] * .4, b["y"] + b["height"] * .5)
    site.advance(.3)
    assert site.mad(base, name_grid(site)) > 6
    site.advance(5, fps=10)
    assert site.mad(base, name_grid(site)) < 3


def test_scrolling_carries_name_away_and_back(site):
    site.open("?debug")
    site.freeze()
    site.advance(.5)
    base = name_grid(site)
    for y in range(0, 340, 40):
        site.scroll_to(y)
        site.advance(1 / 30)
    assert site.state()["nameVis"] == 0
    site.scroll_to(0)
    site.advance(5, fps=10)
    assert site.state()["nameVis"] == 1
    assert site.mad(base, name_grid(site)) < 3


def test_fluid_sleeps_far_down_the_page(site):
    site.open("?debug")
    site.scroll_to(10_000)
    site.advance(.1)
    assert site.state()["fluidActive"] is False
