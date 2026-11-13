# Вырезает персонажа с белого фона и сохраняет для игры.
#   python3 tools/cutout.py <исходная.png> <куда.webp> [размер=640]
# Фон убирается заливкой от краёв, поэтому белые детали внутри персонажа (глаза, зубы) остаются.
import sys
from PIL import Image, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 640
SENT = (255, 0, 255)          # цвет-метка для фона
THRESH = 60                   # насколько пиксель может отличаться от белого и всё ещё считаться фоном

rgb = Image.open(src).convert('RGB')
w, h = rgb.size
work = rgb.copy()
step = max(1, w // 60)
seeds = [(x, y) for x in range(0, w, step) for y in (0, h - 1)] + [(x, y) for y in range(0, h, step) for x in (0, w - 1)]
for s in seeds:
    p = work.getpixel(s)
    if p != SENT and sum(255 - c for c in p) <= THRESH:
        ImageDraw.floodfill(work, s, SENT, thresh=THRESH)

# маска: 255 — персонаж, 0 — фон; слегка поджимаем и размываем край
mask = Image.new('L', (w, h), 255)
mask.putdata([0 if p == SENT else 255 for p in work.getdata()])
mask = mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.4))

# убираем белую кайму: на полупрозрачном крае цвет был смешан с белым фоном
out = []
for (r, g, b), a in zip(rgb.getdata(), mask.getdata()):
    if 0 < a < 255:
        k = a / 255
        r, g, b = (max(0, min(255, round((c - (1 - k) * 255) / k))) for c in (r, g, b))
    out.append((r, g, b, a))
res = Image.new('RGBA', (w, h))
res.putdata(out)
res = res.resize((size, size), Image.LANCZOS)
if dst.lower().endswith('.webp'):
    res.save(dst, 'WEBP', quality=88, method=6)
else:
    res.save(dst)
print(dst, res.size, 'bbox', res.getbbox())
