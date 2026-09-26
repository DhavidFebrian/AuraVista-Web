import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const baseline=JSON.parse(await readFile(new URL('./landing-lock.json',import.meta.url),'utf8'));
test('entire landing source, production markup, shared styles/scripts and portfolio data stay byte-identical to 2e3806f',async()=>{
 for(const [file,expected] of Object.entries(baseline)) assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),expected,file);
});
