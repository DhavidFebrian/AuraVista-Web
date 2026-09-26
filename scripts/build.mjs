import {mkdir, cp, readFile, writeFile, rm} from 'node:fs/promises';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets/vendor',{recursive:true});
await cp('assets','public/assets',{recursive:true});
for(const file of ['index.html','album-cilandak.html','album-dharmawangsa.html','album-dharmawangsa-residence.html','admin.html']) {
 let html=await readFile(file,'utf8');
 html=html.replace('<script src="https://unpkg.com/lucide@latest"></script>','<script src="assets/vendor/lucide.js"></script>')
 .replace('<script src="https://cdn.tailwindcss.com"></script>','<link rel="stylesheet" href="assets/site.css">')
 .replace(/<script>\s*tailwind.config = [\s\S]*?<\/script>/,'');
 await writeFile('public/'+file,html);
}
await cp('node_modules/lucide/dist/umd/lucide.js','public/assets/vendor/lucide.js');
// Frozen landing utilities: page-specific styles must not alter the landing design.
await cp('node_modules/jszip/dist/jszip.min.js','public/assets/vendor/jszip.js');
console.log('Built 5 pages with local, pinned CSS and icons.');
