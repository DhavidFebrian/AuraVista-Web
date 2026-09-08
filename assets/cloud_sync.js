const GIST_ID = '9919d20671f866fda62afde6b90426e3';
const GIST_RAW_URL = `https://gist.githubusercontent.com/DhavidFebrian/${GIST_ID}/raw/auravista_theme_customizer.json`;

// Cloud Theme Store Client
window.AuraVistaCloud = {
  gistId: GIST_ID,
  
  // Ambil tema terbaru dari Cloud Database (dengan fallback ke LocalStorage)
  async fetchTheme() {
    try {
      // Bypass browser cache dengan query param timestamp
      const res = await fetch(`${GIST_RAW_URL}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('auravista_theme_customizer', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Cloud fetch fallback to localStorage:', e);
    }
    const local = localStorage.getItem('auravista_theme_customizer');
    return local ? JSON.parse(local) : null;
  },

  // Simpan tema ke Cloud Database secara realtime via API Serverless
  async saveTheme(themeData) {
    // 1. Simpan ke local dulu untuk respon instan
    localStorage.setItem('auravista_theme_customizer', JSON.stringify(themeData));

    // 2. Push update ke Endpoint Sync API
    try {
      const res = await fetch('/api/sync-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(themeData)
      });

      if (!res.ok) {
        throw new Error(`Sync API status: ${res.status}`);
      }
      return { success: true };
    } catch (err) {
      console.error('Failed saving to cloud:', err);
      return { success: false, error: err.message };
    }
  }
};
