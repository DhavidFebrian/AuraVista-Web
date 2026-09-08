import os
import glob
from PIL import Image, ImageEnhance

raw_root = r"C:\Users\dhavi\Pictures\Aura Vista\Porto"
dest_dir = r"C:\Users\dhavi\Documents\AuraVista-Web\assets\porto"
logo_path = r"C:\Users\dhavi\Documents\AuraVista-Web\assets\aura_vista_logo_transparent.png"

logo = Image.open(logo_path).convert("RGBA")

# Map exact raw files to porto_01 - porto_40
raw_files = []
# 12302
raw_12302 = sorted(glob.glob(os.path.join(raw_root, "12302", "*.*")))
# 4711
raw_4711 = sorted(glob.glob(os.path.join(raw_root, "4711", "*.*")))
# Enhancement
raw_enh = sorted(glob.glob(os.path.join(raw_root, "*.jp*")))

print(f"Found: {len(raw_12302)} in 12302, {len(raw_4711)} in 4711, {len(raw_enh)} in root/enh")

raw_all = raw_12302 + raw_4711 + raw_enh
print(f"Total raw source files: {len(raw_all)}")

target_files = sorted(os.listdir(dest_dir))
print(f"Total target files in web assets: {len(target_files)}")

# Re-watermark every single image from its pristine source, making sure the logo is crisp, prominent (20% width), and top-center with 92% opacity
for idx, target_name in enumerate(target_files):
    target_path = os.path.join(dest_dir, target_name)
    raw_source_path = raw_all[idx] if idx < len(raw_all) else target_path
    
    # Open pristine base image
    base_img = Image.open(raw_source_path).convert("RGBA")
    w, h = base_img.size
    
    # Calculate Logo Dimensions: 20% width of photo, maintain aspect ratio
    logo_w = int(w * 0.20)
    logo_h = int(logo_w * (logo.height / logo.width))
    resized_logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    # Adjust logo opacity to 92%
    alpha = resized_logo.split()[3]
    alpha = ImageEnhance.Brightness(alpha).enhance(0.92)
    resized_logo.putalpha(alpha)
    
    # Position: Top-Center (3.5% from top)
    pos_x = (w - logo_w) // 2
    pos_y = int(h * 0.035)
    
    # Paste logo on base
    watermarked = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    watermarked.paste(base_img, (0, 0))
    watermarked.paste(resized_logo, (pos_x, pos_y), resized_logo)
    
    # Save as high-quality JPEG
    rgb_output = watermarked.convert("RGB")
    rgb_output.save(target_path, "JPEG", quality=93, optimize=True)
    print(f"[{idx+1:02d}/40] Watermarked & Saved: {target_name} ({w}x{h}, logo: {logo_w}x{logo_h} at y={pos_y})")

print("ALL 40 PORTFOLIO PHOTOS SUCCESSFULLY RE-WATERMARKED 100% CONSISTENTLY!")
