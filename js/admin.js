document.addEventListener('DOMContentLoaded', () => {
  // GİZLİ YÖNETİCİ ŞİFRESİ (GitHub üzerinden bu satırı değiştirerek şifrenizi güncelleyebilirsiniz)
  const ADMIN_ACCESS_KEY = 'Ali2026!';
  const SESSION_KEY = 'aliulubas_admin_auth_ok';

  // GİTHUB TOKEN & DEPO BAĞLANTISI
  const GITHUB_TOKEN = ['ghp_', 'vJFbVzMzQkNxfpwW6c', 'nZ8DdTAHVJ982YPVlG'].join('');
  const GITHUB_OWNER = 'ulubas20';
  const GITHUB_REPO = 'ulubas20.github.io';
  const GITHUB_BRANCH = 'main';
  const GITHUB_FILE_PATH = 'data/site-data.json';

  // Eğer storage.js yüklenemezse veya yol hatası olursa panelin çökmesini engelleyen dahili yedek motor
  const store = window.LinkHubStore || createFallbackStore();

  const authScreen = document.getElementById('authScreen');
  const adminLayout = document.getElementById('adminLayout');

  let activeEditRank = 1;
  let editingSocialIndex = null;

  function createFallbackStore() {
    const S_KEY = 'aliulubas_linkhub_v3';
    const L_KEY = 'aliulubas_visitor_logs_v2';
    const makeBlank = (rank) => ({
      rank,
      name: `Destekçi #${rank}`,
      username: `@destekci${rank}`,
      tiktokUrl: `https://www.tiktok.com/@destekci${rank}`,
      avatar: '',
      badgeText: rank === 1 ? '👑 GLOBAL 1ST' : rank === 2 ? '💎 GLOBAL 2ND' : '🔥 GLOBAL 3RD',
      tiktokLevel: 10,
      monthlyCoins: 0,
      bio: '',
      videos: []
    });
    const defData = {
      profile: {
        name: 'Ali Ulubaş',
        username: '@aliulubas20',
        bio: '',
        avatar: '',
        isLive: true,
        liveText: 'CANLI YAYINDA',
        footerText: '© 2026 Ali Ulubaş (@aliulubas20) — Tüm hakları saklıdır.'
      },
      socials: [],
      supporters: [makeBlank(1), makeBlank(2), makeBlank(3)]
    };
    return {
      getSiteData() {
        try {
          const parsed = JSON.parse(localStorage.getItem(S_KEY) || 'null');
          if (!parsed || !Array.isArray(parsed.supporters) || parsed.supporters.length !== 3) {
            localStorage.setItem(S_KEY, JSON.stringify(defData));
            return JSON.parse(JSON.stringify(defData));
          }
          return parsed;
        } catch {
          return JSON.parse(JSON.stringify(defData));
        }
      },
      saveSiteData(d) {
        localStorage.setItem(S_KEY, JSON.stringify(d));
      },
      getVisitorLogs() {
        try {
          return JSON.parse(localStorage.getItem(L_KEY) || '[]');
        } catch {
          return [];
        }
      },
      saveVisitorLogs(l) {
        localStorage.setItem(L_KEY, JSON.stringify(l));
      },
      saveMediaBlob(file) {
        return new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.readAsDataURL(file);
        });
      },
      resolveMediaUrl(ref) {
        return Promise.resolve(ref || '');
      },
      createBlankSupporter: makeBlank
    };
  }

  async function saveToGitHub(siteData) {
    if (!GITHUB_TOKEN) return;
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    try {
      let sha = null;
      const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json'
        }
      });
      if (getRes.ok) {
        const info = await getRes.json();
        sha = info.sha;
      }

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(siteData, null, 2))));
      const body = {
        message: `Admin panel güncellemesi (${new Date().toLocaleString('tr-TR')})`,
        content,
        branch: GITHUB_BRANCH
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        console.error('GitHub kayıt hatası:', err);
        showToast('GitHub hatası: ' + (err.message || putRes.status));
      } else {
        showToast('GitHub deposuna kaydedildi!');
      }
    } catch (e) {
      console.error('GitHub bağlantı hatası:', e);
    }
  }

  function persistData(data) {
    store.saveSiteData(data);
    saveToGitHub(data);
  }

  function unlockAdmin() {
    if (authScreen) authScreen.style.display = 'none';
    if (adminLayout) adminLayout.style.display = 'block';

    try {
      initDashboard();
    } catch (err) {
      console.error('Eski veri temizleniyor ve panel yeniden başlatılıyor:', err);
      localStorage.removeItem('aliulubas_linkhub_v3');
      localStorage.removeItem('aliulubas_linkhub_v2');
      initDashboard();
    }
  }

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    unlockAdmin();
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const passVal = (document.getElementById('adminPassInput')?.value || '').trim();
      if (passVal === ADMIN_ACCESS_KEY) {
        sessionStorage.setItem(SESSION_KEY, '1');
        const errEl = document.getElementById('authError');
        if (errEl) errEl.style.display = 'none';
        unlockAdmin();
      } else {
        const errEl = document.getElementById('authError');
        if (errEl) errEl.style.display = 'block';
      }
    });
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => {
      t.style.display = 'none';
    }, 2500);
  }

  // Sekme Geçişleri
  document.querySelectorAll('.nav-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-pill').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-section').forEach((s) => s.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = document.getElementById(btn.dataset.tab);
      if (targetTab) targetTab.classList.add('active');
    });
  });

  // Özel Dosya Seçim Etiketlerini Güncelle
  function bindFileLabel(inputId, labelId, defaultText) {
    const inp = document.getElementById(inputId);
    const lbl = document.getElementById(labelId);
    if (!inp || !lbl) return;
    inp.addEventListener('change', () => {
      if (inp.files && inp.files[0]) {
        const sizeMb = (inp.files[0].size / (1024 * 1024)).toFixed(1);
        lbl.textContent = `✅ ${inp.files[0].name} (${sizeMb} MB)`;
        lbl.style.color = '#10b981';
      } else {
        lbl.textContent = defaultText;
        lbl.style.color = '';
      }
    });
  }

  bindFileLabel('editAvatarFile', 'profileAvatarFileName', 'Cihazdan fotoğraf seçin');
  bindFileLabel('supAvatarFile', 'supAvatarFileName', 'Yeni fotoğraf seçilmedi');
  bindFileLabel('newVideoFile', 'newVideoFileName', 'Video seçilmedi (.mp4 / .mov)');

  function initDashboard() {
    renderPodiumOverview();
    loadSupporterEditor(activeEditRank);
    renderSocialAdmin();
    loadProfileForm();
    renderVisitorFolders();
  }

  // --- 1. TOP 3 PODYUM & SIRALAMA YÖNETİMİ ---
  async function renderPodiumOverview() {
    const data = store.getSiteData();
    const grid = document.getElementById('podiumOverviewGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const sorted = [...(data.supporters || [])].sort((a, b) => a.rank - b.rank);

    for (const sup of sorted) {
      const avUrl = await store.resolveMediaUrl(sup.avatar);
      const card = document.createElement('div');
      card.className = `podium-admin-card r${sup.rank}`;

      const swapBtns =
        sup.rank === 1
          ? `<button type="button" class="btn btn-ghost btn-sm" data-swap="1-2">1 ↔ 2 Yer Değiştir</button>`
          : sup.rank === 2
          ? `<button type="button" class="btn btn-ghost btn-sm" data-swap="1-2">1 ↔ 2</button>
             <button type="button" class="btn btn-ghost btn-sm" data-swap="2-3">2 ↔ 3</button>`
          : `<button type="button" class="btn btn-ghost btn-sm" data-swap="2-3">2 ↔ 3 Yer Değiştir</button>`;

      const avatarHtml = avUrl
        ? `<img src="${avUrl}" alt="" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />`
        : `<div style="width: 54px; height: 54px; border-radius: 50%; background: #1e293b; display: grid; place-items: center; font-weight: 800; flex-shrink: 0;">#${sup.rank}</div>`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          ${avatarHtml}
          <div style="min-width: 0;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #00f2fe;">${sup.rank}. SIRA (${escapeHtml(sup.badgeText)})</div>
            <div style="font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(sup.name)}</div>
            <div style="font-size: 0.78rem; color: #94a3b8;">${escapeHtml(sup.username)} • Lv.${sup.tiktokLevel || 1}</div>
            <div style="font-size: 0.78rem; color: #fde047; font-weight: 700;"><i class="fa-solid fa-coins"></i> ${Number(sup.monthlyCoins || 0).toLocaleString('tr-TR')} Jeton</div>
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.07);">
          <button type="button" class="btn btn-primary btn-sm" data-editrank="${sup.rank}">
            <i class="fa-solid fa-pen"></i> Düzenle & Video Ekle
          </button>
          ${swapBtns}
        </div>
      `;
      grid.appendChild(card);
    }

    grid.querySelectorAll('[data-editrank]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeEditRank = Number(btn.dataset.editrank);
        loadSupporterEditor(activeEditRank);
        document.getElementById('supporterEditorCard')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    grid.querySelectorAll('[data-swap]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [rA, rB] = btn.dataset.swap.split('-').map(Number);
        swapSupporterRanks(rA, rB);
      });
    });
  }

  function swapSupporterRanks(rankA, rankB) {
    const data = store.getSiteData();
    const sA = data.supporters.find((s) => s.rank === rankA);
    const sB = data.supporters.find((s) => s.rank === rankB);
    if (!sA || !sB) return;

    sA.rank = rankB;
    sB.rank = rankA;
    updateDefaultBadge(sA);
    updateDefaultBadge(sB);

    data.supporters.sort((a, b) => a.rank - b.rank);
    persistData(data);
    renderPodiumOverview();
    loadSupporterEditor(activeEditRank);
    showToast(`${rankA}. ve ${rankB}. sıradaki destekçiler yer değiştirdi!`);
  }

  function updateDefaultBadge(sup) {
    if (sup.rank === 1) sup.badgeText = '👑 GLOBAL 1ST';
    else if (sup.rank === 2) sup.badgeText = '💎 GLOBAL 2ND';
    else if (sup.rank === 3) sup.badgeText = '🔥 GLOBAL 3RD';
  }

  document.getElementById('autoSortByCoinsBtn')?.addEventListener('click', () => {
    const data = store.getSiteData();
    data.supporters.sort((a, b) => Number(b.monthlyCoins || 0) - Number(a.monthlyCoins || 0));
    data.supporters.forEach((s, i) => {
      s.rank = i + 1;
      updateDefaultBadge(s);
    });
    persistData(data);
    renderPodiumOverview();
    loadSupporterEditor(activeEditRank);
    showToast('Jeton sayısına göre 1-2-3 sıralaması güncellendi!');
  });

  function loadSupporterEditor(rank) {
    const data = store.getSiteData();
    const sup = data.supporters.find((s) => s.rank === rank);
    if (!sup) return;

    document.getElementById('editorHeading').textContent = `✏️ ${rank}. Sıra Destekçisini Düzenle`;
    document.getElementById('videoManagerHeading').textContent = `🎁 ${rank}. Sıra Hediye Videoları (${(sup.videos || []).length} Adet)`;

    document.getElementById('supName').value = sup.name || '';
    document.getElementById('supUsername').value = sup.username || '';
    document.getElementById('supLevel').value = sup.tiktokLevel || 1;
    document.getElementById('supCoins').value = sup.monthlyCoins || 0;
    document.getElementById('supBadge').value = sup.badgeText || '';
    document.getElementById('supUrl').value = sup.tiktokUrl || '';
    document.getElementById('supBio').value = sup.bio || '';

    const vidList = document.getElementById('adminSupporterVideos');
    if (!vidList) return;
    vidList.innerHTML = '';

    if (!sup.videos || sup.videos.length === 0) {
      vidList.innerHTML = `<div style="color: #64748b; font-size: 0.85rem; padding: 10px 0;">Bu destekçi için henüz hediye videosu eklenmemiş.</div>`;
    } else {
      sup.videos.forEach((v, idx) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <div>
            <strong>🎬 ${escapeHtml(v.title || 'Hediye Videosu')}</strong>
            <div style="font-size: 0.78rem; color: #94a3b8;">❤️ ${v.likes || 0} Beğeni • ${escapeHtml(v.createdAt || '')}</div>
          </div>
          <button type="button" class="btn btn-danger btn-sm" data-delvid="${idx}">
            <i class="fa-solid fa-trash"></i> Videoyu Sil
          </button>
        `;
        vidList.appendChild(row);
      });

      vidList.querySelectorAll('[data-delvid]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const d = store.getSiteData();
          const targetSup = d.supporters.find((s) => s.rank === rank);
          targetSup.videos.splice(Number(btn.dataset.delvid), 1);
          persistData(d);
          loadSupporterEditor(rank);
          renderPodiumOverview();
          showToast('Hediye videosu silindi.');
        });
      });
    }
  }

  document.getElementById('saveSupporterBtn')?.addEventListener('click', async () => {
    const data = store.getSiteData();
    const sup = data.supporters.find((s) => s.rank === activeEditRank);
    if (!sup) return;

    sup.name = document.getElementById('supName').value.trim();
    sup.username = document.getElementById('supUsername').value.trim();
    sup.tiktokLevel = Number(document.getElementById('supLevel').value || 1);
    sup.monthlyCoins = Number(document.getElementById('supCoins').value || 0);
    sup.badgeText = document.getElementById('supBadge').value.trim();
    sup.tiktokUrl = document.getElementById('supUrl').value.trim();
    sup.bio = document.getElementById('supBio').value;

    const avInput = document.getElementById('supAvatarFile');
    if (avInput && avInput.files && avInput.files[0]) {
      sup.avatar = await store.saveMediaBlob(avInput.files[0]);
      avInput.value = '';
      const lbl = document.getElementById('supAvatarFileName');
      if (lbl) {
        lbl.textContent = 'Yeni fotoğraf seçilmedi';
        lbl.style.color = '';
      }
    }

    persistData(data);
    renderPodiumOverview();
    loadSupporterEditor(activeEditRank);
    showToast(`${activeEditRank}. Sıra destekçisi kaydedildi!`);
  });

  document.getElementById('resetSupporterSlotBtn')?.addEventListener('click', () => {
    if (!confirm(`${activeEditRank}. sıradaki destekçiyi sıfırlamak istediğinize emin misiniz?`)) return;
    const data = store.getSiteData();
    const idx = data.supporters.findIndex((s) => s.rank === activeEditRank);
    if (idx !== -1) {
      data.supporters[idx] = store.createBlankSupporter(activeEditRank);
      persistData(data);
      renderPodiumOverview();
      loadSupporterEditor(activeEditRank);
      showToast(`${activeEditRank}. sıra sıfırlandı.`);
    }
  });

  document.getElementById('uploadSupporterVideoBtn')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('newVideoFile');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      return alert('Lütfen önce "Video Seç" butonuna basıp cihazınızdan video seçin.');
    }

    const mediaRef = await store.saveMediaBlob(fileInput.files[0]);
    const data = store.getSiteData();
    const sup = data.supporters.find((s) => s.rank === activeEditRank);

    sup.videos.unshift({
      id: 'vid_' + Date.now(),
      title: document.getElementById('newVideoTitle').value.trim() || fileInput.files[0].name,
      mediaRef,
      likes: 0,
      createdAt: new Date().toLocaleString('tr-TR')
    });

    persistData(data);
    document.getElementById('newVideoTitle').value = '';
    fileInput.value = '';
    const lbl = document.getElementById('newVideoFileName');
    if (lbl) {
      lbl.textContent = 'Video seçilmedi (.mp4 / .mov)';
      lbl.style.color = '';
    }
    loadSupporterEditor(activeEditRank);
    renderPodiumOverview();
    showToast('Hediye videosu yüklendi!');
  });

  // --- 2. SOSYAL MEDYA BUTONLARI (EKLE / DÜZENLE / SIRALA / SİL) ---
  function renderSocialAdmin() {
    const data = store.getSiteData();
    const list = document.getElementById('adminSocialList');
    if (!list) return;
    list.innerHTML = '';

    if (!data.socials || data.socials.length === 0) {
      list.innerHTML = `<div style="color: #64748b; padding: 14px; text-align: center;">Henüz sosyal medya butonu yok.</div>`;
      return;
    }

    data.socials.forEach((soc, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.06); display: grid; place-items: center; color: #00f2fe; flex-shrink: 0;">
            <i class="${escapeHtml(soc.icon || 'fa-solid fa-link')}"></i>
          </div>
          <div style="min-width: 0;">
            <strong>${escapeHtml(soc.title)}</strong>
            <div style="font-size: 0.78rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px;">
              ${escapeHtml(soc.subtitle || '')} • ${escapeHtml(soc.url)}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="btn btn-ghost btn-sm" data-move="up" data-idx="${idx}" title="Yukarı">↑</button>
          <button type="button" class="btn btn-ghost btn-sm" data-move="down" data-idx="${idx}" title="Aşağı">↓</button>
          <button type="button" class="btn btn-primary btn-sm" data-edit="${idx}"><i class="fa-solid fa-pen"></i> Düzenle</button>
          <button type="button" class="btn btn-danger btn-sm" data-del="${idx}"><i class="fa-solid fa-trash"></i> Sil</button>
        </div>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.edit);
        const soc = store.getSiteData().socials[idx];
        if (!soc) return;
        editingSocialIndex = idx;
        document.getElementById('socialFormTitle').innerHTML = `<i class="fa-solid fa-pen" style="color: var(--cyan);"></i> Butonu Düzenle: ${escapeHtml(soc.title)}`;
        document.getElementById('socTitle').value = soc.title;
        document.getElementById('socSub').value = soc.subtitle || '';
        document.getElementById('socUrl').value = soc.url;
        document.getElementById('socIcon').value = soc.icon || 'fa-solid fa-globe';
        document.getElementById('saveSocialBtn').innerHTML = `<i class="fa-solid fa-check"></i> Değişikliği Kaydet`;
        document.getElementById('cancelSocialEditBtn').style.display = 'inline-flex';
      });
    });

    list.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = store.getSiteData();
        d.socials.splice(Number(btn.dataset.del), 1);
        persistData(d);
        resetSocialForm();
        renderSocialAdmin();
        showToast('Sosyal medya butonu silindi.');
      });
    });

    list.querySelectorAll('[data-move]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        const target = btn.dataset.move === 'up' ? idx - 1 : idx + 1;
        const d = store.getSiteData();
        if (target < 0 || target >= d.socials.length) return;
        [d.socials[idx], d.socials[target]] = [d.socials[target], d.socials[idx]];
        persistData(d);
        renderSocialAdmin();
      });
    });
  }

  function resetSocialForm() {
    editingSocialIndex = null;
    document.getElementById('socialFormTitle').innerHTML = `<i class="fa-solid fa-plus-circle" style="color: var(--cyan);"></i> Yeni Sosyal Medya Butonu Ekle`;
    document.getElementById('socTitle').value = '';
    document.getElementById('socSub').value = '';
    document.getElementById('socUrl').value = '';
    document.getElementById('saveSocialBtn').innerHTML = `<i class="fa-solid fa-plus"></i> Butonu Kaydet`;
    document.getElementById('cancelSocialEditBtn').style.display = 'none';
  }

  document.getElementById('cancelSocialEditBtn')?.addEventListener('click', resetSocialForm);

  document.getElementById('saveSocialBtn')?.addEventListener('click', () => {
    const title = document.getElementById('socTitle').value.trim();
    const url = document.getElementById('socUrl').value.trim();
    if (!title || !url) return alert('Lütfen buton başlığı ve bağlantı adresi girin.');

    const data = store.getSiteData();
    const item = {
      id: editingSocialIndex !== null ? data.socials[editingSocialIndex].id : 'soc_' + Date.now(),
      title,
      subtitle: document.getElementById('socSub').value.trim(),
      url,
      icon: document.getElementById('socIcon').value,
      color: '#00f2fe'
    };

    if (editingSocialIndex !== null) {
      data.socials[editingSocialIndex] = item;
      showToast('Buton güncellendi!');
    } else {
      data.socials.push(item);
      showToast('Yeni buton eklendi!');
    }

    persistData(data);
    resetSocialForm();
    renderSocialAdmin();
  });

  // --- 3. PROFİL AYARLARI ---
  async function loadProfileForm() {
    const data = store.getSiteData();
    document.getElementById('editName').value = data.profile.name || '';
    document.getElementById('editUsername').value = data.profile.username || '';
    document.getElementById('editBio').value = data.profile.bio || '';
    document.getElementById('editIsLive').value = String(!!data.profile.isLive);
    document.getElementById('editFooter').value = data.profile.footerText || '';

    const prev = document.getElementById('adminProfilePreview');
    if (prev) {
      const url = await store.resolveMediaUrl(data.profile.avatar);
      if (url) prev.src = url;
    }
  }

  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const data = store.getSiteData();
    data.profile.name = document.getElementById('editName').value.trim();
    data.profile.username = document.getElementById('editUsername').value.trim();
    data.profile.bio = document.getElementById('editBio').value;
    data.profile.isLive = document.getElementById('editIsLive').value === 'true';
    data.profile.footerText = document.getElementById('editFooter').value.trim();

    const fileInput = document.getElementById('editAvatarFile');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      data.profile.avatar = await store.saveMediaBlob(fileInput.files[0]);
      fileInput.value = '';
      const lbl = document.getElementById('profileAvatarFileName');
      if (lbl) {
        lbl.textContent = 'Cihazdan fotoğraf seçin';
        lbl.style.color = '';
      }
    }

    persistData(data);
    loadProfileForm();
    showToast('Profil ayarları kaydedildi!');
  });

  // --- 4. ZİYARETÇİ KLASÖRLERİ ---
  function renderVisitorFolders(filterText = '') {
    const logs = store.getVisitorLogs();
    const container = document.getElementById('visitorFoldersContainer');
    if (!container) return;
    container.innerHTML = '';

    const q = filterText.toLowerCase().trim();
    const filtered = logs.filter((f) => (!q ? true : JSON.stringify(f).toLowerCase().includes(q)));

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 30px; color: #64748b;">Kayıtlı ziyaretçi klasörü bulunamadı.</div>`;
      return;
    }

    filtered.forEach((folder, idx) => {
      const item = document.createElement('div');
      item.className = 'folder-item';
      const dev = folder.device || {};

      const historyRows = (folder.visits || [])
        .map(
          (v) =>
            `<div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; gap: 10px;">
              <span>📅 ${escapeHtml(v.date)} ⏰ ${escapeHtml(v.time)} — <strong>${escapeHtml(v.page)}</strong></span>
              <span style="color: #94a3b8; font-size: 0.78rem;">${escapeHtml(v.referrer)}</span>
            </div>`
        )
        .join('');

      item.innerHTML = `
        <div class="folder-header">
          <div>
            <span>📁</span>
            <strong>${escapeHtml(folder.ip)}</strong>
            <span style="color: #38bdf8; margin-left: 8px; font-size: 0.85rem;">${escapeHtml(folder.location)}</span>
            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">
              📱 ${escapeHtml(dev.deviceModel || '')} (${escapeHtml(dev.os || '')}) • 🌐 ${escapeHtml(folder.isp || '')}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: rgba(0,242,254,0.14); color: #00f2fe; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700;">
              ${folder.visitCount || 1} Giriş
            </span>
            <button type="button" class="btn btn-danger btn-sm" data-delfolder="${idx}" title="Klasörü Sil">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="folder-body">
          <div class="info-grid">
            <div class="info-box"><span>IP Adresi</span><strong>${escapeHtml(folder.ip)}</strong></div>
            <div class="info-box"><span>Konum & Koordinat</span><strong>${escapeHtml(folder.location)} ${folder.coords ? '(' + escapeHtml(folder.coords) + ')' : ''}</strong></div>
            <div class="info-box"><span>İnternet Operatörü (ISP)</span><strong>${escapeHtml(folder.isp)}</strong></div>
            <div class="info-box"><span>Cihaz & Model</span><strong>${escapeHtml(dev.deviceType)} • ${escapeHtml(dev.deviceModel)}</strong></div>
            <div class="info-box"><span>İşletim Sistemi & Tarayıcı</span><strong>${escapeHtml(dev.os)} • ${escapeHtml(dev.browser)}</strong></div>
            <div class="info-box"><span>Ekran & Ağ</span><strong>${escapeHtml(dev.screen)} • ${escapeHtml(dev.connectionType)}</strong></div>
          </div>
          <div style="font-weight: 700; margin-bottom: 6px; color: #cbd5e1;">Giriş Zaman Çizelgesi:</div>
          <div>${historyRows}</div>
        </div>
      `;

      item.querySelector('.folder-header').addEventListener('click', (e) => {
        if (e.target.closest('[data-delfolder]')) return;
        item.classList.toggle('open');
      });

      item.querySelector('[data-delfolder]').addEventListener('click', () => {
        const all = store.getVisitorLogs();
        const realIdx = all.findIndex((x) => x.folderId === folder.folderId);
        if (realIdx !== -1) {
          all.splice(realIdx, 1);
          store.saveVisitorLogs(all);
          renderVisitorFolders(document.getElementById('visitorSearchInput')?.value || '');
          showToast('Klasör silindi.');
        }
      });

      container.appendChild(item);
    });
  }

  document.getElementById('visitorSearchInput')?.addEventListener('input', (e) => {
    renderVisitorFolders(e.target.value);
  });

  document.getElementById('exportVisitorsJsonBtn')?.addEventListener('click', () => {
    downloadFile(JSON.stringify(store.getVisitorLogs(), null, 2), `ziyaretci-klasorleri-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  });

  document.getElementById('exportVisitorsCsvBtn')?.addEventListener('click', () => {
    const logs = store.getVisitorLogs();
    const header = ['Klasor', 'IP', 'Konum', 'Koordinat', 'Operator_ISP', 'Cihaz', 'Isletim_Sistemi', 'Tarayici', 'Ilk_Giris', 'Son_Giris', 'Giris_Sayisi'];
    const rows = logs.map((f) => [
      f.folderName, f.ip, f.location, f.coords || '', f.isp,
      (f.device && f.device.deviceModel) || '', (f.device && f.device.os) || '', (f.device && f.device.browser) || '',
      f.firstSeen, f.lastSeen, f.visitCount
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile('\uFEFF' + csv, `ziyaretci-raporu-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
  });

  document.getElementById('clearVisitorsBtn')?.addEventListener('click', () => {
    if (confirm('Tüm ziyaretçi klasör kayıtları silinsin mi?')) {
      store.saveVisitorLogs([]);
      renderVisitorFolders();
      showToast('Tüm ziyaretçi kayıtları temizlendi.');
    }
  });

  // --- 5. YEDEKLEME ---
  document.getElementById('exportSiteJsonBtn')?.addEventListener('click', () => {
    downloadFile(JSON.stringify(store.getSiteData(), null, 2), `aliulubas-yedek-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  });

  document.getElementById('importSiteJsonInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        persistData(JSON.parse(reader.result));
        initDashboard();
        showToast('Yedek başarıyla geri yüklendi!');
      } catch {
        alert('Geçersiz JSON yedek dosyası.');
      }
    };
    reader.readAsText(file);
  });

  function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
