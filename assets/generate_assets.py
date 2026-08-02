from PIL import Image, ImageDraw
import os

OUT = os.path.dirname(os.path.abspath(__file__))
BG = (5, 5, 5, 255)        # #050505
ACCENT = (78, 222, 163, 255)  # #4edea3


def crescent(size, color, transparent_bg=True, padding_ratio=0.18):
    """Draw a crescent moon centered in a square canvas."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else BG)
    draw = ImageDraw.Draw(img)

    pad = int(size * padding_ratio)
    r = (size - 2 * pad) / 2
    cx, cy = size / 2, size / 2

    bbox_outer = [cx - r, cy - r, cx + r, cy + r]
    draw.ellipse(bbox_outer, fill=color)

    # Cut-out circle, offset to the upper-right, to leave a crescent sliver.
    offset = r * 0.55
    r2 = r * 0.92
    cx2, cy2 = cx + offset, cy - offset * 0.35
    bbox_inner = [cx2 - r2, cy2 - r2, cx2 + r2, cy2 + r2]
    cut_color = (0, 0, 0, 0) if transparent_bg else BG
    draw.ellipse(bbox_inner, fill=cut_color)

    # Re-center the crescent's visible pixels within the canvas.
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        shape = img.crop(bbox)
        centered = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else BG)
        paste_x = (size - shape.width) // 2
        paste_y = (size - shape.height) // 2
        centered.alpha_composite(shape, (paste_x, paste_y))
        img = centered

    return img


def icon_with_bg(size):
    img = Image.new("RGBA", (size, size), BG)
    moon = crescent(size, ACCENT, transparent_bg=True, padding_ratio=0.2)
    img.alpha_composite(moon)
    return img


# 1. App icon (1024x1024, opaque background) — used for iOS/Android store icon.
icon = icon_with_bg(1024)
icon.convert("RGB").save(os.path.join(OUT, "icon.png"))

# 2. Splash logo (transparent, centered by Expo's splash config over backgroundColor).
splash = crescent(1024, ACCENT, transparent_bg=True, padding_ratio=0.28)
canvas = Image.new("RGBA", (1284, 1284), (0, 0, 0, 0))
canvas.alpha_composite(splash, ((1284 - 1024) // 2, (1284 - 1024) // 2))
canvas.save(os.path.join(OUT, "splash.png"))

# 3. Android adaptive icon foreground (transparent bg, shape inset to safe zone).
adaptive = crescent(1024, ACCENT, transparent_bg=True, padding_ratio=0.32)
adaptive.save(os.path.join(OUT, "adaptive-icon.png"))

# 4. Notification icon — Android requires a plain white silhouette, alpha-only.
notif = crescent(192, (255, 255, 255, 255), transparent_bg=True, padding_ratio=0.12)
notif.save(os.path.join(OUT, "notification-icon.png"))

# 5. Favicon for web.
favicon = icon.resize((48, 48), Image.LANCZOS)
favicon.convert("RGB").save(os.path.join(OUT, "favicon.png"))

print("Generated:", os.listdir(OUT))
