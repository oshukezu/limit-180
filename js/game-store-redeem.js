// Limit 180 - Game Store Redeem Module
// Manages promo codes redemption and cheat codes unlocking for testing.

(function() {
  const StoreRedeem = {
    // 兌換代碼功能
    redeemCode(code) {
      const normalized = code.trim().toUpperCase();
      const msgEl = document.getElementById('redeem-msg');
      if (!msgEl) return;
      
      msgEl.classList.remove('hidden', 'text-green-400', 'text-red-400');
      msgEl.classList.add('text-slate-400');
      
      if (!normalized) {
        msgEl.textContent = '❌ 請輸入代碼！';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }

      const profile = window.MathSprintStorage.getProfile();
      let success = false;
      let alertMsg = '';

      // 檢查兌換代碼
      if (normalized === 'UNLOCK7') {
        // 作弊測試碼：解鎖全關卡 + 200萬金幣
        profile.total_stars = (profile.total_stars || 0) + 2000000;
        profile.today_earnings = (profile.today_earnings || 0) + 2000000;
        profile.max_unlocked_phase = 5; // 五個階段全解鎖
        profile.placement_status = 'ELITE'; // 段位直接成菁英
        
        // 將 M1-M50 所有關卡標記為已通過 (100% 正確率 3星)
        const MISSION_CONFIGS = window.MathSprintConfigs.MISSION_CONFIGS;
        Object.keys(MISSION_CONFIGS).forEach(mId => {
          for (let lId = 1; lId <= 20; lId++) {
            const key = `mission-${mId}-level-${lId}`;
            if (!profile.level_records[key]) {
              profile.level_records[key] = {
                stars: 200 * lId, // 賦予基礎星等分數
                best_avg_time: 1.5,
                max_combo: 20,
                min_time: 1.0,
                accuracy: 1.0,
                is_passed: true
              };
            } else {
              profile.level_records[key].is_passed = true;
              profile.level_records[key].accuracy = Math.max(profile.level_records[key].accuracy || 0, 1.0);
            }
          }
        });
        
        window.MathSprintStorage.saveProfile(profile);
        success = true;
        alertMsg = '🔓 測試代碼生效：已解鎖全關卡與 Mission！並獲得 2,000,000 💰 金幣！';
      } else if (normalized === 'COINS88') {
        // 一般獎勵碼 1：+88,000 金幣
        profile.total_stars = (profile.total_stars || 0) + 88000;
        profile.today_earnings = (profile.today_earnings || 0) + 88000;
        window.MathSprintStorage.saveProfile(profile);
        success = true;
        alertMsg = '🎁 兌換成功：獲得 88,000 💰 金幣！';
      } else if (normalized === 'SECRET7') {
        // 一般獎勵碼 2：+150,000 金幣
        profile.total_stars = (profile.total_stars || 0) + 150000;
        profile.today_earnings = (profile.today_earnings || 0) + 150000;
        window.MathSprintStorage.saveProfile(profile);
        success = true;
        alertMsg = '🎁 兌換成功：獲得 150,000 💰 金幣！';
      } else {
        msgEl.textContent = '❌ 無效的兌換代碼！';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }

      if (success) {
        msgEl.textContent = '✓ 兌換成功！';
        msgEl.className = 'text-[9px] text-green-400 font-tech';
        msgEl.classList.remove('hidden');
        
        // 重新渲染商店餘額與首頁
        if (window.GameStore && window.GameStore.renderStore) {
          window.GameStore.renderStore();
        }
        if (window.MathSprintGame && window.MathSprintGame.renderHome) {
          window.MathSprintGame.renderHome();
        }
        
        // 撥放音效
        if (window.MathSprintAudio && window.MathSprintAudio.play) {
          window.MathSprintAudio.play('success');
        }
        
        alert(alertMsg);
        document.getElementById('redeem-code-input').value = '';
      }
    }
  };

  // Mixin into GameStore
  window.GameStore = window.GameStore || {};
  Object.assign(window.GameStore, StoreRedeem);

  // 綁定事件監聽
  window.addEventListener('limit180ComponentsLoaded', () => {
    const submitBtn = document.getElementById('redeem-submit-btn');
    const inputEl = document.getElementById('redeem-code-input');
    
    if (submitBtn && inputEl) {
      submitBtn.addEventListener('click', () => {
        window.GameStore.redeemCode(inputEl.value);
      });
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          window.GameStore.redeemCode(inputEl.value);
        }
      });
    }
  });
})();
