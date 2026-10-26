import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_creaspay_icon(size=1024):
    # Base image with deep obsidian midnight background
    img = Image.new("RGBA", (size, size), (9, 12, 18, 255))
    
    # Layer 1: Ambient background radial glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = size // 2, size // 2
    
    # Draw soft radial emerald/cyan glow in background
    for r in range(480, 0, -8):
        alpha = int(45 * (1 - r / 480))
        glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 185, 129, alpha))
        
    for r in range(320, 0, -8):
        alpha = int(35 * (1 - r / 320))
        glow_draw.ellipse([cx - r + 40, cy - r + 40, cx + r + 40, cy + r + 40], fill=(99, 102, 241, alpha))
        
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    img = Image.alpha_composite(img, glow)
    
    # Layer 2: Sleek Squircle Glass Plate with subtle border
    plate_size = 720
    px0 = (size - plate_size) // 2
    py0 = (size - plate_size) // 2
    px1 = px0 + plate_size
    py1 = py0 + plate_size
    radius = 160
    
    plate = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    plate_draw = ImageDraw.Draw(plate)
    
    # Shadow under squircle
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle([px0, py0 + 20, px1, py1 + 20], radius=radius, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    img = Image.alpha_composite(img, shadow)
    
    # Plate background: dark glass gradient
    plate_draw.rounded_rectangle([px0, py0, px1, py1], radius=radius, fill=(18, 24, 38, 235))
    
    # Delicate gradient border around the plate
    for b_offset in range(3):
        plate_draw.rounded_rectangle(
            [px0 - b_offset, py0 - b_offset, px1 + b_offset, py1 + b_offset],
            radius=radius + b_offset,
            outline=(34 + b_offset * 10, 48 + b_offset * 15, 74 + b_offset * 20, 200 - b_offset * 50),
            width=1
        )
    
    img = Image.alpha_composite(img, plate)
    
    # Layer 3: Vibrant Geometric "CP" Emblem
    # We draw high-resolution vector-like paths using supersampling
    SS = 4
    ss_size = size * SS
    vector_layer = Image.new("RGBA", (ss_size, ss_size), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vector_layer)
    
    scx, scy = ss_size // 2, ss_size // 2
    
    # C-Loop: Sweeping thick crescent arc in Electric Emerald
    # Center of C at scx - 120, scy
    # Arc from 50 deg to 310 deg
    c_radius_out = 680
    c_radius_in = 440
    c_thick = c_radius_out - c_radius_in
    
    # Draw C crescent with vertical gradient (Emerald to Cyan)
    for angle in range(45, 316):
        rad = math.radians(angle)
        # Interpolate color from Emerald (#10B981) to Cyan (#06B6D4)
        t = (angle - 45) / 270.0
        r_col = int(16 * (1 - t) + 6 * t)
        g_col = int(185 * (1 - t) + 182 * t)
        b_col = int(129 * (1 - t) + 212 * t)
        
        # Center of C loop shifted left slightly
        cc_x = scx - 100
        cc_y = scy
        
        x_out = cc_x + (c_radius_out - c_thick / 2) * math.cos(rad)
        y_out = cc_y + (c_radius_out - c_thick / 2) * math.sin(rad)
        
        vdraw.circle((x_out, y_out), radius=c_thick // 2, fill=(r_col, g_col, b_col, 255))
        
    # P-Stem & Loop: Interlocking vibrant Indigo-Cyan loop on the right
    # Vertical stem of P
    p_stem_x = scx + 100
    p_stem_y_top = scy - 500
    p_stem_y_bot = scy + 460
    stem_thick = 220
    
    for y in range(p_stem_y_top, p_stem_y_bot, 10):
        t = (y - p_stem_y_top) / (p_stem_y_bot - p_stem_y_top)
        r_col = int(6 * (1 - t) + 99 * t)
        g_col = int(182 * (1 - t) + 102 * t)
        b_col = int(212 * (1 - t) + 241 * t)
        vdraw.circle((p_stem_x, y), radius=stem_thick // 2, fill=(r_col, g_col, b_col, 255))
        
    # P-Loop: Semi-circle on the right side of the stem
    p_loop_cx = p_stem_x
    p_loop_cy = scy - 180
    p_radius = 340
    for angle in range(-90, 91):
        rad = math.radians(angle)
        t = (angle + 90) / 180.0
        r_col = int(6 * (1 - t) + 16 * t)
        g_col = int(182 * (1 - t) + 220 * t)
        b_col = int(212 * (1 - t) + 180 * t)
        
        x_p = p_loop_cx + p_radius * math.cos(rad)
        y_p = p_loop_cy + p_radius * math.sin(rad)
        vdraw.circle((x_p, y_p), radius=stem_thick // 2, fill=(r_col, g_col, b_col, 255))

    # Dynamic Golden Fintech Spark / Arrow Accent inside the junction
    spark_cx = scx + 20
    spark_cy = scy + 80
    spark_r = 90
    for sr in range(spark_r, 0, -4):
        vdraw.circle((spark_cx, spark_cy), radius=sr, fill=(251, 191, 36, 255))
        
    # Downscale supersampled emblem with high-quality Lanczos resampling
    emblem_layer = vector_layer.resize((size, size), Image.Resampling.LANCZOS)
    
    # Soft drop shadow for emblem
    emblem_shadow = emblem_layer.filter(ImageFilter.GaussianBlur(16))
    shadow_np = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw_2 = ImageDraw.Draw(shadow_np)
    # composite shadow offset by 10px down
    img.paste(emblem_shadow, (0, 12), emblem_shadow)
    
    # Composite sharp emblem onto image
    img = Image.alpha_composite(img, emblem_layer)
    
    # Outer 1px hairline border around 1024 canvas for crispness
    top_draw = ImageDraw.Draw(img)
    top_draw.rounded_rectangle([2, 2, size - 3, size - 3], radius=180, outline=(255, 255, 255, 18), width=2)
    
    return img

def main():
    os.makedirs("mobile/assets", exist_ok=True)
    
    print("Generating CreasPay Master 1024x1024 App Icon...")
    icon = create_creaspay_icon(1024)
    icon.save("mobile/assets/icon.png", "PNG", optimize=True)
    
    # Save a copy to artifacts directory for inspection
    artifacts_dir = "/Users/abdulquayyumoyedotun/.gemini/antigravity/brain/221a9555-5daf-41c1-bb0c-a01806c8c791"
    icon.save(os.path.join(artifacts_dir, "creaspay_icon.png"), "PNG")
    
    # Android Foreground: Just the emblem on transparent
    print("Generating Android adaptive foreground...")
    # Generate transparent background with emblem centered
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    # resize icon to 70% to fit android safe zone
    icon_scaled = icon.resize((716, 716), Image.Resampling.LANCZOS)
    fg.paste(icon_scaled, (154, 154), icon_scaled)
    fg.save("mobile/assets/android-icon-foreground.png", "PNG", optimize=True)
    
    # Android Background: Solid Dark
    bg = Image.new("RGBA", (1024, 1024), (9, 12, 18, 255))
    bg.save("mobile/assets/android-icon-background.png", "PNG", optimize=True)
    
    # Splash screen icon (512x512)
    print("Generating Splash Icon...")
    splash = icon.resize((512, 512), Image.Resampling.LANCZOS)
    splash.save("mobile/assets/splash-icon.png", "PNG", optimize=True)
    
    # Favicon (48x48)
    print("Generating Favicon...")
    favicon = icon.resize((48, 48), Image.Resampling.LANCZOS)
    favicon.save("mobile/assets/favicon.png", "PNG", optimize=True)
    
    print("All CreasPay logo assets generated successfully!")

if __name__ == "__main__":
    main()
