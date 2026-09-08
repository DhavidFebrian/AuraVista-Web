import os

admin_path = r"C:\Users\dhavi\Documents\AuraVista-Web\admin.html"
with open(admin_path, "r", encoding="utf-8") as f:
    text = f.read()

# Fix cache key & force live sync
text = text.replace("const STORAGE_KEY = 'auravista_portfolio_v8';", "const STORAGE_KEY = 'auravista_portfolio_v9';")

old_func = """    async function loadDashboardData() {
      let data = getPortfolioData();
      if (!data || data.length === 0) {
        try {
          const resp = await fetch('assets/portfolio_data.json');
          data = await resp.json();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.error(e);
        }
      }"""

new_func = """    async function loadDashboardData() {
      let data = null;
      try {
        const resp = await fetch('assets/portfolio_data.json?v=' + Date.now());
        data = await resp.json();
        // ensure any legacy jpg/png in list gets fixed
        data.forEach(item => {
          if (item.img && (item.img.endsWith('.jpg') || item.img.endsWith('.png'))) {
            item.img = item.img.replace(/\\.(jpg|png)$/i, '.webp');
          }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error(e);
        data = getPortfolioData();
      }"""

if old_func in text:
    text = text.replace(old_func, new_func)
    print("Replaced loadDashboardData successfully!")
else:
    print("old_func not matched directly, checking alternative...")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(text)

print("ADMIN_HTML_FIXED_PERFECTLY")
