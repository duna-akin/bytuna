"""Download Google Fonts as self-hosted WOFF2 (latin + latin-ext) and write fonts/fonts.css.

Usage: python3 tools/fetch_fonts.py "Fraunces:ital,wght@0,400;0,700;1,400;1,600" "JetBrains+Mono:wght@400"
"""
import re
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "fonts"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
KEEP = {"latin", "latin-ext"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        return r.read()


def main(families):
    url = "https://fonts.googleapis.com/css2?" + "&".join(f"family={f}" for f in families) + "&display=swap"
    css = get(url).decode()
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    names, blocks = {}, []
    for subset, block in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face\s*\{[^}]*\})", css):
        if subset not in KEEP:
            continue
        src = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        if src not in names:
            family = re.search(r"font-family: '([^']+)'", block).group(1)
            style = re.search(r"font-style: (\w+)", block).group(1)
            names[src] = f"{family.replace(' ', '').lower()}-{style}-{subset}-{len(names)}.woff2"
            (OUT / names[src]).write_bytes(get(src))
        blocks.append(block.replace(src, names[src]))
    (OUT / "fonts.css").write_text("\n".join(blocks) + "\n")
    for n in sorted(set(names.values())):
        print(f"{(OUT / n).stat().st_size:>8}  {n}")


if __name__ == "__main__":
    main(sys.argv[1:] or ["Fraunces:ital,wght@0,400;0,700;1,400;1,600", "JetBrains+Mono:wght@400"])
