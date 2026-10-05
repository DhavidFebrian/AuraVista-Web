import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const seed = JSON.parse(await readFile(new URL('../../assets/portfolio_data.json', import.meta.url).pathname.replace('/tests/assets/', '/assets/').replace(/^\/([A-Z]:)/i, '$1'), 'utf8'));
async function login(page) {
  await page.route('https://gist.githubusercontent.com/**', route => route.fulfill({ json: { masterShotImg: 'assets/HD_04_living_depan.webp', masterShotTitle: 'Grand Living Space HDR', neonBackground: true, bgMood: 'obsidian' } }));
  await page.goto('/admin.html'); await page.getByLabel('Username', { exact: true }).fill('studio-test'); await page.getByLabel('Password', { exact: true }).fill('test-password-only'); await page.getByRole('button', { name: 'Masuk ke studio' }).click(); await expect(page.locator('#app-view')).toBeVisible(); await expect(page.locator('#connection')).toHaveText('Terhubung');
}
test('login, session reload, logout and invalid credentials', async ({ page }) => {
  await page.goto('/admin.html'); await page.getByLabel('Username', { exact: true }).fill('studio-test'); await page.getByLabel('Password', { exact: true }).fill('wrong'); await page.getByRole('button', { name: 'Masuk ke studio' }).click(); await expect(page.getByRole('alert')).toContainText('salah');
  await page.getByRole('button', { name: 'Tampilkan password' }).click(); await expect(page.locator('#login-password')).toHaveAttribute('type', 'text');
  await login(page); await page.reload(); await expect(page.locator('#app-view')).toBeVisible(); await page.getByRole('button', { name: 'Keluar dari studio' }).click(); await expect(page.locator('#login-view')).toBeVisible();
});
test('category counts, location search, filtered selection, sort and preview keyboard', async ({ page }) => {
  await login(page); await expect(page.locator('#stat-total')).toHaveText(String(seed.length));
  const categories = ['dharmawangsa', 'dharmawangsa_residence']; await expect(page.locator('#stat-dharmawangsa')).toHaveText(String(seed.filter(x => categories.includes(x.category)).length));
  await page.locator('.sidebar [data-view="portfolio"]').click(); await page.locator('#filter-category').selectOption('cilandak');
  const expected = seed.filter(x => x.category === 'cilandak').length; await expect(page.locator('.media-card')).toHaveCount(expected); await page.locator('#select-all').check(); await expect(page.locator('#download-selected')).toContainText(`(${expected})`);
  await page.locator('#filter-category').selectOption('all'); await expect(page.locator('#select-all')).not.toBeChecked();
  await page.locator('#search').fill('South Jakarta'); await expect(page.locator('.media-card')).toHaveCount(seed.filter(x => `${x.title} ${x.desc || ''} ${x.location || ''}`.toLowerCase().includes('south jakarta')).length);
  await page.locator('#search').fill('no-such-photo-123'); await expect(page.locator('#empty-state')).toBeVisible(); await expect(page.locator('#select-all')).not.toBeChecked();
  await page.locator('#reset-filters').click(); await page.locator('#sort').selectOption('az'); const ordered = [...seed].sort((a, b) => a.title.localeCompare(b.title)); await expect(page.locator('.media-info h3').first()).toHaveText(ordered[0].title);
  await page.locator('.media-photo > button').first().click(); await expect(page.locator('#preview-title')).toHaveText(ordered[0].title); await page.keyboard.press('ArrowRight'); await expect(page.locator('#preview-title')).toHaveText(ordered[1].title); await page.keyboard.press('Escape'); await expect(page.locator('#preview-dialog')).not.toBeVisible();
});
test('edit persists after reload; untrusted text stays text; backup JSON and CSV download', async ({ page }) => {
  await login(page); await page.locator('.sidebar [data-view="portfolio"]').click(); await page.locator('.media-actions button').filter({ hasText: /^Edit$/ }).first().click();
  const title = `Studio's <b>test</b>`; await page.locator('#edit-title').fill(title); await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click(); await expect(page.locator('#edit-dialog')).not.toBeVisible(); await page.reload(); await expect(page.locator('.media-info h3').first()).toHaveText(title); await expect(page.locator('.media-info h3 b')).toHaveCount(0);
  await page.locator('.media-actions button').filter({ hasText: /^Edit$/ }).first().click(); await page.locator('#edit-title').fill(seed[0].title); await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click(); await expect(page.locator('#edit-dialog')).not.toBeVisible();
  await page.locator('.sidebar [data-view="settings"]').click(); const jsonPromise = page.waitForEvent('download'); await page.locator('#export-json').click(); expect((await jsonPromise).suggestedFilename()).toMatch(/\.json$/); const csvPromise = page.waitForEvent('download'); await page.locator('#export-csv').click(); expect((await csvPromise).suggestedFilename()).toMatch(/\.csv$/);
});
test('watermark upload, validation, atomic publish and delete with cancellation', async ({ page }) => {
  await login(page); await page.locator('.sidebar [data-view="upload"]').click();
  await page.locator('#upload-file').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') }); await expect(page.locator('#upload-error')).toContainText('Pilih JPG');
  await page.locator('#upload-file').setInputFiles('assets/HD_04_living_depan.webp'); await expect(page.locator('#upload-preview')).toBeVisible(); await page.locator('#upload-title').fill('E2E temporary photograph'); await page.locator('#upload-category').selectOption('enhancement'); await page.locator('#upload-desc').fill('Temporary isolated fixture'); await page.locator('#publish').click(); await expect(page.locator('#view-portfolio')).toBeVisible(); await expect(page.locator('.media-info h3').first()).toHaveText('E2E temporary photograph');
  await page.locator('.media-actions button').filter({ hasText: /^Hapus$/ }).first().click(); await page.locator('#confirm-cancel').click(); await expect(page.locator('.media-info h3').first()).toHaveText('E2E temporary photograph'); await page.locator('.media-actions button').filter({ hasText: /^Hapus$/ }).first().click(); await page.locator('#confirm-accept').click(); await expect(page.locator('#stat-total')).toHaveText(String(seed.length));
});
test('backup validates, confirms and restores server metadata; appearance saves', async ({ page }) => {
  await login(page); await page.locator('.sidebar [data-view="settings"]').click(); await page.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') }); await expect(page.locator('#toast')).toHaveClass(/error/);
  await page.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(seed)) }); await expect(page.locator('#confirm-title')).toHaveText('Pulihkan cadangan ini?'); await page.locator('#confirm-accept').click(); await expect(page.locator('#view-portfolio')).toBeVisible();
  await page.locator('.sidebar [data-view="appearance"]').click(); await page.locator('#mood').selectOption('midnight'); await page.locator('#ambient').uncheck(); await page.getByRole('button', { name: 'Simpan tampilan', exact: true }).click(); await expect(page.locator('#appearance-status')).toContainText('Tersimpan ke cloud');
});
test('API failure is read-only and empty API collection does not resurrect static data', async ({ page }) => {
  await page.route('**/api/portfolio', route => route.fulfill({ status: 503, json: { error: 'Fixture offline' } })); await page.goto('/admin.html'); await page.getByLabel('Username', { exact: true }).fill('studio-test'); await page.getByLabel('Password', { exact: true }).fill('test-password-only'); await page.getByRole('button', { name: 'Masuk ke studio' }).click(); await expect(page.locator('#data-warning')).toBeVisible(); await page.locator('.sidebar [data-view="portfolio"]').click(); await expect(page.locator('.media-actions button').filter({ hasText: /^Edit$/ }).first()).toBeDisabled();
  await page.unroute('**/api/portfolio'); await page.route('**/api/portfolio', route => route.fulfill({ json: { success: true, items: [], sha: 'empty' } })); await page.locator('#refresh').click(); await expect(page.locator('#stat-total')).toHaveText('0'); await expect(page.locator('#empty-state')).toBeVisible();
});
test('desktop and mobile layouts have no horizontal overflow or runtime errors', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message)); await login(page);
  for (const width of [1440, 1024, 768, 390, 375]) { await page.setViewportSize({ width, height: 960 }); for (const view of ['overview', 'portfolio', 'upload', 'appearance', 'settings']) { await page.locator(`.sidebar [data-view="${view}"]`).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); } }
  await page.setViewportSize({ width: 1440, height: 1050 }); await page.locator('.sidebar [data-view="overview"]').click(); await page.screenshot({ path: 'work/admin-desktop.png', fullPage: true }); await page.locator('.sidebar [data-view="portfolio"]').click(); await page.screenshot({ path: 'work/admin-library.png', fullPage: true }); await page.setViewportSize({ width: 390, height: 844 }); await page.locator('.sidebar [data-view="overview"]').click(); await page.screenshot({ path: 'work/admin-mobile.png', fullPage: true }); expect(errors).toEqual([]);
});
test('saved photos and protected landing scroll hero work', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/album-cilandak.html'); await expect(page.locator('.photo-card')).toHaveCount(10);
  await page.locator('.gallery-save').first().click(); await page.getByRole('button', { name: 'Saved photos', exact: true }).click(); await expect(page.locator('.photo-card')).toHaveCount(1);
  await page.locator('.photo-card').first().click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
  await page.goto('/'); await expect(page.locator('#hero-scrub-canvas')).toBeVisible(); await page.evaluate(() => scrollTo(0, innerHeight * 2)); await expect(page.locator('#hero-stage-1')).toHaveCSS('opacity', '0');
  await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => scrollTo(0, document.querySelector('#curated-albums').offsetTop)); await page.screenshot({ path: 'work/landing-mobile.png' }); expect(errors).toEqual([]);
});
