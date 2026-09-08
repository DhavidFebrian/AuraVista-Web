import re

html_file = r'C:\Users\dhavi\Documents\AuraVista-Web\index.html'

with open(html_file, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace object-cover with object-cover object-top in gallery items and card styles
# In the JS renderCard:
# Change: class="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
# To: class="w-full h-full object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-105"

html = html.replace(
    'class="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"',
    'class="w-full h-full object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-105"'
)

# Also check if there's any other object-cover in gallery rendering
html = html.replace(
    'class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"',
    'class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"'
)

# And let's adjust the badge position so it doesn't collide with the top-center logo watermark
# The badge is currently at top-4 left-4 or top-3 right-3
# Let's ensure the badge is positioned nicely at bottom-3 left-4 or top-3 left-3 with elegant micro size so top-center logo is 100% visible and uncluttered!
html = html.replace(
    '<div class="absolute top-4 left-4">',
    '<div class="absolute bottom-3 left-4">'
)

# Update storage key to v3 so browser refreshes
html = html.replace("const STORAGE_KEY = '***';", "const STORAGE_KEY = '***';")
html = html.replace("const STORAGE_KEY = '***';", "const STORAGE_KEY = '***';")

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated image alignment to object-top and repositioned badges.")
