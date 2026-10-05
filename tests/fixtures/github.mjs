import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function installFixture(root) {
  const originalFetch = globalThis.fetch;
  const documents = new Map();
  const blobs = new Map(), trees = new Map(), commits = new Map();
  const hash = value => createHash('sha1').update(value).digest('hex');
  for (const path of ['assets/portfolio_data.json', 'assets/albums.json']) { const content = await readFile(`${root}/${path}`, 'utf8'); documents.set(path, { content, sha: hash(content) }); }
  let head = 'fixture-head', serial = 0;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (!address.startsWith('https://api.github.com/')) return originalFetch(url, options);
    const path = new URL(address).pathname.replace('/repos/DhavidFebrian/AuraVista-Web', '');
    const body = options.body ? JSON.parse(options.body) : {};
    let data;
    if (path.startsWith('/gists/')) data = {};
    else if (path === '/git/ref/heads/main') data = { object: { sha: head } };
    else if (path.startsWith('/git/commits/') && options.method === 'GET') data = { sha: head, tree: { sha: 'tree-base' } };
    else if (path.startsWith('/contents/') && documents.has(path.slice(10))) { const file = documents.get(path.slice(10)); data = { content: Buffer.from(file.content).toString('base64'), sha: file.sha }; }
    else if (path === '/git/blobs') { const id = hash(body.content); blobs.set(id, body.content); data = { sha: id }; }
    else if (path === '/git/trees') { const id = 'tree-' + ++serial; trees.set(id, body.tree); data = { sha: id }; }
    else if (path === '/git/commits') { const id = 'commit-' + ++serial; commits.set(id, body); data = { sha: id }; }
    else if (path === '/git/refs/heads/main') {
      const commit = commits.get(body.sha);
      if (commit.parents[0] !== head) return Response.json({ message: 'Conflict' }, { status: 422 });
      for (const entry of trees.get(commit.tree)) documents.set(entry.path, { sha: entry.sha, content: blobs.get(entry.sha) });
      head = body.sha; data = { object: { sha: head } };
    } else return Response.json({ message: 'Unexpected fixture request' }, { status: 404 });
    return Response.json(data);
  };
}
