import {test,expect} from '@playwright/test';
test('editorial collections expose navigation, sorting and a compact contact sheet',async({page})=>{
 await page.goto('/album-cilandak.html',{waitUntil:'domcontentloaded'});
 await expect(page.getByRole('heading',{name:'Cilandak',exact:true})).toBeVisible();
 await expect(page.locator('.collection-cover img')).toBeVisible();
 await page.getByLabel('Sort photographs').selectOption('title');
 const titles=await page.locator('.photo-title').allTextContents();
 expect(titles).toEqual([...titles].sort((a,b)=>a.localeCompare(b)));
 await page.getByRole('button',{name:'Contact sheet'}).click();
 await expect(page.getByRole('button',{name:'Contact sheet'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.editorial-gallery')).toHaveAttribute('data-layout','compact');
 await page.getByRole('link',{name:'Dharmawangsa Residence',exact:true}).first().click();
 await expect(page.getByRole('button',{name:/View photograph:/})).toHaveCount(14);
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
