const fs = require('fs');

const files = ['album-dharmawangsa.html', 'album-dharmawangsa-residence.html', 'album-cilandak.html', 'index.html'];

files.forEach(file => {
  const p = 'C:/Users/dhavi/Documents/AuraVista-Web/' + file;
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    // replace fetch('assets/portfolio_data.json') with cache buster
    content = content.replace(/fetch\(['"]assets\/portfolio_data\.json['"]\)/g, "fetch('assets/portfolio_data.json?v=' + Date.now())");
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated cache-busting in', file);
  }
});
