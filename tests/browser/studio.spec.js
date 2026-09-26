import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const items=JSON.parse(await readFile(new URL('../../assets/portfolio_data.json',import.meta.url),'utf8'));
async function login(page){
 await page.route('**/api/portfolio',route=>route.fulfill({json:{success:true,items}}));
 await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
 await page.locator('#login-username').fill('test-operator');
 await page.locator('#login-password').fill('test-only-credential-not-for-production');
 await page.locator('#login-view button[type=submit]').click();
 await expect(page.locator('#app-view')).toBeVisible();
}
test('theme reset reports cloud failure without claiming global success',async({page})=>{
 await login(page);await page.locator('#nav-hero-customizer').click();
 await page.route('**/api/sync-theme',route=>route.fulfill({status:503,json:{success:false,error:'Cloud unavailable'}}));
 const alerts=[];page.on('dialog',async d=>{alerts.push(d.message());await d.accept();});
 await page.getByRole('button',{name:'Reset Default',exact:true}).click();
 await expect.poll(()=>alerts.length).toBe(2);expect(alerts[1]).toContain('Cloud reset failed');
});
test('original photo downloads preserve format and reject HTTP errors',async({page})=>{
 await login(page);await page.locator('#nav-portfolio').click();
 await page.getByLabel('Filter collection').selectOption('dharmawangsa_residence');
 let pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download Max Quality',exact:true}).first().click();
 const download=await pending;expect(download.suggestedFilename()).toMatch(/\.jpg$/);
 const saved=await readFile(await download.path());expect(saved.subarray(0,2).toString('hex')).toBe('ffd8');
 await page.route('**/assets/porto/*.jpg',route=>route.fulfill({status:404,body:'Not found'}));
 const alerts=[];let downloads=0;page.on('download',()=>downloads++);page.on('dialog',async dialog=>{alerts.push(dialog.message());await dialog.dismiss();});
 await page.getByRole('button',{name:'Download Max Quality',exact:true}).first().click();
 await expect.poll(()=>alerts.length).toBe(1);expect(downloads).toBe(0);
});
test('watermark preview processes a real image and clears stale output after invalid input',async({page})=>{
 await login(page);await page.locator('#nav-upload').click();
 await page.locator('#upload-file-input').setInputFiles(new URL('../../assets/porto/porto_01_12302_image_01.webp',import.meta.url).pathname);
 await expect(page.locator('#canvas-preview-container')).toBeVisible();
 expect(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/webp').startsWith('data:image/webp;base64,'))).toBe(true);
 const alerts=[];page.on('dialog',async dialog=>{alerts.push(dialog.message());await dialog.dismiss();});
 await page.locator('#upload-file-input').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
 await expect(page.locator('#canvas-preview-container')).toBeHidden();
 await expect(page.locator('#btn-publish-photo')).toBeDisabled();
 await expect.poll(()=>alerts.length).toBe(1);
});
test('metadata editor is keyboard accessible and keeps edits after failed cloud save',async({page})=>{
 await login(page);await page.locator('#nav-portfolio').click();
 const edit=page.getByRole('button',{name:'Edit',exact:true}).first();await edit.click();
 await expect(page.getByRole('dialog',{name:'Edit Portofolio Karya'})).toBeVisible();
 await page.getByLabel('Judul Karya / Room').fill('Updated title');
 await page.route('**/api/portfolio',route=>route.fulfill({status:409,json:{success:false,error:'Conflict; please reload.'}}));
 page.on('dialog',dialog=>dialog.dismiss());
 await page.getByRole('button',{name:'Simpan Perubahan'}).click();
 await expect(page.getByLabel('Judul Karya / Room')).toHaveValue('Updated title');
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(edit).toBeFocused();
});
test('cloud refresh failure preserves current library and never reports sync success',async({page})=>{
 await login(page);
 await page.route('**/api/portfolio?*',route=>route.fulfill({status:503,json:{success:false,error:'Cloud unavailable'}}));
 const alerts=[];page.on('dialog',async dialog=>{alerts.push(dialog.message());await dialog.accept();});
 await page.locator('#nav-settings').click();
 await page.getByRole('button',{name:'Reload from cloud'}).click();
 await expect.poll(()=>alerts.length).toBe(2);
 expect(alerts[1]).toContain('Cloud unavailable');
 await page.locator('#nav-portfolio').click();
 await expect(page.locator('#portfolio-grid-container > div')).toHaveCount(items.length);
});
test('backup import rejects executable IDs without replacing trusted library',async({page})=>{
 await login(page);
 const alerts=[];page.on('dialog',async dialog=>{alerts.push(dialog.message());await dialog.dismiss();});
 await page.locator('#nav-settings').click();
 const malicious=[{...items[0],id:"x');window.injected=true;//"}];
 await page.locator('input[type=file][accept=".json"]').setInputFiles({name:'unsafe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(malicious))});
 await expect.poll(()=>alerts.length).toBe(1);
 expect(alerts[0]).toContain('Invalid portfolio backup');
 await page.locator('#nav-portfolio').click();
 await expect(page.locator('#portfolio-grid-container > div')).toHaveCount(items.length);
 expect(await page.evaluate(()=>window.injected)).toBeUndefined();
});
test('studio workspace filters residence and selects only matching photos',async({page})=>{
 await login(page);
 await expect(page.getByRole('heading',{name:'A considered collection.'})).toBeVisible();
 await page.locator('#nav-portfolio').click();
 await page.getByLabel('Filter collection').selectOption('dharmawangsa_residence');
 await expect(page.locator('#portfolio-grid-container > div')).toHaveCount(14);
 await page.locator('#select-all-checkbox').check();
 await expect(page.locator('#selected-count-text')).toHaveText('14');
 await page.getByLabel('Search media').fill('no-such-room');
 await expect(page.locator('#select-all-checkbox')).not.toBeChecked();
 await expect(page.getByRole('status')).toContainText('0 photographs');
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
