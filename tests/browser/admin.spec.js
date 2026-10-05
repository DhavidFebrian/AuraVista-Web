import {test,expect} from '@playwright/test';
test('forged browser session cannot unlock studio',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('auravista_admin_auth','true'));
 await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#login-view')).toBeVisible();await expect(page.locator('#app-view')).toBeHidden();
 expect(await page.evaluate(()=>typeof ADMIN_PASS)).toBe('undefined');
});
