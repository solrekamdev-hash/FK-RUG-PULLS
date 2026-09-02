"""Build experimental Entry 001 artwork layers for the isolated visual lab.

This script never edits the protected source WebPs. It removes the photographed
page boundary, estimates the paper field from probable-paper pixels, and emits
two RGBA treatments sized to the approved Claude page surface.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "assets" / "journal" / "001"
OUTPUT_DIR = Path(__file__).resolve().parent / "assets"
PAGES = ("page-02.webp", "page-03.webp")

# The source files include photographed page edges and a baked gutter. This is
# the shared content-surface crop used by A (in CSS), B, and C.
CROP = (36, 30, 960, 1564)
CLAUDE_PAPER_RGB = np.array([241.0, 233.0, 214.0], dtype=np.float32)
BACKGROUND_RADIUS = 78
LOCAL_RADIUS = 2.4


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def smoothstep(values: np.ndarray, edge0: float, edge1: float) -> np.ndarray:
    t = np.clip((values - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def blur(values: np.ndarray, radius: float) -> np.ndarray:
    """Blur a normalized float plane through Pillow's deterministic 8-bit path."""
    image = Image.fromarray(np.uint8(np.clip(values, 0.0, 1.0) * 255.0), "L")
    image = image.filter(ImageFilter.GaussianBlur(radius=radius))
    return np.asarray(image, dtype=np.float32) / 255.0


def max_filter(values: np.ndarray, size: int) -> np.ndarray:
    image = Image.fromarray(np.uint8(np.clip(values, 0.0, 1.0) * 255.0), "L")
    image = image.filter(ImageFilter.MaxFilter(size=size))
    return np.asarray(image, dtype=np.float32) / 255.0


def box_mean(values: np.ndarray, radius_x: int, radius_y: int) -> np.ndarray:
    """Fast rectangular mean used to reject isolated paper-grain dots."""
    padded = np.pad(values, ((radius_y, radius_y), (radius_x, radius_x)), mode="reflect")
    integral = np.pad(padded, ((1, 0), (1, 0)), mode="constant").cumsum(axis=0).cumsum(axis=1)
    height = 2 * radius_y + 1
    width = 2 * radius_x + 1
    total = integral[height:, width:] - integral[:-height, width:] - integral[height:, :-width] + integral[:-height, :-width]
    return total / float(height * width)


def srgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """Convert sRGB [0,255] to CIE L*a*b* using the D65 white point."""
    srgb = rgb / 255.0
    linear = np.where(
        srgb <= 0.04045,
        srgb / 12.92,
        ((srgb + 0.055) / 1.055) ** 2.4,
    )
    xyz = linear @ np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ],
        dtype=np.float32,
    ).T
    xyz /= np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    delta = 6.0 / 29.0
    f = np.where(
        xyz > delta**3,
        np.cbrt(xyz),
        xyz / (3.0 * delta**2) + 4.0 / 29.0,
    )
    return np.stack(
        [116.0 * f[..., 1] - 16.0, 500.0 * (f[..., 0] - f[..., 1]), 200.0 * (f[..., 1] - f[..., 2])],
        axis=-1,
    )


def estimate_background(lab: np.ndarray, rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Estimate low-frequency paper using normalized convolution over paper pixels."""
    lightness = lab[..., 0]
    red_excess = np.maximum(lab[..., 1] - 0.22 * lab[..., 2] - 2.0, 0.0)
    local_light = blur(lightness / 100.0, 3.0) * 100.0
    local_change = np.abs(lightness - local_light)

    # High-L, low-red, locally quiet pixels are probable paper. The weighting is
    # deliberately soft so broad stains still participate in the field estimate.
    paper_probability = (
        smoothstep(lightness, 42.0, 75.0)
        * (1.0 - 0.94 * smoothstep(red_excess, 4.0, 16.0))
        * (1.0 - 0.72 * smoothstep(local_change, 2.2, 13.0))
    )
    paper_probability = np.clip(paper_probability, 0.025, 1.0)

    denominator = blur(paper_probability, BACKGROUND_RADIUS)

    def normalized_field(channel: np.ndarray, low: float, high: float) -> np.ndarray:
        normalized = np.clip((channel - low) / (high - low), 0.0, 1.0)
        numerator = blur(normalized * paper_probability, BACKGROUND_RADIUS)
        field = numerator / np.maximum(denominator, 1.0 / 255.0)
        return field * (high - low) + low

    lab_field = np.stack(
        [
            normalized_field(lab[..., 0], 0.0, 100.0),
            normalized_field(lab[..., 1], -35.0, 55.0),
            normalized_field(lab[..., 2], -20.0, 70.0),
        ],
        axis=-1,
    )
    rgb_field = np.stack(
        [normalized_field(rgb[..., i], 0.0, 255.0) for i in range(3)],
        axis=-1,
    )
    return lab_field, rgb_field


def pigment_rgb(
    density: np.ndarray,
    red_strength: np.ndarray,
    treatment: str,
) -> np.ndarray:
    """Reconstruct neutral graphite/ink and source-red pigments without paper beige."""
    if treatment == "normalized":
        grey = 104.0 - 88.0 * smoothstep(density, 3.0, 38.0)
        red = np.stack(
            [154.0 - 30.0 * smoothstep(density, 4.0, 30.0), np.full_like(grey, 31.0), np.full_like(grey, 24.0)],
            axis=-1,
        )
    else:
        grey = 82.0 - 70.0 * smoothstep(density, 4.0, 35.0)
        red = np.stack(
            [144.0 - 25.0 * smoothstep(density, 5.0, 30.0), np.full_like(grey, 22.0), np.full_like(grey, 18.0)],
            axis=-1,
        )
    graphite = np.stack([grey, grey - 2.0, grey - 5.0], axis=-1)
    red_mix = smoothstep(red_strength, 8.0, 28.0)[..., None]
    return np.clip(graphite * (1.0 - red_mix) + red * red_mix, 0.0, 255.0)


def build_layers(source_path: Path) -> tuple[Image.Image, Image.Image, dict[str, float | list[int]]]:
    source = Image.open(source_path).convert("RGB")
    cropped = source.crop(CROP)
    rgb = np.asarray(cropped, dtype=np.float32)
    lab = srgb_to_lab(rgb)
    background_lab, _background_rgb = estimate_background(lab, rgb)

    lightness = lab[..., 0]
    background_lightness = background_lab[..., 0]
    dark_relative = np.maximum(background_lightness - lightness, 0.0)
    local_lightness = blur(lightness / 100.0, LOCAL_RADIUS) * 100.0
    fine_dark = np.maximum(local_lightness - lightness, 0.0)
    lab_red = np.maximum(lab[..., 1] - background_lab[..., 1] - 3.0, 0.0)
    source_red_dominance = np.maximum(rgb[..., 0] - np.maximum(rgb[..., 1], rgb[..., 2]) - 18.0, 0.0)
    red_strength = np.sqrt(lab_red * source_red_dominance)
    density = np.maximum(dark_relative, 1.55 * fine_dark)

    height, width = lightness.shape
    x_distance = np.minimum(np.arange(width), np.arange(width)[::-1]).astype(np.float32)
    y_distance = np.minimum(np.arange(height), np.arange(height)[::-1]).astype(np.float32)
    edge_distance = np.minimum(y_distance[:, None], x_distance[None, :])
    edge_suppression = smoothstep(edge_distance, 2.0, 34.0)

    # B: retain faint pencil, subtle grey ruling and local sketch detail while
    # removing the estimated paper field and all of its beige chroma.
    b_dark = smoothstep(dark_relative, 2.0, 28.0)
    b_fine = 0.62 * smoothstep(fine_dark, 1.0, 8.0)
    b_red = smoothstep(red_strength, 8.0, 32.0)
    alpha_b = np.maximum.reduce([b_dark, b_fine, b_red])
    b_binary = (alpha_b > 0.06).astype(np.float32)
    b_local_support = smoothstep(box_mean(b_binary, 4, 4), 0.025, 0.16)
    b_horizontal_support = smoothstep(box_mean(b_binary, 12, 1), 0.10, 0.33)
    b_support = np.maximum.reduce([b_local_support, 0.68 * b_horizontal_support, smoothstep(alpha_b, 0.58, 0.94)])
    alpha_b *= (0.12 + 0.88 * b_support) * edge_suppression
    alpha_b[alpha_b < 0.035] = 0.0

    # C: demand a stronger local/core signal, then retain only a narrow halo
    # around genuine ink/pencil/red seeds. This rejects most ruled lines, grain,
    # stains and perimeter ageing while keeping anti-aliased stroke edges.
    c_candidate = np.maximum.reduce(
        [
            smoothstep(dark_relative, 6.0, 31.0),
            0.84 * smoothstep(fine_dark, 2.8, 10.5),
            smoothstep(red_strength, 12.0, 35.0),
        ]
    )
    c_core = np.maximum.reduce(
        [
            smoothstep(dark_relative, 8.5, 33.0),
            smoothstep(fine_dark, 3.5, 11.0),
            smoothstep(red_strength, 15.0, 38.0),
        ]
    )
    near_core = max_filter(c_core, 5)
    c_density_support = smoothstep(box_mean((c_candidate > 0.075).astype(np.float32), 4, 4), 0.07, 0.25)
    alpha_c = c_candidate * (0.03 + 0.97 * near_core) * c_density_support
    alpha_c *= max_filter((c_core > 0.07).astype(np.float32), 3)
    alpha_c *= edge_suppression
    alpha_c[alpha_c < 0.055] = 0.0

    def rgba(alpha: np.ndarray, treatment: str) -> Image.Image:
        pigment = pigment_rgb(density, red_strength, treatment)
        pixels = np.dstack([pigment, np.clip(alpha * 255.0, 0.0, 255.0)])
        return Image.fromarray(np.uint8(np.rint(pixels)), "RGBA")

    normalized = rgba(alpha_b, "normalized")
    extracted = rgba(alpha_c, "extracted")
    stats = {
        "source_size": list(source.size),
        "surface_crop": list(CROP),
        "output_size": list(cropped.size),
        "normalized_nonzero_alpha_fraction": round(float(np.mean(alpha_b > 0.0)), 6),
        "extracted_nonzero_alpha_fraction": round(float(np.mean(alpha_c > 0.0)), 6),
        "normalized_mean_alpha": round(float(np.mean(alpha_b)), 6),
        "extracted_mean_alpha": round(float(np.mean(alpha_c)), 6),
    }
    return normalized, extracted, stats


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    report: dict[str, object] = {
        "purpose": "isolated visual proof of concept; not production journal output",
        "claude_paper_rgb": CLAUDE_PAPER_RGB.astype(int).tolist(),
        "parameters": {
            "background_colour_space": "CIE L*a*b* (D65)",
            "probable_paper_classifier": "soft L*, red-excess, and local-change weighting",
            "paper_field_estimator": "masked normalized Gaussian convolution",
            "background_radius_px": BACKGROUND_RADIUS,
            "local_detail_radius_px": LOCAL_RADIUS,
            "shared_surface_crop": list(CROP),
            "red_signal": "sqrt(max(a*-background_a*-3,0) * max(R-max(G,B)-18,0))",
            "edge_suppression": "smoothstep(distance_to_crop_edge, 2px, 34px)",
            "normalized_treatment": {
                "dark_alpha": "smoothstep(background_L*-L*, 2, 28)",
                "fine_alpha": "0.62 * smoothstep(local_blur_L*-L*, 1, 8)",
                "red_alpha": "smoothstep(red_signal, 8, 32)",
                "support": "maximum of 9x9 local density, 25x3 horizontal density at 0.68 weight, and strong-core alpha",
                "alpha_floor": 0.035,
            },
            "ink_treatment": {
                "candidate": "max(smoothstep(dark,6,31), 0.84*smoothstep(fine,2.8,10.5), smoothstep(red,12,35))",
                "core": "max(smoothstep(dark,8.5,33), smoothstep(fine,3.5,11), smoothstep(red,15,38))",
                "support": "5x5 core dilation * 9x9 candidate-density smoothstep(0.07,0.25) * 3x3 core support",
                "alpha_floor": 0.055,
            },
            "pigments": "neutral graphite/black plus reconstructed dark red; paper chroma is never emitted",
        },
        "pages": {},
    }

    for source_name in PAGES:
        source_path = SOURCE_DIR / source_name
        page_number = source_name.removeprefix("page-").removesuffix(".webp")
        normalized, extracted, stats = build_layers(source_path)
        normalized_path = OUTPUT_DIR / f"entry-001-page-{page_number}-normalized.png"
        extracted_path = OUTPUT_DIR / f"entry-001-page-{page_number}-ink.png"
        normalized.save(normalized_path, optimize=True)
        extracted.save(extracted_path, optimize=True)
        report["pages"][source_name] = {
            "source_sha256": sha256(source_path),
            "normalized_asset": normalized_path.name,
            "normalized_sha256": sha256(normalized_path),
            "ink_asset": extracted_path.name,
            "ink_sha256": sha256(extracted_path),
            **stats,
        }

    report_path = OUTPUT_DIR.parent / "processing-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(report_path)
    for source_name, page in report["pages"].items():
        print(source_name, page)


if __name__ == "__main__":
    main()
