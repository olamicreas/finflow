import os
import math
from PIL import Image, ImageDraw, ImageFilter

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def lerp_color(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

# CreasPay Signature Theme Palette (from mobile/src/theme/colors.ts)
C_BG = hex_to_rgb("#07070C")          # Jet Black Obsidian
C_PINK = hex_to_rgb("#FF1E75")        # Signature Hot Pink
C_PINK_LIGHT = hex_to_rgb("#FF4D91")  # Light Hot Pink Highlight
C_VIOLET = hex_to_rgb("#7000FF")      # Electric Violet
C_VIOLET_DEEP = hex_to_rgb("#5500D4") # Deep Velvet Violet
C_CYAN = hex_to_rgb("#00E5FF")        # Neon Cyan
C_CYAN_LIGHT = hex_to_rgb("#80F2FF")  # Bright Ice Cyan
C_GOLD = hex_to_rgb("#FFB800")        # Digital Gold Spark
C_GOLD_LIGHT = hex_to_rgb("#FFE885")  # Radiant Gold Core

def render_raw_emblem(W, H):
    """Renders the mathematical CP ribbon emblem at high resolution with pure minimalist precision."""
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

    # 1. Draw "C" arc from 40 deg around to 315 deg
    steps_c = 400
    for i in range(steps_c + 1):
        t = i / steps_c
        deg = 40.0 + t * 275.0
        rad = math.radians(deg)
        
        if t < 0.45:
            color = lerp_color(C_PINK_LIGHT, C_PINK, t / 0.45)
        elif t < 0.80:
            color = lerp_color(C_PINK, C_CYAN, (t - 0.45) / 0.35)
        else:
            color = lerp_color(C_CYAN, C_CYAN_LIGHT, (t - 0.80) / 0.20)
            
        x = c_cx + c_r * math.cos(rad)
        y = c_cy + c_r * math.sin(rad)
        edraw.circle((x, y), radius=stroke_r, fill=(*color, 255))

    # 2. Bridge curve from C top to P top
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
        
        color = lerp_color(C_CYAN_LIGHT, C_PINK, t)
        edraw.circle((bx, by), radius=stroke_r, fill=(*color, 255))

    # 3. P vertical stem
    steps_stem = 250
    for i in range(steps_stem + 1):
        t = i / steps_stem
        sy = p_stem_top_y + t * (p_stem_bot_y - p_stem_top_y)
        color = lerp_color(C_PINK, C_VIOLET, t)
        edraw.circle((p_stem_x, sy), radius=stroke_r, fill=(*color, 255))

    # 4. P upper loop (-90 deg to +90 deg)
    steps_p = 300
    for i in range(steps_p + 1):
        t = i / steps_p
        deg = -90.0 + t * 180.0
        rad = math.radians(deg)
        
        if t < 0.5:
            color = lerp_color(C_PINK, C_PINK_LIGHT, t * 2.0)
        else:
            color = lerp_color(C_PINK_LIGHT, C_VIOLET, (t - 0.5) * 2.0)
            
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
    """Builds the full App Store / Home Screen master icon with obsidian glass plate and glows."""
    cx, cy = W // 2, H // 2
    canvas = Image.new("RGBA", (W, H), (*C_BG, 255))
    
    # 1. Ambient Neon Glow
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)
    
    # Hot Pink glow on left
    p_cx, p_cy = cx - int(W * 0.12), cy - int(H * 0.04)
    for r in range(int(W * 0.44), 0, -20):
        alpha = int(75 * (1 - r / (W * 0.44)))
        g_draw.ellipse([p_cx - r, p_cy - r, p_cx + r, p_cy + r], fill=(*C_PINK, alpha))
        
    # Violet glow on right
    v_cx, v_cy = cx + int(W * 0.13), cy + int(H * 0.06)
    for r in range(int(W * 0.46), 0, -20):
        alpha = int(85 * (1 - r / (W * 0.46)))
        g_draw.ellipse([v_cx - r, v_cy - r, v_cx + r, v_cy + r], fill=(*C_VIOLET, alpha))
        
    # Cyan highlight
    c_glow_cx, c_glow_cy = cx - int(W * 0.02), cy - int(H * 0.20)
    for r in range(int(W * 0.26), 0, -16):
        alpha = int(50 * (1 - r / (W * 0.26)))
        g_draw.ellipse([c_glow_cx - r, c_glow_cy - r, c_glow_cx + r, c_glow_cy + r], fill=(*C_CYAN, alpha))
        
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(110))
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
    s_draw.rounded_rectangle([px0, py0 + 80, px1, py1 + 80], radius=radius, fill=(0, 0, 0, 200))
    shadow = shadow.filter(ImageFilter.GaussianBlur(100))
    canvas = Image.alpha_composite(canvas, shadow)
    
    # Glass Body
    plate = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(plate)
    p_draw.rounded_rectangle([px0, py0, px1, py1], radius=radius, fill=(12, 12, 20, 245))
    
    # Gradient Rim
    border_width = 16
    for b in range(border_width):
        p_draw.rounded_rectangle(
            [px0 - b, py0 - b, px1 + b, py1 + b],
            radius=radius + b,
            outline=(*C_PINK, int(150 * (1 - b / border_width))),
            width=1
        )
    canvas = Image.alpha_composite(canvas, plate)

    # 3. Master Emblem & Drop Shadow
    emblem = render_raw_emblem(W, H)
    emblem_shadow = emblem.filter(ImageFilter.GaussianBlur(35))
    canvas.paste(emblem_shadow, (0, 30), emblem_shadow)
    canvas = Image.alpha_composite(canvas, emblem)

    return canvas

def main():
    print("Generating mathematically perfected CreasPay assets (4x supersampling 4096x4096 -> 1024x1024)...")
    
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
