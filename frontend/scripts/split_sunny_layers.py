"""Split Sunny's front sprite into layers that can move on their own.

Reads public/sunny-pet/front.webp and writes, all on transparent 208x260 canvases:
  body.webp   Sunny without the dragonfly or wings; the fur and shirt they covered are filled in
  fly.webp    the dragonfly alone
  wing.webp   the left wing alone (the rig mirrors it for the right wing)

Run from frontend/ after the artwork changes:  python scripts/split_sunny_layers.py
Requires Pillow and NumPy.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ART = Path(__file__).resolve().parent.parent / "public" / "sunny-pet"
WIDTH, HEIGHT = 208, 260

# The same outlines SunnyCharacter.tsx clips with: the torso, and the left wing where it overlaps the torso.
BODY_OUTLINE = [(0, 0), (208, 0), (208, 140), (180, 140), ("Q", 173, 155, 157, 166), ("Q", 164, 175, 167, 190),
                (171, 214), ("Q", 166, 238, 146, 248), (62, 248), ("Q", 42, 238, 37, 216), (40, 195),
                ("Q", 42, 177, 52, 166), ("Q", 37, 155, 28, 140), (0, 140)]
WING_OUTLINE = [(3, 158), ("Q", 17, 144, 34, 145), (55, 153), ("Q", 62, 165, 51, 175), (47, 178),
                ("Q", 20, 191, 3, 177), ("Q", -3, 167, 3, 158)]


def polygon_mask(outline: list) -> np.ndarray:
    """Rasterise an outline of points and quadratic curves ("Q", cx, cy, x, y) into a boolean mask."""
    points: list[tuple[float, float]] = []
    for step in outline:
        if step[0] == "Q":
            _, cx, cy, x, y = step
            x0, y0 = points[-1]
            for t in np.linspace(0, 1, 16)[1:]:
                points.append(((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x,
                               (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y))
        else:
            points.append(step)
    image = Image.new("L", (WIDTH, HEIGHT), 0)
    ImageDraw.Draw(image).polygon(points, fill=255)
    return np.array(image) > 0


def split_dragonfly(a: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Returns (sprite without the dragonfly, dragonfly layer)."""
    r, g, b, alpha = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    yy, xx = np.mgrid[0:HEIGHT, 0:WIDTH]

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
    return body, fly


def split_wings(a: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Returns (sprite without either wing, left wing layer)."""
    yy, xx = np.mgrid[0:HEIGHT, 0:WIDTH]
    torso = polygon_mask(BODY_OUTLINE)
    # Where the wing sits over the torso: inside its outline, plus the blue wing tip that hangs over
    # the shirt's corner below it (the shirt there is tan, so anything that isn't clearly tan is wing).
    not_shirt = a[..., 0] <= a[..., 2] + 25
    overlap = torso & (polygon_mask(WING_OUTLINE) | (not_shirt & (yy >= 158) & (yy <= 194) & (xx < 56)))
    outside = ~torso & (yy >= 138) & (yy <= 194) & (xx < 70) & (a[..., 3] > 0)
    # The art leaves a small gap between the head and the top of the wing. Once the wing moves it would
    # show as a notch, so the neck is filled out to the torso outline there.
    gap = torso & (a[..., 3] < 200) & (yy >= 141) & (yy <= 160) & (xx < 56)
    wing_mask = overlap | outside

    wing = np.zeros_like(a)
    wing[wing_mask] = a[wing_mask]
    # Over the torso, fade out shirt-coloured pixels, so no tan fringe travels with the wing when it lifts.
    tan = np.clip((a[..., 0] - a[..., 2] - 5) / 25, 0, 1)
    wing[overlap, 3] *= 1 - tan[overlap]

    # The shirt's left edge, measured where it shows: it starts at its top corner (y 162) and runs down and out.
    def shirt_edge(y: int) -> float:
        return float(np.interp(y, [162, 186, 204], [54, 45, 42]))

    body = a.copy()
    noise = np.random.default_rng(5)
    shirt = (a[..., 0] > a[..., 2] + 25) & (a[..., 3] > 200)
    # The art's right wing is the mirror image of the left, so both sides are cleared the same way.
    for mirrored in (False, True):
        flip = (lambda m: m[:, ::-1]) if mirrored else (lambda m: m)
        cover, stray, is_shirt = flip(overlap | gap), flip(outside), flip(shirt)
        opaque = flip(a[..., 3] > 200)
        body[stray] = 0
        inward = -1 if mirrored else 1
        for y, x in np.argwhere(cover):
            local_x = WIDTH - 1 - x if mirrored else x
            # How much of this pixel lies on the shirt side of its edge, so the edge is smooth, not stepped.
            coverage = float(np.clip(local_x + 1 - shirt_edge(y), 0, 1)) if y >= 161 else 1.0
            if coverage <= 0:
                body[y, x] = 0  # beside the shirt, outside the bird
                continue
            # Copy the nearest uncovered, opaque shirt (on shirt rows) or fur (above the shirt) toward the body's centre.
            want_shirt = y >= 161
            source = x
            while 0 <= source < WIDTH and (cover[y, source] or not opaque[y, source] or is_shirt[y, source] != want_shirt):
                source += inward
            body[y, x, :3] = np.clip(a[y, source, :3] + noise.normal(0, 1.8), 0, 255)
            body[y, x, 3] = 255 * coverage
    return body, wing


def main() -> None:
    front = np.array(Image.open(ART / "front.webp").convert("RGBA")).astype(float)
    without_fly, fly = split_dragonfly(front)
    body, _ = split_wings(without_fly)
    _, wing = split_wings(front)
    for name, layer in (("body", body), ("fly", fly), ("wing", wing)):
        Image.fromarray(layer.astype(np.uint8)).save(ART / f"{name}.webp", lossless=True)


if __name__ == "__main__":
    main()
