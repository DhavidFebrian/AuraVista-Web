// Endpoint API Serverless Vercel untuk proxy update Cloud Theme tanpa mengekspos token di client
import { requireAdmin } from '../lib/admin-auth.js';
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  const GIST_ID = '9919d20671f866fda62afde6b90426e3';
  const GITHUB_TOKEN = process.env.AURAVISTA_GH_TOKEN;

  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const themeData = req.body;
      if(!themeData || typeof themeData!=='object' || Array.isArray(themeData) || JSON.stringify(themeData).length>5000) return res.status(400).json({success:false,error:'Invalid theme.'});
      const allowed=['masterShotImg','masterShotTitle','heroBgImg','heroBgTitle','neonBackground','bgMood','updatedAt'];
      for(const [key,value] of Object.entries(themeData)) {
        let valid=allowed.includes(key);
        if(key.endsWith('Img')) valid=typeof value==='string' && /^assets\/(porto\/)?[a-zA-Z0-9_(). -]+\.(webp|jpe?g|png)$/i.test(value);
        if(key.endsWith('Title')) valid=typeof value==='string' && value.length<=160 && !/[<>]/.test(value);
        if(key==='bgMood') valid=['obsidian','midnight','dark-slate'].includes(value);
        if(key==='neonBackground') valid=typeof value==='boolean';
        if(key==='updatedAt') valid=Number.isSafeInteger(value) && value>=0;
        if(!valid)return res.status(400).json({success:false,error:'Invalid theme field: '+key});
      }
      if(!GITHUB_TOKEN)return res.status(503).json({success:false,error:'Cloud storage is not configured.'});
      const payload = {
        files: {
          "auravista_theme_customizer.json": {
            content: JSON.stringify(themeData, null, 2)
          }
        }
      };

      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: 'Cloud update failed. Please retry.' });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Cloud request failed. Please retry.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
