import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { scryptSync } from 'node:crypto';
import auth from '../api/auth.js';
import portfolio from '../api/portfolio.js';
import theme from '../api/sync-theme.js';
const root = resolve(import.meta.dirname, '..');
if (process.env.AV_TEST_FIXTURES === '1') {
  process.env.ADMIN_USERNAME = 'studio-test';
  process.env.ADMIN_PASSWORD_HASH = `test-salt:${scryptSync('test-password-only', 'test-salt', 64).toString('hex')}`;
  process.env.ADMIN_SESSION_SECRET = 'local-test-session-secret-never-used-in-production';
  process.env.AURAVISTA_GH_TOKEN = 'test-token';
  const { installFixture } = await import('../tests/fixtures/github.mjs'); await installFixture(root);
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  res.status = code => { res.statusCode = code; return res; };
  res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
  try {
    const url = new URL(req.url, 'http://localhost');
    const handler = { '/api/auth': auth, '/api/portfolio': portfolio, '/api/sync-theme': theme }[url.pathname];
    if (handler) {
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 4400000) return res.status(413).json({ error: 'Request too large' }); }
      if (body) { try { req.body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); } }
      await handler(req, res); return;
    }
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    const relative = path.slice(root.length + 1).replaceAll(sep, '/');
    if (!path.startsWith(root + sep) || !(relative.startsWith('assets/') || /^[a-z-]+\.html$/.test(relative))) return res.status(404).end();
    const bytes = await readFile(path); res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream'); res.end(bytes);
  } catch { res.status(404).end('Not found'); }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Aura Vista local server: http://127.0.0.1:${process.env.PORT || 4173}`));
