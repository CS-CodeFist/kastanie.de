from pathlib import Path
import math
import random

from PIL import Image, ImageDraw, ImageFilter


SIZE = 768
OUTPUT_SIZE = 192
OUTPUT = Path(__file__).parent


def shaded_shape(image, points, light, dark, seed):
    mask = Image.new('L', (SIZE, SIZE))
    ImageDraw.Draw(mask).polygon(points, fill=255)
    texture = Image.new('RGBA', (SIZE, SIZE))
    pixels = texture.load()
    rng = random.Random(seed)
    left, top, right, bottom = mask.getbbox()
    for vertical in range(top, bottom):
        for horizontal in range(left, right):
            across = (horizontal - left) / (right - left)
            down = (vertical - top) / (bottom - top)
            highlight = math.exp(-((across + down * 0.35 - 0.38) / 0.24) ** 2)
            blend = min(1, max(0, 0.35 + down * 0.45 - highlight * 0.4))
            grain = rng.uniform(-0.6, 0.6)
            color = tuple(round(max(0, min(255, start * (1 - blend) + end * blend + grain)))
                          for start, end in zip(light, dark))
            pixels[horizontal, vertical] = (*color, 255)
    image.paste(texture, (0, 0), mask)


def save(image, name, rotation=0):
    if rotation:
        image = image.rotate(rotation, resample=Image.Resampling.BICUBIC)
    shadow = Image.new('RGBA', image.size, (45, 20, 4, 0))
    shadow.putalpha(image.getchannel('A').filter(ImageFilter.GaussianBlur(4)).point(lambda value: value // 10))
    shadow.alpha_composite(image)
    shadow.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS).save(OUTPUT / name)


def star(name, tips, light, dark, rotation):
    image = Image.new('RGBA', (SIZE, SIZE))
    center = (SIZE / 2, SIZE / 2)
    points = []
    for index in range(tips * 2):
        angle = -math.pi / 2 + index * math.pi / tips
        radius = 300 if index % 2 == 0 else 150
        points.append((center[0] + math.cos(angle) * radius,
                       center[1] + math.sin(angle) * radius))
    rounded = []
    for index, point in enumerate(points):
        previous = points[index - 1]
        following = points[(index + 1) % len(points)]
        start = tuple(point[axis] * 0.92 + previous[axis] * 0.08 for axis in range(2))
        end = tuple(point[axis] * 0.92 + following[axis] * 0.08 for axis in range(2))
        rounded.extend(curve(start, [(point, point, end)]))
    shaded_shape(image, rounded, light, dark, tips)
    save(image, name, rotation)


def curve(start, segments):
    points = [start]
    for first, second, end in segments:
        for step in range(1, 33):
            amount = step / 32
            inverse = 1 - amount
            points.append(tuple(inverse ** 3 * start[axis]
                                + 3 * inverse ** 2 * amount * first[axis]
                                + 3 * inverse * amount ** 2 * second[axis]
                                + amount ** 3 * end[axis] for axis in range(2)))
        start = end
    return points


def bow(name, rotation, light, dark):
    image = Image.new('RGBA', (SIZE, SIZE))
    left_tail = curve((360, 335), [((320, 420), (290, 540), (190, 642))])
    left_tail += [(270, 610), (320, 680)]
    left_tail += curve((320, 680), [((370, 540), (410, 430), (409, 347))])
    right_tail = [(SIZE - horizontal, vertical) for horizontal, vertical in left_tail]
    shaded_shape(image, left_tail, light, dark, 31)
    shaded_shape(image, right_tail, light, dark, 32)
    left_loop = curve((380, 323), [
        ((290, 239), (159, 87), (98, 150)),
        ((43, 203), (77, 409), (170, 415)),
        ((248, 422), (311, 361), (380, 365)),
        ((395, 353), (398, 333), (380, 323)),
    ])
    shaded_shape(image, left_loop, light, dark, 33)
    shaded_shape(image, [(SIZE - horizontal, vertical) for horizontal, vertical in left_loop], light, dark, 34)
    fold = curve((123, 197), [
        ((170, 230), (267, 298), (363, 342)),
        ((263, 327), (152, 355), (123, 197)),
    ])
    fold_light = tuple(round(channel * 0.8) for channel in light)
    shaded_shape(image, fold, fold_light, dark, 35)
    shaded_shape(image, [(SIZE - horizontal, vertical) for horizontal, vertical in fold], fold_light, dark, 36)
    knot = curve((350, 291), [
        ((370, 280), (406, 280), (427, 295)),
        ((443, 323), (438, 367), (423, 392)),
        ((396, 401), (367, 398), (345, 383)),
        ((335, 355), (337, 316), (350, 291)),
    ])
    shaded_shape(image, knot, light, dark, 37)
    save(image, name, rotation)


if __name__ == '__main__':
    star('stern-gold.png', 5, (255, 224, 133), (195, 139, 43), -12)
    star('stern-champagner.png', 5, (255, 243, 192), (212, 174, 101), 17)
    star('stern-gold-acht.png', 5, (245, 204, 100), (185, 123, 32), 6)
    bow('schleife-rot.png', -14, (239, 75, 72), (137, 23, 39))
    bow('schleife-bordeaux.png', 15, (219, 66, 85), (115, 20, 43))