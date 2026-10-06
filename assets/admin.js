const $ = id => document.getElementById(id);
const photoSource = path => /^assets\/porto\/porto-[0-9a-f-]{36}\.webp$/.test(path) ? `https://raw.githubusercontent.com/DhavidFebrian/AuraVista-Web/main/${path}` : path;
const names = { overview: 'Ringkasan', portfolio: 'Koleksi media', upload: 'Unggah foto', appearance: 'Tampilan website', settings: 'Cadangan & aktivitas' };
const categories = { cilandak: 'Cilandak Estate', dharmawangsa: 'Dharmawangsa Apartment', dharmawangsa_residence: 'Dharmawangsa Residence', enhancement: 'Enhancement' };
const locations = { cilandak: 'Cilandak, South Jakarta', dharmawangsa: 'Dharmawangsa Apartment', dharmawangsa_residence: 'Dharmawangsa, South Jakarta', enhancement: 'Studio Grade' };
const state = { items: [], sha: null, selected: new Set(), view: 'overview', busy: false, photo: null, photos: [], preparing: false, uploading: false, preview: [], previewIndex: 0, theme: null, themeDirty: false, editDirty: false, authenticated: false, loading: false };
let toastTimer;
state.albumsSha = null;
function syncAlbums(albums, sha) {
  if (!Array.isArray(albums)) return;
  state.albums = albums; state.albumsSha = sha || null;
  for (const album of albums) { categories[album.id] = album.title; locations[album.id] = album.location; }
  for (const id of ['filter-category', 'upload-category', 'edit-category']) {
    const selected = $(id).value; $(id).replaceChildren();
    if (id === 'filter-category') { const all = node('option', '', 'Semua album'); all.value = 'all'; $(id).append(all); }
    for (const [value, title] of Object.entries(categories)) { const option = node('option', '', title); option.value = value; $(id).append(option); }
    if ([...$(id).options].some(option => option.value === selected)) $(id).value = selected;
  }
  $('new-album').disabled = !state.albumsSha || state.busy;
}
function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }
function toast(message, error = false) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').className = `toast${error ? ' error' : ''}`; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, error ? 10000 : 6000); }
function activity(message) { let entries = []; try { entries = JSON.parse(localStorage.getItem('av-studio-activity') || '[]'); if (!Array.isArray(entries)) entries = []; } catch {} entries.unshift({ message, at: Date.now() }); try { localStorage.setItem('av-studio-activity', JSON.stringify(entries.slice(0, 30))); } catch {} renderActivity(); }
function renderActivity() { let entries = []; try { entries = JSON.parse(localStorage.getItem('av-studio-activity') || '[]'); } catch {} $('activity-list').replaceChildren(); if (!Array.isArray(entries) || !entries.length) { $('activity-list').append(node('li', '', 'Aktivitas penyimpanan Anda akan muncul di sini.')); return; } entries.forEach(entry => { const li = node('li'); li.append(node('span', '', entry.message)); const time = node('time', '', new Date(entry.at).toLocaleString('id-ID')); li.append(time); $('activity-list').append(li); }); }
async function api(path, method = 'GET', body) {
  let response;
  try { response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) }); }
  catch { throw new Error('Koneksi terputus atau server belum merespons. Periksa koneksi, muat ulang data sebelum mengulangi penyimpanan.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/auth') { state.authenticated = false; $('app-view').hidden = true; $('login-view').hidden = false; }
    throw Object.assign(new Error(data.error || `Permintaan gagal (${response.status}).`), { status: response.status });
  }
  return data;
}
function setView(view) {
  if (!names[view]) view = 'overview';
  state.view = view;
  document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== `view-${view}`);
  document.querySelectorAll('.sidebar [data-view]').forEach(el => { el.classList.toggle('active', el.dataset.view === view); el.setAttribute('aria-current', el.dataset.view === view ? 'page' : 'false'); });
  $('breadcrumb').textContent = names[view]; document.title = `${names[view]} — Aura Vista Studio`;
  history.replaceState(null, '', `#${view}`);
  if (view === 'settings') renderActivity();
  if (view === 'appearance') renderTheme();
}
document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => setView(el.dataset.view)));
document.querySelectorAll('[data-close]').forEach(el => el.onclick = () => { if (state.busy) return; $(el.dataset.close).close(); });
document.querySelectorAll('dialog').forEach(dialog => { dialog.addEventListener('cancel', e => { if (state.busy) e.preventDefault(); }); dialog.addEventListener('click', e => { if (e.target === dialog && !state.busy) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } }); });
for (const id of ['filter-category', 'upload-category', 'edit-category']) for (const [value, title] of Object.entries(categories)) { const option = node('option', '', title); option.value = value; $(id).append(option); }
$('upload-location').value = locations[$('upload-category').value];
$('upload-category').onchange = () => $('upload-location').value = locations[$('upload-category').value];
$('edit-category').onchange = () => { $('edit-location').value = locations[$('edit-category').value]; $('edit-badge').value = categories[$('edit-category').value]; };
$('show-password').onclick = () => { const show = $('login-password').type === 'password'; $('login-password').type = show ? 'text' : 'password'; $('show-password').textContent = show ? 'Sembunyi' : 'Lihat'; $('show-password').setAttribute('aria-pressed', String(show)); $('show-password').setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password'); };
$('login-form').onsubmit = async e => {
  e.preventDefault(); const button = e.submitter; button.disabled = true; button.textContent = 'Memverifikasi…'; $('login-error').hidden = true;
  try { await api('/api/auth', 'POST', Object.fromEntries(new FormData(e.target))); $('login-password').value = ''; await enterStudio(); }
  catch (error) { $('login-error').textContent = error.message; $('login-error').hidden = false; }
  finally { button.disabled = false; button.textContent = 'Masuk ke studio ↗'; }
};
$('logout').onclick = async () => {
  if (state.busy || state.uploading || state.preparing) return toast('Tunggu hingga penyimpanan selesai.', true);
  if ((state.photo || state.themeDirty || state.editDirty) && !await confirmAction('Keluar dari studio?', 'Perubahan formulir yang belum tersimpan akan hilang.', 'Keluar')) return;
  try { await api('/api/auth', 'DELETE'); location.href = 'admin.html'; } catch (error) { toast(error.message, true); }
};
async function enterStudio() { state.authenticated = true; $('login-view').hidden = true; $('app-view').hidden = false; setView(location.hash.slice(1) || 'overview'); await Promise.all([loadData(), loadTheme()]); }
async function loadData() {
  if (state.loading || state.busy) return;
  state.loading = true; $('refresh').disabled = true; $('connection').textContent = 'Memuat koleksi…';
  try {
    const data = await api('/api/portfolio');
    if (!Array.isArray(data.items)) throw new Error('Format koleksi tidak valid.');
    state.items = data.items; state.sha = data.sha; syncAlbums(data.albums, data.albumsSha); $('data-warning').hidden = true; $('connection').textContent = 'Terhubung';
  } catch (error) {
    state.sha = null; state.albumsSha = null; $('new-album').disabled = true; $('connection').textContent = 'Mode baca saja'; $('data-warning').hidden = false;
    $('data-warning').textContent = `${error.message} Penyuntingan dinonaktifkan sampai koneksi pulih. Gunakan tombol muat ulang di atas.`;
    if (!state.items.length) { try { const response = await fetch('assets/portfolio_data.json'); if (!response.ok) throw new Error(); const items = await response.json(); if (Array.isArray(items)) state.items = items; } catch {} }
  } finally { state.loading = false; $('refresh').disabled = false; const ids = new Set(state.items.map(x => x.id)); state.selected = new Set([...state.selected].filter(x => ids.has(x))); renderAll(); }
}
$('refresh').onclick = () => loadData();
$('new-album').onclick = () => { if (state.busy || !state.albumsSha) return; $('album-error').textContent = ''; $('album-dialog').showModal(); };
$('album-form').onsubmit = async e => {
  e.preventDefault(); if (state.busy || !state.albumsSha) return;
  state.busy = true; const button = e.submitter; button.disabled = true; button.textContent = 'Membuat album…'; $('album-error').textContent = '';
  try {
    const result = await api('/api/albums', 'POST', { ...Object.fromEntries(new FormData(e.target)), sha: state.albumsSha });
    syncAlbums(result.albums, result.sha); $('upload-category').value = result.album.id; $('upload-location').value = result.album.location;
    $('album-dialog').close(); e.target.reset();
    $('album-status').textContent = `Album “${result.album.title}” siap digunakan. Album muncul di website setelah foto pertama diterbitkan.`;
    activity(`Album “${result.album.title}” dibuat.`); toast('Album berhasil dibuat dan dipilih untuk unggahan ini.');
  } catch (error) {
    $('album-error').textContent = error.message;
    if (error.status === 409) { try { const latest = await api('/api/albums'); syncAlbums(latest.albums, latest.sha); } catch {} }
  } finally { state.busy = false; button.disabled = false; button.textContent = 'Buat album'; $('new-album').disabled = !state.albumsSha; renderAll(); }
};
function filtered() {
  const query = $('search').value.trim().toLowerCase(), cat = $('filter-category').value;
  const items = state.items.filter(x => (cat === 'all' || x.category === cat) && `${x.title} ${x.desc || ''} ${x.location || ''}`.toLowerCase().includes(query));
  if ($('sort').value === 'az') items.sort((a, b) => a.title.localeCompare(b.title));
  if ($('sort').value === 'za') items.sort((a, b) => b.title.localeCompare(a.title));
  if ($('sort').value === 'newest') items.sort((a, b) => (Date.parse(b.uploadedAt) || 0) - (Date.parse(a.uploadedAt) || 0));
  return items;
}
function renderAll() {
  $('nav-count').textContent = state.items.length; $('stat-total').textContent = state.items.length;
  $('stat-dharmawangsa').textContent = state.items.filter(x => ['dharmawangsa', 'dharmawangsa_residence'].includes(x.category)).length;
  $('stat-cilandak').textContent = state.items.filter(x => x.category === 'cilandak').length;
  $('stat-enhancement').textContent = state.items.filter(x => x.category === 'enhancement').length;
  $('recent-grid').replaceChildren();
  state.items.slice(0, 4).forEach(item => { const card = node('button', 'recent-card'); const image = node('img'); image.src = photoSource(item.img); image.alt = item.title; image.loading = 'lazy'; card.append(image, node('h3', '', item.title), node('small', '', categories[item.category] || item.category)); card.onclick = () => preview(item.id, state.items); $('recent-grid').append(card); });
  if (!state.items.length) $('recent-grid').append(node('p', 'muted', 'Koleksi masih kosong. Unggah foto pertama Anda.'));
  $('category-summary').replaceChildren();
  for (const [cat, title] of Object.entries(categories)) { const count = state.items.filter(x => x.category === cat).length; const button = node('button', '', title); button.append(node('strong', '', count)); const progress = node('progress'); progress.value = count; progress.max = state.items.length || 1; progress.setAttribute('aria-label', `${title}: ${count} foto`); button.append(progress); button.onclick = () => { $('filter-category').value = cat; $('search').value = ''; setView('portfolio'); renderPortfolio(); }; $('category-summary').append(button); }
  renderPortfolio(); renderTheme(); updatePublish();
}
function renderPortfolio() {
  const items = filtered(); $('portfolio-grid').replaceChildren(); $('empty-state').hidden = items.length > 0; $('result-count').textContent = `${items.length} dari ${state.items.length} foto`;
  items.forEach(item => {
    const card = node('article', `media-card${state.selected.has(item.id) ? ' selected' : ''}`);
    const photo = node('div', 'media-photo'), open = node('button'); open.setAttribute('aria-label', `Pratinjau ${item.title}`);
    const image = node('img'); image.src = photoSource(item.img); image.alt = item.title; image.loading = 'lazy'; image.decoding = 'async'; image.onerror = () => { image.alt = `${item.title} — gambar belum tersedia`; }; open.append(image); open.onclick = () => preview(item.id, items);
    const label = node('label'), check = node('input'); check.type = 'checkbox'; check.checked = state.selected.has(item.id); check.setAttribute('aria-label', `Pilih ${item.title}`); check.onchange = () => { check.checked ? state.selected.add(item.id) : state.selected.delete(item.id); card.classList.toggle('selected', check.checked); selectionUI(); }; label.append(check);
    photo.append(open, label, node('span', 'category-tag', categories[item.category] || item.category));
    const info = node('div', 'media-info'); info.append(node('h3', '', item.title), node('p', '', item.location || 'Lokasi belum diisi'));
    const actions = node('div', 'media-actions'); const download = node('button', '', 'Unduh ↓'), edit = node('button', '', 'Edit'), remove = node('button', 'delete-photo', 'Hapus foto');
    download.onclick = () => downloadPhotos([item]); edit.onclick = () => openEdit(item); remove.onclick = () => deletePhoto(item); edit.disabled = remove.disabled = !state.sha || state.busy;
    [download, edit, remove].forEach(button => button.setAttribute('aria-label', `${button.textContent} ${item.title}`)); const cover = node('button', 'set-cover', 'Jadikan cover');
    const album = state.albums?.find(album => album.id === item.category);
    const currentCover = state.items.find(photo => photo.id === album?.coverPhotoId && photo.category === item.category);
    if (currentCover?.id === item.id) { cover.textContent = '✓ Cover album'; cover.setAttribute('aria-pressed', 'true'); }
    cover.disabled = !state.albumsSha || state.busy || currentCover?.id === item.id;
    cover.setAttribute('aria-label', `${cover.textContent} ${item.title}`); cover.onclick = () => setAlbumCover(item);
    actions.append(download, edit, remove, cover); info.append(actions); card.append(photo, info); $('portfolio-grid').append(card);
  }); selectionUI();
}
async function setAlbumCover(item) {
  if (state.busy || !state.albumsSha) return;
  state.busy = true; renderPortfolio();
  try {
    const result = await api('/api/albums', 'PUT', { id: item.category, coverPhotoId: item.id, sha: state.albumsSha });
    syncAlbums(result.albums, result.sha); activity(`Cover album “${categories[item.category]}” diperbarui.`); toast('Cover album berhasil disimpan.');
  } catch (error) { toast(error.message, true); if (error.status === 409) { try { const latest = await api('/api/albums'); syncAlbums(latest.albums, latest.sha); } catch {} } }
  finally { state.busy = false; renderAll(); }
}
function selectionUI() { const items = filtered(), count = items.filter(x => state.selected.has(x.id)).length; $('select-all').checked = items.length > 0 && count === items.length; $('select-all').indeterminate = count > 0 && count < items.length; $('select-all').disabled = !items.length; $('download-selected').disabled = !state.selected.size; $('download-selected').textContent = `Unduh pilihan (${state.selected.size})`; $('clear-selection').disabled = !state.selected.size; $('delete-selected').disabled = !state.selected.size || !state.sha || state.busy; $('delete-selected').textContent = state.busy ? 'Menyimpan…' : `Hapus pilihan (${state.selected.size})`; }
['search', 'filter-category', 'sort'].forEach(id => $(id).addEventListener(id === 'search' ? 'input' : 'change', renderPortfolio));
$('select-all').onchange = e => { filtered().forEach(x => e.target.checked ? state.selected.add(x.id) : state.selected.delete(x.id)); renderPortfolio(); };
$('clear-selection').onclick = () => { state.selected.clear(); renderPortfolio(); };
$('reset-filters').onclick = () => { $('search').value = ''; $('filter-category').value = 'all'; $('sort').value = 'default'; renderPortfolio(); };
function preview(id, items) { state.preview = items; state.previewIndex = items.findIndex(x => x.id === id); showPreview(); if (!$('preview-dialog').open) $('preview-dialog').showModal(); }
function showPreview() { const item = state.preview[state.previewIndex]; if (!item) return; $('preview-image').src = photoSource(item.img); $('preview-image').alt = item.title; $('preview-title').textContent = item.title; $('preview-desc').textContent = item.desc || ''; $('preview-position').textContent = `${state.previewIndex + 1} / ${state.preview.length}`; }
function movePreview(delta) { state.previewIndex = (state.previewIndex + delta + state.preview.length) % state.preview.length; showPreview(); }
$('preview-prev').onclick = () => movePreview(-1); $('preview-next').onclick = () => movePreview(1);
$('preview-dialog').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') movePreview(-1); if (e.key === 'ArrowRight') movePreview(1); });
function downloadBlob(blob, filename) { const a = node('a'); const url = URL.createObjectURL(blob); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
async function downloadPhotos(items) {
  if (!items.length) return;
  const button = $('download-selected'); button.disabled = true; button.textContent = 'Menyiapkan unduhan…';
  try {
    const zip = items.length > 1 ? new window.JSZip() : null;
    for (let i = 0; i < items.length; i++) { const item = items[i]; const response = await fetch(photoSource(item.img)); if (!response.ok) throw new Error(`Foto “${item.title}” belum tersedia. Tunggu deployment selesai lalu coba lagi.`); const blob = await response.blob(); const ext = item.img.split('.').pop(); const filename = `${String(i + 1).padStart(2, '0')}_${item.title.replace(/[^a-z0-9_-]/gi, '_')}.${ext}`; if (zip) zip.file(filename, blob); else downloadBlob(blob, filename); }
    if (zip) downloadBlob(await zip.generateAsync({ type: 'blob' }), `AuraVista-${new Date().toISOString().slice(0, 10)}.zip`);
    toast(`${items.length} foto siap diunduh.`);
  } catch (error) { toast(error.message, true); } finally { selectionUI(); }
}
$('download-selected').onclick = () => downloadPhotos(state.items.filter(x => state.selected.has(x.id)));
function confirmAction(title, description, accept = 'Lanjutkan') { $('confirm-title').textContent = title; $('confirm-description').textContent = description; $('confirm-accept').textContent = accept; $('confirm-dialog').showModal(); return new Promise(resolve => { let accepted = false; $('confirm-accept').onclick = () => { accepted = true; $('confirm-dialog').close(); }; $('confirm-cancel').onclick = () => $('confirm-dialog').close(); $('confirm-dialog').addEventListener('close', () => resolve(accepted), { once: true }); }); }
async function savePortfolio(method, body, message) {
  if (state.busy || !state.sha) throw new Error('Tunggu penyimpanan selesai atau muat ulang koneksi.');
  state.busy = true;
  renderPortfolio();
  try { const data = await api('/api/portfolio', method, { ...body, sha: state.sha }); state.items = data.items; state.sha = data.sha; const ids = new Set(state.items.map(x => x.id)); state.selected = new Set([...state.selected].filter(x => ids.has(x))); activity(message); toast(message); return data; }
  finally { state.busy = false; renderAll(); }
}
function openEdit(item) { $('edit-id').value = item.id; for (const key of ['title', 'category', 'location', 'badge', 'desc']) $(`edit-${key}`).value = item[key] || ''; $('edit-error').textContent = ''; state.editDirty = false; $('edit-dialog').showModal(); }
$('edit-form').oninput = () => state.editDirty = true;
$('edit-dialog').addEventListener('close', () => state.editDirty = false);
$('edit-form').onsubmit = async e => { e.preventDefault(); const button = e.submitter; button.disabled = true; button.textContent = 'Menyimpan…'; $('edit-error').textContent = ''; try { await savePortfolio('PUT', { id: $('edit-id').value, ...Object.fromEntries(new FormData(e.target)) }, 'Detail foto berhasil disimpan.'); state.editDirty = false; $('edit-dialog').close(); } catch (error) { $('edit-error').textContent = error.message; } finally { button.disabled = false; button.textContent = 'Simpan perubahan'; } };
async function deletePhoto(item) { if (!await confirmAction('Hapus dari koleksi?', `“${item.title}” akan dihapus dari daftar website. File foto asli tetap tersimpan di repositori.`, 'Hapus foto')) return; try { await savePortfolio('DELETE', { id: item.id }, `Foto “${item.title}” dihapus dari koleksi.`); } catch (error) { toast(error.message, true); } }
$('delete-selected').onclick = async () => {
  const items = state.items.filter(item => state.selected.has(item.id));
  if (!items.length || state.busy || !state.sha) return;
  const visibleIds = new Set(filtered().map(item => item.id));
  const hidden = items.filter(item => !visibleIds.has(item.id)).length;
  const titles = items.slice(0, 5).map(item => `“${item.title}”`).join(', ');
  const description = `${titles}${items.length > 5 ? `, dan ${items.length - 5} foto lainnya` : ''}. ${hidden ? `${hidden} foto pilihan berada di luar filter saat ini. ` : ''}Foto akan dihapus dari koleksi website. File asli tetap tersimpan di repositori.`;
  if (!await confirmAction(`Hapus ${items.length} foto terpilih?`, description, `Hapus ${items.length} foto`)) return;
  try { await savePortfolio('DELETE', { ids: items.map(item => item.id) }, `${items.length} foto berhasil dihapus dari koleksi.`); } catch (error) { toast(error.message, true); }
};
function updatePublish() { for (const id of ['upload-category', 'upload-location', 'upload-desc']) $(id).disabled = state.uploading; $('upload-file').disabled = state.preparing || state.uploading; $('publish').disabled = !state.photos.length || !state.sha || state.busy || state.preparing || state.uploading; }
function renderQueue() {
  state.photo = state.photos[0]?.data || null;
  $('upload-preview').hidden = !state.photos.length;
  $('upload-queue').replaceChildren();
  for (const photo of state.photos) {
    const row = node('div', 'upload-queue-row'); const image = node('img'); image.src = photo.data; image.alt = photo.name;
    const title = node('input'); title.value = photo.title; title.maxLength = 160; title.required = true; title.setAttribute('aria-label', `Judul ${photo.name}`); title.disabled = state.uploading;
    title.oninput = () => { photo.title = title.value; if (state.photos.length === 1) $('upload-title').value = title.value; };
    const remove = node('button', 'button', 'Hapus'); remove.type = 'button'; remove.disabled = state.uploading || state.preparing; remove.setAttribute('aria-label', `Hapus ${photo.name} dari antrean`);
    remove.onclick = () => { state.photos = state.photos.filter(x => x !== photo); if (state.photos.length === 1) $('upload-title').value = state.photos[0].title; renderQueue(); };
    row.append(image, title, remove); $('upload-queue').append(row);
  }
  $('upload-title').required = state.photos.length <= 1;
  $('upload-title').disabled = state.photos.length > 1 || state.uploading;
  $('upload-info').textContent = `${state.photos.length} foto siap. Album, lokasi, dan deskripsi berlaku untuk semua foto.`;
  updatePublish();
}
const logo = new Image(); logo.src = 'assets/aura_vista_logo_cropped.png';
async function processPhoto(file) {

  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('Pilih JPG, PNG, atau WebP dengan ukuran maksimal 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode(); await logo.decode();

    if (image.width * image.height > 80000000) throw new Error('Resolusi terlalu besar. Gunakan foto di bawah 80 megapiksel.');
    const ratio = Math.min(1, 2400 / Math.max(image.width, image.height)); const canvas = $('watermark-canvas'); canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio); const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const width = canvas.width * .2, height = width * logo.height / logo.width; ctx.globalAlpha = .9; ctx.drawImage(logo, (canvas.width - width) / 2, canvas.height * .035, width, height); ctx.globalAlpha = 1;
    let quality = .9, data = canvas.toDataURL('image/webp', quality); while (data.length > 3800000 && quality > .45) { quality -= .1; data = canvas.toDataURL('image/webp', quality); }
    if (!data.startsWith('data:image/webp;') || data.length > 3800000) throw new Error('Foto belum dapat dikompresi. Gunakan gambar yang lebih kecil.');
    return { data, aspect: `${canvas.width}:${canvas.height}`, title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').slice(0, 160), name: file.name };
  } finally { URL.revokeObjectURL(url); }
}

async function addPhotos(files) {
  if (state.uploading || state.preparing) return;
  if (state.photos.length === 1) state.photos[0].title = $('upload-title').value;
  state.preparing = true; updatePublish(); const errors = [];
  const available = Math.max(0, 20 - state.photos.length);
  if (files.length > available) errors.push('Maksimal 20 foto per unggahan. Foto selebihnya belum ditambahkan.');
  for (const file of Array.from(files).slice(0, available)) {
    $('upload-progress').textContent = `Menyiapkan ${file.name}…`;
    try { state.photos.push(await processPhoto(file)); } catch (error) { errors.push(`${file.name}: ${error.message}`); }
  }
  state.preparing = false; $('upload-file').value = ''; $('upload-error').textContent = errors.join(' ');
  if (state.photos.length === 1 && !$('upload-title').value) $('upload-title').value = state.photos[0].title;
  $('upload-progress').textContent = ''; renderQueue();
}
$('upload-file').onchange = e => addPhotos(e.target.files);
for (const event of ['dragenter', 'dragover']) $('dropzone').addEventListener(event, e => { e.preventDefault(); $('dropzone').classList.add('dragging'); });
for (const event of ['dragleave', 'drop']) $('dropzone').addEventListener(event, e => { e.preventDefault(); $('dropzone').classList.remove('dragging'); });
$('dropzone').addEventListener('drop', e => addPhotos(e.dataTransfer.files));
$('upload-form').onsubmit = async e => {
  e.preventDefault(); if (!state.photos.length || state.uploading || state.preparing || state.busy) return;
  const details = Object.fromEntries(new FormData(e.target)); const single = state.photos.length === 1;
  state.uploading = true; renderQueue(); $('upload-error').textContent = '';
  const total = state.photos.length; let completed = 0;
  try {
    while (state.photos.length) {
      const photo = state.photos[0]; $('upload-progress').textContent = `Mengunggah ${completed + 1} dari ${total} foto…`;
      await savePortfolio('POST', { ...details, title: single ? details.title : photo.title, imageBase64: photo.data, aspect: photo.aspect }, `Foto “${photo.title}” berhasil diterbitkan.`);
      state.photos.shift(); completed++; renderQueue();
    }
    e.target.reset(); $('upload-location').value = locations[$('upload-category').value]; setView('portfolio');
  } catch (error) { $('upload-error').textContent = `${error.message} Foto yang belum berhasil tetap berada di antrean. Muat ulang koneksi jika diperlukan, lalu coba lagi.`; }
  finally { state.uploading = false; if (state.photos.length === 1) $('upload-title').value = state.photos[0].title; $('upload-progress').textContent = `${completed} dari ${total} foto berhasil diterbitkan.`; renderQueue(); }
};
const defaultTheme = { masterShotImg: 'assets/HD_04_living_depan.webp', masterShotTitle: 'Grand Living Space HDR', bgMood: 'obsidian', neonBackground: true };
async function loadTheme() { try { const response = await fetch('https://gist.githubusercontent.com/DhavidFebrian/9919d20671f866fda62afde6b90426e3/raw/auravista_theme_customizer.json?t=' + Date.now(), { signal: AbortSignal.timeout(15000) }); if (!response.ok) throw new Error(); const data = await response.json(); state.theme = { ...defaultTheme, ...data }; } catch { state.theme = { ...defaultTheme }; $('appearance-status').textContent = 'Pengaturan cloud belum dapat dimuat. Pratinjau menggunakan pengaturan default; periksa sebelum menyimpan.'; } if (!state.themeDirty) renderTheme(); }
function renderTheme() {
  const selected = state.themeDirty ? $('master-select').value : state.theme?.masterShotImg || defaultTheme.masterShotImg;
  $('master-select').replaceChildren(); const items = [...state.items]; if (!items.some(x => x.img === defaultTheme.masterShotImg)) items.unshift({ img: defaultTheme.masterShotImg, title: defaultTheme.masterShotTitle }); if (state.theme?.masterShotImg && !items.some(x => x.img === state.theme.masterShotImg)) items.unshift({ img: state.theme.masterShotImg, title: state.theme.masterShotTitle });
  items.forEach(item => { const option = node('option', '', item.title); option.value = item.img; $('master-select').append(option); }); $('master-select').value = selected;
  if (!state.themeDirty) { $('mood').value = state.theme?.bgMood || 'obsidian'; $('ambient').checked = state.theme?.neonBackground !== false; }
  masterPreview();
}
function masterPreview() { $('master-preview').src = photoSource($('master-select').value); $('master-title').textContent = $('master-select').selectedOptions[0]?.textContent || 'Foto sorotan'; }
$('master-select').onchange = masterPreview;
$('appearance-form').oninput = () => { state.themeDirty = true; $('appearance-status').textContent = 'Perubahan belum disimpan.'; };
$('appearance-form').onsubmit = async e => { e.preventDefault(); if (state.busy) return; state.busy = true; const button = e.submitter; button.disabled = true; button.textContent = 'Menyimpan…'; const theme = { masterShotImg: $('master-select').value, masterShotTitle: $('master-title').textContent, bgMood: $('mood').value, neonBackground: $('ambient').checked }; try { const data = await api('/api/sync-theme', 'POST', theme); state.theme = data.theme; state.themeDirty = false; try { localStorage.setItem('auravista_theme_customizer', JSON.stringify(data.theme)); } catch {} $('appearance-status').textContent = 'Tersimpan ke cloud. Buka ulang website untuk melihat perubahan.'; activity('Pengaturan tampilan disimpan.'); toast('Tampilan website berhasil disimpan.'); } catch (error) { $('appearance-status').textContent = error.message; toast(error.message, true); } finally { state.busy = false; button.disabled = false; button.textContent = 'Simpan tampilan'; } };
$('export-json').onclick = () => { downloadBlob(new Blob([JSON.stringify(state.items, null, 2)], { type: 'application/json' }), `AuraVista-backup-${new Date().toISOString().slice(0, 10)}.json`); activity('Cadangan metadata JSON diunduh.'); };
$('export-csv').onclick = () => { const columns = ['id', 'title', 'category', 'location', 'desc', 'img']; const cell = value => { let text = String(value || ''); if (/^[=+\-@\t\r]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }; const csv = [columns.join(','), ...state.items.map(item => columns.map(key => cell(item[key])).join(','))].join('\r\n'); downloadBlob(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), 'AuraVista-koleksi.csv'); };
$('import-file').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 2000000) throw new Error('File backup maksimal 2 MB.');
    const items = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
    if (!Array.isArray(items) || items.length > 1000 || items.some(x => !x || typeof x.title !== 'string' || typeof x.id !== 'string' || !categories[x.category] || typeof x.img !== 'string') || new Set(items.map(x => x.id)).size !== items.length) throw new Error('Struktur backup tidak valid atau memiliki ID duplikat.');
    if (!state.sha) throw new Error('Pulihkan koneksi server sebelum mengimpor cadangan.');
    if (!await confirmAction('Pulihkan cadangan ini?', `${items.length} foto dalam cadangan akan mengganti ${state.items.length} entri metadata di server. Unduh cadangan saat ini sebelum melanjutkan.`, 'Pulihkan metadata')) return;
    await savePortfolio('PATCH', { items }, 'Cadangan metadata berhasil dipulihkan ke server.'); setView('portfolio');
  } catch (error) { toast(error.message, true); } finally { e.target.value = ''; }
};
window.addEventListener('beforeunload', e => { if (state.busy || state.preparing || state.uploading || state.photo || state.themeDirty || state.editDirty) { e.preventDefault(); e.returnValue = ''; } });
async function init() { try { const data = await api('/api/auth'); if (data.authenticated) await enterStudio(); else if (!data.configured) { $('login-error').textContent = 'Login admin belum dikonfigurasi di server.'; $('login-error').hidden = false; } } catch (error) { $('login-error').textContent = error.message; $('login-error').hidden = false; } }
init();

