import { fail } from './portfolio.js';
const REPO = 'DhavidFebrian/AuraVista-Web';
const PATH = 'assets/portfolio_data.json';
export async function github(path, method = 'GET', body) {
  const token = process.env.AURAVISTA_GH_TOKEN;
  if (!token) fail('Koneksi penyimpanan belum dikonfigurasi.', 503);
  const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'AuraVista-Studio', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  if (!response.ok) fail([409, 422].includes(response.status) ? 'Data berubah. Muat ulang sebelum menyimpan kembali.' : 'Penyimpanan tidak dapat diakses. Silakan coba lagi.', [409, 422].includes(response.status) ? 409 : 502);
  return response.json();
}
async function readDocument(path, ref = 'main') {
  const file = await github(`/contents/${path}?ref=${encodeURIComponent(ref)}`);
  return { value: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8').replace(/^\uFEFF/, '')), sha: file.sha };
}
export async function readAlbums(ref = 'main') { const data = await readDocument('assets/albums.json', ref); return { albums: data.value, sha: data.sha }; }
export async function readPortfolio(ref = 'main') {
  const [data, albums] = await Promise.all([readDocument(PATH, ref), readAlbums(ref)]);
  return { items: data.value, sha: data.sha, albums: albums.albums, albumsSha: albums.sha };
}
async function commitDocument(path, expectedSha, transform, message, photo) {
  if (typeof expectedSha !== 'string' || !expectedSha) fail('Versi data diperlukan. Muat ulang dashboard.', 409);
  const ref = await github('/git/ref/heads/main');
  const parent = await github(`/git/commits/${ref.object.sha}`);
  const current = await readDocument(path, parent.sha);
  if (expectedSha !== current.sha) fail('Data telah diperbarui dari sesi lain. Muat ulang lalu ulangi perubahan.', 409);
  const items = transform(current.value);
  const blob = await github('/git/blobs', 'POST', { content: JSON.stringify(items, null, 2) + '\n', encoding: 'utf-8' });
  const entries = [{ path, mode: '100644', type: 'blob', sha: blob.sha }];
  if (photo) { const image = await github('/git/blobs', 'POST', { content: photo.content, encoding: 'base64' }); entries.push({ path: photo.item.img, mode: '100644', type: 'blob', sha: image.sha }); }
  const tree = await github('/git/trees', 'POST', { base_tree: parent.tree.sha, tree: entries });
  const commit = await github('/git/commits', 'POST', { message, tree: tree.sha, parents: [parent.sha] });
  await github('/git/refs/heads/main', 'PATCH', { sha: commit.sha, force: false });
  return { success: true, items, sha: blob.sha, commit: commit.sha };
}
export async function commitPortfolio(expectedSha, transform, message, photo) { return commitDocument(PATH, expectedSha, transform, message, photo); }
export async function commitAlbums(expectedSha, transform, message) { const { items, ...result } = await commitDocument('assets/albums.json', expectedSha, transform, message); return { ...result, albums: items }; }
