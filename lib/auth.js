import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'node:crypto';
const TTL = 60 * 60 * 8;
export function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
export function configured() { return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET?.length >= 32); }
export function passwordMatches(password) {
  const [salt, hash] = (process.env.ADMIN_PASSWORD_HASH || '').split(':');
  return !!salt && !!hash && same(scryptSync(password, salt, 64).toString('hex'), hash);
}
function sign(value) { return createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(value).digest('base64url'); }
export function sessionCookie(req, clear = false) {
  const value = Buffer.from(JSON.stringify({ user: process.env.ADMIN_USERNAME, exp: Date.now() + TTL * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  return `av_session=${clear ? '' : value + '.' + sign(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : TTL}${secure ? '; Secure' : ''}`;
}
export function authenticated(req) {
  if (!configured()) return false;
  try {
    const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('av_session='))?.slice(11);
    if (!token) return false;
    const [value, signature] = token.split('.');
    if (!signature || !same(sign(value), signature)) return false;
    const data = JSON.parse(Buffer.from(value, 'base64url').toString());
    return data.user === process.env.ADMIN_USERNAME && data.exp > Date.now();
  } catch { return false; }
}
export function sameOrigin(req) {
  if (!req.headers.origin) return !req.headers['sec-fetch-site'] || req.headers['sec-fetch-site'] === 'same-origin';
  try { return new URL(req.headers.origin).host === req.headers.host; } catch { return false; }
}
export function protect(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!authenticated(req)) { res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.' }); return false; }
  if (!sameOrigin(req)) { res.status(403).json({ error: 'Origin tidak diizinkan.' }); return false; }
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) { res.status(415).json({ error: 'Gunakan application/json.' }); return false; }
  return true;
}
