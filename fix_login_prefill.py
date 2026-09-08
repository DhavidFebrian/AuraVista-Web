admin_path = r'C:\Users\dhavi\Documents\AuraVista-Web\admin.html'
with open(admin_path, 'r', encoding='utf-8') as f:
    admin_html = f.read()

# Replace hardcoded values with empty inputs and autocomplete off
admin_html = admin_html.replace(
    'value="david" class="w-full px-4 py-3 rounded-xl bg-[#080C14] border border-slate-700 text-slate-100 text-sm focus:border-brand-gold focus:outline-none" required />',
    'value="" autocomplete="username" placeholder="Masukkan Username Admin" class="w-full px-4 py-3 rounded-xl bg-[#080C14] border border-slate-700 text-slate-100 text-sm focus:border-brand-gold focus:outline-none" required />'
)
admin_html = admin_html.replace(
    'value="Cakrawala23" class="w-full px-4 py-3 rounded-xl bg-[#080C14] border border-slate-700 text-slate-100 text-sm focus:border-brand-gold focus:outline-none" required />',
    'value="" autocomplete="current-password" placeholder="Masukkan Password Admin" class="w-full px-4 py-3 rounded-xl bg-[#080C14] border border-slate-700 text-slate-100 text-sm focus:border-brand-gold focus:outline-none" required />'
)

with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(admin_html)

index_path = r'C:\Users\dhavi\Documents\AuraVista-Web\index.html'
with open(index_path, 'r', encoding='utf-8') as f:
    index_html = f.read()

index_html = index_html.replace(
    'value="david"',
    'value="" autocomplete="username"'
)
index_html = index_html.replace(
    'value="Cakrawala23"',
    'value="" autocomplete="current-password"'
)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Successfully removed hardcoded prefill values from admin login forms.")
