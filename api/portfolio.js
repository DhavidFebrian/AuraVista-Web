import { protect } from '../lib/auth.js';
import { metadata, newPhoto, validateBackup, fail } from '../lib/portfolio.js';
import { readPortfolio, commitPortfolio } from '../lib/github.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) { res.setHeader('Allow', 'GET, POST, PUT, DELETE, PATCH'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (req.method !== 'GET' && !protect(req, res)) return;
  try {
    if (req.method === 'GET') return res.status(200).json({ success: true, ...await readPortfolio() });
    const body = req.body || {};
    let result;
    if (req.method === 'POST') {
      const photo = newPhoto(body);
      result = await commitPortfolio(body.sha, items => [photo.item, ...items], `Studio: upload ${photo.item.title}`, photo);
    } else if (req.method === 'PATCH') {
      const backup = validateBackup(body.items);
      result = await commitPortfolio(body.sha, current => {
        const knownImages = new Set(current.map(x => x.img));
        if (backup.some(x => !knownImages.has(x.img))) fail('Backup memuat foto yang tidak ada dalam koleksi saat ini. Pulihkan file foto terlebih dahulu.');
        return backup;
      }, 'Studio: restore portfolio metadata backup');
    } else if (req.method === 'DELETE') {
      const ids = body.ids ?? [body.id];
      if (!Array.isArray(ids) || !ids.length || ids.length > 1000 || ids.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) || new Set(ids).size !== ids.length) fail('Pilih foto yang valid untuk dihapus.');
      const selected = new Set(ids);
      result = await commitPortfolio(body.sha, items => {
        if (ids.some(id => !items.some(item => item.id === id))) fail('Sebagian foto tidak ditemukan. Muat ulang koleksi sebelum menghapus.', 404);
        return items.filter(item => !selected.has(item.id));
      }, `Studio: remove ${ids.length} portfolio photo(s)`);
    } else {
      if (typeof body.id !== 'string') fail('ID foto diperlukan.');
      const changes = req.method === 'PUT' ? metadata(body) : null;
      result = await commitPortfolio(body.sha, items => {
        if (!items.some(x => x.id === body.id)) fail('Foto tidak ditemukan.', 404);
        return changes ? items.map(x => x.id === body.id ? { ...x, ...changes } : x) : items.filter(x => x.id !== body.id);
      }, `Studio: ${changes ? 'edit' : 'remove'} ${body.id}`);
    }
    return res.status(200).json(result);
  } catch (error) { return res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Server tidak dapat memproses permintaan. Coba lagi.' }); }
}
