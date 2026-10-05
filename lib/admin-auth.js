import {createHash, timingSafeEqual} from 'node:crypto';
// ponytail: single-operator studio auth, memory-only in browser. Use managed identity for teams.
export function requireAdmin(req,res) {
 res.setHeader('Cache-Control','no-store');
 const user=process.env.AURAVISTA_ADMIN_USER;
 const password=process.env.AURAVISTA_ADMIN_PASSWORD;
 if(!user || !password || password.length<24){res.status(503).json({success:false,error:'Studio access is not configured. Set secure admin credentials in Vercel.'});return false;}
 const authorization=req.headers?.authorization;
 const expected='Basic '+Buffer.from(`${user}:${password}`).toString('base64');
 const digest=value=>createHash('sha256').update(value).digest();
 if(typeof authorization!=='string'||authorization.length>2048||!timingSafeEqual(digest(authorization),digest(expected))){res.status(401).json({success:false,error:'Invalid studio credentials.'});return false;}
 const origin=req.headers?.origin;
 let sameOrigin=true;
 if(origin!==undefined){try{const parsed=new URL(origin);sameOrigin=['https:','http:'].includes(parsed.protocol)&&parsed.host===req.headers.host&&parsed.origin===origin;}catch{sameOrigin=false;}}
 if(!sameOrigin || req.headers?.['sec-fetch-site']==='cross-site'){res.status(403).json({success:false,error:'Cross-site studio requests are not allowed.'});return false;}
 return true;
}
