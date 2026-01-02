from PIL import Image
import sys
import os

if len(sys.argv) != 3:
    print("Usage: make_icon.py <source.png> <out.ico>")
    sys.exit(1)

src = sys.argv[1]
out = sys.argv[2]

img = Image.open(src).convert('RGBA')
# sizes for ICO: include common sizes
sizes = [(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)]

# Ensure output directory exists
os.makedirs(os.path.dirname(out), exist_ok=True)

img.save(out, format='ICO', sizes=sizes)
print(f"Saved {out}")
