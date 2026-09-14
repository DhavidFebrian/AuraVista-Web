const fs = require('fs');

let index = fs.readFileSync('C:/Users/dhavi/Documents/AuraVista-Web/index.html', 'utf8');

// Replace 2-col grid with responsive 3-col grid
index = index.replace(
  'grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10',
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-8'
);

const album3Html = `

        <!-- ALBUM 3 CARD: DHARMAWANGSA RESIDENCE -->
        <a href="album-dharmawangsa-residence.html" class="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden border border-brand-gold/20 hover:border-brand-gold transition-all">
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700"></div>

          <div>
            <!-- Cover Photo Collage / Preview -->
            <div class="aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden mb-6 relative bg-black/60 shadow-2xl">
              <img src="assets/porto/porto_41_dharmawangsa_new_2026_09_14_10_55_56_IMG_0825.jpg" alt="Dharmawangsa Cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9]" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
              
              <div class="absolute top-4 left-4">
                <span class="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] text-brand-gold uppercase tracking-widest border border-brand-gold/40 font-bold">
                  Collection Folio 03
                </span>
              </div>

              <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span class="text-xs text-white/90 font-medium tracking-wider flex items-center gap-1.5 backdrop-blur-md bg-black/50 px-3 py-1 rounded-full border border-white/10">
                  <i data-lucide="image" class="w-3.5 h-3.5 text-brand-gold"></i>
                  14 Curated Captures
                </span>
                <span class="text-xs text-brand-gold font-bold tracking-wider flex items-center gap-1">
                  View Full Album <i data-lucide="arrow-up-right" class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                </span>
              </div>
            </div>

            <!-- Album Meta & Story -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-brand-gold uppercase tracking-[0.2em] font-semibold">Luxury Residential Staging</span>
              <span class="text-xs text-slate-400">Dharmawangsa, South Jakarta</span>
            </div>

            <h3 class="font-serif text-2xl sm:text-3xl font-bold text-slate-100 group-hover:text-gold-gradient transition-colors mb-3">
              Dharmawangsa
            </h3>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-3">
              A bespoke architectural and interior showcase of Dharmawangsa residential property, highlighting open-concept living elegance, master bedroom suites, and gourmet culinary spaces.
            </p>
          </div>

          <!-- Preview Thumbnails Bar -->
          <div class="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between">
            <div class="flex items-center -space-x-2 overflow-hidden">
              <img src="assets/porto/porto_42_dharmawangsa_new_2026_09_14_10_58_11_IMG_0828.jpg" class="inline-block h-9 w-9 rounded-full ring-2 ring-brand-card object-cover" alt="Preview 1" />
              <img src="assets/porto/porto_43_dharmawangsa_new_2026_09_14_10_59_28_IMG_0831.jpg" class="inline-block h-9 w-9 rounded-full ring-2 ring-brand-card object-cover" alt="Preview 2" />
              <img src="assets/porto/porto_44_dharmawangsa_new_2026_09_14_10_59_53_IMG_0833.jpg" class="inline-block h-9 w-9 rounded-full ring-2 ring-brand-card object-cover" alt="Preview 3" />
              <img src="assets/porto/porto_45_dharmawangsa_new_2026_09_14_11_17_48_IMG_0868.jpg" class="inline-block h-9 w-9 rounded-full ring-2 ring-brand-card object-cover" alt="Preview 4" />
              <span class="inline-flex items-center justify-center h-9 w-9 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-bold ring-2 ring-brand-card">+10</span>
            </div>
            <span class="text-xs font-semibold text-slate-300 group-hover:text-brand-gold transition-colors flex items-center gap-1">
              Explore Gallery <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </span>
          </div>
        </a>`;

const album2Marker = '<!-- ALBUM 2 CARD: CILANDAK SOUTH JAKARTA -->';
const album2Pos = index.indexOf(album2Marker);
const album2End = index.indexOf('</a>', album2Pos) + 4;

index = index.substring(0, album2End) + album3Html + index.substring(album2End);
fs.writeFileSync('C:/Users/dhavi/Documents/AuraVista-Web/index.html', index, 'utf8');
console.log('Successfully updated index.html with 3 distinct albums!');
