#!/usr/bin/env python3
"""Fetch local Higher-Lower card images and enrich the source manifest.

Sources are deliberately limited to Wikipedia/Wikimedia, official YouTube
profile pages, and FlagCDN. Failed lookups get an explicit generated fallback
and remain marked as fallback in the manifest.
"""

from __future__ import annotations

import html
import io
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "asset-sources.json"
DEST = ROOT / "assets" / "higher"
UA = "PrivateGameshowAssetFetcher/1.0 (local private event)"
SSL_CONTEXT = ssl._create_unverified_context()

YOUTUBE_HANDLES = {
    "MrBeast": "mrbeast",
    "PewDiePie": "pewdiepie",
    "Dude Perfect": "dudeperfect",
    "IShowSpeed": "IShowSpeed",
    "Gronkh": "gronkh",
    "Rewinside": "rewinside",
    "MontanaBlack": "MontanaBlack",
    "HandOfBlood": "HandOfBlood",
    "Simplicissimus": "Simplicissimus",
    "Knossi": "Knossi",
    "Papaplatte": "Papaplatte",
    "ELoTRiX": "ELoTRiX",
    "Zarbex": "Zarbex",
    "Arda Saatçi": "Arda Saatçi",
    "Lord Lamy": "LordLamy",
}

FLAG_CODES = {
    "Deutschland": "de",
    "Italien": "it",
    "Spanien": "es",
    "Österreich": "at",
    "Frankreich": "fr",
    "Türkei": "tr",
    "Niederlande": "nl",
    "Griechenland": "gr",
    "Portugal": "pt",
    "Dänemark": "dk",
    "USA": "us",
    "Vereinigtes Königreich": "gb",
    "Polen": "pl",
    "Kroatien": "hr",
    "Schweiz": "ch",
}


def request_bytes(url: str, timeout: int = 30) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, context=SSL_CONTEXT, timeout=timeout) as response:
        return response.read(), response.geturl()


def request_json(url: str) -> dict:
    payload, _ = request_bytes(url)
    return json.loads(payload.decode("utf-8"))


def clean_html(value: str | None) -> str | None:
    if not value:
        return None
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip() or None


def wiki_page_image(title: str) -> dict | None:
    # Search rather than relying on one language/title combination. This also
    # handles redirects and slightly different localized article titles.
    for lang in ("en", "de"):
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": title,
            "gsrnamespace": "0",
            "gsrlimit": "5",
            "prop": "pageimages|info",
            "piprop": "thumbnail|original|name",
            "pithumbsize": "900",
            "inprop": "url",
            "format": "json",
            "formatversion": "2",
            "origin": "*",
        }
        url = f"https://{lang}.wikipedia.org/w/api.php?{urllib.parse.urlencode(params)}"
        try:
            data = request_json(url)
        except Exception:
            continue
        pages = data.get("query", {}).get("pages", [])
        pages.sort(key=lambda page: 0 if page.get("thumbnail") else 1)
        for page in pages:
            image_url = (page.get("thumbnail") or page.get("original") or {}).get("source")
            if image_url:
                return {
                    "imageUrl": image_url,
                    "sourceUrl": page.get("fullurl") or f"https://{lang}.wikipedia.org/wiki/{urllib.parse.quote(page.get('title', title))}",
                    "author": "Wikipedia/Wikimedia contributors",
                    "license": "See linked Wikimedia source page",
                    "resolvedTitle": page.get("title"),
                }
    return None


def youtube_profile(name: str) -> dict | None:
    handle = YOUTUBE_HANDLES.get(name)
    if not handle:
        return None
    source_url = f"https://www.youtube.com/@{urllib.parse.quote(handle)}"
    try:
        payload, resolved = request_bytes(source_url)
        text = payload.decode("utf-8", errors="ignore")
    except Exception:
        return None
    patterns = (
        r'<meta\s+property="og:image"\s+content="([^"]+)"',
        r'"avatar"\s*:\s*\{"thumbnails"\s*:\s*\[\{"url"\s*:\s*"([^"]+)"',
    )
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            image_url = html.unescape(match.group(1)).replace(r"\u0026", "&")
            return {
                "imageUrl": image_url,
                "sourceUrl": resolved,
                "author": f"Official YouTube channel: {name}",
                "license": "Channel profile image; rights belong to the channel owner",
            }
    return None


def flag_image(name: str) -> dict | None:
    code = FLAG_CODES.get(name)
    if not code:
        return None
    return {
        "imageUrl": f"https://flagcdn.com/w640/{code}.png",
        "sourceUrl": f"https://flagpedia.net/{code}",
        "author": "FlagCDN / Flagpedia",
        "license": "National flag; see linked source",
    }


def save_as_jpeg(payload: bytes, destination: Path) -> None:
    with Image.open(io.BytesIO(payload)) as image:
        image = image.convert("RGB")
        image.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        # Give very narrow/wide logos some breathing room without changing them.
        if image.width / max(image.height, 1) > 2.4 or image.height / max(image.width, 1) > 2.4:
            canvas = Image.new("RGB", (1000, 750), "white")
            image.thumbnail((900, 650), Image.Resampling.LANCZOS)
            canvas.paste(image, ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2))
            image = canvas
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "JPEG", quality=90, optimize=True)


def fallback_image(asset: dict, destination: Path, reason: str) -> None:
    colors = {
        "channels": (120, 168, 215),
        "companies": (235, 169, 125),
        "animals": (132, 191, 157),
        "travel": (221, 178, 201),
        "buildings": (171, 151, 205),
    }
    background = colors.get(asset.get("category"), (180, 180, 180))
    image = Image.new("RGB", (900, 900), background)
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default(size=44)
    small = ImageFont.load_default(size=22)
    words = asset["name"].split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) > 760 and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    y = 380 - 40 * max(0, len(lines) - 1)
    for line in lines:
        box = draw.textbbox((0, 0), line, font=font)
        draw.text(((900 - (box[2] - box[0])) / 2, y), line, fill="white", font=font)
        y += 70
    draw.text((40, 835), "Bildquelle konnte nicht geladen werden", fill="white", font=small)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "JPEG", quality=88)
    asset["failureReason"] = reason


def main() -> int:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assets = data["assets"]
    DEST.mkdir(parents=True, exist_ok=True)
    downloaded = 0
    fallback = 0

    for index, asset in enumerate(assets, start=1):
        destination = DEST / f"{asset['id']}.jpg"
        candidate = None
        if asset["category"] == "travel":
            candidate = flag_image(asset["name"])
        elif asset["category"] == "channels":
            candidate = youtube_profile(asset["name"])
        if candidate is None:
            candidate = wiki_page_image(asset.get("suggestedWikipediaTitle") or asset["name"])

        try:
            if candidate is None:
                raise RuntimeError("No image candidate found")
            payload, final_url = request_bytes(candidate["imageUrl"])
            save_as_jpeg(payload, destination)
            asset.update(
                {
                    "file": f"assets/higher/{asset['id']}.jpg",
                    "sourceUrl": candidate.get("sourceUrl") or final_url,
                    "imageUrl": final_url,
                    "author": candidate.get("author"),
                    "license": candidate.get("license"),
                    "status": "downloaded",
                }
            )
            asset.pop("failureReason", None)
            downloaded += 1
            print(f"[{index:02d}/75] OK       {asset['id']}: {asset['name']}")
        except Exception as exc:
            fallback_image(asset, destination, str(exc))
            asset.update(
                {
                    "file": f"assets/higher/{asset['id']}.jpg",
                    "sourceUrl": candidate.get("sourceUrl") if candidate else None,
                    "author": candidate.get("author") if candidate else None,
                    "license": candidate.get("license") if candidate else None,
                    "status": "fallback",
                }
            )
            fallback += 1
            print(f"[{index:02d}/75] FALLBACK {asset['id']}: {asset['name']} ({exc})")
        MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        time.sleep(0.08)

    print(f"Finished: {downloaded} downloaded, {fallback} fallback")
    return 0 if fallback == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
