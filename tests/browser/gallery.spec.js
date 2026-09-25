import { test, expect } from '@playwright/test';
test('album search, empty state and keyboard lightbox navigation', async ({page}) => {
 await page.goto('/album-cilandak.html', {waitUntil:'domcontentloaded'});
 await expect(page.getByRole('button', {name: /View photograph:/})).toHaveCount(10);
 const search=page.getByRole('searchbox', {name:'Search photographs'});
 await search.fill('no-such-room');
 await expect(page.getByText('No photographs match your search.')).toBeVisible();
 await page.getByRole('button',{name:'Clear search'}).click();
 const first=page.getByRole('button',{name:/View photograph:/}).first();
 await first.focus(); await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.locator('#viewer-count')).toHaveText('1 / 10');
 await page.keyboard.press('ArrowRight');
 await expect(page.locator('#viewer-count')).toHaveText('2 / 10');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await expect(first).toBeFocused();
});
