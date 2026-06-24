(function() {
  const FOREGROUND_MS = 5000;
  const BACKGROUND_MS = 30000;
  let timerId = null;
  let isChecking = false;

  function getIdentity() {
    try {
      return JSON.parse(localStorage.getItem('limit180_user_profile') || 'null');
    } catch (_) {
      return null;
    }
  }

  function scheduleNext() {
    clearTimeout(timerId);
    const delay = document.hidden ? BACKGROUND_MS : FOREGROUND_MS;
    timerId = setTimeout(checkBalance, delay);
  }

  function isStaleCloudBalance(row) {
    const localChangedAt = Number(localStorage.getItem('limit180_local_balance_changed_at') || 0);
    if (!localChangedAt) return false;
    const cloudUpdatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    return Number.isFinite(cloudUpdatedAt) && cloudUpdatedAt > 0 && cloudUpdatedAt <= localChangedAt;
  }

  function isRecentLedger(ledger, row) {
    if (!ledger?.created_at || !row?.updated_at) return true;
    const ledgerAt = new Date(ledger.created_at).getTime();
    const rowAt = new Date(row.updated_at).getTime();
    return Number.isFinite(ledgerAt) && Number.isFinite(rowAt) && Math.abs(rowAt - ledgerAt) < 15000;
  }

  function getCoinToast(ledger, delta) {
    const reason = String(ledger?.reason || '');
    if (/^admin_award/.test(reason)) {
      return `收到後台發放金幣 +${delta.toLocaleString('zh-TW')} 💰`;
    }
    if (reason === 'daily_login_reward') {
      return `已同步每日登入獎勵 +${delta.toLocaleString('zh-TW')} 💰`;
    }
    if (reason === 'skip_exam_pass_reward') {
      return `已同步跳級考試獎勵 +${delta.toLocaleString('zh-TW')} 💰`;
    }
    if (reason === 'redeem_promo_code' || reason === 'promo_redeem') {
      return `已同步兌換獎勵 +${delta.toLocaleString('zh-TW')} 💰`;
    }
    return '';
  }

  function mergeCloudAssets(profile, row) {
    let changed = false;
    const soldThemes = JSON.parse(localStorage.getItem('limit180_sold_themes') || '[]');
    const soldAssets = JSON.parse(localStorage.getItem('limit180_sold_assets') || '[]');
    const soldBadges = JSON.parse(localStorage.getItem('limit180_sold_badges') || '[]');
    if (Array.isArray(row.purchased_items)) {
      const localThemes = Array.isArray(profile.purchased_themes) ? profile.purchased_themes : ['akaimon'];
      const cloudThemes = row.purchased_items.filter(id => !soldThemes.includes(id));
      const merged = Array.from(new Set([...localThemes, ...cloudThemes, 'akaimon']));
      changed = changed || merged.length !== localThemes.length;
      profile.purchased_themes = merged;
    }
    if (Array.isArray(row.unlocked_assets)) {
      const localAssets = Array.isArray(profile.unlocked_assets) ? profile.unlocked_assets : ['avatar-default', 'border-none'];
      const cloudAssets = row.unlocked_assets.filter(id => !soldAssets.includes(id));
      const merged = Array.from(new Set([...localAssets, ...cloudAssets]));
      changed = changed || merged.length !== localAssets.length;
      profile.unlocked_assets = merged;
    }
    if (Array.isArray(row.equipped_badges)) {
      const localBadges = Array.isArray(profile.equipped_badges) ? profile.equipped_badges : [];
      const cloudBadges = row.equipped_badges.filter(id => !soldBadges.includes(id));
      const merged = Array.from(new Set([...cloudBadges, ...localBadges])).slice(0, 1);
      changed = changed || merged.join('|') !== localBadges.join('|');
      profile.equipped_badges = merged;
    }
    if (Array.isArray(row.purchased_missions)) {
      const localMissions = Array.isArray(profile.purchased_missions) ? profile.purchased_missions : [];
      const merged = Array.from(new Set([...localMissions, ...row.purchased_missions.map(Number)])).filter(Boolean);
      changed = changed || merged.join('|') !== localMissions.join('|');
      profile.purchased_missions = merged;
    }
    if (Number.isFinite(Number(row.skip_exam_tickets))) {
      const tickets = Math.max(0, Number(row.skip_exam_tickets || 0));
      changed = changed || Number(profile.skip_exam_tickets || 0) !== tickets;
      profile.skip_exam_tickets = tickets;
    }
    return changed;
  }

  async function checkBalance() {
    if (isChecking) return scheduleNext();
    const identity = getIdentity();
    if (!identity?.grade_class || !identity?.seat_number || !identity?.nickname) return scheduleNext();
    if (!window.MathSprintSupabaseService?.getGlobalProfile || !window.MathSprintStorage) return scheduleNext();

    isChecking = true;
    try {
      const row = await window.MathSprintSupabaseService.getGlobalProfile(
        identity.grade_class,
        identity.seat_number,
        identity.nickname
      );
      if (!row) return;

      const profile = window.MathSprintStorage.getProfile();
      const localCoins = Number(profile.total_stars || 0);
      const cloudCoins = Number(row.coins_balance || 0);
      const assetsChanged = mergeCloudAssets(profile, row);

      if (cloudCoins > localCoins && !isStaleCloudBalance(row)) {
        const delta = cloudCoins - localCoins;
        const ledger = await window.MathSprintSupabaseService.getLatestCoinLedger?.(
          identity.grade_class,
          identity.seat_number
        );
        profile.total_stars = cloudCoins;
        localStorage.setItem('limit180_last_sync_at', row.updated_at || new Date().toISOString());
        window.MathSprintStorage.saveProfile(profile);
        const toastText = isRecentLedger(ledger, row) ? getCoinToast(ledger, delta) : '';
        if (toastText) window.UIFeedback?.toast?.(toastText, 'success');
      } else if (assetsChanged) {
        window.MathSprintStorage.saveProfile(profile);
      }
    } catch (err) {
      console.warn('[PlayerBalanceSync] 背景同步失敗：', err.message);
    } finally {
      isChecking = false;
      scheduleNext();
    }
  }

  function start() {
    if (timerId) return;
    scheduleNext();
  }

  function restart() {
    clearTimeout(timerId);
    timerId = null;
    start();
  }

  document.addEventListener('visibilitychange', restart);
  window.addEventListener('online', restart);
  window.addEventListener('limit180ComponentsLoaded', start);
  window.addEventListener('mathSprintProfileUpdated', start);

  window.PlayerBalanceSync = { start, checkNow: checkBalance };
})();
