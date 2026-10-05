(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => window.lucide?.createIcons());
  const $ = s => document.querySelector(s);
  const make = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls || ''; if (text !== undefined) e.textContent = text; return e; };
  let saved; try { saved = JSON.parse(localStorage.getItem('av-favorites') || '[]'); } catch { saved = []; }
  const favorites = new Set(Array.isArray(saved) ? saved : []);
  let visible = [], current = 0, previousFocus, previousOverflow;
  const box = $('#lightbox');
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'lightbox-title'); box.inert = true;
  const close = box.querySelector('button'); close.setAttribute('aria-label', 'Close photo');
  const controls = make('div', 'av-lightbox-nav');
  const prev = make('button', 'av-button', '← Previous'), next = make('button', 'av-button', 'Next →'), position = make('span', 'av-count');
  controls.append(prev, position, next); box.append(controls); controls.onclick = e => e.stopPropagation();
  function show(index) {
    if (!visible.length) return;
    current = (index + visible.length) % visible.length;
    const item = visible[current]; $('#lightbox-img').src = item.img; $('#lightbox-img').alt = item.title;
    $('#lightbox-title').textContent = item.title; $('#lightbox-desc').textContent = item.desc || '';
    position.textContent = `${current + 1} / ${visible.length}`;
  }
  window.openLightbox = (src, title, desc) => {
    if (!box.classList.contains('active')) { previousFocus = document.activeElement; previousOverflow = document.body.style.overflow; }
    let index = visible.findIndex(x => x.img === src);
    if (index < 0) { visible = [{ img: src, title, desc }]; index = 0; }
    show(index); box.inert = false; box.classList.add('active'); document.body.style.overflow = 'hidden'; close.focus();
  };
  window.closeLightbox = () => { box.classList.remove('active'); box.inert = true; document.body.style.overflow = previousOverflow || ''; previousFocus?.focus(); };
  prev.onclick = () => show(current - 1); next.onclick = () => show(current + 1);
  box.addEventListener('click', e => { if (e.target === box) window.closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!box.classList.contains('active')) return;
    if (e.key === 'Escape') window.closeLightbox();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'Tab') { const buttons = [...box.querySelectorAll('button')]; const first = buttons[0], last = buttons.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  function gallery(grid, items) {
    let onlySaved = false;
    const bar = make('div', 'av-toolbar'); const search = make('input'); search.type = 'search'; search.placeholder = 'Search photos, spaces, or locations…'; search.setAttribute('aria-label', 'Search photographs');
    const filter = make('button', 'av-button', '♡ Saved photos'); filter.setAttribute('aria-pressed', 'false');
    const count = make('span', 'av-count'); count.setAttribute('role', 'status');
    bar.append(search, filter, count); grid.before(bar);
    function render() {
      const query = search.value.trim().toLowerCase();
      visible = items.filter(x => (!onlySaved || favorites.has(x.id)) && `${x.title} ${x.desc} ${x.location}`.toLowerCase().includes(query));
      grid.replaceChildren(); count.textContent = `${visible.length} photograph${visible.length === 1 ? '' : 's'}`;
      if (!visible.length) grid.append(make('p', 'av-empty', onlySaved ? 'No saved photos match. Save a photograph using its heart button.' : 'No photographs found. Try a different search.'));
      visible.forEach(item => {
        const card = make('article', 'av-card'); const photo = make('button', 'av-photo'); photo.type = 'button'; photo.setAttribute('aria-label', `View ${item.title}`);
        const img = make('img'); img.src = item.img; img.alt = item.title; img.loading = 'lazy'; img.decoding = 'async';
        const caption = make('span', 'av-caption'); caption.append(make('strong', '', item.title), make('small', '', item.desc)); photo.append(img, caption);
        photo.onclick = () => window.openLightbox(item.img, item.title, item.desc);
        const save = make('button', 'av-save', favorites.has(item.id) ? '♥' : '♡'); save.setAttribute('aria-pressed', String(favorites.has(item.id))); save.setAttribute('aria-label', `Save ${item.title}`);
        save.onclick = () => { favorites.has(item.id) ? favorites.delete(item.id) : favorites.add(item.id); try { localStorage.setItem('av-favorites', JSON.stringify([...favorites])); } catch {} if (onlySaved) { render(); filter.focus(); } else { save.textContent = favorites.has(item.id) ? '♥' : '♡'; save.setAttribute('aria-pressed', String(favorites.has(item.id))); } };
        card.append(photo, save); grid.append(card);
      });
    }
    search.oninput = render; filter.onclick = () => { onlySaved = !onlySaved; filter.setAttribute('aria-pressed', String(onlySaved)); render(); }; render();
  }
  async function loadGallery(grid, category) {
    if (!grid) return;
    grid.textContent = 'Loading photographs…';
    try {
      const response = await fetch('assets/portfolio_data.json'); if (!response.ok) throw new Error('Unavailable');
      const data = await response.json(); if (!Array.isArray(data)) throw new Error('Invalid data');
      gallery(grid, data.filter(x => x.category === category && typeof x.img === 'string' && /^(assets\/|https:\/\/)/.test(x.img)));
    } catch {
      grid.replaceChildren(make('p', 'av-empty', 'The gallery could not load. Please check your connection.'));
      const retry = make('button', 'av-button', 'Try again'); retry.onclick = () => loadGallery(grid, category); grid.append(retry);
    }
  }
  // Shared entry points used by the page DOMContentLoaded callbacks.
  window.initHomePage = () => { Promise.resolve(window.applyThemeCustomizer?.()).catch(() => {}); return loadGallery($('#enhancement-grid'), 'enhancement'); };
  window.loadAlbum = () => { const grid = $('[id$="-grid"]'); const category = location.pathname.includes('residence') ? 'dharmawangsa_residence' : location.pathname.includes('cilandak') ? 'cilandak' : 'dharmawangsa'; return loadGallery(grid, category); };
  document.querySelectorAll('a[target="_blank"]').forEach(a => a.rel = 'noopener noreferrer');
  if (!$('#hero')) return;
  const skip = make('a', 'av-skip', 'Skip to projects'); skip.href = '#curated-albums'; document.body.prepend(skip);
  const menu = make('button', 'av-button av-menu', 'Menu'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-controls', 'mobile-navigation');
  const nav = make('nav', 'av-mobile-nav'); nav.id = 'mobile-navigation'; nav.hidden = true; nav.setAttribute('aria-label', 'Mobile navigation');
  [['About','#about'],['Services','#services'],['Projects','#curated-albums'],['Enhancement','#enhancement-showcase'],['Start a project','#contact']].forEach(([text, href]) => { const a = make('a','',text); a.href = href; a.onclick = () => { nav.hidden = true; menu.setAttribute('aria-expanded','false'); }; nav.append(a); });
  menu.onclick = () => { nav.hidden = !nav.hidden; menu.setAttribute('aria-expanded', String(!nav.hidden)); }; menu.addEventListener('keydown', e => { if(e.key === 'Escape') { nav.hidden = true; menu.setAttribute('aria-expanded','false'); } }); nav.addEventListener('keydown', e => { if(e.key === 'Escape') { nav.hidden = true; menu.setAttribute('aria-expanded','false'); menu.focus(); } });
  $('header > div > div:last-child').append(menu); $('header').append(nav);
  const brief = make('div', 'av-brief');
  brief.innerHTML = `<div><span class="av-eyebrow">Your next perspective</span><h3>Great spaces deserve<br>a considered story.</h3><p>Tell us a little about your property. Build a project brief, then continue the conversation with our studio on WhatsApp.</p><p>No automatic submission. You can review your message before sending.</p></div><form id="project-brief" class="av-fields"><label><span>Your name *</span><input class="av-input" name="name" autocomplete="name" required maxlength="100" placeholder="Your name"></label><label><span>Service</span><select class="av-input" name="service"><option>Architectural photography</option><option>Cinematic walkthrough</option><option>Drone & estate film</option><option>Editing & enhancement</option><option>Full production</option></select></label><label class="av-wide"><span>Property location *</span><input class="av-input" name="location" required maxlength="180" placeholder="Area, city, or property name"></label><label class="av-wide"><span>What do you have in mind?</span><textarea class="av-input" name="details" rows="3" maxlength="1500" placeholder="Property type, preferred dates, and deliverables"></textarea></label><button class="av-button av-submit av-wide" type="submit">Prepare WhatsApp brief ↗</button></form>`;
  $('#contact').prepend(brief);
  $('#project-brief').onsubmit = e => { e.preventDefault(); const data = new FormData(e.target); const text = `Hello Aura Vista Media!\n\nName: ${data.get('name').trim()}\nService: ${data.get('service')}\nLocation: ${data.get('location').trim()}\nProject details: ${data.get('details').trim() || 'To be discussed'}\n\nI would like to discuss availability and a quotation.`; window.open(`https://wa.me/6285169671344?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); };
  const faq = make('section', 'av-faq'); faq.innerHTML = `<span class="av-eyebrow">Before we begin</span><h2>A little clarity, before the first frame.</h2><details><summary>How do I request a quotation?</summary><p>Use the project brief below to share your location, service, and requirements. The studio can confirm scope, availability, and pricing with you on WhatsApp.</p></details><details><summary>Can I share references from your portfolio?</summary><p>Yes. Tap the heart on any photograph to save it on this browser. Use “Saved photos” in each gallery to revisit your references when discussing the project.</p></details><details><summary>What should I include in my brief?</summary><p>Include the property location, approximate size, intended use of the visuals, preferred shoot dates, and whether you need photographs, a film, or both.</p></details>`; $('#contact').before(faq);
})();
