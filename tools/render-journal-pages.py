#!/usr/bin/env python3
"""Build neutralised journal-page textures without modifying approved sources.

The renderer estimates the slowly varying paper field with a large morphological
closing followed by a Gaussian blur.  It converts the source to optical density
relative to that field, continuously suppresses only low-density paper noise,
then prints the surviving neutral and chromatic marks onto a deterministic warm
ivory substrate.  No hard colour key or binary transparency mask is used.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


PROTECTED_SOURCE_HASHES = {
    "page-01.webp": "1e797d1e94dae072987ae07681b8838942e6570ffce22f9bf09fdad97023b8ff",
    "page-02.webp": "71f9484cad8dcb1c0abd8b658673c3f81b2dd6308182385f486b83cd25e78ffc",
    "page-03.webp": "2d5a6774c8aa99658d3f6807f6b8a273af3cb92d30b1b3af4ecff051a8dfa19c",
    "page-04.webp": "cc3f54cdbb2ca9424b640bc5e05cb7a00e7c6fe0f1f790977cb30ec9fe6f4560",
}

PAPER_RGB = np.array([240.0, 236.0, 225.0], dtype=np.float32)
MORPHOLOGY_RADIUS = 40
BACKGROUND_SIGMA = 30.0
BACKGROUND_DOWNSAMPLE = 8
PAGE_SEED = 4100


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def smoothstep(low: float, high: float, values: np.ndarray) -> np.ndarray:
    scaled = np.clip((values - low) / (high - low), 0.0, 1.0)
    return scaled * scaled * (3.0 - (2.0 * scaled))


def estimate_paper_field(source_u8: np.ndarray) -> np.ndarray:
    height, width = source_u8.shape[:2]
    small_size = (
        max(8, int(round(width / BACKGROUND_DOWNSAMPLE))),
        max(8, int(round(height / BACKGROUND_DOWNSAMPLE))),
    )
    reduced = Image.fromarray(source_u8, mode="RGB").resize(small_size, Image.Resampling.LANCZOS)
    morphology_size = ((MORPHOLOGY_RADIUS * 2) // BACKGROUND_DOWNSAMPLE) | 1
    closed = reduced.filter(ImageFilter.MaxFilter(morphology_size)).filter(ImageFilter.MinFilter(morphology_size))
    blurred = closed.filter(ImageFilter.GaussianBlur(BACKGROUND_SIGMA / BACKGROUND_DOWNSAMPLE))
    return np.asarray(blurred.resize((width, height), Image.Resampling.BICUBIC), dtype=np.float32)


def paper_substrate(height: int, width: int, page_number: int) -> np.ndarray:
    """Make a quiet, deterministic matte stock adapted from material-paper.svg."""
    rng = np.random.default_rng(PAGE_SEED + page_number)

    coarse_small = np.clip(
        128.0 + (rng.normal(0.0, 1.0, (max(8, height // 42), max(8, width // 42))) * 28.0),
        0,
        255,
    ).astype(np.uint8)
    coarse_image = Image.fromarray(coarse_small, mode="L").resize((width, height), Image.Resampling.BICUBIC)
    coarse = np.asarray(coarse_image.filter(ImageFilter.GaussianBlur(5.5)), dtype=np.float32) - 128.0
    coarse /= max(float(coarse.std()), 1e-6)

    tooth_u8 = np.clip(128.0 + (rng.normal(0.0, 1.0, (height, width)) * 24.0), 0, 255).astype(np.uint8)
    tooth = np.asarray(
        Image.fromarray(tooth_u8, mode="L").filter(ImageFilter.GaussianBlur(0.55)),
        dtype=np.float32,
    ) - 128.0
    tooth /= max(float(tooth.std()), 1e-6)

    tone = (coarse * 0.72) + (tooth * 0.34)
    substrate = PAPER_RGB[None, None, :] + tone[:, :, None]

    # Sparse, sub-pixel-strength fibres: visible only on close inspection.
    fibre_image = Image.new("L", (width, height), 128)
    fibre_draw = ImageDraw.Draw(fibre_image)
    for _ in range(74):
        x = int(rng.integers(0, width))
        y = int(rng.integers(0, height))
        length = int(rng.integers(max(5, width // 90), max(9, width // 34)))
        rise = int(rng.integers(-2, 3))
        value = int(rng.choice((126, 130)))
        fibre_draw.line(
            (x, y, min(width - 1, x + length), max(0, min(height - 1, y + rise))),
            fill=value,
            width=1,
        )
    fibres = (np.asarray(fibre_image, dtype=np.float32) - 128.0) * 0.24
    substrate += fibres[:, :, None]

    return np.clip(substrate, 0.0, 255.0)


def normalise_page(source_u8: np.ndarray, page_number: int) -> tuple[np.ndarray, dict[str, float | int]]:
    source = source_u8.astype(np.float32)
    paper_field = estimate_paper_field(source_u8)

    # Division in transmission space, expressed as optical density.  The large
    # background field removes beige cast, broad staining, and photographed edge
    # shading while leaving narrow handwriting and drawing strokes as density.
    transmission = np.clip((source + 3.0) / (paper_field + 3.0), 0.018, 1.08)
    density = np.maximum(-np.log(transmission), 0.0)
    density_magnitude = density.max(axis=2)
    density_chroma = density.max(axis=2) - density.min(axis=2)

    # Continuous attenuation replaces a hard threshold.  Faint neutral marks
    # retain at least 20% of their density; strong pencil/ink smoothly reaches
    # full strength.  Chromatic marks, especially red, bypass attenuation.
    neutral_weight = 0.20 + (0.80 * smoothstep(0.014, 0.090, density_magnitude))
    chroma_weight = smoothstep(0.012, 0.055, density_chroma)
    red_signal = (source[:, :, 0] - np.maximum(source[:, :, 1], source[:, :, 2])) / 255.0
    red_weight = smoothstep(0.035, 0.16, red_signal)
    retention = np.maximum(neutral_weight, np.maximum(chroma_weight, red_weight))

    clean_density = density * retention[:, :, None]
    substrate = paper_substrate(source_u8.shape[0], source_u8.shape[1], page_number)
    rendered = substrate * np.exp(-clean_density * 1.035)
    rendered_u8 = np.clip(np.rint(rendered), 0, 255).astype(np.uint8)

    red_mask = (red_signal > 0.10) & (density_magnitude > 0.08)
    pencil_mask = (density_chroma < 0.035) & (density_magnitude > 0.055) & (density_magnitude < 0.55)
    metrics: dict[str, float | int] = {
        "red_mark_pixels": int(red_mask.sum()),
        "red_mark_median_retention": round(float(np.median(retention[red_mask])) if red_mask.any() else 1.0, 4),
        "pencil_detail_pixels": int(pencil_mask.sum()),
        "pencil_detail_median_retention": round(float(np.median(retention[pencil_mask])) if pencil_mask.any() else 1.0, 4),
        "background_field_sigma": BACKGROUND_SIGMA,
        "morphology_radius": MORPHOLOGY_RADIUS,
    }
    return rendered_u8, metrics


def render(source_dir: Path, output_dir: Path) -> None:
    source_dir = source_dir.resolve()
    output_dir = output_dir.resolve()
    if output_dir == source_dir or source_dir in output_dir.parents and output_dir.name == source_dir.name:
        raise ValueError("Output directory must be separate from the protected source directory")

    sources = [source_dir / name for name in PROTECTED_SOURCE_HASHES]
    before_hashes: dict[str, str] = {}
    for source_path in sources:
        if not source_path.is_file():
            raise FileNotFoundError(source_path)
        actual_hash = sha256(source_path)
        expected_hash = PROTECTED_SOURCE_HASHES[source_path.name]
        if actual_hash != expected_hash:
            raise RuntimeError(f"Protected source hash mismatch for {source_path.name}: {actual_hash}")
        before_hashes[source_path.name] = actual_hash

    output_dir.mkdir(parents=True, exist_ok=True)
    report: dict[str, object] = {
        "method": "large-radius morphological closing + Gaussian paper-field estimate; optical-density division; continuous neutral/chromatic retention; deterministic warm-ivory composite",
        "paper_rgb": [int(value) for value in PAPER_RGB],
        "pages": [],
    }

    for page_number, source_path in enumerate(sources, start=1):
        with Image.open(source_path) as image:
            source_u8 = np.asarray(image.convert("RGB"))
        rendered_u8, metrics = normalise_page(source_u8, page_number)
        output_path = output_dir / source_path.name
        temporary_path = output_dir / f".{source_path.stem}.tmp.webp"
        Image.fromarray(rendered_u8, mode="RGB").save(
            temporary_path,
            format="WEBP",
            lossless=True,
            quality=100,
            method=6,
        )
        temporary_path.replace(output_path)
        report["pages"].append(
            {
                "source": f"../{source_path.name}",
                "source_sha256": before_hashes[source_path.name],
                "rendered": output_path.name,
                "rendered_sha256": sha256(output_path),
                "width": int(source_u8.shape[1]),
                "height": int(source_u8.shape[0]),
                **metrics,
            }
        )

    after_hashes = {source_path.name: sha256(source_path) for source_path in sources}
    if after_hashes != before_hashes:
        raise RuntimeError("A protected source changed during rendering")

    report_path = output_dir / "render-report.json"
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Rendered {len(sources)} protected pages to {output_dir}")
    for page in report["pages"]:
        assert isinstance(page, dict)
        print(f"{page['rendered']}: {page['rendered_sha256']}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("assets/journal/001"),
        help="Directory containing the four protected Entry 001 WebPs",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("assets/journal/001/rendered"),
        help="Separate directory for deterministic derived textures",
    )
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    render(arguments.source_dir, arguments.output_dir)
