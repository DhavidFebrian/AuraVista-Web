import { protect } from '../lib/auth.js';
import { newAlbum, fail } from '../lib/portfolio.js';
import { readAlbums, commitAlbums } from '../lib/github.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (req.method === 'POST' && !protect(req, res)) return;
  try {
    if (req.method === 'GET') return res.status(200).json({ success: true, ...await readAlbums() });
    const album = newAlbum(req.body || {});
    const result = await commitAlbums(req.body.sha, albums => {
      if (albums.length >= 100) fail('Batas maksimal 100 album telah tercapai.');
      if (albums.some(item => item.id === album.id || item.title.trim().toLowerCase() === album.title.toLowerCase())) fail('Nama album sudah digunakan. Pilih nama lain.', 409);
      return [...albums, album];
    }, `Studio: create album ${album.title}`);
    return res.status(201).json({ ...result, album });
  } catch (error) { return res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Album belum dapat disimpan. Coba lagi.' }); }
}
