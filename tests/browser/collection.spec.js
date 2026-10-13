import {test,expect} from '@playwright/test';
test('editorial collections expose navigation, sorting and a compact contact sheet',async({page})=>{
 await page.goto('/album-cilandak.html',{waitUntil:'domcontentloaded'});
 await expect(page.getByRole('heading',{name:'Cilandak',exact:true})).toBeVisible();
 const cover=page.locator('.collection-cover img');await expect(cover).toBeVisible();
 expect(await cover.evaluate(node=>Math.abs(node.getBoundingClientRect().width/node.getBoundingClientRect().height-node.naturalWidth/node.naturalHeight))).toBeLessThan(.02);
 const preview=page.locator('.photo-frame img').first();await expect(preview).toBeVisible();
 expect(await preview.evaluate(node=>Math.abs(node.getBoundingClientRect().width/node.getBoundingClientRect().height-node.naturalWidth/node.naturalHeight))).toBeLessThan(.02);
 await page.getByLabel('Sort photographs').selectOption('title');
 const titles=await page.locator('.photo-title').allTextContents();
 expect(titles).toEqual([...titles].sort((a,b)=>a.localeCompare(b)));
 await page.getByRole('button',{name:'Contact sheet'}).click();
 await expect(page.getByRole('button',{name:'Contact sheet'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.editorial-gallery')).toHaveAttribute('data-layout','compact');
 await page.getByRole('link',{name:'Dharmawangsa Residence',exact:true}).first().click();
 await expect(page.getByRole('button',{name:/View photograph:/})).toHaveCount(14);
 expect(await page.locator('.collection-cover img').evaluate(node=>Math.abs(node.getBoundingClientRect().width/node.getBoundingClientRect().height-node.naturalWidth/node.naturalHeight))).toBeLessThan(.02);
 await page.setViewportSize({width:1920,height:900});expect((await page.locator('.photographs-section').boundingBox()).width).toBeGreaterThan(1800);
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
