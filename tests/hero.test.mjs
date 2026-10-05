import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const baseline=JSON.parse(readFileSync(new URL('./hero-baseline.json',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');
test('120 hero frames and original markup, CSS and scroll engine remain byte-identical',()=>{
 const html=readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
 const blocks={hero_markup:html.slice(html.indexOf('  <div id="hero"'),html.indexOf('  <!-- 4 EDITORIAL')),hero_css:html.slice(html.indexOf('    /* ULTRA-PREMIUM CANVAS'),html.indexOf('  </style>')),hero_engine:html.slice(html.indexOf('    function initSpatialScrollDive()'),html.indexOf('    async function applyThemeCustomizer'))};
 for(const [key,value] of Object.entries(blocks))assert.equal(hash(value),baseline.blocks[key],key);
 assert.equal(Object.keys(baseline.assets).length,120);
 for(const [file,digest] of Object.entries(baseline.assets))assert.equal(hash(readFileSync(file)),digest,file);
});
