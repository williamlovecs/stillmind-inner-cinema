from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import json

ROOT = Path(r"C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\02-42-11-0872a2fc\stillmind-inner-cinema-2")
BASE = ROOT / "artifacts" / "experience-v2"
OUT = BASE / "contact-sheets"
OUT.mkdir(parents=True, exist_ok=True)
SHA = "c32d423c4eaa5e3f263d1679bb78eee0fd181fbd"
FONT_DIR = Path(__import__("matplotlib").get_data_path()) / "fonts" / "ttf"
FONT = str(FONT_DIR / "DejaVuSans.ttf")
BOLD = str(FONT_DIR / "DejaVuSans-Bold.ttf")
COLORS = {"bg": "#0c111b", "panel": "#131c29", "text": "#edf0f6", "muted": "#9ba8ba", "line": "#344256", "after": "#c5b6fa"}
BATCHES = {
    "A": [("paced-breath", "Paced breath"), ("thought-watching", "Thought watching"), ("wide-gaze", "Wide gaze")],
    "B": [("body-scan", "Body scan"), ("person-shift", "Person shift"), ("logout-pause", "Logout pause")],
    "C": [("release", "Release"), ("open-awareness", "Open awareness"), ("grounded-action", "Grounded action")],
    "D": [("trigger-journal", "Trigger journal"), ("anchors", "Anchors")],
}


def text(draw, xy, value, size=20, color="text", bold=False):
    draw.text(xy, value, font=ImageFont.truetype(BOLD if bold else FONT, size), fill=COLORS[color])


def fit(path, width, height):
    with Image.open(path) as source:
        image = ImageOps.contain(source.convert("RGB"), (width, height), Image.Resampling.LANCZOS)
    panel = Image.new("RGB", (width, height), COLORS["panel"])
    panel.paste(image, ((width - image.width) // 2, 0))
    return panel


def sheet(title, rows, output, thumb_height=560):
    margin, gap, width, label_height = 28, 16, 290, 40
    headers = ["Web / Before", "Web / After", "Expo Web / Before", "Expo Web / After"]
    canvas_width = margin * 2 + width * 4 + gap * 3
    canvas_height = 128 + len(rows) * (label_height + thumb_height + gap) + 50
    canvas = Image.new("RGB", (canvas_width, canvas_height), COLORS["bg"])
    draw = ImageDraw.Draw(canvas)
    text(draw, (margin, 22), title, 30, bold=True)
    text(draw, (margin, 67), f"After: {SHA[:12]} | Synthetic local browser QA; Expo Web is not a physical device.", 16, "muted")
    for col, header in enumerate(headers):
        x = margin + col * (width + gap)
        text(draw, (x, 100), header, 17, "after" if col % 2 else "muted", bold=True)
    for row, (label, paths) in enumerate(rows):
        y = 128 + row * (label_height + thumb_height + gap)
        text(draw, (margin, y), label, 19, bold=True)
        for col, path in enumerate(paths):
            x = margin + col * (width + gap)
            top = y + label_height
            if path is None:
                tile = Image.new("RGB", (width, thumb_height), COLORS["panel"])
                tile_draw = ImageDraw.Draw(tile)
                text(tile_draw, (28, thumb_height // 2 - 12), "No matching baseline", 17, "muted")
                text(tile_draw, (28, thumb_height // 2 + 20), "New product surface", 17, "muted")
            else:
                if not path.is_file():
                    raise FileNotFoundError(path)
                tile = fit(path, width, thumb_height)
            canvas.paste(tile, (x, top))
            draw.rectangle((x, top, x + width - 1, top + thumb_height - 1), outline=COLORS["after"] if col % 2 else COLORS["line"], width=2 if col % 2 else 1)
    canvas.save(output, optimize=True)
    if output.stat().st_size >= 3_000_000:
        raise RuntimeError(f"Contact sheet exceeds 3 MB: {output}")
    return output


manifest = {"testedGitSha": SHA, "scope": "Synthetic local browser QA; baseline and after are separate runs; Expo Web is not physical-device evidence", "files": []}
for batch, methods in BATCHES.items():
    rows = []
    for slug, label in methods:
        rows.append((label, [
            BASE / "baseline-web" / f"method-{slug}-320.png",
            BASE / "web" / f"batch-{batch}" / f"{slug}-320.png",
            BASE / "baseline-native" / f"native-method-{slug}.png",
            BASE / "native" / f"batch-{batch}" / f"{slug}-390.png",
        ]))
    path = sheet(f"Experience V2 / Batch {batch} / Before and After", rows, OUT / f"batch-{batch}-before-after.png")
    manifest["files"].append({"file": path.name, "rows": [row[0] for row in rows]})

web = BASE / "web" / "product-paths"
native = BASE / "native" / "product-paths"
product_rows = [
    ("Home / real recent practice", [BASE / "baseline-web" / "home-390.png", web / "recent-home-390.png", BASE / "baseline-native" / "native-home.png", native / "recent-home-390.png"]),
    ("Library / saved favorite and filters", [None, web / "favorite-library-390.png", None, native / "favorite-library-390.png"]),
    ("Reflection / real local sessions", [None, web / "reflection-390.png", None, native / "reflection-390.png"]),
    ("Settings / real local data controls", [None, web / "data-settings-390.png", None, native / "data-settings-390.png"]),
]
path = sheet("Experience V2 / Product Paths / Baseline and New Surfaces", product_rows, OUT / "product-paths-before-after.png", thumb_height=600)
manifest["files"].append({"file": path.name, "rows": [row[0] for row in product_rows]})
(OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
for item in manifest["files"]:
    path = OUT / item["file"]
    with Image.open(path) as image:
        print(path.name, image.size, path.stat().st_size)
