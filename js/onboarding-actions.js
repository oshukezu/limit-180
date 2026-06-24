// Limit 180 Onboarding - Submit/Cloud/Reward Actions
(function() {
  const PENDING_SHARE_CODE_KEY = 'limit180_pending_join_share_code';
  const LOGIN_REWARD_LAST_DATE_KEY = 'limit180_login_reward_last_date';
  const LOGIN_REWARD_STREAK_KEY = 'limit180_login_reward_streak';

  function ctx() {
    return window.MathSprintOnboardingContext || {};
  }
  function getVal(id) {
    return (document.getElementById(id)?.value || '').trim();
  }
  function getLocalDateString() {
    return new Date().toLocaleDateString('sv');
  }
  function isConsecutiveDay(prevDateStr, todayDateStr) {
    if (!prevDateStr || !todayDateStr) return false;
    const prev = new Date(`${prevDateStr}T00:00:00`);
    const today = new Date(`${todayDateStr}T00:00:00`);
    if (Number.isNaN(prev.getTime()) || Number.isNaN(today.getTime())) return false;
    return Math.round((today - prev) / 86400000) === 1;
  }
  function computeDailyLoginReward(streakDay) {
    const day = Math.max(1, Number(streakDay || 1));
    const baseReward = day >= 30 ? 2500 : (500 + (day - 1) * 50);
    const weeklyBonus = day % 7 === 0 ? 1000 : 0;
    return { day, baseReward, weeklyBonus, totalReward: baseReward + weeklyBonus };
  }

  async function grantDailyLoginRewardIfNeeded(identity) {
    if (!identity || identity.grade_class === '訪客' || !window.MathSprintStorage) return;
    const today = getLocalDateString();
    const claimedDate = localStorage.getItem(LOGIN_REWARD_LAST_DATE_KEY);
    if (claimedDate === today) return;

    const prevStreak = Number(localStorage.getItem(LOGIN_REWARD_STREAK_KEY) || 0);
    const nextStreak = isConsecutiveDay(claimedDate, today) ? (prevStreak + 1) : 1;
    const reward = computeDailyLoginReward(nextStreak);
    const localProfile = window.MathSprintStorage.getProfile();
    localProfile.bonus_stars = (localProfile.bonus_stars || 0) + reward.totalReward;
    localProfile.today_earnings = (localProfile.today_earnings || 0) + reward.totalReward;
    window.MathSprintStorage.recalculateTotalStars(localProfile);
    window.MathSprintStorage.saveProfile(localProfile);
    localStorage.setItem(LOGIN_REWARD_LAST_DATE_KEY, today);
    localStorage.setItem(LOGIN_REWARD_STREAK_KEY, String(reward.day));

    if (window.MathSprintSupabaseService?.applyCoinTransaction) {
      const gc = String(identity.grade_class || '').trim().toUpperCase();
      const sn = String(identity.seat_number || '').trim();
      const nn = String(identity.nickname || '').trim();
      if (gc && sn && nn) {
        const eventKey = `${gc}:${sn}:daily_login:${today}`;
        await window.MathSprintSupabaseService.applyCoinTransaction(gc, sn, nn, reward.totalReward, 'daily_login_reward', {
          streakDay: reward.day, baseReward: reward.baseReward, weeklyBonus: reward.weeklyBonus, rewardDate: today
        }, eventKey).catch(() => {});
      }
    }
    window.UIFeedback?.toast?.(
      `每日登入獎勵 Day ${reward.day}：+${reward.totalReward.toLocaleString('zh-TW')} 💰`, 'success'
    );
  }

  async function joinTeamIfPending(gc, sn, nn) {
    const pendingShareCode = localStorage.getItem(PENDING_SHARE_CODE_KEY);
    if (!pendingShareCode || !window.MathSprintSupabaseService?.joinClassByShareCode) return;
    try {
      await window.MathSprintSupabaseService.joinClassByShareCode(pendingShareCode, gc, sn, nn);
      localStorage.removeItem(PENDING_SHARE_CODE_KEY);
      window.UIFeedback?.toast?.('已成功加入團隊', 'success');
    } catch (err) {
      window.UIFeedback?.toast?.(`已完成登入/註冊，但加入團隊失敗：${err.message}`, 'error');
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (ctx().isSubmitting || !ctx().errorMsg) return;
    const inputClass = getVal('profile-class');
    const inputSeat = getVal('profile-seat');
    const inputNickname = getVal('profile-nickname');
    const validator = window.MathSprintOnboardingValidator;
    if (validator) {
      const clsRes = validator.validateClass(inputClass); if (!clsRes.valid) return ctx().showError(clsRes.error);
      const seatRes = validator.validateSeat(inputSeat); if (!seatRes.valid) return ctx().showError(seatRes.error);
      const nickRes = validator.validateNickname(inputNickname); if (!nickRes.valid) return ctx().showError(nickRes.error);
    }

    const submitBtn = document.getElementById('profile-submit-btn');
    const originalText = submitBtn ? submitBtn.textContent : "進入 180 禁區";
    ctx().isSubmitting = true;
    if (submitBtn) { submitBtn.textContent = "傳輸中..."; submitBtn.disabled = true; }
    const isEditMode = document.getElementById('profile-class').readOnly;

    if (!isEditMode && window.MathSprintSupabaseService) {
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (db) {
          const { data, error } = await db.from('users_profile').select('nickname')
            .eq('grade_class', inputClass).eq('seat_number', inputSeat).limit(1);
          if (error) throw error;
          if (data && data.length > 0) {
            ctx().showError(`該班級與座號已被註冊（暱稱: "${data[0].nickname}" 佔用），座號不能重複！`);
            ctx().isSubmitting = false;
            if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
            return;
          }
        }
      } catch (_) {}
    }
    if (!isEditMode) {
      const ok = confirm(`【確定要建立此特工身份嗎？】\n\n班級：${inputClass}\n座號：${inputSeat} 號\n暱稱：${inputNickname}`);
      if (!ok) {
        ctx().isSubmitting = false;
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
        return;
      }
    }
    ctx().errorMsg.classList.add('hidden');
    const userProfile = { grade_class: inputClass, seat_number: inputSeat, nickname: inputNickname };

    try {
      localStorage.setItem('limit180_user_profile', JSON.stringify(userProfile));
      ctx().updateUserProfileBar(userProfile);
      const tempRecords = window.MathSprintGame?._tempPendingRecords;
      if (tempRecords) {
        for (const key in tempRecords) {
          const tr = tempRecords[key];
          if (tr.guest_bonus_stars > 0) {
            const p = window.MathSprintStorage.getProfile();
            p.bonus_stars = (p.bonus_stars || 0) + tr.guest_bonus_stars;
            window.MathSprintStorage.recalculateTotalStars(p);
            window.MathSprintStorage.saveProfile(p);
          }
          if (tr.isPass) {
            window.MathSprintStorage.saveLevelRecord(tr.missionNum, tr.levelNum, tr.stars, tr.avgTime, tr.maxCombo, tr.minTime, tr.accuracy);
          }
          window.MathSprintStorage.logHistory(tr.missionNum, tr.levelNum, tr.totalQuestions, tr.correctCount, tr.avgTime, tr.maxCombo, tr.isPass);
        }
        delete window.MathSprintGame._tempPendingRecords;
      }
      if (window.MathSprintOnboarding?.uploadAllLocalStats) {
        await window.MathSprintOnboarding.uploadAllLocalStats(inputClass, inputSeat, inputNickname);
      }
      await joinTeamIfPending(inputClass, inputSeat, inputNickname);
      ctx().isSubmitting = false;
      if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
      ctx().modal?.classList.add('hidden');
    } catch (err) {
      ctx().showError(`雲端綁定失敗：${err.message || '連線中斷'}`);
      ctx().isSubmitting = false;
      if (submitBtn) { submitBtn.textContent = "進入 180 禁區"; submitBtn.disabled = false; }
    }
  }

  async function handleCloudLogin() {
    if (ctx().isSubmitting || !ctx().errorMsg) return;
    const inputClass = getVal('profile-class');
    const inputSeat = getVal('profile-seat');
    const inputNickname = getVal('profile-nickname');
    const validator = window.MathSprintOnboardingValidator;
    if (validator) {
      const clsRes = validator.validateClass(inputClass); if (!clsRes.valid) return ctx().showError(clsRes.error);
      const seatRes = validator.validateSeat(inputSeat); if (!seatRes.valid) return ctx().showError(seatRes.error);
      const nickRes = validator.validateNickname(inputNickname); if (!nickRes.valid) return ctx().showError(nickRes.error);
    }
    const loginBtn = document.getElementById('profile-cloud-login-btn');
    const submitBtn = document.getElementById('profile-submit-btn');
    const oldLoginText = loginBtn ? loginBtn.textContent : '跨裝置登入';
    const oldSubmitText = submitBtn ? submitBtn.textContent : '進入 180 禁區';
    ctx().isSubmitting = true;
    if (loginBtn) { loginBtn.textContent = '登入中...'; loginBtn.disabled = true; }
    if (submitBtn) submitBtn.disabled = true;
    ctx().errorMsg.classList.add('hidden');
    try {
      if (!window.MathSprintOnboarding?.loginFromCloud) throw new Error('雲端登入功能尚未載入');
      const result = await window.MathSprintOnboarding.loginFromCloud(inputClass, inputSeat, inputNickname);
      if (!localStorage.getItem('limit180_last_sync_at')) localStorage.setItem('limit180_last_sync_at', new Date().toISOString());
      ctx().updateUserProfileBar({ grade_class: inputClass.toUpperCase(), seat_number: inputSeat, nickname: inputNickname });
      window.MathSprintGame?.renderHome?.(); window.MathSprintGame?.renderLobby?.();
      window.MathSprintLeaderboard?.renderLeaderboard?.().catch(() => {});
      window.UIFeedback?.toast?.(`登入成功，已同步 ${result.missions} 個任務與 ${result.coins.toLocaleString('zh-TW')} 💰`, 'success');
      await grantDailyLoginRewardIfNeeded({ grade_class: inputClass.toUpperCase(), seat_number: inputSeat, nickname: inputNickname });
      await joinTeamIfPending(inputClass.toUpperCase(), inputSeat, inputNickname);
      ctx().modal?.classList.add('hidden');
    } catch (err) {
      ctx().showError(`跨裝置登入失敗：${err.message || '請稍後再試'}`);
    } finally {
      ctx().isSubmitting = false;
      if (loginBtn) { loginBtn.textContent = oldLoginText; loginBtn.disabled = false; }
      if (submitBtn) { submitBtn.textContent = oldSubmitText; submitBtn.disabled = false; }
    }
  }

  async function syncCurrentStatsToCloud(missionId) {
    if (!missionId) return;
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (!profileStr || !window.MathSprintStorage) return;
    const u = JSON.parse(profileStr);
    const lp = window.MathSprintStorage.getProfile();
    let stars = 0, totalTime = 0, count = 0, minTime = 999;
    for (let l = 1; l <= 20; l++) {
      const rec = lp.level_records[`mission-${missionId}-level-${l}`];
      if (!rec) continue;
      stars += rec.stars || 0;
      if (rec.stars > 0 && rec.best_avg_time && rec.best_avg_time < 999) { totalTime += rec.best_avg_time; count++; }
      if (rec.min_time && rec.min_time < minTime) minTime = rec.min_time;
    }
    if (Number(missionId) === 1) stars += (lp.bonus_stars || 0);
    const avgTime = count > 0 ? parseFloat((totalTime / count).toFixed(3)) : 999;
    if (!(stars > 0 && avgTime < 999 && window.MathSprintSupabaseService?.saveRecord)) return;
    try {
      await window.MathSprintSupabaseService.saveRecord(
        u.grade_class, u.seat_number, u.nickname, missionId, stars, avgTime,
        minTime === 999 ? 99.9 : parseFloat(minTime.toFixed(3))
      );
      window.MathSprintLeaderboard?.renderLeaderboard?.().catch(() => {});
    } catch (_) {}
  }

  window.MathSprintOnboardingActions = { grantDailyLoginRewardIfNeeded, handleFormSubmit, handleCloudLogin, syncCurrentStatsToCloud };
})();
