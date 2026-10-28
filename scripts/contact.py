#!/usr/bin/env python3
"""Склейка стоп-кадров в контактный лист: python3 scripts/contact.py out.png img1 img2 ..."""
import sys
from PIL import Image, ImageDraw

out = sys.argv[1]
files = sys.argv[2:]
cols = 3
w, h = 640, 360
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 24)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h))
    x = (i % cols) * w
    y = (i // cols) * (h + 24)
    sheet.paste(im, (x, y + 24))
    d.text((x + 6, y + 4), f.split('/')[-1], fill=(200, 200, 200))
sheet.save(out)
