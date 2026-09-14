// Endpoint API Serverless Vercel untuk Upload & Sinkronisasi Portofolio ke GitHub & Cloud Database
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GITHUB_TOKEN = process.env.AURAVISTA_GH_TOKEN;
  const REPO = 'DhavidFebrian/AuraVista-Web';

  async function ghRequest(path, method = 'GET', body = null) {
    const headers = {
      'User-Agent': 'AuraVista-Serverless-App',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    const options = {
      method,
      headers
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`https://api.github.com${path}`, options);
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  }

  try {
    // 1. GET: Fetch latest portfolio data from repository
    if (req.method === 'GET') {
      const getFile = await ghRequest(`/repos/${REPO}/contents/assets/portfolio_data.json?ref=main`);
      if (!getFile.ok) {
        return res.status(getFile.status).json({ success: false, error: 'Failed to read portfolio data' });
      }
      const content = Buffer.from(getFile.data.content, 'base64').toString('utf8');
      const items = JSON.parse(content.replace(/^\uFEFF/, ''));
      return res.status(200).json({ success: true, items, sha: getFile.data.sha });
    }

    // 2. POST: Upload new photo & update portfolio data
    if (req.method === 'POST') {
      const { title, category, desc, badge, imageBase64, aspect } = req.body;

      if (!imageBase64 || !title) {
        return res.status(400).json({ success: false, error: 'Image data and title are required' });
      }

      // Clean base64 data
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const timestamp = Date.now();
      const cleanTitle = (title || 'photo').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
      const filename = `porto_upload_${timestamp}_${cleanTitle}.webp`;
      const filePath = `assets/porto/${filename}`;

      // A. Commit new image file to GitHub
      const uploadImgRes = await ghRequest(`/repos/${REPO}/contents/${filePath}`, 'PUT', {
        message: `Upload new portfolio photo: ${title} via Studio Admin`,
        content: base64Data,
        branch: 'main'
      });

      if (!uploadImgRes.ok) {
        return res.status(uploadImgRes.status).json({
          success: false,
          error: `Failed to upload image file: ${uploadImgRes.data?.message || 'Unknown error'}`
        });
      }

      // B. Fetch current portfolio_data.json
      const getDataRes = await ghRequest(`/repos/${REPO}/contents/assets/portfolio_data.json?ref=main`);
      if (!getDataRes.ok) {
        return res.status(getDataRes.status).json({ success: false, error: 'Failed to retrieve current portfolio database' });
      }

      const currentContent = Buffer.from(getDataRes.data.content, 'base64').toString('utf8');
      const portfolioList = JSON.parse(currentContent.replace(/^\uFEFF/, ''));

      // Determine proper badge and location
      const badgeMap = {
        'dharmawangsa': 'Dharmawangsa Apt',
        'dharmawangsa_residence': 'Dharmawangsa',
        'cilandak': 'Cilandak South Jakarta',
        'enhancement': 'Master Grade'
      };

      const locMap = {
        'dharmawangsa': 'Dharmawangsa Apartment',
        'dharmawangsa_residence': 'Dharmawangsa, South Jakarta',
        'cilandak': 'Cilandak, South Jakarta',
        'enhancement': 'Studio Grade'
      };

      const newItem = {
        id: `porto-${timestamp}`,
        title: title,
        category: category || 'enhancement',
        badge: badge || badgeMap[category] || 'Curated Portfolio',
        location: locMap[category] || 'South Jakarta',
        desc: desc || '',
        img: filePath,
        aspect: aspect || '3:4',
        uploadedAt: new Date().toISOString()
      };

      // Add to beginning of array
      portfolioList.unshift(newItem);

      // C. Commit updated portfolio_data.json
      const updatedJsonString = JSON.stringify(portfolioList, null, 2);
      const updateDataRes = await ghRequest(`/repos/${REPO}/contents/assets/portfolio_data.json`, 'PUT', {
        message: `Add ${title} to portfolio_data.json via Studio Admin`,
        content: Buffer.from(updatedJsonString, 'utf8').toString('base64'),
        sha: getDataRes.data.sha,
        branch: 'main'
      });

      if (!updateDataRes.ok) {
        return res.status(updateDataRes.status).json({
          success: false,
          error: `Failed to update portfolio data: ${updateDataRes.data?.message || 'Unknown error'}`
        });
      }

      return res.status(200).json({
        success: true,
        item: newItem,
        message: 'Foto berhasil disimpan secara permanen ke server dan database cloud!'
      });
    }

    // 3. PUT: Edit existing portfolio item metadata
    if (req.method === 'PUT') {
      const { id, title, category, desc, badge } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'Item ID is required' });

      const getDataRes = await ghRequest(`/repos/${REPO}/contents/assets/portfolio_data.json?ref=main`);
      if (!getDataRes.ok) return res.status(getDataRes.status).json({ success: false, error: 'Failed to read data' });

      const currentContent = Buffer.from(getDataRes.data.content, 'base64').toString('utf8');
      const portfolioList = JSON.parse(currentContent.replace(/^\uFEFF/, ''));

      let found = false;
      const updatedList = portfolioList.map(item => {
        if (item.id === id) {
          found = true;
          return {
            ...item,
            title: title || item.title,
            category: category || item.category,
            desc: desc !== undefined ? desc : item.desc,
            badge: badge || item.badge
          };
        }
        return item;
      });

      if (!found) return res.status(404).json({ success: false, error: 'Item not found' });

      const updatedJsonString = JSON.stringify(updatedList, null, 2);
      const updateDataRes = await ghRequest(`/repos/${REPO}/contents/assets/portfolio_data.json`, 'PUT', {
        message: `Edit portfolio item ${id} via Studio Admin`,
        content: Buffer.from(updatedJsonString, 'utf8').toString('base64'),
        sha: getDataRes.data.sha,
        branch: 'main'
      });

      return res.status(200).json({ success: true, message: 'Item berhasil diupdate secara permanen!' });
    }

    // 4. DELETE: Remove portfolio item
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'Item ID is required' });

      const getDataRes = await ghRequest(`/repos/${REPO}/contents/assets/portfolio_data.json?ref=main`);
      if (!getDataRes.ok) return res.status(getDataRes.status).json({ success: false, error: 'Failed to read data' });

      const currentContent = Buffer.from(getDataRes.data.content, 'base64').toString('utf8');
      const portfolioList = JSON.parse(currentContent.replace(/^\uFEFF/, ''));
      const filteredList = portfolioList.filter(item => item.id !== id);

      const updatedJsonString = JSON.stringify(filteredList, null, 2);
      const updateDataRes = await ghRequest(`/repos/${REPO}/contents/assets/portfolio_data.json`, 'PUT', {
        message: `Delete portfolio item ${id} via Studio Admin`,
        content: Buffer.from(updatedJsonString, 'utf8').toString('base64'),
        sha: getDataRes.data.sha,
        branch: 'main'
      });

      return res.status(200).json({ success: true, message: 'Item berhasil dihapus!' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Handler Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
