import os
from PIL import Image, ImageOps

# Source banner path
source_banner_path = r"C:\Users\Kapil\.gemini\antigravity\brain\3da15ee2-2336-4d88-b7df-fbd6e6026647\promo_banner_raw_1781353987445.png"

# Destination paths
extension_dir = r"C:\Users\Kapil\.gemini\antigravity\scratch\youtube-volume-bar-extension"
promo_dir = os.path.join(extension_dir, "promo")

def main():
    os.makedirs(promo_dir, exist_ok=True)
    
    if not os.path.exists(source_banner_path):
        print(f"Error: Source banner not found at {source_banner_path}")
        return
        
    print(f"Opening source banner: {source_banner_path}...")
    with Image.open(source_banner_path) as img:
        # Convert to RGB (strips any alpha channel)
        rgb_img = img.convert("RGB")
        
        # 1. Generate Small Promo Tile (440x280)
        print("Generating Small Promo Tile (440x280)...")
        small_tile = ImageOps.fit(rgb_img, (440, 280), method=Image.Resampling.LANCZOS)
        small_dest_path = os.path.join(promo_dir, "small_promo.png")
        small_tile.save(small_dest_path, "PNG")
        print(f"  Saved to: {small_dest_path}")
        
        # 2. Generate Marquee Promo Tile (1400x560)
        print("Generating Marquee Promo Tile (1400x560)...")
        marquee_tile = ImageOps.fit(rgb_img, (1400, 560), method=Image.Resampling.LANCZOS)
        marquee_dest_path = os.path.join(promo_dir, "marquee_promo.png")
        marquee_tile.save(marquee_dest_path, "PNG")
        print(f"  Saved to: {marquee_dest_path}")
        
    print("Promotional tiles generation complete successfully!")

if __name__ == "__main__":
    main()
