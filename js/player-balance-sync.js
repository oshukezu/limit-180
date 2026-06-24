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

  function mergeCloudAssets(profile, row) {
    let changed = false;
    if (Array.isArray(row.purchased_items)) {
      const localThemes = Array.isArray(profile.purchased_themes) ? profile.purchased_themes : ['akaimon'];
      const merged = Array.from(new Set([...localThemes, ...row.purchased_items, 'akaimon']));
      changed = changed || merged.length !== localThemes.length;
      profile.purchased_themes = merged;
    }
    if (Array.isArray(row.unlocked_assets)) {
      const localAssets = Array.isArray(profile.unlocked_assets) ? profile.unlocked_assets : ['avatar-default', 'border-none'];
      const merged = Array.from(new Set([...localAssets, ...row.unlocked_assets]));
      changed = changed || merged.length !== localAssets.length;
      profile.unlocked_assets = merged;
    }
    if (Array.isArray(row.equipped_badges)) {
      const localBadges = Array.isArray(profile.equipped_badges) ? profile.equipped_badges : [];
      const merged = Array.from(new Set([...row.equipped_badges, ...localBadges])).slice(0, 1);
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

      if (cloudCoins > localCoins) {
        const delta = cloudCoins - localCoins;
        profile.total_stars = cloudCoins;
        localStorage.setItem('limit180_last_sync_at', row.updated_at || new Date().toISOString());
        window.MathSprintStorage.saveProfile(profile);
        window.UIFeedback?.toast?.(`收到後台發放金幣 +${delta.toLocaleString('zh-TW')} 💰`, 'success');
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
