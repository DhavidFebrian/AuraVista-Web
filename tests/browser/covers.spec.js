import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const seed=JSON.parse(readFileSync('assets/portfolio_data.json','utf8'));
const registry=JSON.parse(readFileSync('assets/albums.json','utf8'));
test('select album covers, persist after reload, publish built-in and custom covers and fall back after removal',async({page})=>{
 await page.route('https://raw.githubusercontent.com/**',route=>route.fulfill({path:'assets/HD_04_living_depan.webp',contentType:'image/webp'}));
 await page.goto('/admin.html');await page.locator('#login-username').fill('studio-test');await page.locator('#login-password').fill('test-password-only');await page.locator('#login-form button[type=submit]').click();await expect(page.locator('#connection')).toHaveText('Terhubung');
 for(const album of [registry.find(x=>x.id==='cilandak'),registry.find(x=>!x.builtin&&seed.filter(p=>p.category===x.id).length>1)].filter(Boolean)) {
  const photos=seed.filter(p=>p.category===album.id);const target=photos[1];
  await page.locator('.sidebar [data-view="portfolio"]').click();await page.locator('#filter-category').selectOption(album.id);
  const firstCover=page.locator('.media-card').filter({has:page.getByRole('heading',{name:photos[0].title,exact:true})}).locator('.set-cover');
  await expect(firstCover).toBeEnabled(); await firstCover.click(); await expect(firstCover).toBeDisabled();
  const card=page.locator('.media-card').filter({has:page.getByRole('heading',{name:target.title,exact:true})});
  await card.locator('.set-cover').click();await expect(card.locator('.set-cover')).toHaveText('✓ Cover album');
  await page.reload();await expect(page.locator('#connection')).toHaveText('Terhubung');await page.locator('#filter-category').selectOption(album.id);await expect(card.locator('.set-cover')).toBeDisabled();
  await page.setViewportSize({width:375,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const publicPage=await page.context().newPage();await publicPage.goto('/');
  const selector=album.builtin?'.collection-card[href="album-cilandak.html"] img':`.collection-card[data-custom-album="${album.id}"] img`;
  await expect(publicPage.locator(selector)).toHaveAttribute('src',new RegExp(target.img.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'));
  await publicPage.goto(album.builtin?'/album-cilandak.html':`/album.html?id=${album.id}`);await expect(publicPage.locator('.collection-cover img')).toHaveAttribute('alt',target.title);
  await publicPage.route('**/api/portfolio',async route=>{const response=await route.fetch();const data=await response.json();data.items=data.items.filter(p=>p.id!==target.id);await route.fulfill({json:data});});
  await publicPage.reload();await expect(publicPage.locator('.collection-cover img')).toHaveAttribute('alt',photos[0].title);await publicPage.close();
 }
});
