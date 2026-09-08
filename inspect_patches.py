import os
from PIL import Image

porto_dir = r"C:\Users\dhavi\Documents\AuraVista-Web\assets\porto"
raw_porto_dir = r"C:\Users\dhavi\Pictures\Aura Vista\Porto"

# Let's inspect raw sources vs current assets/porto files
# We will check if any of porto_01 to porto_40 missed the watermark
for idx in range(1, 41):
    f = [x for x in os.listdir(porto_dir) if x.startswith(f"porto_{idx:02d}")][0]
    p = os.path.join(porto_dir, f)
    img = Image.open(p)
    # Check the top-center patch (where watermark is supposed to be)
    w, h = img.size
    top_center_patch = img.crop((int(w * 0.4), int(h * 0.03), int(w * 0.6), int(h * 0.15)))
    # calculate brightness/variance to verify presence
    colors = top_center_patch.getcolors(maxcolors=100000)
    print(f"[{idx:02d}] {f} -> Size: {w}x{h}, Top patch unique colors: {len(colors) if colors else 'many'}")
