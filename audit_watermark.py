import os
import glob
from PIL import Image

porto_dir = r"C:\Users\dhavi\Documents\AuraVista-Web\assets\porto"
raw_porto_dir = r"C:\Users\dhavi\Pictures\Aura Vista\Porto"
logo_path = r"C:\Users\dhavi\Documents\AuraVista-Web\assets\aura_vista_logo_transparent.png"

print("Checking logo exists:", os.path.exists(logo_path))
logo = Image.open(logo_path).convert("RGBA")
print("Logo size:", logo.size)

files = sorted(os.listdir(porto_dir))
print(f"Total files in {porto_dir}: {len(files)}")
for f in files:
    full_p = os.path.join(porto_dir, f)
    img = Image.open(full_p)
    print(f"{f} -> size: {img.size}, mode: {img.mode}")
