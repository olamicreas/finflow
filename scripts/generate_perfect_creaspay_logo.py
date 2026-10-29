import os
import math
from PIL import Image, ImageDraw, ImageFilter

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def lerp_color(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

# CreasPay Refined Minimalist Palette: Crisp White + Touch of App Pink Alone
C_BG = hex_to_rgb("#07070C")          # Jet Black Obsidian
C_WHITE = hex_to_rgb("#FFFFFF")       # Crisp Pure White
C_SILVER = hex_to_rgb("#F1F5F9")      # Platinum Silver
C_PINK = hex_to_rgb("#FF1E75")        # Signature Hot Pink (The ONLY accent)
C_PINK_LIGHT = hex_to_rgb("#FF4D91")  # Light Hot Pink Highlight

def render_raw_emblem(W, H):
    """Renders the CP ribbon emblem in sleek monochromatic white with a touch of signature pink alone."""
    cx, cy = W // 2, H // 2
    emblem = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    edraw = ImageDraw.Draw(emblem)

    stroke_r = int(W * 0.054) # Brush radius (~440px stroke thickness on 4096 canvas)
    c_r = int(W * 0.180)      # "C" radius
    p_r = int(W * 0.118)      # "P" loop radius

    c_cx = cx - int(W * 0.065)
    c_cy = cy - int(H * 0.015)

    p_stem_x = cx + int(W * 0.125)
    p_loop_cy = cy - int(H * 0.090)
    p_stem_top_y = p_loop_cy - p_r
    p_stem_bot_y = cy + int(H * 0.200)

    # 1. Draw "C" arc from 40 deg around to 315 deg (Crisp White / Platinum)
    steps_c = 400
    for i in range(steps_c + 1):
        t = i / steps_c
        deg = 40.0 + t * 275.0
        rad = math.radians(deg)
        color = lerp_color(C_SILVER, C_WHITE, t)
        x = c_cx + c_r * math.cos(rad)
        y = c_cy + c_r * math.sin(rad)
        edraw.circle((x, y), radius=stroke_r, fill=(*color, 255))

    # 2. Bridge curve from C top to P top (transitions smoothly into the pink accent)
    c_top_x = c_cx + c_r * math.cos(math.radians(315))
    c_top_y = c_cy + c_r * math.sin(math.radians(315))
    p_top_x = p_stem_x
    p_top_y = p_stem_top_y

    steps_b = 150
    for i in range(steps_b + 1):
        t = i / steps_b
        p0 = (c_top_x, c_top_y)
        p1 = (c_top_x + int(W * 0.06), c_top_y - int(H * 0.03))
        p2 = (p_top_x - int(W * 0.04), p_top_y)
        p3 = (p_top_x, p_top_y)
        
        bx = (1-t)**3 * p0[0] + 3*(1-t)**2*t * p1[0] + 3*(1-t)*t**2 * p2[0] + t**3 * p3[0]
        by = (1-t)**3 * p0[1] + 3*(1-t)**2*t * p1[1] + 3*(1-t)*t**2 * p2[1] + t**3 * p3[1]
        
        color = lerp_color(C_WHITE, C_PINK, t)
        edraw.circle((bx, by), radius=stroke_r, fill=(*color, 255))

    # 3. P vertical stem (Crisp White)
    steps_stem = 250
    for i in range(steps_stem + 1):
        t = i / steps_stem
        sy = p_stem_top_y + t * (p_stem_bot_y - p_stem_top_y)
        color = lerp_color(C_PINK, C_WHITE, t * 1.5) if t < 0.6 else C_WHITE
        edraw.circle((p_stem_x, sy), radius=stroke_r, fill=(*color, 255))

    # 4. P upper loop (-90 deg to +90 deg) (The Touch of App Pink Alone)
    steps_p = 300
    for i in range(steps_p + 1):
        t = i / steps_p
        deg = -90.0 + t * 180.0
        rad = math.radians(deg)
        
        # Smooth rich gradient in pink
        if t < 0.5:
            color = lerp_color(C_PINK, C_PINK_LIGHT, t * 2.0)
        else:
            color = lerp_color(C_PINK_LIGHT, C_PINK, (t - 0.5) * 2.0)
            
        x = p_stem_x + p_r * math.cos(rad)
        y = p_loop_cy + p_r * math.sin(rad)
        edraw.circle((x, y), radius=stroke_r, fill=(*color, 255))

    # 5. Auto-Center with Mathematical Precision
    bbox = emblem.getbbox()
    emb_cx = (bbox[0] + bbox[2]) / 2.0
    emb_cy = (bbox[1] + bbox[3]) / 2.0
    dx = cx - emb_cx
    dy = cy - emb_cy

    centered_emblem = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    centered_emblem.paste(emblem, (int(round(dx)), int(round(dy))), emblem)

    return centered_emblem

def build_app_icon(W, H):
    """Builds the full App Store master icon with subtle dark aesthetic and single pink warmth."""
    cx, cy = W // 2, H // 2
    canvas = Image.new("RGBA", (W, H), (*C_BG, 255))
    
    # 1. Subtle, elegant warm pink ambient glow (no cyan, no violet)
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    
    p_cx, p_cy = cx + int(W * 0.08), cy - int(H * 0.05)
    for r in range(int(W * 0.40), 0, -25):
        alpha = int(45 * (1 - r / (W * 0.40)))
        g_draw.ellipse([p_cx - r, p_cy - r, p_cx + r, p_cy + r], fill=(*C_PINK, alpha))
        
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(130))
    canvas = Image.alpha_composite(canvas, glow_layer)
    
    # 2. Translucent Glass Shield Plate
    plate_size = int(W * 0.77)
    px0 = (W - plate_size) // 2
    py0 = (H - plate_size) // 2
    px1 = px0 + plate_size
    py1 = py0 + plate_size
    radius = int(plate_size * 0.27)
    
    # Drop shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([px0, py0 + 60, px1, py1 + 60], radius=radius, fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(80))
    canvas = Image.alpha_composite(canvas, shadow)
    
    # Glass Body (Jet Dark Obsidian Glass)
    plate = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(plate)
    p_draw.rounded_rectangle([px0, py0, px1, py1], radius=radius, fill=(11, 11, 16, 250))
    
    # Subtle Minimalist Rim
    border_width = 12
    for b in range(border_width):
        alpha = int(90 * (1 - b / border_width))
        p_draw.rounded_rectangle(
            [px0 - b, py0 - b, px1 + b, py1 + b],
            radius=radius + b,
            outline=(255, 255, 255, alpha // 2),
            width=1
        )
    canvas = Image.alpha_composite(canvas, plate)

    # 3. Master Emblem & Drop Shadow
    emblem = render_raw_emblem(W, H)
    emblem_shadow = emblem.filter(ImageFilter.GaussianBlur(30))
    canvas.paste(emblem_shadow, (0, 24), emblem_shadow)
    canvas = Image.alpha_composite(canvas, emblem)

    return canvas

def main():
    print("Generating refined minimalist CreasPay assets (White with touch of pink alone)...")
    
    # 1. Master High-Resolution App Icon
    hires_app_icon = build_app_icon(4096, 4096)
    master_icon = hires_app_icon.resize((1024, 1024), Image.Resampling.LANCZOS)
    master_icon.save("mobile/assets/icon.png", "PNG", optimize=True)
    print("✓ Saved mobile/assets/icon.png (1024x1024)")
    
    # 2. In-App Transparent Brand Mark (perfected centering)
    hires_mark = render_raw_emblem(4096, 4096)
    mark_icon = hires_mark.resize((1024, 1024), Image.Resampling.LANCZOS)
    mark_icon.save("mobile/assets/creaspay-mark.png", "PNG", optimize=True)
    print("✓ Saved mobile/assets/creaspay-mark.png (1024x1024 transparent)")
    
    # 3. Android Adaptive Foreground (scaled to safe zone)
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    scaled_mark = mark_icon.resize((740, 740), Image.Resampling.LANCZOS)
    fg.paste(scaled_mark, (142, 142), scaled_mark)
    fg.save("mobile/assets/android-icon-foreground.png", "PNG", optimize=True)
    print("✓ Saved mobile/assets/android-icon-foreground.png")
    
    # 4. Android Adaptive Background
    bg = Image.new("RGBA", (1024, 1024), (*C_BG, 255))
    bg.save("mobile/assets/android-icon-background.png", "PNG", optimize=True)
    print("✓ Saved mobile/assets/android-icon-background.png")
    
    # 5. Splash Screen Icon
    splash = master_icon.resize((512, 512), Image.Resampling.LANCZOS)
    splash.save("mobile/assets/splash-icon.png", "PNG", optimize=True)
    print("✓ Saved mobile/assets/splash-icon.png")
    
    # 6. Web / PWA Favicon
    favicon = master_icon.resize((48, 48), Image.Resampling.LANCZOS)
    favicon.save("mobile/assets/favicon.png", "PNG", optimize=True)
    print("✓ Saved mobile/assets/favicon.png")
    
    # Copy to Brain Artifacts for instant review
    artifacts_dir = "/Users/abdulquayyumoyedotun/.gemini/antigravity/brain/221a9555-5daf-41c1-bb0c-a01806c8c791"
    master_icon.save(os.path.join(artifacts_dir, "creaspay_perfect_icon.png"), "PNG")
    mark_icon.save(os.path.join(artifacts_dir, "creaspay_mark.png"), "PNG")
    print("✓ Saved previews to artifacts directory.")

if __name__ == "__main__":
    main()
