import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import auth from '../api/auth.js';
import portfolio from '../api/portfolio.js';
import theme from '../api/sync-theme.js';
import { authenticated, sessionCookie } from '../lib/auth.js';
import { metadata, validateBackup, newPhoto } from '../lib/portfolio.js';
import { installFixture } from './fixtures/github.mjs';
const fetchOriginal = globalThis.fetch;
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1');
process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD_HASH = `salt:${scryptSync('test-password', 'salt', 64).toString('hex')}`;
process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-thirty-two-characters';
process.env.AURAVISTA_GH_TOKEN = 'fixture';
const request = (method, body, cookie = '') => ({ method, body, headers: { 'content-type': 'application/json', host: 'localhost', origin: 'http://localhost', cookie }, socket: { remoteAddress: 'test' } });
async function call(handler, req) { const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(value) { this.body = value; return this; }, end() {} }; await handler(req, res); return res; }
const cookie = () => sessionCookie(request('GET')).split(';')[0];
beforeEach(async () => { globalThis.fetch = fetchOriginal; await installFixture(root); });
after(() => globalThis.fetch = fetchOriginal);
test('credentials are checked server-side; cookie is HttpOnly and tampering fails', async () => {
  assert.equal((await call(auth, request('POST', { username: 'test-admin', password: 'wrong' }))).code, 401);
  const result = await call(auth, request('POST', { username: 'test-admin', password: 'test-password' }));
  assert.equal(result.code, 200); assert.match(result.headers['Set-Cookie'], /HttpOnly; SameSite=Strict/);
  assert.equal(authenticated(request('GET', null, result.headers['Set-Cookie'])), true);
  assert.equal(authenticated(request('GET', null, cookie() + 'x')), false);
  const logout = await call(auth, request('DELETE')); assert.match(logout.headers['Set-Cookie'], /Max-Age=0/);
});
test('all mutation methods require a server session', async () => { for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.equal((await call(portfolio, request(method, {}))).code, 401); assert.equal((await call(theme, request('POST', {}))).code, 401); });
test('cross-origin writes are blocked', async () => { const req = request('PUT', {}, cookie()); req.headers.origin = 'https://other.test'; assert.equal((await call(portfolio, req)).code, 403); });
test('metadata validation rejects unknown categories, blank titles and oversized values', () => { for (const body of [{ title: '', category: 'cilandak' }, { title: 'Hello', category: 'unknown' }, { title: 'x'.repeat(161), category: 'cilandak' }]) assert.throws(() => metadata(body)); });
test('backup rejects duplicate ids and unsafe image paths', () => { const item = { id: 'x', title: 'Photo', category: 'cilandak', img: 'assets/porto/photo.webp' }; assert.throws(() => validateBackup([item, item])); assert.throws(() => validateBackup([{ ...item, img: 'javascript:alert(1)' }])); assert.throws(() => validateBackup([{ ...item, img: 'assets/../secret.webp' }])); });
test('image upload rejects fake WebP and excessive size', () => { const body = { title: 'Photo', category: 'cilandak' }; assert.throws(() => newPhoto({ ...body, imageBase64: 'data:image/webp;base64,YWJj' })); assert.throws(() => newPhoto({ ...body, imageBase64: 'data:image/webp;base64,' + 'A'.repeat(3800004) }), /besar/); });
test('edit persists and stale saves cannot overwrite newer data', async () => {
  const initial = (await call(portfolio, request('GET'))).body;
  const item = initial.items[0];
  const edited = await call(portfolio, request('PUT', { ...item, title: 'Updated title', sha: initial.sha }, cookie()));
  assert.equal(edited.code, 200); assert.equal(edited.body.items[0].title, 'Updated title');
  assert.equal((await call(portfolio, request('DELETE', { id: item.id, sha: initial.sha }, cookie()))).code, 409);
  const latest = (await call(portfolio, request('GET'))).body; assert.equal(latest.items[0].title, 'Updated title');
});
test('upload, restore and deletion persist; deleting missing ids returns 404', async () => {
  const initial = (await call(portfolio, request('GET'))).body;
  const upload = await call(portfolio, request('POST', { title: 'Fixture photo', category: 'enhancement', imageBase64: 'data:image/webp;base64,' + Buffer.from('RIFF0000WEBPfixture').toString('base64'), sha: initial.sha }, cookie()));
  assert.equal(upload.code, 200); assert.equal(upload.body.items.length, initial.items.length + 1);
  const restore = await call(portfolio, request('PATCH', { items: initial.items, sha: upload.body.sha }, cookie())); assert.equal(restore.code, 200);
  const missing = await call(portfolio, request('DELETE', { id: 'nonexistent', sha: restore.body.sha }, cookie())); assert.equal(missing.code, 404);
  const deleted = await call(portfolio, request('DELETE', { id: initial.items[0].id, sha: restore.body.sha }, cookie())); assert.equal(deleted.body.items.length, initial.items.length - 1);
});
test('theme validates data, saves supported fields and omits protected hero settings', async () => {
  const invalid = await call(theme, request('POST', { masterShotImg: 'javascript:alert(1)' }, cookie())); assert.equal(invalid.code, 400);
  const result = await call(theme, request('POST', { masterShotImg: 'assets/HD_04_living_depan.webp', masterShotTitle: 'Master', bgMood: 'obsidian', neonBackground: true, heroBgImg: 'changed' }, cookie())); assert.equal(result.code, 200); assert.equal(result.body.theme.heroBgImg, undefined);
});
test('bulk deletion is atomic, rejects missing ids and protects against stale writes', async () => {
  const original = (await call(portfolio, request('GET'))).body;
  const ids = original.items.slice(0, 2).map(item => item.id);
  const invalid = await call(portfolio, request('DELETE', { ids: [ids[0], 'missing-id'], sha: original.sha }, cookie()));
  assert.equal(invalid.code, 404);
  assert.deepEqual((await call(portfolio, request('GET'))).body.items, original.items);
  for (const value of [[], [ids[0], ids[0]], ['invalid/id'], 'not-an-array']) assert.equal((await call(portfolio, request('DELETE', { ids: value, sha: original.sha }, cookie()))).code, 400);
  const deleted = await call(portfolio, request('DELETE', { ids, sha: original.sha }, cookie()));
  assert.equal(deleted.code, 200);
  assert.deepEqual(deleted.body.items, original.items.filter(item => !ids.includes(item.id)));
  assert.equal((await call(portfolio, request('DELETE', { ids: [original.items[2].id], sha: original.sha }, cookie()))).code, 409);
});
