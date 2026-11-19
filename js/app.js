document.addEventListener('DOMContentLoaded', async () => {
  const store = window.LinkHubStore;
  const data = store.getSiteData();

  if (window.VisitorTracker) {
    const params = new URLSearchParams(window.location.search);
    const supRank = params.get('destekci');
    window.VisitorTracker.recordVisit(supRank ? `Podyum #${supRank} Sayfası` : 'Ana Sayfa');
  }

  // Profil
  document.getElementById('profileName').textContent = data.profile.name;
  document.getElementById('profileHandle').textContent = data.profile.username;
  document.getElementById('profileBio').textContent = data.profile.bio;
  document.getElementById('footerText').textContent = data.profile.footerText;
  document.getElementById('profileAvatar').src = await store.resolveMediaUrl(data.profile.avatar);

  const liveBadge = document.getElementById('liveBadge');
  if (data.profile.isLive) {
    liveBadge.style.display = 'inline-block';
    liveBadge.textContent = data.profile.liveText || 'CANLI YAYINDA';
  }

  // Sosyal Medya Butonları
  const socialContainer = document.getElementById('socialLinksContainer');
  socialContainer.innerHTML = '';
  (data.socials || []).forEach((item) => {
    const a = document.createElement('a');
    a.className = 'social-btn';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `
      <div class="social-left">
        <div class="social-icon-box" style="color: ${item.color || '#00f2fe'}">
          <i class="${item.icon || 'fa-solid fa-link'}"></i>
        </div>
        <div>
          <div>${escapeHtml(item.title)}</div>
          ${item.subtitle ? `<span class="social-sub">${escapeHtml(item.subtitle)}</span>` : ''}
        </div>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: #64748b; font-size: 0.85rem;"></i>
    `;
    socialContainer.appendChild(a);
  });

  // Yan Yana İlk 3 Podyum
  const podiumContainer = document.getElementById('podiumContainer');
  podiumContainer.innerHTML = '';

  const top3 = [...data.supporters].sort((a, b) => a.rank - b.rank).slice(0, 3);

  for (const sup of top3) {
    const card = document.createElement('div');
    card.className = `podium-card rank-${sup.rank}`;

    const stickerClass = `sticker-${sup.rank}`;
    const avatarUrl = await store.resolveMediaUrl(sup.avatar);
    const videoCount = (sup.videos || []).length;
    const formattedCoins = Number(sup.monthlyCoins || 0).toLocaleString('tr-TR');

    card.innerHTML = `
      ${sup.rank === 1 ? '<div class="crown-float">👑</div>' : ''}
      <span class="rank-sticker ${stickerClass}">${escapeHtml(sup.badgeText || `GLOBAL #${sup.rank}`)}</span>
      <div class="podium-avatar-wrap">
        <img class="podium-avatar" src="${avatarUrl}" alt="${escapeHtml(sup.name)}" />
        <span class="tiktok-level-pill">Lv.${Number(sup.tiktokLevel || 1)}</span>
      </div>
      <div class="podium-name">${escapeHtml(sup.name)}</div>
      <div class="podium-user">${escapeHtml(sup.username)}</div>
      <div class="coin-badge">🪙 ${formattedCoins}</div>
      <div class="video-mini-count">🎬 ${videoCount} Hediye Videosu</div>
    `;

    card.addEventListener('click', () => openSupporterPage(sup.rank));
    podiumContainer.appendChild(card);
  }

  // Destekçi Özel Sayfa Modalı
  const modal = document.getElementById('supporterModal');
  const pageBox = document.getElementById('supporterPageBox');

  async function openSupporterPage(rank) {
    const freshData = store.getSiteData();
    const sup = freshData.supporters.find((s) => s.rank === Number(rank));
    if (!sup) return;

    pageBox.className = `supporter-page-box theme-${sup.rank}`;

    const badgeEl = document.getElementById('modalRankBadge');
    badgeEl.className = `rank-sticker sticker-${sup.rank}`;
    badgeEl.textContent = sup.badgeText || `GLOBAL #${sup.rank}`;

    const avatarEl = document.getElementById('modalSupporterAvatar');
    avatarEl.src = await store.resolveMediaUrl(sup.avatar);
    avatarEl.style.borderColor = sup.rank === 1 ? '#ffd700' : sup.rank === 2 ? '#38bdf8' : '#fb923c';

    document.getElementById('modalSupporterName').textContent = sup.name;
    document.getElementById('modalSupporterHandle').textContent = sup.username;
    document.getElementById('modalSupporterLevel').textContent = `⚡ TikTok Hediye Lv. ${Number(sup.tiktokLevel || 1)}`;
    document.getElementById('modalSupporterCoins').textContent = `🪙 Bu Ay: ${Number(sup.monthlyCoins || 0).toLocaleString('tr-TR')} Jeton`;
    document.getElementById('modalSupporterBio').textContent = sup.bio || '';

    document.getElementById('supporterTiktokBtn').href = sup.tiktokUrl || 'https://www.tiktok.com';

    const newTabBtn = document.getElementById('openInNewTabBtn');
    const url = new URL(window.location.href);
    url.searchParams.set('destekci', sup.rank);
    newTabBtn.href = url.toString();

    const grid = document.getElementById('supporterVideosGrid');
    grid.innerHTML = '';
    const videos = sup.videos || [];
    document.getElementById('modalVideoCount').textContent = `${videos.length} Video`;

    if (videos.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 28px; color: #64748b; font-size: 0.9rem;">Henüz hediye videosu eklenmemiş.</div>`;
    } else {
      for (const vid of videos) {
        const videoUrl = await store.resolveMediaUrl(vid.mediaRef);
        const tile = document.createElement('div');
        tile.className = 'video-tile';
        tile.innerHTML = `
          <video src="${videoUrl}" muted preload="metadata" playsinline></video>
          <div class="video-tile-overlay">
            <div class="play-badge"><i class="fa-solid fa-play"></i></div>
            <div class="tile-meta">
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(vid.title || 'Hediye')}</div>
              <div style="color: #ff6b8b; font-size: 0.74rem;">❤️ ${vid.likes || 0}</div>
            </div>
          </div>
        `;
        tile.addEventListener('click', () => openVideoPlayer(vid, videoUrl, sup.rank));
        grid.appendChild(tile);
      }
    }

    modal.classList.add('active');
  }

  document.getElementById('closeSupporterModal').addEventListener('click', () => {
    modal.classList.remove('active');
    const url = new URL(window.location.href);
    url.searchParams.delete('destekci');
    window.history.replaceState({}, '', url.toString());
  });

  // Tam Ekran Video Oynatıcı & Üyeliksiz Beğeni
  let activeVideoId = null;
  let activeSupporterRank = null;
  const playerModal = document.getElementById('videoPlayerModal');
  const videoEl = document.getElementById('activeVideoPlayer');
  const likeBtn = document.getElementById('videoLikeBtn');
  const likeCountEl = document.getElementById('videoLikeCount');

  function openVideoPlayer(vid, videoUrl, rank) {
    activeVideoId = vid.id;
    activeSupporterRank = rank;
    document.getElementById('playerVideoTitle').textContent = vid.title || 'Hediye Videosu';
    videoEl.src = videoUrl;
    videoEl.play().catch(() => {});

    const guestLikes = store.getGuestLikes();
    likeBtn.classList.toggle('liked', !!guestLikes[vid.id]);
    likeCountEl.textContent = vid.likes || 0;

    playerModal.classList.add('active');
  }

  likeBtn.addEventListener('click', () => {
    if (!activeVideoId) return;
    const res = store.toggleGuestLike(activeVideoId);
    likeBtn.classList.toggle('liked', res.isLiked);
    likeCountEl.textContent = res.count;
    if (activeSupporterRank) openSupporterPage(activeSupporterRank);
  });

  document.getElementById('closePlayerModal').addEventListener('click', () => {
    videoEl.pause();
    videoEl.src = '';
    playerModal.classList.remove('active');
  });

  const initialSup = new URLSearchParams(window.location.search).get('destekci');
  if (initialSup) openSupporterPage(initialSup);

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});