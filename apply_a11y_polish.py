import re

html_path = r'C:\Users\dhavi\Documents\AuraVista-Web\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Enhance accessibility & WCAG audit compliance from UI/UX Pro Max:
# Add proper aria-labels and smooth interactive focus rings

# Update storage key to v6
html = html.replace("const STORAGE_KEY = '***';", "const STORAGE_KEY = '***';")
html = html.replace("const STORAGE_KEY = '***';", "const STORAGE_KEY = '***';")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Saved polish updates to index.html.")
