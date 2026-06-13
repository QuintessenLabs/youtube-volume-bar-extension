import os
from PIL import Image, ImageOps

# Source screenshot paths
screenshot_dir = r"C:\Users\Kapil\Pictures\Screenshots"
screenshot_files = [
    r"Screenshot 2026-06-13 175958.png",
    r"Screenshot 2026-06-13 180022.png"
]

# Destination path
extension_dir = r"C:\Users\Kapil\.gemini\antigravity\scratch\youtube-volume-bar-extension"
dest_screenshots_dir = os.path.join(extension_dir, "screenshots")

def main():
    os.makedirs(dest_screenshots_dir, exist_ok=True)
    
    for i, file_name in enumerate(screenshot_files, start=1):
        src_path = os.path.join(screenshot_dir, file_name)
        dest_path = os.path.join(dest_screenshots_dir, f"screenshot{i}.png")
        
        print(f"Processing {src_path}...")
        if not os.path.exists(src_path):
            print(f"Error: Screenshot {src_path} not found!")
            continue
            
        with Image.open(src_path) as img:
            # Convert source to RGB
            src_rgb = img.convert("RGB")
            src_w, src_h = src_rgb.size
            
            # Create a premium dark grey canvas (1280x800) matching YouTube's dark mode (#0f0f0f)
            canvas_w, canvas_h = 1280, 800
            canvas = Image.new("RGB", (canvas_w, canvas_h), color=(15, 15, 15))
            
            # If the source image is larger than the canvas, resize it proportionally to fit
            scale = min(canvas_w / src_w, canvas_h / src_h)
            if scale < 1.0:
                new_w = int(src_w * scale)
                new_h = int(src_h * scale)
                src_rgb = src_rgb.resize((new_w, new_h), Image.Resampling.LANCZOS)
                src_w, src_h = new_w, new_h
                print(f"  Downscaled snip to ({src_w}, {src_h}) to fit canvas.")
            
            # Position the screenshot in the center of the canvas
            paste_x = (canvas_w - src_w) // 2
            paste_y = (canvas_h - src_h) // 2
            canvas.paste(src_rgb, (paste_x, paste_y))
            
            # Save the final 1280x800 image
            print(f"  Pasted screenshot at center ({paste_x}, {paste_y}) on a 1280x800 dark canvas.")
            canvas.save(dest_path, "PNG")
            print(f"  Saved processed screenshot to: {dest_path}")
            
    print("Screenshot processing completed successfully!")

if __name__ == "__main__":
    main()
