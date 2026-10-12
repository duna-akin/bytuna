def audio(site):
    return site.page.evaluate("__hero.state().audio")


def test_audio_waits_for_first_interaction(site):
    site.open("?debug")
    assert audio(site)["started"] is False
    site.page.mouse.click(5, 5)
    site.page.wait_for_function("__hero.state().audio.ready", timeout=20_000)
    assert audio(site)["started"] is True


def test_audio_plays_at_quarter_volume(site):
    site.open("?debug")
    site.page.mouse.click(5, 5)
    site.page.wait_for_function("__hero.state().audio.ready", timeout=20_000)
    site.page.wait_for_timeout(2000)  # past the 1.5 s fade-in
    assert abs(audio(site)["level"] - .25) < .01, audio(site)["level"]


def test_keydown_unlocks_audio(site):
    site.open("?debug")
    site.page.keyboard.press("Tab")
    assert audio(site)["started"] is True


STRICT_AUTOPLAY = """
const Real = window.AudioContext;
window.AudioContext = class extends Real {
  constructor(...a) { super(...a); super.suspend(); }      // starts blocked, like a real browser
  resume() { return navigator.userActivation.isActive ? super.resume() : Promise.resolve(); }
};
"""


def test_audio_recovers_when_first_key_is_not_a_gesture(site):
    site.page.add_init_script(STRICT_AUTOPLAY)
    site.open("?debug")
    site.page.keyboard.press("Escape")  # not a user activation: the context stays suspended
    site.page.wait_for_timeout(200)
    site.page.mouse.click(5, 5)
    site.page.wait_for_function("__hero.state().audio.state === 'running'", timeout=5_000)


COUNT_SHOTS = """
window.__shots = 0;
const start = AudioBufferSourceNode.prototype.start;
AudioBufferSourceNode.prototype.start = function (...a) { if (!this.loop) window.__shots++; return start.apply(this, a); };
"""


def test_swish_marks_strokes_not_every_movement(site):
    site.page.add_init_script(COUNT_SHOTS)
    site.open("?debug")
    site.page.mouse.click(5, 5)  # unlock audio (its stone plop is counted, so reset below)
    site.page.wait_for_function("__hero.state().audio.ready", timeout=20_000)
    site.page.mouse.move(150, 200)  # (Playwright teleports the cursor; settle before measuring)
    site.page.wait_for_timeout(400)
    site.page.evaluate("window.__shots = 0")
    for i in range(60):  # slow drift across the hero
        site.page.mouse.move(150 + i * 3, 200)
        site.page.wait_for_timeout(30)
    assert site.page.evaluate("window.__shots") == 0
    site.page.wait_for_timeout(400)
    site.page.mouse.move(650, 260, steps=25)  # one quick stroke
    assert site.page.evaluate("window.__shots") == 1


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
