"""Download Google Fonts as self-hosted WOFF2 (latin + latin-ext) and write fonts/fonts.css.

Usage: python3 tools/fetch_fonts.py "Fraunces:ital,wght@0,400;0,700;1,400;1,600" "JetBrains+Mono:wght@400"

The giant "tuna" also needs Fraunces' high-contrast display cut (opsz 144). The full
optical-size axis doubles every file, so instead DISPLAY fetches a tiny subset holding
only the letters of the name, registered under its own family name.
"""
import re
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "fonts"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
KEEP = {"latin", "latin-ext"}
DISPLAY = [("Fraunces:opsz,wght@144,700", "tuna", "Fraunces Display")]  # (family spec, text, css family)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        return r.read()


def css_for(query):
    return get("https://fonts.googleapis.com/css2?" + query + "&display=swap").decode()


def save(block, names, stem):
    src = re.search(r"url\((https://[^)]+)\) format\('woff2'\)", block).group(1)
    if src not in names:
        names[src] = f"{stem}-{len(names)}.woff2"
        (OUT / names[src]).write_bytes(get(src))
    return block.replace(src, names[src])


def main(families):
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    names, blocks = {}, []
    css = css_for("&".join(f"family={f}" for f in families))
    for subset, block in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face\s*\{[^}]*\})", css):
        if subset in KEEP:
            family = re.search(r"font-family: '([^']+)'", block).group(1)
            style = re.search(r"font-style: (\w+)", block).group(1)
            blocks.append(save(block, names, f"{family.replace(' ', '').lower()}-{style}-{subset}"))
    for spec, text, alias in DISPLAY:
        for block in re.findall(r"@font-face\s*\{[^}]*\}", css_for(f"family={spec}&text={text}")):
            block = re.sub(r"font-family: '[^']+'", f"font-family: '{alias}'", block)
            blocks.append(save(block, names, alias.replace(" ", "").lower()))
    (OUT / "fonts.css").write_text("\n".join(blocks) + "\n")
    for n in sorted(set(names.values())):
        print(f"{(OUT / n).stat().st_size:>8}  {n}")


if __name__ == "__main__":
    main(sys.argv[1:] or ["Fraunces:ital,wght@0,400;0,700;1,400", "JetBrains+Mono:wght@400", "Gloria+Hallelujah"])
