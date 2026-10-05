import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const baseline=JSON.parse(await readFile(new URL('./landing-lock.json',import.meta.url),'utf8'));
// Current scope permits redesign outside the scroll hero. Hero blocks have a separate strict test.
test('original portfolio photographs and frame assets remain unchanged',async()=>{
 for(const [file,expected] of Object.entries(baseline)) {
  if(!file.startsWith('assets/') || !/\.(webp|png|jpg)$/.test(file)) continue;
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),expected,file);
 }
});
