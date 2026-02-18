from PIL import Image, ImageDraw, ImageFont
import math

SIZE = 1024
img = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
draw = ImageDraw.Draw(img)

# Background gradient: dark navy top to blue bottom
for y in range(SIZE):
    t = y / SIZE
    r = int(10 + (22 - 10) * t)
    g = int(30 + (80 - 30) * t)
    b = int(60 + (140 - 60) * t)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b))

# White circle badge centered
cx, cy = SIZE // 2, SIZE // 2 - 20
badge_r = 340
draw.ellipse([cx - badge_r, cy - badge_r, cx + badge_r, cy + badge_r],
             fill=(255, 255, 255))

# ₪ symbol in app accent blue inside the badge
font_paths = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]
font_size = 420
for fp in font_paths:
    try:
        font = ImageFont.truetype(fp, font_size)
        bbox = draw.textbbox((0, 0), "₪", font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = cx - tw // 2 - bbox[0]
        ty = cy - th // 2 - bbox[1]
        draw.text((tx, ty), "₪", font=font, fill=(30, 100, 190))
        break
    except:
        continue

# Bottom text "שכר"
try:
    font_sm = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 72)
    text = "SalaryPro"
    bbox2 = draw.textbbox((0, 0), text, font=font_sm)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(((SIZE - tw2) // 2, SIZE - 110), text, font=font_sm, fill=(160, 200, 240))
except:
    pass

img.save("assets/icon.png", "PNG", quality=95)
# Also generate splash
splash = Image.new("RGB", (SIZE, SIZE))
sdraw = ImageDraw.Draw(splash)
for y in range(SIZE):
    t = y / SIZE
    r = int(10 + (22 - 10) * t)
    g = int(30 + (80 - 30) * t)
    b = int(60 + (140 - 60) * t)
    sdraw.line([(0, y), (SIZE, y)], fill=(r, g, b))
# Center badge on splash too
sdraw.ellipse([cx - badge_r, cy - badge_r, cx + badge_r, cy + badge_r], fill=(255, 255, 255))
try:
    sdraw.text((tx, ty), "₪", font=font, fill=(30, 100, 190))
except:
    pass
splash.save("assets/splash.png", "PNG", quality=95)
print("Done: icon.png + splash.png")
