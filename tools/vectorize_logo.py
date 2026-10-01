from copy import deepcopy
from pathlib import Path
from tempfile import TemporaryDirectory
from xml.etree import ElementTree as ET

from PIL import Image
import vtracer


ROOT = Path(__file__).resolve().parent.parent
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def main():
    with Image.open(ROOT / "bilder" / "Logo braun-p-500.png") as source:
        image = source.convert("RGBA")
    mask = Image.new("RGB", image.size, "white")
    mask.putdata([
        (0, 0, 0) if alpha >= 128 and red < 100 and green < red else (255, 255, 255)
        for red, green, blue, alpha in image.getdata()
    ])

    with TemporaryDirectory() as directory:
        input_path = Path(directory) / "lettering.png"
        output_path = Path(directory) / "lettering.svg"
        mask.save(input_path)
        vtracer.convert_image_to_svg_py(
            str(input_path), str(output_path), colormode="binary",
            mode="spline", filter_speckle=2, corner_threshold=60,
            length_threshold=3.5, splice_threshold=45, path_precision=3,
        )
        lettering = ET.parse(output_path).getroot()

    original = ET.parse(ROOT / "bilder" / "kastanie-logo.svg").getroot()
    result = ET.Element(f"{{{SVG}}}svg", {
        "viewBox": f"0 0 {image.width} {image.height}",
        "width": str(image.width), "height": str(image.height),
        "role": "img", "aria-labelledby": "logo-title",
    })
    ET.SubElement(result, f"{{{SVG}}}title", {"id": "logo-title"}).text = (
        "Kastanie - Bistro, Cafe, Apartment"
    )
    result.append(deepcopy(original.find(f"{{{SVG}}}defs")))
    leaf = original.find(f"{{{SVG}}}g")[1][0]
    assert len(leaf.findall(f".//{{{SVG}}}path")) == 7
    result.append(deepcopy(leaf))
    for path in lettering.findall(f"{{{SVG}}}path"):
        path.set("fill", "#291d11")
        result.append(path)

    ET.indent(result)
    target = ROOT / "bilder" / "kastanie-logo-schriftzug.svg"
    ET.ElementTree(result).write(target, encoding="utf-8", xml_declaration=True)
    print(f"Created {target.name}")


if __name__ == "__main__":
    main()