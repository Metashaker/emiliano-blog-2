#!/usr/bin/env python3
"""Fetch Google Fonts, inline as base64 @font-face data URIs, inject into template."""
import base64, re, urllib.request, sys, os

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

# CSS2 `family=` query fragments (spaces -> +)
FAMILIES = [
    "Cinzel:wght@400;600",
    "Cormorant+Garamond:wght@400;600",
    "Fraunces:wght@400;600",
    "Newsreader:ital,wght@0,400;0,600;1,400",
    "Marcellus",
    "Orbitron:wght@500;700",
    "Chakra+Petch:wght@400;600",
    "Sora:wght@400;600",
    "IBM+Plex+Mono:wght@400;500",
    "Audiowide",
]

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "design-directions.template.html")
OUT = os.path.join(HERE, "design-directions.html")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


FACE_RE = re.compile(r"@font-face\s*{([^}]+)}", re.S)


def prop(block, name):
    m = re.search(name + r"\s*:\s*([^;]+);", block)
    return m.group(1).strip() if m else None


faces = []
seen = set()
for fam in FAMILIES:
    css = fetch(f"https://fonts.googleapis.com/css2?family={fam}&display=swap").decode("utf-8")
    for block in FACE_RE.findall(css):
        urange = prop(block, "unicode-range") or ""
        # keep only the Latin subset to minimise size
        if "U+0000-00FF" not in urange:
            continue
        family = prop(block, "font-family")
        style = prop(block, "font-style") or "normal"
        weight = prop(block, "font-weight") or "400"
        src = prop(block, "src") or ""
        m = re.search(r"url\((https://[^)]+\.woff2)\)", src)
        if not m:
            continue
        url = m.group(1)
        key = (family, style, weight)
        if key in seen:
            continue
        seen.add(key)
        data = fetch(url)
        b64 = base64.b64encode(data).decode("ascii")
        faces.append(
            f"@font-face{{font-family:{family};font-style:{style};"
            f"font-weight:{weight};font-display:swap;"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2');}}"
        )
        print(f"  embedded {family} {style} {weight}  ({len(data)//1024} KB)", file=sys.stderr)

css_out = "\n".join(faces)
with open(TEMPLATE, encoding="utf-8") as f:
    html = f.read()
html = html.replace("/* __FONT_FACES__ */", css_out)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

kb = os.path.getsize(OUT) // 1024
print(f"\nWrote {OUT}  ({len(faces)} faces, {kb} KB total)", file=sys.stderr)
