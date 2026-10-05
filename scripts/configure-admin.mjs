// Run locally once after `vercel login`; generated credentials never enter Git.
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const username = 'david';
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const env = [{ key: 'ADMIN_USERNAME', value: username }, { key: 'ADMIN_PASSWORD_HASH', value: hash }, { key: 'ADMIN_SESSION_SECRET', value: randomBytes(48).toString('base64url') }].map(x => ({ ...x, type: 'encrypted', target: ['production', 'preview'] }));
await mkdir('work', { recursive: true });
await writeFile('work/admin-environment.json', JSON.stringify(env));
await writeFile('work/ADMIN-ACCESS.txt', `Aura Vista Studio\nUsername: ${username}\nPassword: ${password}\n\nSimpan di password manager. File ini hanya lokal dan tidak dipush atau dideploy.\n`);
for (const entry of env) {
  const result = spawnSync(process.platform === 'win32' ? 'vercel.cmd' : 'vercel', ['env', 'add', entry.key, 'production,preview', '--scope', 'davv', '--force', '--yes', '--sensitive'], { shell: process.platform === 'win32', input: entry.value, encoding: 'utf8' });
  if (result.status !== 0) { console.error(`Failed to configure ${entry.key}: ${result.stderr}`); process.exit(result.status || 1); }
  console.log(`Configured ${entry.key}.`);
}
console.log('Admin credentials configured; access details saved locally in work/ADMIN-ACCESS.txt.');
