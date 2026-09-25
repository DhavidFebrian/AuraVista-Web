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
 return true;
}
