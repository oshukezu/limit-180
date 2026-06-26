// Limit 180 - Game Store Redeem Module
// Manages promo codes redemption and cheat codes unlocking for testing.

(function() {
  function getCurrentIdentity() {
    try {
      const profileRaw = localStorage.getItem('limit180_user_profile');
      if (!profileRaw) return null;
      const parsed = JSON.parse(profileRaw);
      if (!parsed?.grade_class || !parsed?.seat_number || !parsed?.nickname) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  const StoreRedeem = {
    // 兌換代碼功能
    async redeemCode(code, msgId = 'redeem-msg', inputId = 'redeem-code-input') {
      const normalized = code.trim().toUpperCase();
      const msgEl = document.getElementById(msgId);
      if (!msgEl) return;
      
      msgEl.classList.remove('hidden', 'text-green-400', 'text-red-400');
      msgEl.classList.add('text-slate-400');
      
      if (!normalized) {
        msgEl.textContent = '❌ 請輸入代碼！';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }
      if (!/^[A-Z0-9]{7}$/.test(normalized)) {
        msgEl.textContent = '❌ 代碼需為 7 位英數字。';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }

      // --- 本地作弊碼檢查 (使用 gitignored 設定檔) ---
      if (window.LIMIT180_CHEAT_CODES && normalized === window.LIMIT180_CHEAT_CODES.MASTER_CHEAT_CODE) {
        const profile = window.MathSprintStorage.getProfile();
        await window.LIMIT180_CHEAT_CODES.applyMasterCheat(profile, getCurrentIdentity);
        
        msgEl.textContent = '✓ 特工神之權限已解鎖！';
        msgEl.className = 'text-[9px] text-green-400 font-tech';
        msgEl.classList.remove('hidden');
        
        if (window.GameStore?.renderStore) window.GameStore.renderStore();
        if (window.MathSprintGame?.renderHome) window.MathSprintGame.renderHome();
        if (window.MathSprintGame?.renderLobby) window.MathSprintGame.renderLobby();
        if (window.MathSprintAudio?.play) window.MathSprintAudio.play('success');
        
        if (window.UIFeedback) {
          window.UIFeedback.toast('✓ 恭喜！特工神之權限（所有關卡、主題、資源與 100 萬金幣）已解鎖！', 'success');
        } else {
          alert('🎁 恭喜！特工神之權限（所有關卡、主題、資源與 100 萬金幣）已解鎖！');
        }
        
        const inputEl = document.getElementById(inputId);
        if (inputEl) inputEl.value = '';
        return;
      }

      const identity = getCurrentIdentity();
      if (!identity) {
        msgEl.textContent = '❌ 請先完成身份綁定後再兌換。';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }

      if (!window.MathSprintSupabaseService?.redeemPromoCode) {
        msgEl.textContent = '❌ 雲端功能未啟用，無法兌換代碼。';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }

      try {
        const result = await window.MathSprintSupabaseService.redeemPromoCode(
          normalized,
          identity.grade_class,
          identity.seat_number,
          identity.nickname
        );

        const profile = window.MathSprintStorage.getProfile();
        const earned = Number(result.coinsReward || 0);
        let newBalance = (profile.total_stars || 0) + earned;

        if (window.MathSprintSupabaseService?.applyCoinTransaction) {
          const tx = await window.MathSprintSupabaseService.applyCoinTransaction(
            identity.grade_class,
            identity.seat_number,
            identity.nickname,
            earned,
            'promo_redeem',
            { code: normalized }
          );
          if (tx?.newBalance >= 0) newBalance = tx.newBalance;
        }

        profile.total_stars = newBalance;
        profile.today_earnings = (profile.today_earnings || 0) + earned;
        window.MathSprintStorage.saveProfile(profile);

        if (window.MathSprintSupabaseService.saveGlobalProfile) {
          await window.MathSprintSupabaseService.saveGlobalProfile(
            identity.grade_class,
            identity.seat_number,
            identity.nickname,
            profile.total_stars || 0,
            profile.purchased_themes || ['akaimon'],
            profile.equipped_avatar || 'avatar-default',
            profile.equipped_border || 'border-none',
            profile.equipped_badges || [],
            profile.unlocked_assets || ['avatar-default', 'border-none']
          );
        }

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
        if (window.MathSprintGame && window.MathSprintGame.renderLobby) {
          window.MathSprintGame.renderLobby();
        }
        
        // 撥放音效
        if (window.MathSprintAudio && window.MathSprintAudio.play) {
          window.MathSprintAudio.play('success');
        }

        if (window.UIFeedback) {
          window.UIFeedback.toast(`兌換成功，獲得 ${earned.toLocaleString('zh-TW')} 💰 金幣`, 'success');
        } else {
          alert(`🎁 兌換成功：獲得 ${earned.toLocaleString('zh-TW')} 💰 金幣！`);
        }
        
        const inputEl = document.getElementById(inputId);
        if (inputEl) inputEl.value = '';
      } catch (err) {
        msgEl.textContent = `❌ ${err?.message || '兌換失敗'}`;
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
      }
    }
  };

  // Mixin into GameStore
  window.GameStore = window.GameStore || {};
  Object.assign(window.GameStore, StoreRedeem);

  // 綁定事件監聽
  window.addEventListener('limit180ComponentsLoaded', () => {
    // 綁定商店的兌換
    const submitBtn = document.getElementById('redeem-submit-btn');
    const inputEl = document.getElementById('redeem-code-input');
    if (submitBtn && inputEl) {
      submitBtn.addEventListener('click', () => {
        window.GameStore.redeemCode(inputEl.value, 'redeem-msg', 'redeem-code-input');
      });
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          window.GameStore.redeemCode(inputEl.value, 'redeem-msg', 'redeem-code-input');
        }
      });
    }

    // 綁定錯題消除頁面的兌換
    const revSubmitBtn = document.getElementById('review-redeem-submit-btn');
    const revInputEl = document.getElementById('review-redeem-code-input');
    if (revSubmitBtn && revInputEl) {
      revSubmitBtn.addEventListener('click', () => {
        window.GameStore.redeemCode(revInputEl.value, 'review-redeem-msg', 'review-redeem-code-input');
      });
      revInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          window.GameStore.redeemCode(revInputEl.value, 'review-redeem-msg', 'review-redeem-code-input');
        }
      });
    }
  });
})();
