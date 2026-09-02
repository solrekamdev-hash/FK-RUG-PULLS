"""Build Entry 004's inside-back companion as transparent artwork."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ENTRY = ROOT / "assets" / "journal" / "004"
SOURCE = ENTRY / "source" / "inside-back-imagegen-rgb.png"
OUTPUT = ENTRY / "inside-back.png"
REPORT = ENTRY / "source" / "inside-back-processing.json"

CANVAS = (924, 1534)
CONTENT = (850, 1412)
OFFSET = ((CANVAS[0] - CONTENT[0]) // 2, (CANVAS[1] - CONTENT[1]) // 2)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def smoothstep(values: np.ndarray, edge0: float, edge1: float) -> np.ndarray:
    t = np.clip((values - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def extract_ink(source: Image.Image) -> Image.Image:
    resized = source.convert("RGB").resize(CONTENT, Image.Resampling.LANCZOS)
    rgb = np.asarray(resized, dtype=np.float32)
    minimum = np.min(rgb, axis=-1)
    ink_signal = 255.0 - minimum
    red_signal = np.maximum(rgb[..., 0] - 0.5 * (rgb[..., 1] + rgb[..., 2]), 0.0)
    alpha = np.maximum(
        smoothstep(ink_signal, 18.0, 110.0),
        smoothstep(red_signal, 15.0, 115.0),
    )
    alpha[alpha < 0.025] = 0.0

    density = smoothstep(ink_signal, 45.0, 210.0)
    neutral = 38.0 - 27.0 * density
    black = np.stack([neutral, neutral, neutral - 1.0], axis=-1)
    red_density = smoothstep(ink_signal, 55.0, 220.0)
    red = np.stack(
        [208.0 - 25.0 * red_density, 19.0 - 6.0 * red_density, 15.0 - 5.0 * red_density],
        axis=-1,
    )
    red_mix = smoothstep(red_signal, 18.0, 105.0)[..., None]
    pigment = black * (1.0 - red_mix) + red * red_mix

    pixels = np.dstack([pigment, alpha[..., None] * 255.0])
    layer = Image.fromarray(np.uint8(np.rint(np.clip(pixels, 0.0, 255.0))), "RGBA")
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(layer, OFFSET)
    return canvas


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(SOURCE)
    source = Image.open(SOURCE)
    artwork = extract_ink(source)
    artwork.save(OUTPUT, optimize=True)
    alpha = artwork.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("Entry 004 inside-back extraction produced no artwork")
    left, top, right, bottom = bbox
    report = {
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "source_sha256": sha256(SOURCE),
        "source_size": list(source.size),
        "source_mode": source.mode,
        "output": str(OUTPUT.relative_to(ROOT)).replace("\\", "/"),
        "output_sha256": sha256(OUTPUT),
        "output_size": list(artwork.size),
        "output_mode": artwork.mode,
        "content_size": list(CONTENT),
        "content_offset": list(OFFSET),
        "alpha_bbox": list(bbox),
        "edge_clearance_px": {
            "left": left,
            "top": top,
            "right": CANVAS[0] - right,
            "bottom": CANVAS[1] - bottom,
        },
        "nonzero_alpha_fraction": round(float(np.mean(np.asarray(alpha) > 0)), 6),
        "paper_background_baked": False,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
