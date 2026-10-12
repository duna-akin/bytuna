"""Helpers for driving the river site in Playwright."""
import math


class Site:
    def __init__(self, page, base):
        self.page = page
        self.base = base

    def open(self, query=""):
        self.page.goto(f"{self.base}/index.html{query}")
        if "debug" in query:
            self.page.wait_for_function("window.__hero && window.__hero.ready", timeout=60_000)
        return self

    def box(self, selector):
        b = self.page.locator(selector).bounding_box()
        assert b, f"{selector} not rendered"
        return b

    def advance(self, seconds, fps=30):
        self.page.evaluate("([s, f]) => __hero.advance(s, f)", [seconds, fps])

    def freeze(self, on=True):
        self.page.evaluate("on => __hero.freeze(on)", on)

    def state(self):
        return self.page.evaluate("__hero.state()")

    def region(self, x, y, w, h):
        return self.page.evaluate("([x, y, w, h]) => __hero.region(x, y, w, h)", [x, y, w, h])

    def lum(self, x, y, w, h):
        r, g, b = self.region(x, y, w, h)
        return .2126 * r + .7152 * g + .0722 * b

    def grid(self, x, y, w, h, step=4):
        return self.page.evaluate("([x, y, w, h, s]) => __hero.grid(x, y, w, h, s)", [x, y, w, h, step])

    def scroll_to(self, y):
        self.page.evaluate("y => { scrollTo(0, y); dispatchEvent(new Event('scroll')); }", y)
        self.page.wait_for_timeout(50)

    @staticmethod
    def mad(a, b):
        """Mean absolute difference between two equal-length luminance grids."""
        assert len(a) == len(b) and a
        return sum(abs(x - y) for x, y in zip(a, b)) / len(a)

    @staticmethod
    def std(a):
        m = sum(a) / len(a)
        return math.sqrt(sum((x - m) ** 2 for x in a) / len(a))
