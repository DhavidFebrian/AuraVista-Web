import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "assets" / "portfolio_data.json"
LOGO_PATH = ROOT / "assets" / "aura_vista_logo_cropped.png"
MAX_SIDE = 2400
WATERMARK_RATIO = 0.17
WATERMARK_OPACITY = 0.82


with DATA_PATH.open(encoding="utf-8") as handle:
    items = json.load(handle)

logo = Image.open(LOGO_PATH).convert("RGBA")

for index, item in enumerate(items, start=1):
    source_path = ROOT / item["original"]
    output_path = ROOT / item["img"]

    with Image.open(source_path) as source:
        image = ImageOps.exif_transpose(source).convert("RGBA")
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)

    width, height = image.size
    logo_width = max(1, round(width * WATERMARK_RATIO))
    logo_height = max(1, round(logo_width * logo.height / logo.width))
    resized_logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
    alpha = ImageEnhance.Brightness(resized_logo.getchannel("A")).enhance(WATERMARK_OPACITY)
    resized_logo.putalpha(alpha)

    image.alpha_composite(resized_logo, ((width - logo_width) // 2, round(height * 0.035)))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(output_path, "WEBP", quality=84, method=6)
    print(f"[{index:03d}/{len(items):03d}] {output_path.name}")

print(f"Rebuilt {len(items)} portfolio previews with a {WATERMARK_RATIO:.0%} watermark.")
