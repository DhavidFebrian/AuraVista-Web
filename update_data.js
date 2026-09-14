const fs = require('fs');

// 1. Update portfolio_data.json: set category 'dharmawangsa_residence' for porto-41..54, location 'Dharmawangsa'
const dataPath = 'C:/Users/dhavi/Documents/AuraVista-Web/assets/portfolio_data.json';
let raw = fs.readFileSync(dataPath, 'utf8').replace(/^\uFEFF/, '');
let data = JSON.parse(raw);

data.forEach(item => {
  const num = parseInt(item.id.replace('porto-', ''));
  if (num >= 41 && num <= 54) {
    item.category = 'dharmawangsa_residence';
    item.badge = 'Dharmawangsa';
    item.location = 'Dharmawangsa';
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('portfolio_data.json updated.');

// 2. Update album-dharmawangsa.html to only load 18 photos from 4711 (Dharmawangsa Apartment)
let dharmaHtml = fs.readFileSync('C:/Users/dhavi/Documents/AuraVista-Web/album-dharmawangsa.html', 'utf8');
dharmaHtml = dharmaHtml.replace(
  /const items = data\.filter\(item => item\.category === 'dharmawangsa' \|\| \(item\.img && item\.img\.includes\('4711'\)\)\);/,
  "const items = data.filter(item => item.category === 'dharmawangsa' || (item.img && item.img.includes('4711')));"
);
fs.writeFileSync('C:/Users/dhavi/Documents/AuraVista-Web/album-dharmawangsa.html', dharmaHtml, 'utf8');
console.log('album-dharmawangsa.html updated.');
