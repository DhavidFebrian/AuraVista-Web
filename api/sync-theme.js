// Endpoint API Serverless Vercel untuk proxy update Cloud Theme tanpa mengekspos token di client
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GIST_ID = '9919d20671f866fda62afde6b90426e3';
  const GITHUB_TOKEN = process.env.AURAVISTA_GH_TOKEN;

  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const themeData = req.body;
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
        return res.status(response.status).json({ success: false, error: await response.text() });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
