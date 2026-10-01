from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "bilder" / "icons"
BACKGROUND = "#291d11"


def place_logo(logo, size, logo_size, background):
    canvas = Image.new("RGBA", size, background)
    resized = logo.copy()
    resized.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
    position = ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2)
    canvas.alpha_composite(resized, position)
    return canvas


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with Image.open(ROOT / "bilder" / "kastanie-logo-pur.png") as source:
        leaf = source.convert("RGBA")
    with Image.open(ROOT / "bilder" / "kastanie-logo.png") as source:
        logo = source.convert("RGBA")

    for size in (16, 32, 48):
        place_logo(leaf, (size, size), size, (0, 0, 0, 0)).save(
            OUTPUT / f"favicon-{size}.png", optimize=True
        )
    place_logo(leaf, (48, 48), 48, (0, 0, 0, 0)).save(
        ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )

    for filename, size, scale in (
        ("apple-touch-icon.png", 180, 0.85),
        ("icon-192.png", 192, 0.85),
        ("icon-512.png", 512, 0.85),
        ("icon-maskable-512.png", 512, 0.54),
        ("instagram-profile.png", 600, 0.65),
    ):
        place_logo(logo, (size, size), int(size * scale), BACKGROUND).convert("RGB").save(
            OUTPUT / filename, optimize=True
        )

    place_logo(logo, (1200, 630), 520, BACKGROUND).convert("RGB").save(
        OUTPUT / "social-preview.png", optimize=True
    )
    print("Generated favicon.ico and 9 PNG assets.")


if __name__ == "__main__":
    main()