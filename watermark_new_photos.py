import os
import glob
from PIL import Image, ImageEnhance

dest_dir = r"C:\Users\dhavi\Documents\AuraVista-Web\assets\porto"
logo_path = r"C:\Users\dhavi\Documents\AuraVista-Web\assets\aura_vista_logo_transparent.png"

if not os.path.exists(logo_path):
    print("Logo not found at:", logo_path)
    exit(1)

logo = Image.open(logo_path).convert("RGBA")

# Look specifically for the 14 new dharmawangsa photos (porto_41 to porto_54)
new_files = [f for f in os.listdir(dest_dir) if any(f.startswith(f"porto_{i:02d}") for i in range(41, 55))]
print(f"Found {len(new_files)} new photos to watermark:")

for f in sorted(new_files):
    img_path = os.path.join(dest_dir, f)
    base_img = Image.open(img_path).convert("RGBA")
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
    
    # Save back
    rgb_output = watermarked.convert("RGB")
    rgb_output.save(img_path, "JPEG", quality=93, optimize=True)
    print(f"Watermarked: {f} ({w}x{h}, logo {logo_w}x{logo_h})")

print("Finished watermarking all 14 new Dharmawangsa photos!")
