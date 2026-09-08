import re

index_path = r'C:\Users\dhavi\Documents\AuraVista-Web\index.html'
with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Update navbar Admin button in index.html to link directly to admin.html
html = html.replace(
    '<button onclick="openAdminModal()" id="admin-nav-btn" class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-brand-gold text-xs uppercase tracking-wider border border-brand-gold/20 hover:border-brand-gold/50 transition-all">',
    '<a href="admin.html" id="admin-nav-btn" class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-brand-gold text-xs uppercase tracking-wider border border-brand-gold/20 hover:border-brand-gold/50 transition-all">'
)
html = html.replace(
    '</button>\n\n        <a href="#contact"',
    '</a>\n\n        <a href="#contact"'
)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html to link directly to dedicated admin.html.")
