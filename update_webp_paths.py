import os
import re

files = [
    r"C:\Users\dhavi\Documents\AuraVista-Web\index.html",
    r"C:\Users\dhavi\Documents\AuraVista-Web\album-dharmawangsa.html",
    r"C:\Users\dhavi\Documents\AuraVista-Web\album-cilandak.html"
]

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("HD_06_pool.png", "HD_06_pool.webp")
    content = content.replace("HD_01_balkon.png", "HD_01_balkon.webp")
    content = content.replace("HD_03_bathroom.png", "HD_03_bathroom.webp")
    content = content.replace("HD_04_living_depan.png", "HD_04_living_depan.webp")
    content = content.replace("HD_05_living_samping.png", "HD_05_living_samping.webp")
    content = content.replace("HD_02_koridor.png", "HD_02_koridor.webp")
    content = re.sub(r'assets/porto/(porto_[0-9]+_[^"\']+)\.(jpg|png)', r'assets/porto/\1.webp', content)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated successfully:", fpath)
