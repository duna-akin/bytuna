def audio(site):
    return site.page.evaluate("__hero.state().audio")


def test_audio_waits_for_first_interaction(site):
    site.open("?debug")
    assert audio(site)["started"] is False
    site.page.mouse.click(5, 5)
    site.page.wait_for_function("__hero.state().audio.ready", timeout=20_000)
    assert audio(site)["started"] is True


def test_keydown_unlocks_audio(site):
    site.open("?debug")
    site.page.keyboard.press("Tab")
    assert audio(site)["started"] is True


def test_mute_toggle_persists(site):
    site.open("?debug")
    btn = site.page.locator("#sound")
    assert btn.is_visible()
    assert btn.get_attribute("aria-pressed") == "false"
    btn.click()
    assert btn.get_attribute("aria-pressed") == "true"
    assert audio(site)["muted"] is True
    assert site.page.evaluate("localStorage.getItem('bytuna:muted')") == "1"
    site.open("?debug")
    assert site.page.get_attribute("#sound", "aria-pressed") == "true"


def test_hidden_tab_suspends_audio(site):
    site.open("?debug")
    site.page.mouse.click(5, 5)
    site.page.wait_for_function("__hero.state().audio.ready", timeout=20_000)
    hide = """h => { Object.defineProperty(document, 'hidden', {value: h, configurable: true});
                     document.dispatchEvent(new Event('visibilitychange')); }"""
    site.page.evaluate(hide, True)
    site.page.wait_for_function("__hero.state().audio.state === 'suspended'")
    site.page.evaluate(hide, False)
    site.page.wait_for_function("__hero.state().audio.state === 'running'")


def test_sound_button_works_without_webgl(new_page, server):
    page, errors = new_page()
    page.goto(f"{server}/index.html?nogl&debug")
    page.wait_for_function("window.__hero && window.__hero.ready")
    page.click("#sound")
    assert page.evaluate("__hero.state().audio.muted") is True
    assert errors == []
