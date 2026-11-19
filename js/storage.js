(function () {
  const STORAGE_KEY = 'aliulubas_linkhub_v3';
  const LOGS_KEY = 'aliulubas_visitor_logs_v2';
  const LIKES_KEY = 'aliulubas_guest_likes_v2';
  const DB_NAME = 'AliUlubasMediaDB';
  const STORE_NAME = 'media_blobs';

  function createDefaultAvatar(label, bg1, bg2) {
    const initials = (label || 'AU').slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/>
      </linearGradient></defs>
      <rect width="200" height="200" rx="100" fill="url(#g)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="72">${initials}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function createBlankSupporter(rank) {
    const configs = {
      1: {
        name: 'Kral Destekçi #1',
        username: '@destekci1',
        badgeText: '👑 GLOBAL 1ST',
        tiktokLevel: 45,
        monthlyCoins: 250000,
        bio: 'Zirvenin tek sahibi! Canlı yayınların 1 numaralı efsane destekçisi.',
        colors: ['#f59e0b', '#78350f']
      },
      2: {
        name: 'Elmas Destekçi #2',
        username: '@destekci2',
        badgeText: '💎 GLOBAL 2ND',
        tiktokLevel: 38,
        monthlyCoins: 145000,
        bio: 'Elmas podyum 2. sıra VIP destekçisi.',
        colors: ['#0284c7', '#0f172a']
      },
      3: {
        name: 'Alev Destekçi #3',
        username: '@destekci3',
        badgeText: '🔥 GLOBAL 3RD',
        tiktokLevel: 32,
        monthlyCoins: 85000,
        bio: 'Podyumun 3. sırasındaki güçlü destekçi.',
        colors: ['#ea580c', '#431407']
      }
    };
    const c = configs[rank] || configs[3];
    return {
      rank,
      name: c.name,
      username: c.username,
      tiktokUrl: `https://www.tiktok.com/${c.username}`,
      avatar: createDefaultAvatar(`#${rank}`, c.colors[0], c.colors[1]),
      badgeText: c.badgeText,
      tiktokLevel: c.tiktokLevel,
      monthlyCoins: c.monthlyCoins,
      bio: c.bio,
      videos: []
    };
  }

  const DEFAULT_DATA = {
    profile: {
      name: 'Ali Ulubaş',
      username: '@aliulubas20',
      bio: 'TikTok Canlı Yayın • Oyun & İçerik Üreticisi\nResmi hesaplarım ve Aylık Global Top 3 destekçilerim.',
      avatar: createDefaultAvatar('AU', '#00f2fe', '#fe2c55'),
      isLive: true,
      liveText: 'CANLI YAYINDA',
      footerText: '© 2026 Ali Ulubaş (@aliulubas20) — Tüm hakları saklıdır.'
    },
    socials: [
      { id: 's1', title: 'TikTok Ana Hesap', subtitle: '@aliulubas20 • Canlı yayınları kaçırma', url: 'https://www.tiktok.com/@aliulubas20', icon: 'fa-brands fa-tiktok', color: '#00f2fe' },
      { id: 's2', title: 'TikTok Yedek / Oyun', subtitle: '@aliulubas35', url: 'https://www.tiktok.com/@aliulubas35', icon: 'fa-brands fa-tiktok', color: '#fe2c55' },
      { id: 's3', title: 'YouTube Kanalım', subtitle: 'Ali oyunda2828 • Videolar & Shorts', url: 'https://www.youtube.com', icon: 'fa-brands fa-youtube', color: '#ff0000' },
      { id: 's4', title: 'Instagram', subtitle: 'Günlük paylaşımlar ve duyurular', url: 'https://www.instagram.com', icon: 'fa-brands fa-instagram', color: '#e1306c' },
      { id: 's5', title: 'Shopier Mağazam', subtitle: 'Dijital ürünler ve özel paketler', url: 'https://www.shopier.com/aliulubas20', icon: 'fa-solid fa-bag-shopping', color: '#10b981' }
    ],
    supporters: [createBlankSupporter(1), createBlankSupporter(2), createBlankSupporter(3)]
  };

  function openMediaDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveMediaBlob(file) {
    const db = await openMediaDB();
    const id = 'idb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(file, id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function resolveMediaUrl(ref) {
    if (!ref) return '';
    if (!ref.startsWith('idb_')) return ref;
    try {
      const db = await openMediaDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(ref);
        req.onsuccess = () => (req.result ? resolve(URL.createObjectURL(req.result)) : resolve(''));
        req.onerror = () => resolve('');
      });
    } catch {
      return '';
    }
  }

  function getSiteData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.supporters) || parsed.supporters.length !== 3) {
        parsed.supporters = [createBlankSupporter(1), createBlankSupporter(2), createBlankSupporter(3)];
      }
      return parsed;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  function saveSiteData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getVisitorLogs() {
    try {
      return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveVisitorLogs(logs) {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }

  function getGuestLikes() {
    try {
      return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function toggleGuestLike(videoId) {
    const likes = getGuestLikes();
    const data = getSiteData();
    let updatedCount = 0;
    let isLiked = false;

    for (const sup of data.supporters) {
      const vid = (sup.videos || []).find((v) => v.id === videoId);
      if (vid) {
        if (likes[videoId]) {
          delete likes[videoId];
          vid.likes = Math.max(0, (vid.likes || 0) - 1);
          isLiked = false;
        } else {
          likes[videoId] = true;
          vid.likes = (vid.likes || 0) + 1;
          isLiked = true;
        }
        updatedCount = vid.likes;
        break;
      }
    }

    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    saveSiteData(data);
    return { isLiked, count: updatedCount };
  }

  window.LinkHubStore = {
    getSiteData,
    saveSiteData,
    getVisitorLogs,
    saveVisitorLogs,
    getGuestLikes,
    toggleGuestLike,
    saveMediaBlob,
    resolveMediaUrl,
    createBlankSupporter
  };
})();