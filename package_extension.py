import os
import zipfile
import shutil
import tempfile
import subprocess

# Paths
extension_dir = r"C:\Users\Kapil\.gemini\antigravity\scratch\youtube-volume-bar-extension"
parent_dir = r"C:\Users\Kapil\.gemini\antigravity\scratch"
zip_path = os.path.join(parent_dir, "youtube-volume-bar-extension.zip")
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pem_path = os.path.join(parent_dir, "youtube-volume-bar-extension.pem")
crx_dest_path = os.path.join(parent_dir, "youtube-volume-bar-extension.crx")

# Files to include in the extension distribution (relative to extension_dir)
files_to_include = [
    "manifest.json",
    "content.js",
    "popup.html",
    "popup.css",
    "popup.js",
    os.path.join("icons", "icon16.png"),
    os.path.join("icons", "icon48.png"),
    os.path.join("icons", "icon128.png"),
]

def create_zip():
    print(f"Creating ZIP package for Chrome Web Store at: {zip_path}...")
    try:
        # Delete old zip if exists
        if os.path.exists(zip_path):
            os.remove(zip_path)
            
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for rel_path in files_to_include:
                full_path = os.path.join(extension_dir, rel_path)
                if os.path.exists(full_path):
                    # Ensure path separators are forward slashes in ZIP
                    zip_path_name = rel_path.replace(os.sep, '/')
                    zip_file.write(full_path, zip_path_name)
                    print(f"  Added: {zip_path_name}")
                else:
                    print(f"  Warning: File not found {full_path}")
        print("ZIP package created successfully!")
        return True
    except Exception as e:
        print(f"Error creating ZIP package: {e}")
        return False

def pack_crx():
    print("Checking for Chrome executable...")
    if not os.path.exists(chrome_path):
        print(f"Warning: chrome.exe not found at default path '{chrome_path}'")
        print("Cannot pack .crx automatically. Please use Chrome developer mode to pack it.")
        return False
        
    print(f"Packing extension to .crx using Chrome CLI with a clean temp directory...")
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix="yt_vol_ext_")
    try:
        # Copy only distribution files to temp_dir
        for rel_path in files_to_include:
            src_path = os.path.join(extension_dir, rel_path)
            if os.path.exists(src_path):
                dest_path = os.path.join(temp_dir, rel_path)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                shutil.copy(src_path, dest_path)
                
        # Pack the temp_dir extension
        cmd = [chrome_path, f"--pack-extension={temp_dir}"]
        if os.path.exists(pem_path):
            cmd.append(f"--pack-extension-key={pem_path}")
            print(f"  Using existing private key: {pem_path}")
        else:
            print("  No existing private key found. Chrome will generate a new one.")
            
        subprocess.run(cmd, check=True)
        print("Chrome pack command finished!")
        
        # Chrome generates .crx and .pem in the parent of the packed folder
        # So it will generate:
        # - temp_dir.crx (in the temp folder)
        # - temp_dir.pem (in the temp folder, if key wasn't provided)
        temp_parent = os.path.dirname(temp_dir)
        generated_crx = temp_dir + ".crx"
        generated_pem = temp_dir + ".pem"
        
        # Move generated CRX to parent_dir as youtube-volume-bar-extension.crx
        if os.path.exists(generated_crx):
            if os.path.exists(crx_dest_path):
                os.remove(crx_dest_path)
            shutil.move(generated_crx, crx_dest_path)
            print(f"  Moved CRX to: {crx_dest_path}")
            
        # Move generated PEM to parent_dir if it was newly created
        if os.path.exists(generated_pem) and not os.path.exists(pem_path):
            shutil.move(generated_pem, pem_path)
            print(f"  Moved newly generated private key to: {pem_path}")
            
        return True
    except Exception as e:
        print(f"Error packing CRX: {e}")
        return False
    finally:
        # Clean up temp directory
        print("Cleaning up temp files...")
        shutil.rmtree(temp_dir, ignore_errors=True)
        # Clean up temp crx/pem if any remained
        temp_crx = temp_dir + ".crx"
        temp_pem = temp_dir + ".pem"
        if os.path.exists(temp_crx):
            os.remove(temp_crx)
        if os.path.exists(temp_pem):
            os.remove(temp_pem)

def main():
    zip_success = create_zip()
    crx_success = pack_crx()
    
    if zip_success and crx_success:
        print("\nAll packaging steps completed successfully!")
    else:
        print("\nPackaging completed with warnings/errors.")

if __name__ == "__main__":
    main()
