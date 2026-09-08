import json
import re

html_path = r'C:\Users\dhavi\Documents\AuraVista-Web\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the Admin Modal with an Ultra-Complete Studio Control Center:
# Tabs:
# 1. [Overview & Stats] Total photos, categories breakdown, storage usage
# 2. [All Portfolio Items (40+)] Search, filter, inline edit title/desc/category, reorder up/down, toggle hidden/visible, delete any item
# 3. [Upload & Auto-Watermark] Select image, instant top-center watermark preview, publish to live
# 4. [Site Settings & Backup] Export JSON, Import JSON, Reset to Default, Change Site Title / Contact info

old_admin_modal_start = '<!-- ADMIN STUDIO MODAL -->'
old_admin_modal_end = '<!-- HIDDEN ASSET FOR CANVAS WATERMARKING -->'

admin_modal_idx = html.find(old_admin_modal_start)
hidden_asset_idx = html.find(old_admin_modal_end)

if admin_modal_idx != -1 and hidden_asset_idx != -1:
    new_admin_modal = '''<!-- ADMIN STUDIO MODAL -->
  <div id="admin-modal" class="modal-backdrop fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6" onclick="closeAdminModal(event)">
    <div class="max-w-5xl w-full glass-card rounded-3xl p-5 sm:p-8 border border-brand-gold/40 shadow-2xl relative max-h-[92vh] flex flex-col" onclick="event.stopPropagation()">
      
      <!-- Close Modal -->
      <button onclick="closeAdminModal()" class="absolute top-5 right-5 w-9 h-9 rounded-full glass-panel text-slate-400 hover:text-white flex items-center justify-center text-sm border border-slate-700 hover:border-brand-gold transition-colors z-20">
        ✕
      </button>

      <!-- VIEW 1: LOGIN FORM -->
      <div id="admin-login-view" class="text-center py-10 my-auto">
        <div class="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold mx-auto mb-4">
          <i data-lucide="lock" class="w-8 h-8"></i>
        </div>
        <h3 class="font-serif text-2xl sm:text-3xl font-bold text-gold-gradient mb-2">Aura Vista Admin Login</h3>
        <p class="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-8">Masukkan kredensial administrator untuk mengakses pusat kendali portofolio dan pengaturan sistem.</p>
        
        <form onsubmit="handleAdminLogin(event)" class="max-w-sm mx-auto space-y-4 text-left">
          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">Username</label>
            <input type="text" id="admin-username" placeholder="Masukkan Username" class="w-full px-4 py-3 rounded-xl bg-brand-card border border-brand-gold/30 text-slate-100 text-sm focus:border-brand-gold focus:outline-none" required />
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">Password</label>
            <input type="password" id="admin-password" placeholder="Masukkan Password" class="w-full px-4 py-3 rounded-xl bg-brand-card border border-brand-gold/30 text-slate-100 text-sm focus:border-brand-gold focus:outline-none" required />
          </div>
          <button type="submit" class="w-full py-3.5 rounded-xl btn-gold text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-2">
            <i data-lucide="key" class="w-4 h-4"></i>
            <span>Login to Dashboard</span>
          </button>
          <p id="login-error" class="text-xs text-red-400 text-center hidden">Username atau Password salah. Silakan coba lagi.</p>
        </form>
      </div>

      <!-- VIEW 2: FULL ADMIN CONTROL CENTER -->
      <div id="admin-dashboard-view" class="hidden flex-1 flex flex-col overflow-hidden">
        
        <!-- Admin Header -->
        <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-serif text-xl sm:text-2xl font-bold text-slate-100">Studio Management Center</h3>
              <p class="text-[11px] text-slate-400">Kelola seluruh foto portofolio, upload watermark, dan konfigurasi live.</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Admin: David
            </span>
            <button onclick="handleAdminLogout()" class="px-3 py-1.5 rounded-lg glass-panel text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-colors">
              Logout
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 py-3 border-b border-slate-800/80 overflow-x-auto shrink-0 text-xs font-semibold">
          <button onclick="switchAdminTab('portfolio')" id="tab-btn-portfolio" class="admin-tab-btn active px-4 py-2 rounded-xl bg-brand-gold text-black flex items-center gap-2">
            <i data-lucide="image" class="w-4 h-4"></i>
            <span>Kelola Portofolio (<span id="admin-total-badge">40</span>)</span>
          </button>
          <button onclick="switchAdminTab('upload')" id="tab-btn-upload" class="admin-tab-btn px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-brand-gold flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Upload & Auto-Watermark</span>
          </button>
          <button onclick="switchAdminTab('settings')" id="tab-btn-settings" class="admin-tab-btn px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-brand-gold flex items-center gap-2">
            <i data-lucide="settings" class="w-4 h-4"></i>
            <span>Data & Pengaturan</span>
          </button>
        </div>

        <!-- TAB CONTENT CONTAINER (Scrollable) -->
        <div class="flex-1 overflow-y-auto py-4 pr-1 space-y-6">

          <!-- TAB 1: KELOLA SEMUA PORTOFOLIO -->
          <div id="admin-tab-portfolio" class="space-y-4">
            <!-- Search & Filters Toolbar -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div class="relative flex-1">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                <input type="text" id="admin-search-input" oninput="renderAdminPortfolioTable()" placeholder="Cari judul portofolio atau deskripsi..." class="w-full pl-10 pr-4 py-2 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none" />
              </div>
              <div class="flex items-center gap-2">
                <select id="admin-filter-category" onchange="renderAdminPortfolioTable()" class="px-3 py-2 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-200 focus:border-brand-gold focus:outline-none">
                  <option value="all">Semua Kategori</option>
                  <option value="enhancement">Enhancement</option>
                  <option value="facade">Exterior</option>
                  <option value="interior">Interior</option>
                </select>
                <button onclick="openAddNewModal()" class="px-4 py-2 rounded-xl btn-gold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <i data-lucide="plus" class="w-4 h-4"></i>
                  <span>Tambah Foto</span>
                </button>
              </div>
            </div>

            <!-- Portfolio Items Grid / Table -->
            <div id="admin-portfolio-list" class="space-y-2.5">
              <!-- Rendered Dynamically via JS -->
            </div>
          </div>

          <!-- TAB 2: UPLOAD & AUTO-WATERMARK -->
          <div id="admin-tab-upload" class="hidden space-y-6 max-w-2xl mx-auto">
            <div class="bg-slate-900/60 p-6 rounded-2xl border border-brand-gold/20">
              <h4 class="font-serif text-lg font-bold text-slate-100 mb-1">Upload Karya Baru dengan Auto-Watermark</h4>
              <p class="text-xs text-slate-400 mb-6">Logo resmi Aura Vista akan langsung ditempelkan otomatis secara presisi di posisi Top-Center (90% Opacity) sebelum disimpan.</p>
              
              <form onsubmit="handleUploadPorto(event)" class="space-y-5">
                <div>
                  <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">Pilih Foto Arsitektur (High-Res)</label>
                  <input type="file" id="porto-file" accept="image/*" onchange="previewAndWatermark(event)" class="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-gold file:text-black hover:file:brightness-110 cursor-pointer glass-panel p-2 rounded-xl border border-brand-gold/20" required />
                </div>

                <!-- Realtime Watermark Preview Canvas -->
                <div id="preview-wrapper" class="hidden rounded-2xl overflow-hidden border border-brand-gold/30 bg-black/80 p-4 text-center">
                  <p class="text-[11px] text-brand-gold font-semibold uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                    <span>Live Watermark Applied (Top-Center 90% Opacity)</span>
                  </p>
                  <canvas id="watermark-canvas" class="max-h-[320px] w-auto max-w-full mx-auto rounded-xl shadow-lg border border-slate-800"></canvas>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">Judul Portofolio</label>
                    <input type="text" id="porto-title" placeholder="Contoh: Modern Pavilion Garden" class="w-full px-3.5 py-2.5 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none" required />
                  </div>
                  <div>
                    <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">Kategori</label>
                    <select id="porto-category" class="w-full px-3.5 py-2.5 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none">
                      <option value="enhancement">Enhancement (Sky & Retouching)</option>
                      <option value="facade">Exterior (Facade & Grounds)</option>
                      <option value="interior">Interior (Living & Sanctuary)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">Deskripsi Singkat Karya</label>
                  <textarea id="porto-desc" rows="2" placeholder="Jelaskan teknik pencahayaan, perspektif arsitektur, atau tone warna..." class="w-full px-3.5 py-2.5 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none" required></textarea>
                </div>

                <button type="submit" id="btn-save-porto" class="w-full py-3.5 rounded-xl btn-gold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  <span>Terbitkan Foto ke Website</span>
                </button>
              </form>
            </div>
          </div>

          <!-- TAB 3: DATA & PENGATURAN -->
          <div id="admin-tab-settings" class="hidden space-y-6 max-w-2xl mx-auto">
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-3 gap-3">
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p class="text-[10px] uppercase text-slate-400 tracking-wider">Total Portofolio</p>
                <p id="stats-total" class="font-serif text-2xl font-bold text-brand-gold mt-1">40</p>
              </div>
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p class="text-[10px] uppercase text-slate-400 tracking-wider">Aktif Tayang</p>
                <p id="stats-active" class="font-serif text-2xl font-bold text-emerald-400 mt-1">40</p>
              </div>
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p class="text-[10px] uppercase text-slate-400 tracking-wider">Kustom Tambahan</p>
                <p id="stats-custom" class="font-serif text-2xl font-bold text-blue-400 mt-1">0</p>
              </div>
            </div>

            <!-- Backup & Restore -->
            <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h4 class="font-serif text-base font-bold text-slate-100">Backup & Restore Portofolio</h4>
              <p class="text-xs text-slate-400">Ekspor seluruh database portofolio ke file JSON untuk cadangan, atau impor database baru secara instan.</p>
              
              <div class="flex flex-wrap gap-3">
                <button onclick="exportPortfolioJSON()" class="px-4 py-2.5 rounded-xl glass-panel text-xs text-brand-gold hover:text-white border border-brand-gold/30 flex items-center gap-2">
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>Download Backup JSON</span>
                </button>
                <label class="px-4 py-2.5 rounded-xl glass-panel text-xs text-slate-200 hover:text-white border border-slate-700 cursor-pointer flex items-center gap-2">
                  <i data-lucide="upload" class="w-4 h-4"></i>
                  <span>Import Database JSON</span>
                  <input type="file" accept=".json" onchange="importPortfolioJSON(event)" class="hidden" />
                </label>
              </div>
            </div>

            <!-- Danger Zone / Reset -->
            <div class="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-3">
              <h4 class="font-serif text-base font-bold text-red-300">Zona Reset Database</h4>
              <p class="text-xs text-slate-400">Kembalikan seluruh 40 judul, kategori, dan foto portofolio ke konfigurasi standar pabrik (default master).</p>
              <button onclick="resetToDefaultPorto()" class="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-red-500/30">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                <span>Reset Semua ke Default (40 Foto)</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  </div>

  <!-- EDIT PORTOFOLIO MODAL -->
  <div id="edit-porto-modal" class="modal-backdrop fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onclick="closeEditModal(event)">
    <div class="max-w-lg w-full glass-card rounded-2xl p-6 border border-brand-gold/40 shadow-2xl relative" onclick="event.stopPropagation()">
      <button onclick="closeEditModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-sm">✕</button>
      <h3 class="font-serif text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <i data-lucide="edit-3" class="w-4 h-4 text-brand-gold"></i>
        <span>Edit Detail Portofolio</span>
      </h3>
      <form onsubmit="handleSaveEditPorto(event)" class="space-y-4">
        <input type="hidden" id="edit-porto-id" />
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">Judul Portofolio</label>
          <input type="text" id="edit-porto-title" class="w-full px-3.5 py-2.5 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none" required />
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">Kategori</label>
          <select id="edit-porto-category" class="w-full px-3.5 py-2.5 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none">
            <option value="enhancement">Enhancement (Sky & Retouching)</option>
            <option value="facade">Exterior (Facade & Grounds)</option>
            <option value="interior">Interior (Living & Sanctuary)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">Deskripsi Karya</label>
          <textarea id="edit-porto-desc" rows="3" class="w-full px-3.5 py-2.5 rounded-xl bg-brand-card border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none" required></textarea>
        </div>
        <div class="flex items-center justify-end gap-3 pt-2">
          <button type="button" onclick="closeEditModal()" class="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300">Batal</button>
          <button type="submit" class="px-5 py-2 rounded-xl btn-gold text-xs uppercase tracking-wider font-bold">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  </div>\n\n  '''
    html = html[:admin_modal_idx] + new_admin_modal + html[hidden_asset_idx:]

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Replaced Admin Modal markup with Full Studio Management Dashboard.")
