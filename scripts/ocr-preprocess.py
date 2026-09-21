#!/usr/bin/env python3
"""Upscale + contrast public/evidence JPGs for tesseract. Crops sign bands when useful."""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageEnhance

root = Path(__file__).resolve().parents[1]
src = root / "public" / "evidence"
dst = Path("/tmp/xenia-ocr/prep")
dst.mkdir(parents=True, exist_ok=True)

CROPS = {
    "ig-DVyBqtNCrwp-1.jpg": (0.0, 0.0, 1.0, 0.42),
    "xhs-6a7f037e.jpg": (0.12, 0.18, 0.88, 0.78),
}


def prep(im: Image.Image, scale: float = 2.4) -> Image.Image:
    gray = ImageOps.grayscale(im)
    w, h = gray.size
    gray = gray.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    gray = ImageOps.autocontrast(gray, cutoff=2)
    gray = ImageEnhance.Contrast(gray).enhance(1.6)
    gray = gray.filter(ImageFilter.SHARPEN)
    return gray.convert("L")


for path in sorted(src.glob("*.jpg")):
    im = Image.open(path).convert("RGB")
    prep(im).save(dst / f"{path.stem}.png")
    crop = CROPS.get(path.name)
    if crop:
        w, h = im.size
        box = (int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h))
        prep(im.crop(box), scale=3.0).save(dst / f"{path.stem}-crop.png")
    print(path.name, im.size)
