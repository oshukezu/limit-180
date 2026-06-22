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
    async redeemCode(code) {
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
      if (!/^[A-Z0-9]{7}$/.test(normalized)) {
        msgEl.textContent = '❌ 代碼需為 7 位英數字。';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
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
        profile.total_stars = (profile.total_stars || 0) + earned;
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
        
        // 撥放音效
        if (window.MathSprintAudio && window.MathSprintAudio.play) {
          window.MathSprintAudio.play('success');
        }

        alert(`🎁 兌換成功：獲得 ${earned.toLocaleString('zh-TW')} 💰 金幣！`);
        document.getElementById('redeem-code-input').value = '';
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
