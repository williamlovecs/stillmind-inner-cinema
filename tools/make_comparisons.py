from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).parent / "stillmind-inner-cinema-2"
out = root / "artifacts" / "inner-cinema-2"
font_path = Path("C:/Windows/Fonts/arial.ttf")
bold_path = Path("C:/Windows/Fonts/arialbd.ttf")
font = ImageFont.truetype(str(font_path), 21)
bold = ImageFont.truetype(str(bold_path), 25)
small = ImageFont.truetype(str(font_path), 15)

pairs = [
    (
        "web-before-after.png",
        "WEB / INNER CINEMA 2.0 / ACTUAL CHROMIUM CAPTURES",
        [
            ("Character / same sentence", root / "artifacts/inner-cinema-2/baseline-web/observer-near-390.png", root / "artifacts/web-smoke/observer-near-390.png"),
            ("Audience / same sentence", root / "artifacts/inner-cinema-2/baseline-web/observer-audience-390.png", root / "artifacts/web-smoke/observer-audience-390.png"),
        ],
    ),
    (
        "native-before-after.png",
        "EXPO WEB / INNER CINEMA 2.0 / NOT A PHYSICAL DEVICE TEST",
        [
            ("Character / same sentence", root / "artifacts/inner-cinema-2/baseline-native/native-observer-near.png", root / "artifacts/native-web-smoke/native-observer-near.png"),
            ("Audience / same sentence", root / "artifacts/inner-cinema-2/baseline-native/native-observer-audience.png", root / "artifacts/native-web-smoke/native-observer-audience.png"),
        ],
    ),
]

for name, title, rows in pairs:
    canvas = Image.new("RGB", (880, 1930), "#080d1b")
    draw = ImageDraw.Draw(canvas)
    draw.text((34, 24), title, fill="#f3efff", font=bold)
    draw.text((240, 74), "BASELINE 28b0004", fill="#9da8bf", font=font)
    draw.text((580, 74), "INNER CINEMA 2.0", fill="#d7b8ff", font=font)
    for row, (label, before, after) in enumerate(rows):
        y = 116 + row * 885
        draw.text((34, y), label, fill="#c9d1e4", font=font)
        for col, source in enumerate((before, after)):
            image = Image.open(source).convert("RGB")
            image.thumbnail((390, 844), Image.Resampling.LANCZOS)
            x = 34 + col * 420
            canvas.paste(image, (x, y + 38))
    draw.text((34, 1896), "Local synthetic input only. Visual comparison is not evidence of psychological benefit.", fill="#929cb4", font=small)
    canvas.save(out / name, optimize=True)
    print(out / name)
