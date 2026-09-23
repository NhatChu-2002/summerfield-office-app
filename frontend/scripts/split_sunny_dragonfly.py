"""Split Sunny's front sprite so the dragonfly can move on its own.

Reads public/sunny-pet/front.webp and writes:
  front-nofly.webp  Sunny with the dragonfly removed and the fur under it filled in
  fly.webp          the dragonfly alone, on a transparent canvas of the same size

Run from frontend/ after the artwork changes:  python scripts/split_sunny_dragonfly.py
Requires Pillow and NumPy.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ART = Path(__file__).resolve().parent.parent / "public" / "sunny-pet"


def main() -> None:
    a = np.array(Image.open(ART / "front.webp").convert("RGBA")).astype(float)
    height, width = a.shape[:2]
    r, g, b, alpha = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    yy, xx = np.mgrid[0:height, 0:width]

    # The dragonfly is the only green in the top of the sprite.
    green = (g > b + 6) & (g > r + 12) & (alpha > 8) & (yy < 62)
    dilated = np.array(Image.fromarray((green * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0

    # Fit a circle to the visible top of the head, away from the dragonfly, to rebuild the hidden outline.
    points = []
    for x in range(30, 178):
        column = (alpha[:, x] > 128) & ~dilated[:, x]
        ys = np.nonzero(column[:120])[0]
        if not len(ys):
            continue
        top = ys[0]
        if dilated[max(0, top - 4):top + 1, max(0, x - 3):x + 4].any() or dilated[:top + 6, x].any():
            continue
        points.append((x, top))
    edge = np.array(points, float)
    edge = edge[(edge[:, 0] > 36) & (edge[:, 0] < 150)]
    system = np.c_[2 * edge[:, 0], 2 * edge[:, 1], np.ones(len(edge))]
    cx, cy, c = np.linalg.lstsq(system, (edge ** 2).sum(1), rcond=None)[0]
    radius = np.sqrt(c + cx * cx + cy * cy)
    distance = np.hypot(xx - cx, yy - cy) - radius
    inside = np.clip(0.5 - distance, 0, 1)

    # Fill with fur sampled just inside the head, with slight noise so it matches the texture.
    band = (distance < -4) & (distance > -14) & ~dilated & (alpha > 250) & (xx > 40) & (xx < 120) & (yy < 70)
    fur = a[band][:, :3].mean(0)
    noise = np.random.default_rng(3)
    body = a.copy()
    for y, x in np.argwhere(dilated):
        coverage = inside[y, x]
        if coverage <= 0:
            body[y, x] = 0
            continue
        body[y, x, :3] = np.clip(fur + noise.normal(0, 2.2), 0, 255)
        body[y, x, 3] = 255 * coverage

    # Keep the dragonfly and its greenish fringe, fading the fringe so no blue fur comes along.
    keep = green | (dilated & (g >= b - 4))
    fly = np.zeros_like(a)
    fly[keep] = a[keep]
    fly[keep & ~green, 3] *= 0.55

    Image.fromarray(body.astype(np.uint8)).save(ART / "front-nofly.webp", lossless=True)
    Image.fromarray(fly.astype(np.uint8)).save(ART / "fly.webp", lossless=True)


if __name__ == "__main__":
    main()
