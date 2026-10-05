import { configured, authenticated, passwordMatches, same, sameOrigin, sessionCookie } from '../lib/auth.js';
// Best-effort per-instance throttling; credentials remain server-side.
const attempts = new Map();
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ authenticated: authenticated(req), configured: configured() });
  if (!['POST', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'GET, POST, DELETE'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origin tidak diizinkan.' });
  if (!configured()) return res.status(503).json({ error: 'Login admin belum dikonfigurasi di server.' });
  if (req.method === 'DELETE') { res.setHeader('Set-Cookie', sessionCookie(req, true)); return res.status(200).json({ success: true }); }
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: 'Gunakan application/json.' });
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 256 || username.length > 100) return res.status(400).json({ error: 'Data login tidak valid.' });
  const key = req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  for (const [k, a] of attempts) if (a.until < now) attempts.delete(k);
  const attempt = attempts.get(key) || { count: 0, until: now + 900000 };
  if (attempt.count >= 8) { res.setHeader('Retry-After', String(Math.ceil((attempt.until - now) / 1000))); return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }); }
  const validPassword = passwordMatches(password);
  if (!same(username, process.env.ADMIN_USERNAME) || !validPassword) { attempt.count++; attempts.set(key, attempt); return res.status(401).json({ error: 'Username atau password salah.' }); }
  attempts.delete(key);
  res.setHeader('Set-Cookie', sessionCookie(req));
  return res.status(200).json({ success: true });
}
