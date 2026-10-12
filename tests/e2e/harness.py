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

    @staticmethod
    def mad(a, b):
        """Mean absolute difference between two equal-length luminance grids."""
        assert len(a) == len(b) and a
        return sum(abs(x - y) for x, y in zip(a, b)) / len(a)

    @staticmethod
    def std(a):
        m = sum(a) / len(a)
        return math.sqrt(sum((x - m) ** 2 for x in a) / len(a))
