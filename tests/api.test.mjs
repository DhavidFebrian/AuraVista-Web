import {test} from 'node:test';
import assert from 'node:assert/strict';
import portfolio from '../api/portfolio.js';
import theme from '../api/sync-theme.js';
function response(){return {code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;},end(){return this;}};}
test('valid credentials required and cross-origin preflight never permits writes',async()=>{
 process.env.AURAVISTA_ADMIN_USER='test-operator';process.env.AURAVISTA_ADMIN_PASSWORD='test-only-credential-not-for-production';
 for(const method of ['GET','POST','PUT','DELETE','OPTIONS']){const res=response();await portfolio({method,headers:{},body:{}},res);assert.equal(res.code,401);assert.equal(res.headers['Access-Control-Allow-Origin'],undefined);}
});
test('metadata validation rejects script markup and failed upstream writes never report success',async()=>{
 process.env.AURAVISTA_ADMIN_USER='test-operator';process.env.AURAVISTA_ADMIN_PASSWORD='test-only-credential-not-for-production';process.env.AURAVISTA_GH_TOKEN='test-only-upstream';
 const headers={authorization:'Basic '+Buffer.from(`${process.env.AURAVISTA_ADMIN_USER}:${process.env.AURAVISTA_ADMIN_PASSWORD}`).toString('base64')};
 let calls=0;const original=global.fetch;global.fetch=async()=>{calls++;return new Response(JSON.stringify(calls%2 ? {sha:'abc',content:Buffer.from(JSON.stringify([{id:'porto-1',title:'Original'}])).toString('base64')} : {message:'Conflict'}),{status:calls%2?200:409});};
 try{
  let res=response();await portfolio({method:'PUT',headers,body:{id:'porto-1',title:'<img onerror=alert(1)>'}},res);assert.equal(res.code,400);assert.equal(calls,0);
  for(const method of ['PUT','DELETE']){res=response();await portfolio({method,headers,body:{id:'porto-1',title:'Updated'}},res);assert.equal(res.code,409);assert.equal(res.body.success,false);}
 }finally{global.fetch=original;}
});
test('theme rejects external image URLs before reaching GitHub',async()=>{
 process.env.AURAVISTA_ADMIN_USER='test-operator';process.env.AURAVISTA_ADMIN_PASSWORD='test-only-credential-not-for-production';
 const headers={authorization:'Basic '+Buffer.from(`${process.env.AURAVISTA_ADMIN_USER}:${process.env.AURAVISTA_ADMIN_PASSWORD}`).toString('base64')};
 const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;return new Response('{}',{status:200});};
 try{const res=response();await theme({method:'POST',headers,body:{masterShotImg:'https://untrusted.example/track'}},res);assert.equal(res.code,400);assert.equal(calls,0);}finally{global.fetch=original;}
});
test('theme field allowlist cannot be bypassed with suffixes',async()=>{
 process.env.AURAVISTA_ADMIN_USER='test-operator';process.env.AURAVISTA_ADMIN_PASSWORD='test-only-credential-not-for-production';
 const headers={authorization:'Basic '+Buffer.from(`${process.env.AURAVISTA_ADMIN_USER}:${process.env.AURAVISTA_ADMIN_PASSWORD}`).toString('base64')};
 const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;return new Response('{}',{status:200});};
 try{for(const body of [{unexpectedImg:'assets/HD_06_pool.webp'},{unexpectedTitle:'Injected setting'}]){const res=response();await theme({method:'POST',headers,body},res);assert.equal(res.code,400);}assert.equal(calls,0);}finally{global.fetch=original;}
});
test('authenticated cross-site requests never reach cloud storage',async()=>{
 process.env.AURAVISTA_ADMIN_USER='test-operator';process.env.AURAVISTA_ADMIN_PASSWORD='test-only-credential-not-for-production';process.env.AURAVISTA_GH_TOKEN='test-only-upstream';
 const authorization='Basic '+Buffer.from(`${process.env.AURAVISTA_ADMIN_USER}:${process.env.AURAVISTA_ADMIN_PASSWORD}`).toString('base64');
 let calls=0;const original=global.fetch;global.fetch=async()=>{calls++;return new Response('{}',{status:200});};
 try{for(const handler of [portfolio,theme]){for(const extra of [{origin:'https://attacker.example'},{'sec-fetch-site':'cross-site'},{origin:'null'}]){const res=response();await handler({method:'POST',headers:{authorization,host:'auravistamedia.vercel.app',...extra},body:{}},res);assert.equal(res.code,403);assert.equal(res.headers['Cache-Control'],'no-store');}}assert.equal(calls,0);}finally{global.fetch=original;}
});
test('portfolio rejects whitespace titles, unsupported aspect ratios and unknown fields',async()=>{
 process.env.AURAVISTA_ADMIN_USER='test-operator';process.env.AURAVISTA_ADMIN_PASSWORD='test-only-credential-not-for-production';process.env.AURAVISTA_GH_TOKEN='test-only-upstream';
 const headers={authorization:'Basic '+Buffer.from(`${process.env.AURAVISTA_ADMIN_USER}:${process.env.AURAVISTA_ADMIN_PASSWORD}`).toString('base64')};
 let calls=0;const original=global.fetch;global.fetch=async()=>{calls++;return new Response(JSON.stringify({sha:'abc',content:Buffer.from('[]').toString('base64')}),{status:200});};
 try{for(const body of [{id:'porto-01',title:'   '},{id:'porto-01',aspect:'evil'},{id:'porto-01',img:'../../index.html'}]){const res=response();await portfolio({method:'PUT',headers,body},res);assert.equal(res.code,400);}assert.equal(calls,0);}finally{global.fetch=original;}
});
test('all admin API requests fail closed before upstream access',async()=>{
 delete process.env.AURAVISTA_ADMIN_USER;delete process.env.AURAVISTA_ADMIN_PASSWORD;
 const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error('must not fetch');};
 try{for(const handler of [portfolio,theme]){const res=response();await handler({method:'POST',headers:{},body:{}},res);assert.equal(res.code,503);}assert.equal(calls,0);}finally{global.fetch=original;}
});
