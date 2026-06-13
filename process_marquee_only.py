import os
from PIL import Image, ImageOps

# Source marquee banner path
source_marquee_path = r"C:\Users\Kapil\.gemini\antigravity\brain\3da15ee2-2336-4d88-b7df-fbd6e6026647\promo_marquee_raw_1781354197891.png"

# Destination path
extension_dir = r"C:\Users\Kapil\.gemini\antigravity\scratch\youtube-volume-bar-extension"
dest_marquee_path = os.path.join(extension_dir, "promo", "marquee_promo.png")

def main():
    if not os.path.exists(source_marquee_path):
        print(f"Error: Source image not found at {source_marquee_path}")
        return
        
    print(f"Opening wide marquee source: {source_marquee_path}...")
    with Image.open(source_marquee_path) as img:
        # Convert to RGB (strips alpha channel)
        rgb_img = img.convert("RGB")
        
        # Fit/crop/resize to exactly 1400x560
        print("Resizing and cropping to exactly 1400x560...")
        marquee_tile = ImageOps.fit(rgb_img, (1400, 560), method=Image.Resampling.LANCZOS)
        
        # Save as 24-bit PNG with no alpha
        marquee_tile.save(dest_marquee_path, "PNG")
        print(f"Saved Marquee Promo Tile to: {dest_marquee_path}")
        
    print("Marquee tile generation complete!")

if __name__ == "__main__":
    main()
