import { protect } from '../lib/auth.js';
import { imagePath } from '../lib/portfolio.js';
const URL = 'https://api.github.com/gists/9919d20671f866fda62afde6b90426e3';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['POST', 'PATCH'].includes(req.method)) { res.setHeader('Allow', 'POST, PATCH'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!protect(req, res)) return;
  const body = req.body || {};
  if (!imagePath(body.masterShotImg) || typeof body.masterShotTitle !== 'string' || body.masterShotTitle.length > 160 || typeof body.neonBackground !== 'boolean' || !['obsidian', 'midnight', 'dark-slate'].includes(body.bgMood)) return res.status(400).json({ error: 'Pengaturan tampilan tidak valid.' });
  if (!process.env.AURAVISTA_GH_TOKEN) return res.status(503).json({ error: 'Koneksi penyimpanan belum dikonfigurasi.' });
  const theme = { masterShotImg: body.masterShotImg, masterShotTitle: body.masterShotTitle, neonBackground: body.neonBackground, bgMood: body.bgMood, updatedAt: Date.now() };
  try {
    const response = await fetch(URL, { method: 'PATCH', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.AURAVISTA_GH_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ files: { 'auravista_theme_customizer.json': { content: JSON.stringify(theme, null, 2) } } }), signal: AbortSignal.timeout(20000) });
    if (!response.ok) return res.status(502).json({ error: 'Pengaturan belum tersimpan. Periksa koneksi cloud dan coba lagi.' });
    return res.status(200).json({ success: true, theme });
  } catch { return res.status(502).json({ error: 'Koneksi cloud gagal. Coba lagi.' }); }
}
