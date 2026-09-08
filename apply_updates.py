import json
import re
import os

html_file = r'C:\Users\dhavi\Documents\AuraVista-Web\index.html'

with open(html_file, 'r', encoding='utf-8') as f:
    html = f.read()

titles = [
    ('Modern Villa Panoramic Facade', 'facade', 'Exterior', 'Geometric framing with balanced natural daylight and horizon lines.'),
    ('Contemporary Residence Twilight Entry', 'facade', 'Exterior', 'Architectural lighting design emphasizing linear structural symmetry.'),
    ('Grand Living Pavilion & Glass Atrium', 'interior', 'Interior', 'Spacious open-concept living area with seamless outdoor integration.'),
    ('Sculptural Dining Lounge & Ambient Chandelier', 'interior', 'Interior', 'Warm evening ambiance highlighting bespoke textures and curated finishes.'),
    ('Minimalist Gourmet Kitchen & Island', 'interior', 'Interior', 'Clean marble countertops framed by warm recessed architectural lighting.'),
    ('Master Retreat & Private Courtyard View', 'interior', 'Interior', 'Relaxing master bedroom staging with floor-to-ceiling glass paneling.'),
    ('Executive Study & Library Gallery', 'interior', 'Interior', 'Refined timber wall paneling with soft focused task illumination.'),
    ('Spa Sanctuary & Freestanding Marble Bath', 'interior', 'Interior', 'Natural stone textures and subtle water reflections in master bath.'),
    ('Upper Terrace & Geometric Pergola', 'facade', 'Exterior', 'Linear shade structure overlooking lush landscape vistas.'),
    ('Courtyard Reflection Pool & Sunken Deck', 'facade', 'Exterior', 'Water feature integration complementing modern structural lines.'),
    ('Palatial Estate Grand Portico', 'facade', 'Exterior', 'Monumental classical pillars with balanced landscape symmetry.'),
    ('Regal Residence Main Driveway Framing', 'facade', 'Exterior', 'Sweeping entrance perspective showcasing manicured gardens.'),
    ('Classical Terrace & Balustrade Overview', 'facade', 'Exterior', 'Elevated architectural view highlighting timeless craftsmanship.'),
    ('Veranda Lounge & Tropical Garden Framing', 'facade', 'Exterior', 'Shaded outdoor corridor transitioning between interior and garden.'),
    ('Grand Foyer & Double-Height Ceiling', 'interior', 'Interior', 'Soaring classical entrance with ornate crown moldings and polished marble.'),
    ('Formal Reception Salon & Chandelier', 'interior', 'Interior', 'Symmetrical seating arrangement in expansive formal entertainment hall.'),
    ('Private Conservatory & Sunroom', 'interior', 'Interior', 'Glass-enclosed atrium filled with diffused tropical morning sunlight.'),
    ('Bespoke Wine Cellar & Tasting Room', 'interior', 'Interior', 'Curated timber joinery and atmospheric temperature-controlled vault.'),
    ('Formal Dining Room with Coffered Ceiling', 'interior', 'Interior', 'Regal banquet setting with ambient warm perimeter illumination.'),
    ('Master Suite Lounge & Fireplace Hearth', 'interior', 'Interior', 'Opulent private lounge framed with plush fabrics and wood details.'),
    ('En-Suite Marble Vanity & Dressing Suite', 'interior', 'Interior', 'Illuminated mirror staging with book-matched Italian marble slabs.'),
    ('Lakeside Pavilion & Private Pier', 'facade', 'Exterior', 'Waterside recreation structure harmonizing with natural surroundings.'),
    ('Manicured Courtyard Fountain & Parterre', 'facade', 'Exterior', 'Classical European garden geometry framing the residence facade.'),
    ('Nightfall Facade & Landscape Illumination', 'facade', 'Exterior', 'Sophisticated exterior accent lighting highlighting facade depth.'),
    ('Atmospheric Golden Hour Retouching', 'enhancement', 'Enhancement', 'Warm golden horizon gradient and naturalized sunlight cast.'),
    ('Cinematic Twilight Sky Replacement', 'enhancement', 'Enhancement', 'Seamless dramatic twilight backdrop matching architectural lighting.'),
    ('Architectural Relighting & Tone Balance', 'enhancement', 'Enhancement', 'Dynamic range balancing to reveal subtle shadow details.'),
    ('Perspective & Vertical Alignment Grade', 'enhancement', 'Enhancement', 'Zero-distortion optical correction for true structural geometry.'),
    ('Reflective Glazing & Pool Surface Tuning', 'enhancement', 'Enhancement', 'Clear liquid reflections and balanced interior-to-exterior exposure.'),
    ('Crisp Horizon & Cloud Dynamic Range', 'enhancement', 'Enhancement', 'High-fidelity cloud texture recovery without artificial artifacts.'),
    ('Sunset Over Infinity Pool & Horizon', 'enhancement', 'Enhancement', 'Cinematic sunset grade harmonized with ambient landscape lights.'),
    ('Dusk Residence & Atmospheric Color Harmony', 'enhancement', 'Enhancement', 'Cool ambient dusk tones contrasted with warm interior illumination.'),
    ('Fine Wood & Stone Texture Enhancement', 'enhancement', 'Enhancement', 'Micro-contrast sharpening on natural architectural materials.'),
    ('Lush Landscape Chromatic Grading', 'enhancement', 'Enhancement', 'Naturalized foliage greens and rich organic earth tones.'),
    ('Glass Reflection & Glare Suppression', 'enhancement', 'Enhancement', 'Polarized reflection removal revealing interior depth through windows.'),
    ('Clean Monochromatic Shadow Staging', 'enhancement', 'Enhancement', 'Soft gradient transitions preserving natural architectural volume.'),
    ('Warm Ambient Interior Exposure Blend', 'enhancement', 'Enhancement', 'Multi-bracket HDR synthesis for balanced window and interior light.'),
    ('Editorial Color Precision & Hue Tuning', 'enhancement', 'Enhancement', 'Signature luxury grade with muted undertones and radiant highlights.'),
    ('Structural Geometry & Keystone Calibration', 'enhancement', 'Enhancement', 'Precision alignment of vertical architectural lines and facades.'),
    ('Aura Vista Signature Masterwork Production', 'facade', 'Exterior', 'Flagship architectural media production for ultra-prime property.')
]

porto_dir = r'C:\Users\dhavi\Documents\AuraVista-Web\assets\porto'
porto_files = sorted([f for f in os.listdir(porto_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

portfolio_entries = []
for i, f in enumerate(porto_files):
    title, cat, badge, desc = titles[i % len(titles)]
    portfolio_entries.append({
        'id': f'porto-{i+1:02d}',
        'title': title,
        'category': cat,
        'badge': badge,
        'desc': desc,
        'img': f'assets/porto/{f}'
    })

# Replace DEFAULT_PORTFOLIO in html
portfolio_json = json.dumps(portfolio_entries, indent=6)
html = re.sub(r'const DEFAULT_PORTFOLIO = \[[\s\S]*?\];', f'const DEFAULT_PORTFOLIO = {portfolio_json};', html)

# Bust cache
html = html.replace("const STORAGE_KEY = 'auravista_portfolio_data';", "const STORAGE_KEY = 'auravista_portfolio_v3';")
html = html.replace("const STORAGE_KEY = 'auravista_portfolio_v2';", "const STORAGE_KEY = 'auravista_portfolio_v3';")

# Refine Card UI in script to look hyper-luxe editorial (magazine look, no template feel)
old_card_code = """        div.innerHTML = `
          <div class="aspect-[4/3] overflow-hidden relative">
            <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-brand-darker/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
              <span class="inline-flex items-center gap-2 text-xs font-bold text-brand-gold uppercase tracking-wider">
                <i data-lucide="maximize-2" class="w-4 h-4"></i> View Full Resolution
              </span>
            </div>
            <span class="absolute top-3 right-3 px-3 py-1 bg-black/80 backdrop-blur-md text-[10px] text-brand-gold uppercase tracking-wider rounded-full border border-brand-gold/30">${item.badge || item.category}</span>
          </div>
          <div class="p-5">
            <h4 class="font-serif font-bold text-slate-100 text-base">${item.title}</h4>
            <p class="text-xs text-slate-400 mt-1">${item.desc}</p>
          </div>
        `;"""

new_card_code = """        div.innerHTML = `
          <div class="aspect-[16/11] overflow-hidden relative bg-black/40">
            <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-brand-darker/95 via-brand-darker/25 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
              <span class="inline-flex items-center gap-2 text-[11px] font-semibold text-brand-goldLight tracking-[0.2em] uppercase mb-1">
                <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 text-brand-gold"></i> Inspect Master Artwork
              </span>
            </div>
            <div class="absolute top-4 left-4">
              <span class="px-3.5 py-1 bg-black/75 backdrop-blur-md text-[9px] uppercase tracking-[0.25em] text-brand-goldLight font-medium rounded-full border border-brand-gold/20 shadow-lg">${item.badge || item.category}</span>
            </div>
          </div>
          <div class="p-6 flex flex-col justify-between">
            <div>
              <h4 class="font-serif text-lg font-bold text-slate-100 group-hover:text-brand-goldLight transition-colors tracking-wide leading-snug">${item.title}</h4>
              <p class="text-xs text-slate-400/90 font-light mt-2 leading-relaxed line-clamp-2">${item.desc}</p>
            </div>
            <div class="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <span class="font-serif italic capitalize text-slate-400 text-xs">Architectural Masterwork</span>
              <span class="text-brand-gold/80 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium">Explore <i data-lucide="chevron-right" class="w-3 h-3"></i></span>
            </div>
          </div>
        `;"""

if old_card_code in html:
    html = html.replace(old_card_code, new_card_code)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Updated {html_file} cleanly.")
