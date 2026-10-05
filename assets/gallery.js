(() => {
  'use strict';
  const element = (tag, className, text) => {
    const node = document.createElement(tag); node.className = className || '';
    if (text !== undefined) node.textContent = text;
    return node;
  };
  let visible = [], current = 0, trigger;
  const photoSource = path => /^assets\/porto\/porto-[0-9a-f-]{36}\.webp$/.test(path) ? `https://raw.githubusercontent.com/DhavidFebrian/AuraVista-Web/main/${path}` : path;
  let savedIds = []; try { savedIds = JSON.parse(localStorage.getItem('av-favorites') || '[]'); } catch {}
  const favorites = new Set(Array.isArray(savedIds) ? savedIds : []);
  function renderAlbumLinks(albums, photos) {
    document.querySelectorAll('[data-custom-album]').forEach(card => card.remove());
    const home = document.querySelector('.collection-grid');
    const tabs = document.querySelector('.collection-tabs');
    for (const album of albums.filter(item => !item.builtin)) {
      const items = photos.filter(item => item.category === album.id);
      const href = `album.html?id=${encodeURIComponent(album.id)}`;
      if (home && items.length) {
        const card = element('a', 'collection-card'); card.href = href; card.dataset.customAlbum = album.id;
        const meta = element('div', 'collection-meta'); meta.append(element('span', '', 'Collection'), element('span', '', `${items.length} photographs`));
        const img = element('img'); img.src = photoSource(items[0].img); img.alt = album.title; img.loading = 'lazy';
        card.append(meta, img, element('h3', '', album.title), element('p', '', album.desc || album.location), element('span', 'collection-link', 'Explore collection ↗')); home.append(card);
      }
      if (tabs && (items.length || new URLSearchParams(location.search).get('id') === album.id)) {
        const link = element('a', '', album.title); link.href = href; link.dataset.customAlbum = album.id;
        if (new URLSearchParams(location.search).get('id') === album.id) link.setAttribute('aria-current', 'page'); tabs.append(link);
      }
    }
  }
  const dialog = element('dialog', 'photo-viewer');
  dialog.setAttribute('aria-labelledby', 'viewer-title');
  const close = element('button', 'viewer-close', 'Close ×'); close.type = 'button';
  const image = element('img', 'viewer-image');
  const title = element('h2', '', ''); title.id = 'viewer-title';
  const description = element('p', 'viewer-description');
  const controls = element('div', 'viewer-controls');
  const prev = element('button', '', '← Previous'); prev.type = 'button';
  const count = element('span'); count.id = 'viewer-count'; count.setAttribute('aria-live','polite');
  const next = element('button', '', 'Next →'); next.type = 'button';
  controls.append(prev, count, next); dialog.append(close, image, title, description, controls);
  document.body.append(dialog);
  function show(index) {
    current = (index + visible.length) % visible.length;
    const item = visible[current]; image.src = photoSource(item.img); image.alt = item.title;
    title.textContent = item.title; description.textContent = item.desc || '';
    count.textContent = `${current + 1} / ${visible.length}`;
  }
  function dismiss() { dialog.close(); }
  close.addEventListener('click', dismiss);
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; trigger?.focus(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dismiss(); } });
  prev.addEventListener('click', () => show(current-1)); next.addEventListener('click', () => show(current+1));
  dialog.addEventListener('keydown', e => {
    if(e.key==='ArrowRight') {e.preventDefault();show(current+1);}
    if(e.key==='ArrowLeft') {e.preventDefault();show(current-1);}
  });
  async function mount(grid) {
    const toolbar=element('div','gallery-toolbar');
    const label=element('label','','Search photographs');
    const search=element('input'); search.type='search'; search.placeholder='Try “living”, “pool” or “facade”'; search.maxLength=120;
    search.id=grid.id+'-search'; label.htmlFor=search.id;
    const clear=element('button','text-action','Clear search');clear.type='button';
    const status=element('p','gallery-status','Loading photographs…');status.setAttribute('role','status');
    const sortLabel=element('label','','Sort photographs');
    const sort=element('select');sort.id=grid.id+'-sort';sortLabel.htmlFor=sort.id;
    for(const [value,text] of [['curated','Curated order'],['title','Title · A–Z']]){const option=element('option','',text);option.value=value;sort.append(option);}
    sortLabel.append(sort);
    const layout=element('button','layout-toggle','Contact sheet');layout.type='button';layout.setAttribute('aria-pressed','false');
    layout.addEventListener('click',()=>{const compact=layout.getAttribute('aria-pressed')!=='true';layout.setAttribute('aria-pressed',String(compact));if(compact)grid.dataset.layout='compact';else delete grid.dataset.layout;});
    const saved = element('button', 'layout-toggle', 'Saved photos'); saved.type = 'button'; saved.setAttribute('aria-pressed', 'false');
    let onlySaved = false;
    saved.onclick = () => { onlySaved = !onlySaved; saved.setAttribute('aria-pressed', String(onlySaved)); render(); };
    label.append(search);toolbar.append(label,clear,sortLabel,layout,saved);grid.before(toolbar,status);
    grid.className='editorial-gallery';grid.setAttribute('aria-busy','true');
    let items=[];
    function render() {
      const query=search.value.trim().toLocaleLowerCase();
      const filtered=items.filter(item=>(!onlySaved || favorites.has(item.id)) && [item.title,item.desc,item.location].join(' ').toLocaleLowerCase().includes(query));
      if(sort.value==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title));
      grid.replaceChildren();
      status.textContent=filtered.length ? `${filtered.length} photograph${filtered.length===1?'':'s'} · Select a frame to explore` : items.length ? 'No photographs match your search.' : 'This collection has no photographs yet.';
      filtered.forEach((item,index)=>{
        const card=element('button','photo-card');card.type='button';card.setAttribute('aria-label',`View photograph: ${item.title}`);
        const frame=element('div','photo-frame');const img=element('img');img.src=photoSource(item.img);img.alt=item.title;img.loading='lazy';img.decoding='async';
        const number=element('span','photo-number',String(index+1).padStart(2,'0'));
        frame.append(img,number);card.append(frame,element('span','photo-location',item.location||'Aura Vista Media'),element('span','photo-title',item.title),element('span','photo-description',item.desc||''));
        card.addEventListener('click',()=>{visible=filtered;trigger=card;show(index);dialog.showModal();document.body.style.overflow='hidden';close.focus();});
        const wrapper = element('article', 'gallery-entry'); const heart = element('button', 'gallery-save', favorites.has(item.id) ? '♥' : '♡'); heart.type = 'button'; heart.setAttribute('aria-label', `Save ${item.title}`); heart.setAttribute('aria-pressed', String(favorites.has(item.id)));
        heart.onclick = () => { favorites.has(item.id) ? favorites.delete(item.id) : favorites.add(item.id); try { localStorage.setItem('av-favorites', JSON.stringify([...favorites])); } catch {} if (onlySaved) render(); else { heart.textContent = favorites.has(item.id) ? '♥' : '♡'; heart.setAttribute('aria-pressed', String(favorites.has(item.id))); } };
        wrapper.append(card, heart); grid.append(wrapper);
      });
    }
    async function load() {
      grid.setAttribute('aria-busy','true');status.textContent='Loading photographs…';
      try {
        let data, albums = [];
        try { const live = await fetch('/api/portfolio', { signal: AbortSignal.timeout(12000) }); if (!live.ok) throw new Error(); const payload = await live.json(); if (!Array.isArray(payload.items)) throw new Error(); data = payload.items; albums = payload.albums || []; }
        catch { const response=await fetch('assets/portfolio_data.json');if(!response.ok)throw new Error('Unavailable'); data=await response.json(); const albumResponse = await fetch('assets/albums.json'); if (albumResponse.ok) albums = await albumResponse.json(); }
        if(!Array.isArray(data))throw new Error('Invalid collection');
        if (grid.hasAttribute('data-dynamic-album')) {
          const id = new URLSearchParams(location.search).get('id'); const album = albums.find(item => item.id === id);
          if (!album) { document.getElementById('collection-title').textContent = 'Collection not found'; status.textContent = 'This album does not exist. Return to All collections to explore the portfolio.'; return; }
          grid.dataset.category = album.id; document.title = `${album.title} — Aura Vista Media`;
          document.getElementById('collection-title').textContent = album.title; document.getElementById('album-location').textContent = album.location; document.getElementById('album-description').textContent = album.desc || 'A curated collection by Aura Vista Media.';
          const cover = data.find(item => item.category === album.id);
          document.getElementById('album-cover').hidden = !cover;
          if (cover) { const img = document.getElementById('album-cover-image'); img.src = photoSource(cover.img); img.alt = cover.title; document.getElementById('album-cover-title').textContent = cover.title; }
        }
        document.querySelectorAll('.collection-card').forEach(card => { const href = card.getAttribute('href'); const category = href.includes('residence') ? 'dharmawangsa_residence' : href.includes('cilandak') ? 'cilandak' : 'dharmawangsa'; const counter = card.querySelector('.collection-meta span:last-child'); if (counter) counter.textContent = `${data.filter(x => x.category === category).length} photographs`; });
        renderAlbumLinks(albums, data);
        items=data.filter(item=>item.category===grid.dataset.category && typeof item.title==='string' && /^assets\/porto\/[a-zA-Z0-9_(). -]+\.(webp|jpe?g|png)$/i.test(item.img));
        document.querySelectorAll('[data-collection-count]').forEach(node=>node.textContent=items.length);
        render();
      } catch {
        status.textContent='The collection could not be loaded. Please try again.';
        const retry=element('button','text-action','Retry loading');retry.type='button';retry.addEventListener('click',load);status.append(' ',retry);
      } finally {grid.setAttribute('aria-busy','false');}
    }
    sort.addEventListener('change',render);
    search.addEventListener('input',render);clear.addEventListener('click',()=>{search.value='';render();search.focus();});
    await load();
  }
  document.querySelectorAll('[data-category]').forEach(mount);
})();
