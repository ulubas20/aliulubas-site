(function () {
  // Tarayıcıdan detaylı cihaz, işletim sistemi, GPU ve ağ bilgisi çıkarma
  async function getDetailedDeviceInfo() {
    const ua = navigator.userAgent || '';
    let os = 'Bilinmeyen İşletim Sistemi';
    let deviceType = 'Masaüstü Bilgisayar';
    let deviceModel = 'PC / Laptop';
    let browser = 'Bilinmeyen Tarayıcı';

    // İşletim Sistemi Tespiti
    if (/Android/i.test(ua)) {
      os = 'Android';
      deviceType = 'Mobil Telefon';
      const match = ua.match(/Android\s([0-9.]+);\s([^;)]+)/i);
      if (match) {
        os = `Android ${match[1]}`;
        deviceModel = match[2].trim();
      }
    } else if (/iPhone/i.test(ua)) {
      os = 'iOS (iPhone)';
      deviceType = 'Mobil Telefon';
      const ver = ua.match(/OS\s(\d+[_\d]*)/i);
      if (ver) os = `iOS ${ver[1].replace(/_/g, '.')}`;
      deviceModel = 'Apple iPhone';
    } else if (/iPad/i.test(ua)) {
      os = 'iPadOS';
      deviceType = 'Tablet';
      deviceModel = 'Apple iPad';
    } else if (/Windows NT 10\.0/i.test(ua)) {
      os = 'Windows 10 / 11';
    } else if (/Windows NT 6\.3/i.test(ua)) {
      os = 'Windows 8.1';
    } else if (/Mac OS X/i.test(ua)) {
      os = 'macOS';
      deviceModel = 'Apple Mac';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    }

    // Modern Client Hints API ile tam telefon modeli ve Windows 11 ayrımı
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      try {
        const hints = await navigator.userAgentData.getHighEntropyValues([
          'model',
          'platform',
          'platformVersion',
          'fullVersionList'
        ]);
        if (hints.model) deviceModel = hints.model;
        if (hints.platform === 'Windows' && hints.platformVersion) {
          const major = parseInt(hints.platformVersion.split('.')[0], 10);
          os = major >= 13 ? 'Windows 11' : 'Windows 10';
        }
      } catch {}
    }

    // Tarayıcı Tespiti (TikTok / Instagram uygulama içi tarayıcı dahil)
    if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) {
      browser = 'TikTok Uygulama İçi Tarayıcı';
    } else if (/Instagram/i.test(ua)) {
      browser = 'Instagram Uygulama İçi Tarayıcı';
    } else if (/Edg\//i.test(ua)) {
      browser = 'Microsoft Edge';
    } else if (/OPR\/|Opera/i.test(ua)) {
      browser = 'Opera';
    } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
      browser = 'Google Chrome';
    } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
      browser = 'Apple Safari';
    } else if (/Firefox\//i.test(ua)) {
      browser = 'Mozilla Firefox';
    }

    // Ekran Kartı (GPU) Bilgisi
    let gpu = 'Tespit Edilemedi';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch {}

    // Ağ Bağlantı Türü (4G / Wi-Fi vb.)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connectionType = conn
      ? `${(conn.effectiveType || 'Bilinmiyor').toUpperCase()} (${conn.downlink || '?'} Mbps)`
      : 'Standart Bağlantı';

    return {
      deviceType,
      deviceModel,
      os,
      browser,
      screen: `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio || 1}x)`,
      language: navigator.language || 'tr-TR',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul',
      cpuCores: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Çekirdek` : 'Bilinmiyor',
      ram: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Bilinmiyor',
      gpu,
      connectionType,
      userAgent: ua
    };
  }

  // Çoklu Yedekli Gerçek IP, Konum ve Operatör (ISP) Sorgusu
  async function fetchNetworkIntel() {
    // 1. Kaynak: ipwho.is (HTTPS, ücretsiz, detaylı ISP + Konum)
    try {
      const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
      const d = await res.json();
      if (d && d.success !== false && d.ip) {
        return {
          ip: d.ip,
          country: d.country || 'Türkiye',
          region: d.region || '',
          city: d.city || 'Bilinmiyor',
          postal: d.postal || '',
          coords: d.latitude && d.longitude ? `${d.latitude}, ${d.longitude}` : '',
          isp: (d.connection && (d.connection.isp || d.connection.org)) || 'Bilinmiyor',
          asn: (d.connection && d.connection.asn) ? `AS${d.connection.asn}` : ''
        };
      }
    } catch {}

    // 2. Kaynak: ipapi.co
    try {
      const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
      const d = await res.json();
      if (d && d.ip) {
        return {
          ip: d.ip,
          country: d.country_name || 'Türkiye',
          region: d.region || '',
          city: d.city || 'Bilinmiyor',
          postal: d.postal || '',
          coords: d.latitude && d.longitude ? `${d.latitude}, ${d.longitude}` : '',
          isp: d.org || d.asn || 'Bilinmiyor',
          asn: d.asn || ''
        };
      }
    } catch {}

    // 3. Kaynak: ipinfo.io + api.ipify.org
    try {
      const res = await fetch('https://ipinfo.io/json', { cache: 'no-store' });
      const d = await res.json();
      if (d && d.ip) {
        return {
          ip: d.ip,
          country: d.country || 'TR',
          region: d.region || '',
          city: d.city || 'Bilinmiyor',
          postal: d.postal || '',
          coords: d.loc || '',
          isp: d.org || 'Bilinmiyor',
          asn: ''
        };
      }
    } catch {}

    // Son çare sadece IP
    try {
      const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
      const d = await res.json();
      return {
        ip: d.ip || 'Yerel / Gizli Ağ',
        country: 'Bilinmiyor',
        region: '',
        city: 'Bilinmiyor',
        postal: '',
        coords: '',
        isp: 'API Engellendi (Reklam Engelleyici)',
        asn: ''
      };
    } catch {
      return {
        ip: 'Tespit Edilemedi (Yerel Dosya / Engelleyici)',
        country: 'Bilinmiyor',
        region: '',
        city: 'Bilinmiyor',
        postal: '',
        coords: '',
        isp: 'Tespit Edilemedi',
        asn: ''
      };
    }
  }

  async function recordVisit(pageLabel = 'Ana Sayfa') {
    const [net, dev] = await Promise.all([fetchNetworkIntel(), getDetailedDeviceInfo()]);
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const logs = window.LinkHubStore.getVisitorLogs();

    // Kişiye özel klasör anahtarı (IP + Cihaz Modeli + OS)
    const folderId = `${net.ip}__${dev.deviceModel}__${dev.os}`.replace(/\s+/g, '_');
    let folder = logs.find((f) => f.folderId === folderId);

    const visitEntry = {
      date: dateStr,
      time: timeStr,
      timestamp: now.toISOString(),
      page: pageLabel,
      referrer: document.referrer || 'Doğrudan Giriş'
    };

    if (!folder) {
      folder = {
        folderId,
        folderName: `${net.ip} • ${dev.deviceModel} (${net.city})`,
        ip: net.ip,
        location: `${net.city}${net.region ? ' / ' + net.region : ''}, ${net.country}`,
        coords: net.coords,
        isp: `${net.isp}${net.asn ? ' (' + net.asn + ')' : ''}`,
        device: dev,
        firstSeen: `${dateStr} ${timeStr}`,
        lastSeen: `${dateStr} ${timeStr}`,
        visitCount: 1,
        visits: [visitEntry]
      };
      logs.unshift(folder);
    } else {
      folder.ip = net.ip;
      folder.location = `${net.city}${net.region ? ' / ' + net.region : ''}, ${net.country}`;
      folder.coords = net.coords || folder.coords;
      folder.isp = `${net.isp}${net.asn ? ' (' + net.asn + ')' : ''}`;
      folder.device = dev;
      folder.lastSeen = `${dateStr} ${timeStr}`;
      folder.visitCount = (folder.visitCount || 0) + 1;
      folder.visits.unshift(visitEntry);
      // En son giren klasörü en üste taşı
      const idx = logs.indexOf(folder);
      if (idx > 0) {
        logs.splice(idx, 1);
        logs.unshift(folder);
      }
    }

    window.LinkHubStore.saveVisitorLogs(logs);
  }

  window.VisitorTracker = { recordVisit };
})();