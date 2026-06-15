// Limit 180 — 定級測試 UI 控制器
(function() {
  let placementModal = null;
  let choicePanel = null;
  let confirmPanel = null;
  let resultPanel = null;

  window.addEventListener('limit180ComponentsLoaded', () => {
    placementModal = document.getElementById('placement-modal');
    choicePanel = document.getElementById('placement-choice-panel');
    confirmPanel = document.getElementById('placement-confirm-panel');
    resultPanel = document.getElementById('placement-result-panel');

    // 基礎鍛鍊班選擇
    const btnJunior = document.getElementById('placement-btn-junior');
    if (btnJunior) {
      btnJunior.addEventListener('click', () => {
        applyJuniorProfile();
      });
    }

    // 前往極速菁英確認警告
    const btnElite = document.getElementById('placement-btn-elite');
    if (btnElite) {
      btnElite.addEventListener('click', () => {
        choicePanel.classList.add('hidden');
        confirmPanel.classList.remove('hidden');
      });
    }

    // 啟動定級測驗
    const btnConfirmStart = document.getElementById('placement-confirm-start-btn');
    if (btnConfirmStart) {
      btnConfirmStart.addEventListener('click', () => {
        if (placementModal) placementModal.classList.add('hidden');
        if (window.MathSprintGame && typeof window.MathSprintGame.startPlacementTest === 'function') {
          window.MathSprintGame.startPlacementTest();
        }
      });
    }

    // 確認頁返回
    const btnConfirmBack = document.getElementById('placement-confirm-back-btn');
    if (btnConfirmBack) {
      btnConfirmBack.addEventListener('click', () => {
        confirmPanel.classList.add('hidden');
        choicePanel.classList.remove('hidden');
      });
    }

    // 結果頁關閉
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

  // 套用基礎鍛鍊班設定
  function applyJuniorProfile() {
    const profile = window.MathSprintStorage.getProfile();
    profile.placement_status = 'JUNIOR';
    profile.placement_score = 0;
    profile.max_unlocked_phase = 1; // 基礎第一階

    window.MathSprintStorage.saveProfile(profile);
    
    if (placementModal) placementModal.classList.add('hidden');
    
    // 渲染大廳並進入
    if (window.MathSprintGame && typeof window.MathSprintGame.renderLobby === 'function') {
      window.MathSprintGame.renderLobby();
    }
    window.showView('view-lobby');
  }

  // 暴露至全域
  window.MathSprintPlacementModal = {
    // 檢查是否已做過測驗，未做過則跳出 Modal
    checkAndShow() {
      const profile = window.MathSprintStorage.getProfile();
      if (!profile.placement_status || profile.placement_status === 'NOT_TESTED') {
        if (placementModal) {
          // 初始化面板顯示狀態
          choicePanel.classList.remove('hidden');
          confirmPanel.classList.add('hidden');
          resultPanel.classList.add('hidden');
          placementModal.classList.remove('hidden');
        }
        return true;
      }
      return false;
    },

    // 顯示定級測驗判定結果
    showResult(passed, score) {
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

      if (passed) {
        // 晉級菁英班
        profile.placement_status = 'ELITE';
        profile.max_unlocked_phase = 3; // 解鎖至第三階段起點 M21
        
        // 菁英跳級星等與金幣補貼 (依比例補足跳級關卡的基本星數補貼 120,000 金幣)
        // 並將起點重設為 Mission 21
        profile.total_stars = (profile.total_stars || 0) + 120000;
        profile.today_earnings = (profile.today_earnings || 0) + 120000;
        window.MathSprintStorage.recalculateTotalStars(profile);
        window.MathSprintStorage.saveProfile(profile);

        // 串接 Supabase 同步進度與補貼
        syncPlacementResultToCloud('ELITE', score, 3, 120000);

        // UI 渲染
        resultPanel.className = "hud-panel p-6 bg-slate-950 border-2 border-green-500 max-w-md w-full relative";
        if (resultTitle) {
          resultTitle.textContent = "🚀 菁英班晉級成功！";
          resultTitle.className = "text-base font-pixel text-green-400 glow-green";
        }
        if (resultTag) {
          resultTag.textContent = "OVERCLOCKING SUCCESS";
          resultTag.className = "text-xs font-pixel text-green-400 glow-green block mb-1";
        }
        if (resultDesc) {
          resultDesc.className = "text-xs font-pixel text-green-300 leading-relaxed bg-green-950/20 border border-green-800 p-4 rounded text-left mb-6";
          resultDesc.innerHTML = `恭喜特工！您在 10 題極速測驗中成功答對了 <span class="text-yellow-400 font-bold">${score} 題</span>，達成高年級菁英超頻門檻！<br><br>系統已自動將您跳級解鎖至 <span class="text-yellow-400 font-bold">Mission 21</span>，並補貼發放開局菁英獎金 <span class="text-yellow-400 font-bold">120,000 💰 金幣</span>！`;
        }
        if (resultCloseBtn) {
          resultCloseBtn.className = "cyber-btn cyber-btn-green px-8 py-3 font-pixel text-xs text-green-400";
        }
      } else {
        // 分流基礎班 (尊嚴保護機制)
        profile.placement_status = 'JUNIOR';
        profile.max_unlocked_phase = 1;
        window.MathSprintStorage.saveProfile(profile);

        // 串接 Supabase 同步進度
        syncPlacementResultToCloud('JUNIOR', score, 1, 0);

        // UI 渲染
        resultPanel.className = "hud-panel p-6 bg-slate-950 border-2 border-cyan-500 max-w-md w-full relative";
        if (resultTitle) {
          resultTitle.textContent = "🌱 段位判定完成";
          resultTitle.className = "text-base font-pixel text-cyan-400 glow-blue";
        }
        if (resultTag) {
          resultTag.textContent = "CALIBRATION COMPLETE";
          resultTag.className = "text-xs font-pixel text-cyan-400 glow-blue block mb-1";
        }
        if (resultDesc) {
          resultDesc.className = "text-xs font-pixel text-cyan-300 leading-relaxed bg-cyan-950/10 border border-cyan-800 p-4 rounded text-left mb-6";
          resultDesc.innerHTML = `測試完成！大腦神經元已成功活化。<br><br>系統偵測到您目前的反射神經適合由基礎區提取 <span class="text-yellow-400 font-bold">60%</span> 的加速紅利，一邊累積金幣、一邊穩健衝刺！`;
        }
        if (resultCloseBtn) {
          resultCloseBtn.className = "cyber-btn px-8 py-3 font-pixel text-xs text-cyan-400 border border-cyan-800";
        }
      }

      placementModal.classList.remove('hidden');
    }
  };

  // 雲端同步輔助
  async function syncPlacementResultToCloud(status, score, maxPhase, coinsReward) {
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (!profileStr) return;
    const u = JSON.parse(profileStr);

    if (window.MathSprintSupabaseService) {
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) return;

        // 更新 users_profile 的 placement 欄位 (如果資料表支援)
        // 由於我們使用的是單一資料表且無 placement_status 欄位（如果在 supabase_init.sql 中尚未實體執行），
        // 這裡會安全地先同步在本地，如果 Supabase 支援就進行更新。
        // 為保證資料安全性，我們利用 saveGlobalProfile 自動傳輸 coins_balance。
        if (window.MathSprintStorage) {
          const localProfile = window.MathSprintStorage.getProfile();
          if (window.MathSprintSupabaseService.saveGlobalProfile) {
            await window.MathSprintSupabaseService.saveGlobalProfile(
              u.grade_class,
              u.seat_number,
              u.nickname,
              localProfile.total_stars || 0,
              localProfile.purchased_items || []
            );
          }

          // 另外，如果是菁英特工，我們為他寫入一筆 M21 關卡的空記錄，用來讓雲端排行榜知道他已經跳級了！
          if (status === 'ELITE') {
            await window.MathSprintSupabaseService.saveRecord(
              u.grade_class,
              u.seat_number,
              u.nickname,
              21, // Mission 21
              0,  // 0 星 (起始)
              99.9,
              99.9
            );
          }
        }
      } catch (err) {
        console.warn("[PlacementSync] 雲端同步定級失敗：", err.message || err);
      }
    }
  }
})();
