def at_beach(site):
    site.open("?debug")
    site.freeze()
    site.scroll_to(10_000)
    site.advance(.2)


def word_std(site, sel):
    w = site.box(sel)
    return site.std(site.grid(w["x"], w["y"], w["width"], w["height"], 2))


def test_hover_deepens_carving(site):
    at_beach(site)
    before = word_std(site, "#gh")
    site.page.hover("#gh")
    site.advance(.6)
    assert site.state()["hoverIdx"] == 0
    assert word_std(site, "#gh") > before * 1.15


def test_bottle_lifts_and_reveals_address(site):
    at_beach(site)
    site.page.hover("#mail")
    site.advance(.6)
    assert site.state()["bottleLift"] > .9
    site.page.wait_for_timeout(700)  # CSS transition on the address
    assert float(site.page.eval_on_selector(".addr", "e => getComputedStyle(e).opacity")) > .8


def test_keyboard_reaches_links(site):
    at_beach(site)
    order = []
    for _ in range(3):
        site.page.keyboard.press("Tab")
        order.append(site.page.evaluate("document.activeElement.id"))
        site.advance(.3)
        if order[-1] == "gh":
            assert site.state()["hoverIdx"] == 0
    assert order == ["gh", "li", "mail"]
    site.advance(.5)
    assert site.state()["bottleLift"] > .9
    site.page.wait_for_timeout(700)
    assert float(site.page.eval_on_selector(".addr", "e => getComputedStyle(e).opacity")) > .8
