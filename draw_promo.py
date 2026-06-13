import os
from PIL import Image, ImageDraw, ImageFont

# Font paths
font_bold_path = r"C:\Windows\Fonts\segoeuib.ttf"
font_reg_path = r"C:\Windows\Fonts\segoeui.ttf"

# Target Directory
extension_dir = r"C:\Users\Kapil\.gemini\antigravity\scratch\youtube-volume-bar-extension"
promo_dir = os.path.join(extension_dir, "promo")

def draw_speaker(draw, x, y, scale=1.0, color=(255, 255, 255)):
    # Draw a clean speaker icon programmatically using polygons and lines
    # Body
    body_w = int(6 * scale)
    body_h = int(8 * scale)
    body_x = x
    body_y = y + int(4 * scale)
    draw.rectangle([body_x, body_y, body_x + body_w, body_y + body_h], fill=color)
    
    # Cone
    cone_pts = [
        (body_x + body_w, body_y),
        (body_x + body_w + int(6 * scale), y),
        (body_x + body_w + int(6 * scale), y + int(16 * scale)),
        (body_x + body_w, body_y + body_h)
    ]
    draw.polygon(cone_pts, fill=color)
    
    # Sound wave arc
    wave_x = body_x + body_w + int(9 * scale)
    wave_y = y + int(2 * scale)
    wave_w = int(12 * scale)
    wave_h = int(12 * scale)
    draw.arc([wave_x, wave_y, wave_x + wave_w, wave_y + wave_h], start=-45, end=45, fill=color, width=int(2 * scale))

def generate_small_promo():
    width, height = 440, 280
    img = Image.new("RGB", (width, height), color=(15, 15, 15))  # YouTube dark mode background (#0f0f0f)
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    try:
        font_title = ImageFont.truetype(font_bold_path, 16)
        font_label = ImageFont.truetype(font_reg_path, 12)
        font_sub = ImageFont.truetype(font_reg_path, 10)
    except IOError:
        font_title = font_label = font_sub = ImageFont.load_default()

    # Header
    draw.text((20, 20), "YouTube VolSlider", font=font_title, fill=(255, 51, 51))  # Red accent
    draw.text((20, 40), "Resize YouTube's volume controls", font=font_sub, fill=(170, 170, 170))
    
    # --- DEFAULT SLIDER ---
    # Label
    draw.text((50, 80), "Default Slider (52px)", font=font_label, fill=(170, 170, 170))
    # Speaker
    draw_speaker(draw, 50, 105, scale=1.0)
    # Slider track (grey background)
    track_y = 113
    draw.rounded_rectangle([75, track_y, 75 + 52, track_y + 3], radius=1, fill=(255, 255, 255, 40))
    # Slider fill (white)
    draw.rounded_rectangle([75, track_y, 75 + 35, track_y + 3], radius=1, fill=(255, 255, 255))
    # Slider handle (circle)
    handle_x = 75 + 35
    handle_r = 6
    draw.ellipse([handle_x - handle_r, track_y + 1 - handle_r, handle_x + handle_r, track_y + 1 + handle_r], fill=(255, 255, 255))
    
    # --- EXPANDED SLIDER ---
    # Label
    draw.text((50, 160), "Custom Expanded Slider (Up to 300px)", font=font_label, fill=(255, 255, 255))
    # Speaker
    draw_speaker(draw, 50, 185, scale=1.0)
    # Slider track (grey background)
    track_y_exp = 193
    draw.rounded_rectangle([75, track_y_exp, 75 + 280, track_y_exp + 3], radius=1, fill=(255, 255, 255, 40))
    # Slider fill (white)
    draw.rounded_rectangle([75, track_y_exp, 75 + 180, track_y_exp + 3], radius=1, fill=(255, 255, 255))
    # Slider handle (circle)
    handle_x_exp = 75 + 180
    handle_r_exp = 6
    draw.ellipse([handle_x_exp - handle_r_exp, track_y_exp + 1 - handle_r_exp, handle_x_exp + handle_r_exp, track_y_exp + 1 + handle_r_exp], fill=(255, 255, 255))
    
    dest_path = os.path.join(promo_dir, "small_promo.png")
    img.save(dest_path, "PNG")
    print(f"Programmatically generated small promo tile: {dest_path}")

def generate_marquee_promo():
    width, height = 1400, 560
    img = Image.new("RGB", (width, height), color=(15, 15, 15))  # YouTube dark mode background
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    try:
        font_title = ImageFont.truetype(font_bold_path, 48)
        font_subtitle = ImageFont.truetype(font_reg_path, 22)
        font_label = ImageFont.truetype(font_bold_path, 20)
        font_val = ImageFont.truetype(font_reg_path, 16)
    except IOError:
        font_title = font_subtitle = font_label = font_val = ImageFont.load_default()

    # Header Title
    draw.text((100, 70), "YouTube VolSlider", font=font_title, fill=(255, 51, 51))
    draw.text((100, 135), "Tired of the volume bar being too small? Scale it to any width!", font=font_subtitle, fill=(170, 170, 170))
    
    # Draw horizontal divider
    draw.line([100, 185, 1300, 185], fill=(255, 255, 255, 20), width=1)
    
    # --- DEFAULT SLIDER ---
    # Label
    draw.text((100, 230), "DEFAULT YOUTUBE SLIDER", font=font_label, fill=(130, 130, 130))
    # Speaker
    draw_speaker(draw, 100, 275, scale=2.0, color=(170, 170, 170))
    # Slider track
    track_y = 290
    draw.rounded_rectangle([150, track_y, 150 + 52, track_y + 6], radius=3, fill=(255, 255, 255, 40))
    # Slider fill
    draw.rounded_rectangle([150, track_y, 150 + 35, track_y + 6], radius=3, fill=(255, 255, 255))
    # Slider handle
    handle_x = 150 + 35
    handle_r = 10
    draw.ellipse([handle_x - handle_r, track_y + 3 - handle_r, handle_x + handle_r, track_y + 3 + handle_r], fill=(255, 255, 255))
    # Width Tag
    draw.text((150 + 52 + 20, track_y - 8), "52px (Tiny & hard to target)", font=font_val, fill=(130, 130, 130))
    
    # --- EXPANDED SLIDER ---
    # Label
    draw.text((100, 380), "EXPANDED VOLUME SLIDER (CUSTOMIZABLE WIDTH)", font=font_label, fill=(255, 255, 255))
    # Speaker
    draw_speaker(draw, 100, 425, scale=2.0, color=(255, 255, 255))
    # Slider track
    track_y_exp = 440
    slider_width = 800  # Stretched slider representation
    draw.rounded_rectangle([150, track_y_exp, 150 + slider_width, track_y_exp + 6], radius=3, fill=(255, 255, 255, 40))
    # Slider fill
    draw.rounded_rectangle([150, track_y_exp, 150 + 550, track_y_exp + 6], radius=3, fill=(255, 255, 255))
    # Slider handle
    handle_x_exp = 150 + 550
    handle_r_exp = 10
    draw.ellipse([handle_x_exp - handle_r_exp, track_y_exp + 3 - handle_r_exp, handle_x_exp + handle_r_exp, track_y_exp + 3 + handle_r_exp], fill=(255, 255, 255))
    # Width Tag
    draw.text((150 + slider_width + 20, track_y_exp - 8), "Choose any width up to 300px!", font=font_val, fill=(255, 51, 51))
    
    dest_path = os.path.join(promo_dir, "marquee_promo.png")
    img.save(dest_path, "PNG")
    print(f"Programmatically generated marquee promo tile: {dest_path}")

def main():
    os.makedirs(promo_dir, exist_ok=True)
    generate_small_promo()
    generate_marquee_promo()
    print("All promotional graphics drawn and saved successfully!")

if __name__ == "__main__":
    main()
