const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/dhavi/Documents/AuraVista-Web/assets/porto';
const files = fs.readdirSync(dir);

// Find the file that starts with porto_54
const oldFile = files.find(f => f.startsWith('porto_54'));
console.log('Old file:', oldFile);

const cleanName = 'porto_54_dharmawangsa_new_Preserving_original_building_structure_2K.jpg';
if (oldFile) {
  fs.renameSync(path.join(dir, oldFile), path.join(dir, cleanName));
  console.log('Renamed to:', cleanName);
}

// Update portfolio_data.json
const jsonPath = 'C:/Users/dhavi/Documents/AuraVista-Web/assets/portfolio_data.json';
let data = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, ''));

data.forEach(item => {
  if (item.id === 'porto-54') {
    item.img = 'assets/porto/' + cleanName;
    console.log('Updated item porto-54 in JSON:', item.img);
  }
});

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Done!');
