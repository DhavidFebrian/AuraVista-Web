import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
test('multiple photos preserve pending queue after partial failure and retry only remaining photos', async ({ page }) => {
 await page.goto('/admin.html'); await page.locator('#login-username').fill('studio-test'); await page.locator('#login-password').fill('test-password-only'); await page.locator('#login-form button[type=submit]').click(); await expect(page.locator('#connection')).toHaveText('Terhubung');
 await page.locator('.sidebar [data-view="upload"]').click();
 const buffer=readFileSync('assets/HD_04_living_depan.webp');
 await page.locator('#upload-file').setInputFiles(['one','two','three'].map(name=>({name:name+'.webp',mimeType:'image/webp',buffer})));
 await expect(page.locator('.upload-queue-row')).toHaveCount(3); await expect(page.locator('#publish')).toBeEnabled();
 await page.locator('.upload-queue-row').last().getByRole('button').click(); await expect(page.locator('.upload-queue-row')).toHaveCount(2);
 await page.locator('.upload-queue-row input').first().fill('Batch first'); await page.locator('.upload-queue-row input').last().fill('Batch second');
 await page.setViewportSize({width:375,height:844}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 let requests=0;
 await page.route('**/api/portfolio',route=>{ if(route.request().method()==='POST' && ++requests===2) return route.fulfill({status:503,json:{error:'Temporary failure'}}); return route.continue(); });
 await page.locator('#publish').click(); await expect(page.locator('#upload-error')).toContainText('Temporary failure'); await expect(page.locator('.upload-queue-row')).toHaveCount(1); await expect(page.locator('#upload-title')).toHaveValue('Batch second');
 await page.locator('#publish').click(); await expect(page.locator('#view-portfolio')).toBeVisible(); expect(requests).toBe(3);
 await expect(page.locator('.media-info h3').filter({hasText:'Batch first'})).toHaveCount(1); await expect(page.locator('.media-info h3').filter({hasText:'Batch second'})).toHaveCount(1);
 const result=await (await page.request.get('/api/portfolio')).json();
 const response=await page.request.delete('/api/portfolio',{data:{sha:result.sha,ids:result.items.filter(x=>['Batch first','Batch second'].includes(x.title)).map(x=>x.id)}}); expect(response.ok()).toBeTruthy();
});
