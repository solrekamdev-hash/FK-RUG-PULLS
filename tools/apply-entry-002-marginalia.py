"""Apply the restrained Entry 002 marginalia pass from preserved RGBA bases.

The approved artwork is kept in assets/journal/002/approved-base. This script
builds separate transparent embellishment layers, then composites them over the
approved layers without moving or rescaling any existing pixels.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
ENTRY = ROOT / "assets" / "journal" / "002"
BASE = ENTRY / "approved-base"
DETAILS = ENTRY / "marginalia"
SPRITE_SHEET = DETAILS / "sprites.png"
CANVAS = (924, 1534)

COLS = (0, 418, 836, 1254)
ROWS = (0, 314, 627, 941, 1254)
SPRITE_NAMES = (
    "star",
    "clock",
    "up_arrow",
    "toilet_roll",
    "smug_face",
    "scratches",
    "receipt",
    "down_x",
    "regret_face",
    "fuel_drop",
    "spiral",
    "red_fragment",
)

# name, x, y, maximum width, maximum height, rotation, opacity
PLACEMENTS: dict[str, tuple[tuple[str, int, int, int, int, float, float], ...]] = {
    "inside-front": (
        ("star", 786, 78, 86, 74, -7, .92),
        ("scratches", 66, 624, 58, 34, 12, .78),
        ("up_arrow", 796, 688, 66, 53, 5, .82),
        ("smug_face", 792, 1002, 58, 59, -5, .86),
        ("spiral", 790, 1320, 70, 70, -9, .78),
        ("red_fragment", 72, 1410, 108, 34, 1, .78),
    ),
    "page-01": (
        ("star", 20, 1394, 50, 43, -8, .78),
        ("scratches", 807, 872, 54, 31, -12, .72),
        ("spiral", 19, 1084, 48, 48, 9, .68),
        ("red_fragment", 782, 986, 70, 22, -4, .72),
    ),
    "page-02": (
        ("clock", 508, 208, 62, 69, -5, .86),
        ("up_arrow", 226, 304, 49, 39, -8, .84),
        ("toilet_roll", 807, 532, 55, 53, 5, .88),
        ("smug_face", 449, 875, 50, 51, -6, .80),
        ("star", 58, 1400, 58, 50, -10, .82),
        ("scratches", 788, 1430, 62, 36, -6, .78),
    ),
    "page-03": (
        ("receipt", 498, 424, 56, 74, 5, .84),
        ("down_x", 520, 846, 34, 96, -4, .82),
        ("scratches", 802, 648, 58, 33, -10, .72),
        ("red_fragment", 118, 748, 94, 29, 2, .74),
        ("spiral", 94, 1332, 62, 62, 7, .76),
        ("star", 784, 1384, 60, 52, -7, .78),
    ),
    "page-04": (
        ("fuel_drop", 520, 168, 49, 51, 6, .88),
        ("scratches", 800, 510, 62, 36, -8, .74),
        ("receipt", 610, 900, 52, 69, 4, .80),
        ("down_x", 700, 1154, 31, 88, -6, .78),
        ("spiral", 518, 1270, 62, 62, 10, .76),
        ("regret_face", 770, 1245, 58, 47, -4, .78),
        ("star", 794, 1400, 58, 50, -7, .78),
        ("red_fragment", 650, 1430, 106, 33, 1, .76),
    ),
    "inside-back": (
        ("star", 766, 78, 82, 70, -7, .90),
        ("scratches", 66, 608, 58, 34, 11, .78),
        ("receipt", 792, 918, 56, 74, 4, .84),
        ("smug_face", 792, 1080, 58, 59, -5, .84),
        ("spiral", 70, 1360, 70, 70, 8, .78),
        ("red_fragment", 690, 1406, 116, 35, -2, .78),
    ),
}


def load_sprites() -> dict[str, Image.Image]:
    sheet = Image.open(SPRITE_SHEET).convert("RGBA")
    sprites: dict[str, Image.Image] = {}
    index = 0
    for row in range(4):
        for col in range(3):
            tile = sheet.crop((COLS[col], ROWS[row], COLS[col + 1], ROWS[row + 1]))
            bbox = tile.getchannel("A").getbbox()
            if bbox is None:
                raise RuntimeError(f"Empty sprite cell: {SPRITE_NAMES[index]}")
            sprites[SPRITE_NAMES[index]] = tile.crop(bbox)
            index += 1
    return sprites


def prepare(sprite: Image.Image, max_width: int, max_height: int, rotation: float, opacity: float) -> Image.Image:
    scale = min(max_width / sprite.width, max_height / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    result = sprite.resize(size, Image.Resampling.LANCZOS)
    if rotation:
        result = result.rotate(rotation, Image.Resampling.BICUBIC, expand=True)
    if opacity < 1:
        result.putalpha(ImageEnhance.Brightness(result.getchannel("A")).enhance(opacity))
    return result


def target_paths(name: str) -> tuple[Path, Path]:
    if name.startswith("page-"):
        relative = Path("artwork") / f"{name}.png"
    else:
        relative = Path(f"{name}.png")
    return BASE / relative, ENTRY / relative


def main() -> None:
    sprites = load_sprites()
    DETAILS.mkdir(parents=True, exist_ok=True)
    for page_name, placements in PLACEMENTS.items():
        base_path, target_path = target_paths(page_name)
        base = Image.open(base_path).convert("RGBA")
        if base.size != CANVAS:
            raise RuntimeError(f"Unexpected approved canvas for {page_name}: {base.size}")
        overlay = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        for sprite_name, x, y, max_width, max_height, rotation, opacity in placements:
            mark = prepare(sprites[sprite_name], max_width, max_height, rotation, opacity)
            if x + mark.width > CANVAS[0] or y + mark.height > CANVAS[1]:
                raise RuntimeError(f"{page_name}/{sprite_name} exceeds the approved canvas")
            overlay.alpha_composite(mark, (x, y))
        overlay_path = DETAILS / f"{page_name}-overlay.png"
        overlay.save(overlay_path, optimize=True)
        composed = Image.alpha_composite(base, overlay)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        composed.save(target_path, optimize=True)
        print(page_name, "overlay_bbox", overlay.getchannel("A").getbbox(), "final_bbox", composed.getchannel("A").getbbox())


if __name__ == "__main__":
    main()
