from PIL import Image
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
ICON_PATH = ROOT / 'src' / 'renderer' / 'images' / 'app_icon.ico'
OUT_PNG = ROOT / 'src' / 'renderer' / 'images' / 'app_icon_256.png'
OUT_ICO = ROOT / 'src' / 'renderer' / 'images' / 'app_icon_256.ico'

def main():
    if not ICON_PATH.exists():
        print(f"Source icon not found: {ICON_PATH}")
        sys.exit(1)
    img = Image.open(ICON_PATH)
    img = img.convert('RGBA')
    resized = img.resize((256,256), Image.LANCZOS)
    resized.save(OUT_PNG)
    # Save ICO with a single 256x256 entry
    resized.save(OUT_ICO, sizes=[(256,256)])
    print(f"Wrote: {OUT_PNG}\nWrote: {OUT_ICO}")

if __name__ == '__main__':
    main()
