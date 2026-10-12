LINKS = {
    "#gh": "https://github.com/duna-akin",
    "#li": "https://www.linkedin.com/in/tuna-akin/",
    "#mail": "mailto:tuna.akin@protonmail.com",
}


def test_dictionary_reads_without_javascript(new_page, server):
    page, errors = new_page(java_script_enabled=False)
    page.goto(f"{server}/index.html")
    text = page.locator("main").inner_text()
    assert "tuna" in page.locator("#name").inner_text()
    assert "a large, fast, restless fish." in text
    assert "the Danube, Europe's second-longest river." in text
    assert "Tuna Akın, student @ Laf who builds things." in text
    assert "← you are here" in text
    assert errors == []


def test_links_are_exactly_the_three_from_the_spec(site):
    site.open()
    hrefs = site.page.eval_on_selector_all("a[href]", "as => as.map(a => '#' + a.id + ' ' + a.getAttribute('href'))")
    assert sorted(hrefs) == sorted(f"{k} {v}" for k, v in LINKS.items())
    assert site.page.get_attribute("#mail", "aria-label") == "email tuna.akin@protonmail.com"


def test_no_corner_labels_or_instructions(site):
    site.open()
    assert site.page.locator(".corner, #hint").count() == 0


def test_phone_has_no_horizontal_scroll(new_page, server):
    page, errors = new_page(viewport={"width": 390, "height": 844})
    page.goto(f"{server}/index.html")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert errors == []
