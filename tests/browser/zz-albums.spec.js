import { test, expect } from '@playwright/test';
test('create an album from upload, preserve draft, publish photo and open its public gallery', async ({ page }) => {
  await page.route('https://gist.githubusercontent.com/**', route => route.fulfill({ json: { masterShotImg: 'assets/HD_04_living_depan.webp', masterShotTitle: 'Master', neonBackground: true, bgMood: 'obsidian' } }));
  // New image URLs use the existing public GitHub storage; keep this QA run isolated.
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ path: 'assets/HD_04_living_depan.webp', contentType: 'image/webp' }));
  await page.goto('/admin.html'); await page.locator('#login-username').fill('studio-test'); await page.locator('#login-password').fill('test-password-only'); await page.locator('#login-form button[type=submit]').click(); await expect(page.locator('#connection')).toHaveText('Terhubung');
  await page.locator('.sidebar [data-view="upload"]').click();
  await page.locator('#upload-file').setInputFiles('assets/HD_04_living_depan.webp'); await expect(page.locator('#upload-preview')).toBeVisible(); await page.locator('#upload-title').fill('Kemang first photograph');
  await page.locator('#new-album').click(); await page.locator('#album-name').fill('Kemang Test Residence'); await page.locator('#album-location').fill('Kemang, Jakarta Selatan'); await page.locator('#album-description').fill('A considered new collection.');
  await page.setViewportSize({ width: 375, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.route('**/api/albums', route => route.request().method() === 'POST' ? route.fulfill({ status: 503, json: { error: 'Album belum tersimpan.' } }) : route.continue());
  await page.getByRole('button', { name: 'Buat album', exact: true }).click(); await expect(page.locator('#album-error')).toHaveText('Album belum tersimpan.'); await expect(page.locator('#album-name')).toHaveValue('Kemang Test Residence');
  await page.unroute('**/api/albums'); await page.getByRole('button', { name: 'Buat album', exact: true }).click(); await expect(page.locator('#album-dialog')).not.toBeVisible();
  await expect(page.locator('#upload-category')).toHaveValue('album-kemang-test-residence'); await expect(page.locator('#upload-location')).toHaveValue('Kemang, Jakarta Selatan'); await expect(page.locator('#upload-title')).toHaveValue('Kemang first photograph'); await expect(page.locator('#upload-preview')).toBeVisible();
  await page.locator('#new-album').click(); await page.locator('#album-name').fill('Kemang Test Residence'); await page.locator('#album-location').fill('Jakarta'); await page.getByRole('button', { name: 'Buat album', exact: true }).click(); await expect(page.locator('#album-error')).toContainText('sudah digunakan'); await page.locator('[data-close="album-dialog"]').last().click();
  const publicPage = await page.context().newPage(); await publicPage.goto('/album.html?id=album-kemang-test-residence'); await expect(publicPage.locator('#collection-title')).toHaveText('Kemang Test Residence'); await expect(publicPage.getByRole('status')).toHaveText('This collection has no photographs yet.');
  await page.locator('#publish').click(); await expect(page.locator('#view-portfolio')).toBeVisible(); await page.locator('#filter-category').selectOption('album-kemang-test-residence'); await expect(page.locator('.media-card')).toHaveCount(1);
  await page.reload(); await expect(page.locator('#connection')).toHaveText('Terhubung'); await page.locator('#filter-category').selectOption('album-kemang-test-residence'); await expect(page.locator('.media-info h3')).toHaveText('Kemang first photograph');
  await publicPage.reload(); await expect(publicPage.locator('.photo-card')).toHaveCount(1); await expect(publicPage.locator('#album-cover')).toBeVisible();
  await publicPage.goto('/'); const albumLink = publicPage.locator('.collection-card[data-custom-album="album-kemang-test-residence"]'); await expect(albumLink).toBeVisible(); await albumLink.click(); await expect(publicPage).toHaveURL(/album.html\?id=album-kemang-test-residence/); await expect(publicPage.locator('.photo-card')).toHaveCount(1);
  await publicPage.goto('/album.html?id=not-found'); await expect(publicPage.locator('#collection-title')).toHaveText('Collection not found');
  await publicPage.close();
});
