from pathlib import Path
import importlib.util

from PIL import Image


OUTPUT = Path(__file__).parent
spec = importlib.util.spec_from_file_location('advent_assets', OUTPUT.parent / 'advent' / 'generate_assets.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
assets.OUTPUT = OUTPUT


def heart(name, light, dark, rotation):
    image = Image.new('RGBA', (assets.SIZE, assets.SIZE))
    points = assets.curve((384, 218), [
        ((313, 102), (140, 105), (110, 252)),
        ((78, 401), (250, 522), (384, 647)),
        ((518, 522), (690, 401), (658, 252)),
        ((628, 105), (455, 102), (384, 218)),
    ])
    assets.shaded_shape(image, points, light, dark, 14)
    assets.save(image, name, rotation)


if __name__ == '__main__':
    heart('herz-rot.png', (246, 83, 91), (171, 26, 45), -12)
    heart('herz-bordeaux.png', (204, 65, 98), (119, 26, 54), 13)
    heart('herz-rose.png', (255, 176, 189), (200, 100, 133), -5)