// Limit 180 — 跳級考試 UI 控制器
(function() {
  let placementModal = null;
  let choicePanel = null;
  let confirmPanel = null;
  let resultPanel = null;

  function getIdentity() {
    try {
      return JSON.parse(localStorage.getItem('limit180_user_profile') || 'null');
    } catch (_) {
      return null;
    }
  }

  function getHighestUnlockedMission(profile) {
    const configs = window.MathSprintConfigs?.MISSION_CONFIGS || {};
    const count = Object.keys(configs).length || 50;
    let max = 1;
    for (let m = 1; m <= count; m++) {
      if (window.MathSprintStorage.isMissionUnlocked(m, profile)) max = m;
    }
    return max;
  }

  function renderTicketCount() {
    const profile = window.MathSprintStorage.getProfile();
    document.querySelectorAll('.skip-exam-ticket-count').forEach(el => {
      el.textContent = Number(profile.skip_exam_tickets || 0).toLocaleString('zh-TW');
    });
    const modalCount = document.getElementById('placement-ticket-count');
    if (modalCount) modalCount.textContent = Number(profile.skip_exam_tickets || 0).toLocaleString('zh-TW');
  }

  function openChoicePanel() {
    if (!placementModal) return;
    renderTicketCount();
    choicePanel.classList.remove('hidden');
    confirmPanel.classList.add('hidden');
    resultPanel.classList.add('hidden');
    placementModal.classList.remove('hidden');
  }

  window.addEventListener('limit180ComponentsLoaded', () => {
    placementModal = document.getElementById('placement-modal');
    choicePanel = document.getElementById('placement-choice-panel');
    confirmPanel = document.getElementById('placement-confirm-panel');
    resultPanel = document.getElementById('placement-result-panel');

    const btnJunior = document.getElementById('placement-btn-junior');
    if (btnJunior) {
      btnJunior.addEventListener('click', () => {
        if (placementModal) placementModal.classList.add('hidden');
      });
    }

    const btnElite = document.getElementById('placement-btn-elite');
    if (btnElite) {
      btnElite.addEventListener('click', () => {
        choicePanel.classList.add('hidden');
        confirmPanel.classList.remove('hidden');
      });
    }

    const btnConfirmStart = document.getElementById('placement-confirm-start-btn');
    if (btnConfirmStart) {
      btnConfirmStart.addEventListener('click', startSkipExam);
    }

    const btnConfirmBack = document.getElementById('placement-confirm-back-btn');
    if (btnConfirmBack) {
      btnConfirmBack.addEventListener('click', () => {
        confirmPanel.classList.add('hidden');
        choicePanel.classList.remove('hidden');
      });
    }

    const btnResultClose = document.getElementById('placement-result-close-btn');
    if (btnResultClose) {
      btnResultClose.addEventListener('click', () => {
        if (placementModal) placementModal.classList.add('hidden');
        // 切換至大廳
        if (window.MathSprintGame && typeof window.MathSprintGame.renderLobby === 'function') {
          window.MathSprintGame.renderLobby();
        }
        window.showView('view-lobby');
      });
    }
  });

  async function startSkipExam() {
    const identity = getIdentity();
    if (!identity?.grade_class || identity.grade_class === '訪客') {
      window.UIFeedback?.toast?.('請先登入會員，再使用跳級考試券。', 'error');
      return;
    }
    const profile = window.MathSprintStorage.getProfile();
    if (Number(profile.skip_exam_tickets || 0) <= 0) {
      window.UIFeedback?.toast?.('沒有可使用的跳級考試券，請先到商店購買。', 'error');
      return;
    }

    try {
      const result = await window.MathSprintSupabaseService.consumeSkipExamTicket(
        identity.grade_class,
        identity.seat_number,
        identity.nickname
      );
      profile.skip_exam_tickets = Number(result?.tickets ?? Math.max(0, (profile.skip_exam_tickets || 0) - 1));
      window.MathSprintStorage.saveProfile(profile);
      localStorage.setItem('limit180_skip_exam_attempt_id', result?.attempt_id || `${identity.grade_class}:${identity.seat_number}:${Date.now()}`);
      renderTicketCount();
      if (placementModal) placementModal.classList.add('hidden');
      window.MathSprintGame?.startPlacementTest?.();
    } catch (err) {
      window.UIFeedback?.toast?.(`無法啟動跳級考試：${err.message || '請確認資料庫已執行升級 SQL'}`, 'error');
    }
  }

  window.MathSprintPlacementModal = {
    checkAndShow() {
      return false;
    },

    openSkipExam() {
      const identity = getIdentity();
      if (!identity?.grade_class || identity.grade_class === '訪客') {
        window.UIFeedback?.toast?.('請先登入會員，再使用跳級考試券。', 'error');
        return;
      }
      const profile = window.MathSprintStorage.getProfile();
      if (Number(profile.skip_exam_tickets || 0) <= 0) {
        window.UIFeedback?.toast?.('沒有跳級考試券，請先到商店購買。', 'error');
        return;
      }
      openChoicePanel();
    },

    async showResult(passed, score) {
      if (!placementModal || !resultPanel) return;

      choicePanel.classList.add('hidden');
      confirmPanel.classList.add('hidden');
      resultPanel.classList.remove('hidden');

      const resultTitle = document.getElementById('placement-result-title');
      const resultTag = document.getElementById('placement-result-tag');
      const resultDesc = document.getElementById('placement-result-desc');
      const resultCloseBtn = document.getElementById('placement-result-close-btn');

      const profile = window.MathSprintStorage.getProfile();
      profile.placement_score = score;
      profile.placement_status = 'JUNIOR';

      if (passed) {
        const before = getHighestUnlockedMission(profile);
        const target = Math.min(50, before + 5);
        const unlocked = [];
        profile.purchased_missions = Array.isArray(profile.purchased_missions) ? profile.purchased_missions : [];
        for (let m = before + 1; m <= target; m++) {
          if (!profile.purchased_missions.includes(m)) {
            profile.purchased_missions.push(m);
            unlocked.push(m);
          }
        }
        const reward = 200000;
        profile.bonus_stars = (profile.bonus_stars || 0) + reward;
        profile.today_earnings = (profile.today_earnings || 0) + reward;
        profile.total_stars = (profile.total_stars || 0) + reward;
        window.MathSprintStorage.saveProfile(profile);
        await syncSkipExamPass(score, profile);

        // UI 渲染
        resultPanel.className = "hud-panel p-6 bg-slate-950 border-2 border-green-500 max-w-md w-full relative";
        if (resultTitle) {
          resultTitle.textContent = "跳級考試通過！";
          resultTitle.className = "text-base font-pixel text-green-400 glow-green";
        }
        if (resultTag) {
          resultTag.textContent = "OVERCLOCKING SUCCESS";
          resultTag.className = "text-xs font-pixel text-green-400 glow-green block mb-1";
        }
        if (resultDesc) {
          resultDesc.className = "text-xs font-pixel text-green-300 leading-relaxed bg-green-950/20 border border-green-800 p-4 rounded text-left mb-6";
          const rangeText = unlocked.length ? `Mission ${unlocked[0]} - Mission ${unlocked[unlocked.length - 1]}` : '已達最高 Mission';
          resultDesc.innerHTML = `你在 10 題跳級考試中答對 <span class="text-yellow-400 font-bold">${score} 題</span>，已通過門檻。<br><br>本次解鎖：<span class="text-yellow-400 font-bold">${rangeText}</span><br>額外獎勵：<span class="text-yellow-400 font-bold">200,000 💰</span>`;
        }
        if (resultCloseBtn) {
          resultCloseBtn.className = "cyber-btn cyber-btn-green px-8 py-3 font-pixel text-xs text-green-400";
        }
      } else {
        window.MathSprintStorage.saveProfile(profile);

        // UI 渲染
        resultPanel.className = "hud-panel p-6 bg-slate-950 border-2 border-cyan-500 max-w-md w-full relative";
        if (resultTitle) {
          resultTitle.textContent = "跳級考試未通過";
          resultTitle.className = "text-base font-pixel text-cyan-400 glow-blue";
        }
        if (resultTag) {
          resultTag.textContent = "CALIBRATION COMPLETE";
          resultTag.className = "text-xs font-pixel text-cyan-400 glow-blue block mb-1";
        }
        if (resultDesc) {
          resultDesc.className = "text-xs font-pixel text-cyan-300 leading-relaxed bg-cyan-950/10 border border-cyan-800 p-4 rounded text-left mb-6";
          resultDesc.innerHTML = `本次答對 <span class="text-yellow-400 font-bold">${score} 題</span>，未達 8 題通過門檻。<br><br>考試券已在開始時消耗，不會退回。可以先回一般關卡累積金幣與速度，再購買新券挑戰。`;
        }
        if (resultCloseBtn) {
          resultCloseBtn.className = "cyber-btn px-8 py-3 font-pixel text-xs text-cyan-400 border border-cyan-800";
        }
      }

      placementModal.classList.remove('hidden');
    }
  };

  async function syncSkipExamPass(score, profile) {
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (!profileStr) return;
    const u = JSON.parse(profileStr);
    const attemptId = localStorage.getItem('limit180_skip_exam_attempt_id') || `${u.grade_class}:${u.seat_number}:${Date.now()}`;
    try {
      await window.MathSprintSupabaseService?.updatePurchasedMissions?.(
        u.grade_class,
        u.seat_number,
        u.nickname,
        profile.purchased_missions || []
      );
      const tx = await window.MathSprintSupabaseService?.applyCoinTransaction?.(
        u.grade_class,
        u.seat_number,
        u.nickname,
        200000,
        'skip_exam_pass_reward',
        { score, purchased_missions: profile.purchased_missions || [] },
        `${u.grade_class}:${u.seat_number}:skip_exam_pass:${attemptId}`
      );
      if (tx?.newBalance >= 0) {
        profile.total_stars = tx.newBalance;
        window.MathSprintStorage.saveProfile(profile);
      }
    } catch (err) {
      console.warn("[SkipExamSync] 雲端同步跳級結果失敗：", err.message || err);
    }
  }
})();
