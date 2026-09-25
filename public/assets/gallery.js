(() => {
  'use strict';
  const element = (tag, className, text) => {
    const node = document.createElement(tag); node.className = className || '';
    if (text !== undefined) node.textContent = text;
    return node;
  };
  let visible = [], current = 0, trigger;
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
    const item = visible[current]; image.src = item.img; image.alt = item.title;
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
    label.append(search);toolbar.append(label,clear);grid.before(toolbar,status);
    grid.className='editorial-gallery';grid.setAttribute('aria-busy','true');
    let items=[];
    function render() {
      const query=search.value.trim().toLocaleLowerCase();
      const filtered=items.filter(item=>[item.title,item.desc,item.location].join(' ').toLocaleLowerCase().includes(query));
      grid.replaceChildren();
      status.textContent=filtered.length ? `${filtered.length} photograph${filtered.length===1?'':'s'} · Select a frame to explore` : 'No photographs match your search.';
      filtered.forEach((item,index)=>{
        const card=element('button','photo-card');card.type='button';card.setAttribute('aria-label',`View photograph: ${item.title}`);
        const frame=element('div','photo-frame');const img=element('img');img.src=item.img;img.alt=item.title;img.loading='lazy';img.decoding='async';
        const number=element('span','photo-number',String(index+1).padStart(2,'0'));
        frame.append(img,number);card.append(frame,element('span','photo-location',item.location||'Aura Vista Media'),element('span','photo-title',item.title),element('span','photo-description',item.desc||''));
        card.addEventListener('click',()=>{visible=filtered;trigger=card;show(index);dialog.showModal();document.body.style.overflow='hidden';close.focus();});
        grid.append(card);
      });
    }
    async function load() {
      grid.setAttribute('aria-busy','true');status.textContent='Loading photographs…';
      try {
        const response=await fetch('assets/portfolio_data.json');if(!response.ok)throw new Error('Unavailable');
        const data=await response.json();if(!Array.isArray(data))throw new Error('Invalid collection');
        items=data.filter(item=>item.category===grid.dataset.category && typeof item.title==='string' && /^assets\/porto\/[a-zA-Z0-9_(). -]+\.(webp|jpe?g|png)$/i.test(item.img));
        render();
      } catch {
        status.textContent='The collection could not be loaded. Please try again.';
        const retry=element('button','text-action','Retry loading');retry.type='button';retry.addEventListener('click',load);status.append(' ',retry);
      } finally {grid.setAttribute('aria-busy','false');}
    }
    search.addEventListener('input',render);clear.addEventListener('click',()=>{search.value='';render();search.focus();});
    await load();
  }
  document.querySelectorAll('[data-category]').forEach(mount);
})();
