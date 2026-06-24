// Limit 180 - 客製化首頁渲染與頭像資訊互動
(function() {
  function h() {
    return window.AgentCustomizationHelpers || {};
  }

  function renderHomeIdentityCard() {
    const profile = window.MathSprintStorage.getProfile();
    const avImg = document.getElementById('home-avatar-img');
    const avBorder = document.getElementById('home-avatar-border');
    const loginBadge = document.getElementById('home-login-streak-badge');
    const agentName = document.getElementById('home-agent-nickname');
    const classInfo = document.getElementById('home-agent-class-info');
    const lastSyncEl = document.getElementById('home-last-sync-time');
    const badgesContainer = document.getElementById('home-agent-badges');
    const maxStageBadge = document.getElementById('home-max-stage-badge');

    const AVATARS = h().getAvatars?.() || {};
    const BORDERS = h().getBorders?.() || {};
    const avObj = AVATARS[profile.equipped_avatar] || AVATARS['avatar-default'] || { icon: '🛡️' };
    const borObj = BORDERS[profile.equipped_border] || BORDERS['border-none'] || { color: 'transparent', id: 'border-none' };
    if (avImg) avImg.textContent = avObj.icon;
    if (avBorder) h().applyAvatarBorderVisual?.(avBorder, borObj);

    let identity = null;
    try { identity = JSON.parse(localStorage.getItem('limit180_user_profile') || 'null'); } catch (_) {}
    if (agentName) agentName.textContent = identity?.nickname || '訪客特工';
    if (classInfo) {
      classInfo.textContent = identity?.grade_class && identity?.seat_number && identity.grade_class !== '訪客'
        ? `${identity.grade_class} 班 座號 ${identity.seat_number} 號`
        : '訪客狀態・建議先登入';
    }
    if (lastSyncEl) {
      const raw = localStorage.getItem('limit180_last_sync_at');
      const d = raw ? new Date(raw) : null;
      lastSyncEl.textContent = d && !Number.isNaN(d.getTime()) ? `最後同步：${d.toLocaleString('zh-TW')}` : '最後同步：--';
    }
    if (loginBadge) {
      const day = Math.max(0, Number(localStorage.getItem('limit180_login_reward_streak') || 0));
      loginBadge.textContent = `連續登入 Day ${day}`;
      loginBadge.title = `連續登入 Day ${day}`;
    }
    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      const equippedBadges = (profile.equipped_badges || []).slice(0, 1);
      if (equippedBadges.length === 0) badgesContainer.innerHTML = `<span class="text-[9px] text-slate-500">尚未配戴徽章</span>`;
      else equippedBadges.forEach((bId) => {
        const b = h().getBadges?.()[bId];
        if (!b) return;
        const span = document.createElement('span');
        span.className = 'text-4xl leading-none cursor-help';
        span.textContent = b.icon;
        span.title = `${b.name}: ${b.desc}`;
        badgesContainer.appendChild(span);
      });
    }
    if (maxStageBadge) {
      let maxMission = 1, maxLevel = 1, hasAnyRecord = false;
      Object.keys(profile.level_records || {}).forEach((key) => {
        const m = key.match(/mission-(\d+)-level-(\d+)/);
        if (!m || !profile.level_records[key]?.is_passed) return;
        hasAnyRecord = true;
        const mi = parseInt(m[1], 10), lv = parseInt(m[2], 10);
        if (mi > maxMission || (mi === maxMission && lv > maxLevel)) { maxMission = mi; maxLevel = lv; }
      });
      maxStageBadge.textContent = hasAnyRecord ? `M${maxMission} L${maxLevel}` : 'M1 L1';
    }
  }

  function renderAvatarInfoModal() {
    const profile = window.MathSprintStorage.getProfile();
    let identity = null;
    try { identity = JSON.parse(localStorage.getItem('limit180_user_profile') || 'null'); } catch (_) {}
    const AVATARS = h().getAvatars?.() || {};
    const BORDERS = h().getBorders?.() || {};
    const BADGES = h().getBadges?.() || {};
    const av = AVATARS[profile.equipped_avatar] || AVATARS['avatar-default'] || { icon: '🛡️', name: '實習特工' };
    const bor = BORDERS[profile.equipped_border] || BORDERS['border-none'] || { name: '無外框' };
    const badgeNames = (profile.equipped_badges || []).map((id) => BADGES[id]?.name).filter(Boolean).join('、') || '無';
    document.getElementById('avatar-info-icon').textContent = av.icon || '🛡️';
    document.getElementById('avatar-info-name').textContent = identity?.nickname || '訪客特工';
    document.getElementById('avatar-info-class-seat').textContent = identity?.grade_class ? `${identity.grade_class} 班 ${identity?.seat_number || '--'} 號` : '訪客狀態';
    document.getElementById('avatar-info-border').textContent = bor.name || '無外框';
    document.getElementById('avatar-info-badges').textContent = badgeNames;
    document.getElementById('avatar-info-streak').textContent = `Day ${Math.max(0, Number(localStorage.getItem('limit180_login_reward_streak') || 0))}`;
    const raw = localStorage.getItem('limit180_last_sync_at');
    const d = raw ? new Date(raw) : null;
    document.getElementById('avatar-info-sync').textContent = d && !Number.isNaN(d.getTime()) ? d.toLocaleString('zh-TW') : '--';
  }

  function openAvatarInfoModal() {
    renderAvatarInfoModal();
    document.getElementById('avatar-info-modal')?.classList.remove('hidden');
  }

  function bind(customization) {
    window.addEventListener('mathSprintProfileUpdated', renderHomeIdentityCard);
    renderHomeIdentityCard();

    document.getElementById('home-avatar-tap-area')?.addEventListener('click', (e) => {
      if (e.target?.closest?.('#open-custom-btn-main')) return;
      openAvatarInfoModal();
    });
    document.getElementById('avatar-info-close-btn')?.addEventListener('click', () => {
      document.getElementById('avatar-info-modal')?.classList.add('hidden');
    });
    document.getElementById('avatar-info-modal')?.addEventListener('click', (e) => {
      if (e.target?.id === 'avatar-info-modal') document.getElementById('avatar-info-modal')?.classList.add('hidden');
    });
    document.getElementById('avatar-info-open-custom-btn')?.addEventListener('click', () => {
      document.getElementById('avatar-info-modal')?.classList.add('hidden');
      customization?.openModal?.();
    });
    document.getElementById('avatar-info-copy-btn')?.addEventListener('click', async () => {
      let identity = null;
      try { identity = JSON.parse(localStorage.getItem('limit180_user_profile') || 'null'); } catch (_) {}
      const payload = identity
        ? `班級：${identity.grade_class || '--'}\n座號：${identity.seat_number || '--'}\n暱稱：${identity.nickname || '--'}`
        : '班級：--\n座號：--\n暱稱：訪客特工';
      try {
        await navigator.clipboard.writeText(payload);
        window.UIFeedback?.toast?.('已複製身分資訊', 'success');
      } catch (_) {
        window.UIFeedback?.toast?.('複製失敗，請手動複製', 'error');
      }
    });
  }

  window.AgentCustomizationHome = { bind, renderHomeIdentityCard };
})();
