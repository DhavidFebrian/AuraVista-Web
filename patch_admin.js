const fs = require('fs');

const adminPath = 'C:/Users/dhavi/Documents/AuraVista-Web/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Update Category Select Options in Upload and Edit Modal to support all 4 categories
content = content.replace(
  `<select id="upload-category" class="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none">
                    <option value="dharmawangsa">Dharmawangsa Apartment</option>
                    <option value="cilandak">Cilandak South Jakarta</option>
                    <option value="enhancement">Visual Enhancement & Grade</option>
                  </select>`,
  `<select id="upload-category" class="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none">
                    <option value="dharmawangsa_residence">Dharmawangsa (Residential)</option>
                    <option value="dharmawangsa">Dharmawangsa Apartment (4711)</option>
                    <option value="cilandak">Cilandak South Jakarta</option>
                    <option value="enhancement">Visual Enhancement & Grade</option>
                  </select>`
);

content = content.replace(
  `<select id="filter-cat" onchange="renderPortfolioList()" class="px-4 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 text-xs text-slate-200 focus:border-brand-gold focus:outline-none">
                  <option value="all">Semua Kategori (40)</option>
                  <option value="dharmawangsa">Dharmawangsa Apartment (18)</option>
                  <option value="cilandak">Cilandak South Jakarta (10)</option>
                  <option value="enhancement">Visual Enhancement (12)</option>
                </select>`,
  `<select id="filter-cat" onchange="renderPortfolioList()" class="px-4 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 text-xs text-slate-200 focus:border-brand-gold focus:outline-none">
                  <option value="all">Semua Kategori</option>
                  <option value="dharmawangsa_residence">Dharmawangsa</option>
                  <option value="dharmawangsa">Dharmawangsa Apartment</option>
                  <option value="cilandak">Cilandak South Jakarta</option>
                  <option value="enhancement">Visual Enhancement</option>
                </select>`
);

content = content.replace(
  `<select id="edit-category" class="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none">
            <option value="dharmawangsa">Dharmawangsa Apartment</option>
            <option value="cilandak">Cilandak South Jakarta</option>
            <option value="enhancement">Visual Enhancement</option>
          </select>`,
  `<select id="edit-category" class="w-full px-4 py-2.5 rounded-xl bg-[#080C14] border border-slate-700 text-xs text-slate-100 focus:border-brand-gold focus:outline-none">
            <option value="dharmawangsa_residence">Dharmawangsa</option>
            <option value="dharmawangsa">Dharmawangsa Apartment</option>
            <option value="cilandak">Cilandak South Jakarta</option>
            <option value="enhancement">Visual Enhancement</option>
          </select>`
);

// 2. Replace handleUploadSubmit, handleSaveEdit, deleteItem, and loadDashboardData with Cloud Sync API
const newScriptLogic = `
    const STORAGE_KEY = 'auravista_portfolio_v9';
    const AUTH_KEY = 'auravista_admin_auth';
    const ADMIN_USER = 'david';
    const ADMIN_PASS = 'Cakrawala23';

    let watermarkedDataUrl = '';
    let selectedItemIds = new Set();
    let currentPortfolioList = [];

    // Init Authentication
    function initAuth() {
      const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true';
      if (isAuth) {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('app-view').classList.remove('hidden');
        loadDashboardData();
      } else {
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('app-view').classList.add('hidden');
      }
      lucide.createIcons();
    }

    function handleLogin(e) {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;

      if (u === ADMIN_USER && p === ADMIN_PASS) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        document.getElementById('login-error').classList.add('hidden');
        initAuth();
      } else {
        document.getElementById('login-error').classList.remove('hidden');
      }
    }

    function handleLogout() {
      sessionStorage.removeItem(AUTH_KEY);
      location.reload();
    }

    function getPortfolioData() {
      return currentPortfolioList.length > 0 ? currentPortfolioList : [];
    }

    function switchView(viewName) {
      document.querySelectorAll('.view-panel').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active', 'bg-slate-900/60', 'text-brand-gold'));

      const activeView = document.getElementById(\`view-\${viewName}\`);
      const activeNav = document.getElementById(\`nav-\${viewName}\`);
      if (activeView) activeView.classList.remove('hidden');
      if (activeNav) activeNav.classList.add('active', 'bg-slate-900/60', 'text-brand-gold');

      const titles = {
        'overview': ['Overview Studio Dashboard', 'Ringkasan performa dan inventaris media Aura Vista.'],
        'portfolio': ['Media Portfolio & High-Res Export', 'Kelola karya, edit deskripsi, dan download foto resolusi maksimal ber-watermark.'],
        'upload': ['Studio Auto-Watermark Engine', 'Upload karya baru dengan penempelan logo otomatis presisi dan simpan permanen ke Cloud.'],
        'hero-customizer': ['Master Shot & Hero Look Customizer', 'Kustomisasi foto master shot dan efek background beranda secara interaktif.'],
        'settings': ['Backup & Tools Database', 'Export JSON cadangan dan utilitas pemulihan database.']
      };

      if (titles[viewName]) {
        document.getElementById('page-title').innerText = titles[viewName][0];
        document.getElementById('page-subtitle').innerText = titles[viewName][1];
      }

      if (viewName === 'portfolio') {
        renderPortfolioList();
      } else if (viewName === 'hero-customizer') {
        renderMasterShotSelector();
      }

      lucide.createIcons();
    }

    async function loadDashboardData() {
      try {
        const resp = await fetch('/api/portfolio?v=' + Date.now());
        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson.success && Array.isArray(resJson.items)) {
            currentPortfolioList = resJson.items;
          }
        }
      } catch (e) {
        console.warn('API portfolio fetch fallback to static JSON:', e);
      }

      if (!currentPortfolioList || currentPortfolioList.length === 0) {
        try {
          const resp = await fetch('assets/portfolio_data.json?v=' + Date.now());
          currentPortfolioList = await resp.json();
        } catch (e) {
          console.error('Failed fetching static JSON:', e);
        }
      }

      updateDashboardStats(currentPortfolioList);
      renderPortfolioList();
      lucide.createIcons();
    }

    function updateDashboardStats(data) {
      const total = data.length;
      const dh = data.filter(d => d.category === 'dharmawangsa' || (d.img && d.img.includes('4711'))).length;
      const dhRes = data.filter(d => d.category === 'dharmawangsa_residence').length;
      const cil = data.filter(d => d.category === 'cilandak' || (d.img && d.img.includes('12302'))).length;
      const enh = data.filter(d => d.category === 'enhancement' || (!d.img?.includes('4711') && !d.img?.includes('12302') && d.category !== 'dharmawangsa_residence')).length;

      if (document.getElementById('stat-total')) document.getElementById('stat-total').innerText = total;
      if (document.getElementById('stat-dharmawangsa')) document.getElementById('stat-dharmawangsa').innerText = dh + dhRes;
      if (document.getElementById('stat-cilandak')) document.getElementById('stat-cilandak').innerText = cil;
      if (document.getElementById('stat-enhancement')) document.getElementById('stat-enhancement').innerText = enh;
      if (document.getElementById('badge-total-items')) document.getElementById('badge-total-items').innerText = total;

      // Overview Recent Grid
      const recentContainer = document.getElementById('overview-recent-grid');
      if (recentContainer) {
        recentContainer.innerHTML = '';
        data.slice(0, 4).forEach(item => {
          const div = document.createElement('div');
          div.className = 'glass-panel p-2.5 rounded-2xl overflow-hidden';
          div.innerHTML = \`
            <div class="aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-black/50">
              <img src="\${item.img}" class="w-full h-full object-cover" />
            </div>
            <p class="text-xs font-bold text-slate-100 truncate">\${item.title}</p>
            <span class="text-[9px] uppercase text-brand-gold tracking-wider">\${item.badge || item.category}</span>
          \`;
          recentContainer.appendChild(div);
        });
      }
    }

    // Render Portfolio Table / Grid in View 2
    function renderPortfolioList() {
      const data = getPortfolioData();
      const query = (document.getElementById('search-input')?.value || '').toLowerCase();
      const filterCat = document.getElementById('filter-cat')?.value || 'all';
      const container = document.getElementById('portfolio-grid-container');
      if (!container) return;
      container.innerHTML = '';

      const filtered = data.filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(query) || (item.desc && item.desc.toLowerCase().includes(query));
        let matchesCat = true;
        if (filterCat === 'dharmawangsa_residence') matchesCat = item.category === 'dharmawangsa_residence';
        else if (filterCat === 'dharmawangsa') matchesCat = item.category === 'dharmawangsa' || (item.img && item.img.includes('4711'));
        else if (filterCat === 'cilandak') matchesCat = item.category === 'cilandak' || (item.img && item.img.includes('12302'));
        else if (filterCat === 'enhancement') matchesCat = item.category === 'enhancement' || (!item.img.includes('4711') && !item.img.includes('12302') && item.category !== 'dharmawangsa_residence');
        return matchesQuery && matchesCat;
      });

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="col-span-full text-center py-16 text-slate-500">
            <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
            <p class="text-sm">Tidak ada portofolio yang cocok dengan pencarian.</p>
          </div>
        \`;
        lucide.createIcons();
        return;
      }

      filtered.forEach(item => {
        const isChecked = selectedItemIds.has(item.id);
        const card = document.createElement('div');
        card.className = \`glass-card rounded-2xl overflow-hidden p-3.5 flex flex-col justify-between group transition-all \${isChecked ? 'border-brand-gold ring-1 ring-brand-gold/50' : ''}\`;
        
        card.innerHTML = \`
          <div>
            <div class="aspect-[3/4] rounded-xl overflow-hidden mb-3.5 relative bg-black/80 flex items-center justify-center">
              <img src="\${item.img}" alt="\${item.title}" class="w-full h-full object-contain transition-transform group-hover:scale-105 duration-500" loading="lazy" />
              
              <!-- Checkbox for Selection -->
              <div class="absolute top-2.5 right-2.5 z-10">
                <input type="checkbox" onchange="toggleSelectItem('\${item.id}', this)" \${isChecked ? 'checked' : ''} class="w-5 h-5 rounded border-slate-600 bg-black/70 text-brand-gold focus:ring-0 custom-checkbox cursor-pointer shadow-md" />
              </div>

              <div class="absolute top-2.5 left-2.5">
                <span class="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[9px] text-brand-gold uppercase tracking-wider border border-brand-gold/30 font-bold">\${item.badge || item.category}</span>
              </div>
            </div>
            <h4 class="font-serif font-bold text-sm text-slate-100 line-clamp-1">\${item.title}</h4>
            <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">\${item.desc}</p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <!-- Download Single High-Res Button -->
            <button onclick="downloadSinglePhoto('\${item.img}', '\${item.title}')" class="w-full py-1.5 rounded-lg btn-gold text-[11px] uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 shadow-sm">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Download Max Quality</span>
            </button>

            <div class="flex items-center justify-between gap-2">
              <button onclick="openEditModal('\${item.id}')" class="flex-1 py-1.5 rounded-lg glass-panel text-xs text-brand-gold hover:text-white flex items-center justify-center gap-1 border border-brand-gold/20 hover:border-brand-gold transition-all">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
              </button>
              <button onclick="deleteItem('\${item.id}')" class="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs flex items-center justify-center border border-red-500/20 transition-all">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        \`;
        container.appendChild(card);
      });

      updateSelectionUI();
      lucide.createIcons();
    }

    // Toggle Select Item
    function toggleSelectItem(id, checkbox) {
      if (checkbox.checked) {
        selectedItemIds.add(id);
      } else {
        selectedItemIds.delete(id);
      }
      updateSelectionUI();
    }

    // Toggle Select All
    function toggleSelectAll(masterCheckbox) {
      const data = getPortfolioData();
      if (masterCheckbox.checked) {
        data.forEach(item => selectedItemIds.add(item.id));
      } else {
        selectedItemIds.clear();
      }
      renderPortfolioList();
    }

    function updateSelectionUI() {
      const count = selectedItemIds.size;
      const countEl = document.getElementById('selected-count-text');
      if (countEl) countEl.innerText = count;

      const btn = document.getElementById('btn-download-selected');
      if (btn) {
        btn.disabled = count === 0;
        btn.innerHTML = \`<i data-lucide="download" class="w-4 h-4"></i><span>Download Maximum Quality (\${count} Foto)</span>\`;
      }

      const masterCheckbox = document.getElementById('select-all-checkbox');
      const total = getPortfolioData().length;
      if (masterCheckbox && total > 0) {
        masterCheckbox.checked = count === total;
      }
      lucide.createIcons();
    }

    // Single Download Maximum Quality
    async function downloadSinglePhoto(imgUrl, title) {
      try {
        const cleanTitle = (title || 'AuraVista_Photo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const resp = await fetch(imgUrl);
        const blob = await resp.blob();
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = \`AuraVista_HQ_\${cleanTitle}.webp\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } catch (err) {
        alert('Gagal mendownload foto: ' + err.message);
      }
    }

    // Batch Download Selected Photos as Zip
    async function downloadSelectedPhotos() {
      if (selectedItemIds.size === 0) {
        alert('Pilih minimal satu foto untuk didownload.');
        return;
      }

      const data = getPortfolioData();
      const selectedItems = data.filter(d => selectedItemIds.has(d.id));

      const btn = document.getElementById('btn-download-selected');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = \`<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Packaging Max Quality (\${selectedItems.length})...</span>\`;
      lucide.createIcons();

      try {
        if (selectedItems.length === 1) {
          await downloadSinglePhoto(selectedItems[0].img, selectedItems[0].title);
        } else {
          const zip = new JSZip();
          const folder = zip.folder("AuraVista_Watermarked_Masters");

          for (let i = 0; i < selectedItems.length; i++) {
            const item = selectedItems[i];
            const cleanTitle = (item.title || \`photo_\${i+1}\`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const resp = await fetch(item.img);
            const blob = await resp.blob();
            folder.file(\`\${String(i+1).padStart(2, '0')}_\${cleanTitle}.webp\`, blob);
          }

          const content = await zip.generateAsync({ type: "blob" });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(content);
          a.download = \`AuraVista_Media_Batch_\${new Date().toISOString().slice(0,10)}.zip\`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        }
      } catch (err) {
        alert('Gagal mendownload paket foto: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        lucide.createIcons();
      }
    }

    // Auto-Watermark HTML5 Canvas Engine
    function processWatermarkCanvas(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const baseImg = new Image();
        baseImg.onload = function() {
          const logoImg = document.getElementById('logo-watermark-source');
          const canvas = document.getElementById('studio-watermark-canvas');
          const ctx = canvas.getContext('2d');

          const maxDim = 1920;
          let w = baseImg.width;
          let h = baseImg.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;

          // 1. Draw base photo
          ctx.drawImage(baseImg, 0, 0, w, h);

          // 2. Draw Top-Center Watermark (Exact ratio: 20% width, 3.5% top Y, 92% opacity)
          const logoW = Math.round(w * 0.20);
          const logoRatio = (logoImg.naturalHeight || 500) / (logoImg.naturalWidth || 500);
          const logoH = Math.round(logoW * logoRatio);
          const logoX = Math.round((w - logoW) / 2);
          const logoY = Math.round(h * 0.035);

          ctx.save();
          ctx.globalAlpha = 0.92;
          ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
          ctx.restore();

          watermarkedDataUrl = canvas.toDataURL('image/webp', 0.93);
          
          const ratio = w / h;
          let detectedAspect = '3:4';
          if (ratio < 0.65) detectedAspect = '9:16';
          else if (ratio > 1.2) detectedAspect = '16:9';
          else if (ratio >= 0.95 && ratio <= 1.05) detectedAspect = '1:1';
          
          canvas.setAttribute('data-aspect', detectedAspect);
          document.getElementById('canvas-preview-container').classList.remove('hidden');
          lucide.createIcons();
        };
        baseImg.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }

    async function handleUploadSubmit(e) {
      e.preventDefault();
      if (!watermarkedDataUrl) {
        alert('Silakan pilih file foto terlebih dahulu.');
        return;
      }

      const title = document.getElementById('upload-title').value;
      const category = document.getElementById('upload-category').value;
      const desc = document.getElementById('upload-desc').value;
      const canvas = document.getElementById('studio-watermark-canvas');
      const aspect = canvas?.getAttribute('data-aspect') || '3:4';

      const btn = document.getElementById('btn-publish-photo');
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = \`<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan & Mengunggah ke Cloud Server...</span>\`;
      lucide.createIcons();

      try {
        const response = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            category,
            desc,
            imageBase64: watermarkedDataUrl,
            aspect
          })
        });

        const resJson = await response.json();
        if (response.ok && resJson.success) {
          alert('Berhasil! Foto ber-watermark telah disimpan permanen ke server cloud dan website.');
          document.getElementById('upload-file-input').value = '';
          document.getElementById('upload-title').value = '';
          document.getElementById('upload-desc').value = '';
          document.getElementById('canvas-preview-container').classList.add('hidden');
          watermarkedDataUrl = '';
          
          await loadDashboardData();
          switchView('portfolio');
        } else {
          throw new Error(resJson.error || 'Gagal menyimpan foto ke server');
        }
      } catch (err) {
        alert('Error Upload: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        lucide.createIcons();
      }
    }

    function openEditModal(id) {
      const data = getPortfolioData();
      const item = data.find(d => d.id === id);
      if (!item) return;

      document.getElementById('edit-id').value = item.id;
      document.getElementById('edit-title').value = item.title;
      document.getElementById('edit-category').value = item.category || 'enhancement';
      document.getElementById('edit-desc').value = item.desc || '';

      document.getElementById('edit-modal').classList.remove('hidden');
      lucide.createIcons();
    }

    function closeEditModal() {
      document.getElementById('edit-modal').classList.add('hidden');
    }

    async function handleSaveEdit(e) {
      e.preventDefault();
      const id = document.getElementById('edit-id').value;
      const title = document.getElementById('edit-title').value;
      const category = document.getElementById('edit-category').value;
      const desc = document.getElementById('edit-desc').value;

      try {
        const response = await fetch('/api/portfolio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, title, category, desc })
        });

        const resJson = await response.json();
        if (response.ok && resJson.success) {
          closeEditModal();
          alert('Perubahan portofolio berhasil disimpan permanen!');
          await loadDashboardData();
        } else {
          throw new Error(resJson.error || 'Gagal menyimpan perubahan');
        }
      } catch (err) {
        alert('Error Edit: ' + err.message);
      }
    }

    async function deleteItem(id) {
      if (!confirm('Yakin ingin menghapus foto ini secara permanen dari server cloud?')) return;

      try {
        const response = await fetch('/api/portfolio', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });

        const resJson = await response.json();
        if (response.ok && resJson.success) {
          alert('Foto berhasil dihapus secara permanen!');
          await loadDashboardData();
        } else {
          throw new Error(resJson.error || 'Gagal menghapus item');
        }
      } catch (err) {
        alert('Error Delete: ' + err.message);
      }
    }

    // ================= MASTER SHOT & BACKGROUND CUSTOMIZER LOGIC =================
    const THEME_KEY = 'auravista_theme_customizer';
    let currentSelectTarget = 'hero';

    function getCustomizerSettings() {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
      return {
        heroBgImg: 'assets/HD_06_pool.webp',
        heroBgTitle: 'Private Resort Swimming Pool',
        masterShotImg: 'assets/HD_04_living_depan.webp',
        masterShotTitle: 'Grand Living Space HDR',
        neonBackground: true,
        bgMood: 'obsidian'
      };
    }

    function setSelectTarget(target) {
      currentSelectTarget = target;
      const tabHero = document.getElementById('tab-target-hero');
      const tabMaster = document.getElementById('tab-target-master');
      const hint = document.getElementById('target-hint-text');

      if (target === 'hero') {
        tabHero.className = 'px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-gold text-black shadow-md';
        tabMaster.className = 'px-4 py-1.5 rounded-lg text-xs font-bold glass-panel text-slate-300 hover:text-white border border-slate-700';
        if (hint) hint.innerText = 'Mengubah: Background Hero Landing Page';
      } else {
        tabMaster.className = 'px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-gold text-black shadow-md';
        tabHero.className = 'px-4 py-1.5 rounded-lg text-xs font-bold glass-panel text-slate-300 hover:text-white border border-slate-700';
        if (hint) hint.innerText = 'Mengubah: Master Shot Card (Section About)';
      }
      renderMasterShotSelector();
    }

    function renderMasterShotSelector() {
      const data = getPortfolioData();
      const settings = getCustomizerSettings();
      const grid = document.getElementById('master-shot-selector-grid');
      if (!grid) return;
      grid.innerHTML = '';

      const currentMasterImg = document.getElementById('current-master-shot-img');
      const currentMasterTitle = document.getElementById('current-master-shot-title');
      if (currentMasterImg) currentMasterImg.src = settings.masterShotImg;
      if (currentMasterTitle) currentMasterTitle.innerText = settings.masterShotTitle;

      const currentHeroImg = document.getElementById('current-hero-bg-img');
      const currentHeroTitle = document.getElementById('current-hero-bg-title');
      if (currentHeroImg) currentHeroImg.src = settings.heroBgImg || 'assets/HD_06_pool.webp';
      if (currentHeroTitle) currentHeroTitle.innerText = settings.heroBgTitle || 'Private Resort Swimming Pool';

      const toggleNeon = document.getElementById('toggle-neon-bg');
      if (toggleNeon) toggleNeon.checked = settings.neonBackground !== false;

      const moodSelect = document.getElementById('select-bg-mood');
      if (moodSelect) moodSelect.value = settings.bgMood || 'obsidian';

      data.forEach(item => {
        const activeUrl = currentSelectTarget === 'hero' ? settings.heroBgImg : settings.masterShotImg;
        const isSelected = item.img === activeUrl;
        
        const div = document.createElement('div');
        div.className = \`aspect-[3/4] rounded-xl overflow-hidden cursor-pointer relative group border-2 transition-all \${isSelected ? 'border-brand-gold ring-2 ring-brand-gold/50 scale-105' : 'border-slate-800 hover:border-slate-500'}\`;
        div.onclick = () => selectPhotoForTarget(item.img, item.title);
        div.innerHTML = \`
          <img src="\${item.img}" alt="\${item.title}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
            <span class="text-[9px] font-bold text-brand-gold bg-black/90 px-2 py-1 rounded line-clamp-2">\${item.title}</span>
          </div>
          \${isSelected ? '<span class="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-brand-gold text-black text-[8px] font-black uppercase">SELECTED</span>' : ''}
        \`;
        grid.appendChild(div);
      });
      lucide.createIcons();
    }

    function selectPhotoForTarget(imgUrl, title) {
      const current = getCustomizerSettings();
      if (currentSelectTarget === 'hero') {
        current.heroBgImg = imgUrl;
        current.heroBgTitle = title;
      } else {
        current.masterShotImg = imgUrl;
        current.masterShotTitle = title;
      }
      localStorage.setItem(THEME_KEY, JSON.stringify(current));
      renderMasterShotSelector();
    }

    function updateBackgroundSettings() {
      const current = getCustomizerSettings();
      current.neonBackground = document.getElementById('toggle-neon-bg').checked;
      current.bgMood = document.getElementById('select-bg-mood').value;
      localStorage.setItem(THEME_KEY, JSON.stringify(current));
    }

    async function saveCustomizerToCloud() {
      updateBackgroundSettings();
      const current = getCustomizerSettings();
      current.updatedAt = Date.now();

      const btn = document.getElementById('btn-save-cloud');
      const orig = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = \`<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan ke Cloud...</span>\`;
        lucide.createIcons();
      }

      if (window.AuraVistaCloud) {
        const res = await window.AuraVistaCloud.saveTheme(current);
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = orig;
          lucide.createIcons();
        }

        if (res.success) {
          alert('Berhasil! Foto Master Shot & Tampilan Web tersimpan ke Cloud. Perubahan akan langsung tampil di semua device!');
        } else {
          alert('Tersimpan di Lokal. Catatan Cloud: ' + res.error);
        }
      } else {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = orig;
        }
        alert('Tersimpan di Local PC!');
      }
    }

    async function resetCustomizerSettings() {
      if (!confirm('Kembalikan Hero Background dan Master Shot ke pengaturan default?')) return;
      localStorage.removeItem(THEME_KEY);
      const defaultSettings = {
        heroBgImg: 'assets/HD_06_pool.webp',
        heroBgTitle: 'Private Resort Swimming Pool',
        masterShotImg: 'assets/HD_04_living_depan.webp',
        masterShotTitle: 'Grand Living Space HDR',
        neonBackground: true,
        bgMood: 'obsidian',
        updatedAt: Date.now()
      };
      if (window.AuraVistaCloud) {
        await window.AuraVistaCloud.saveTheme(defaultSettings);
      }
      renderMasterShotSelector();
      alert('Pengaturan tampilan berhasil di-reset ke default di semua device!');
    }

    function exportJSON() {
      const data = getPortfolioData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`AuraVista_Portfolio_Backup_\${new Date().toISOString().slice(0,10)}.json\`;
      a.click();
    }

    function importJSON(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (Array.isArray(parsed)) {
            currentPortfolioList = parsed;
            alert('Database portofolio berhasil dipulihkan di memori!');
            renderPortfolioList();
            switchView('portfolio');
          } else {
            alert('Format file JSON tidak valid.');
          }
        } catch (err) {
          alert('Gagal membaca file JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    }

    async function resetDefault() {
      if (!confirm('Muat ulang data portofolio dari cloud server?')) return;
      await loadDashboardData();
      alert('Database berhasil disinkronkan dengan server cloud!');
      switchView('portfolio');
    }

    // Startup
    window.addEventListener('DOMContentLoaded', () => {
      initAuth();
    });
`;

// Replace script tag in admin.html
const scriptTagStart = content.lastIndexOf('<script>');
content = content.substring(0, scriptTagStart) + '<script>' + newScriptLogic + '\n  </script>\n</body>\n</html>';

fs.writeFileSync(adminPath, content, 'utf8');
console.log('admin.html updated successfully with Cloud API backend sync!');
