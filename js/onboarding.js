// Limit 180 玩家身份綁定與 Onboarding 模組（核心 UI）
(function() {
  let modal = null;
  let form = null;
  let errorMsg = null;
  let profileBar = null;
  let profileInfo = null;
  let isSubmitting = false;

  function showProfileModal(isEditMode = false, pendingCoins = null, preset = null) {
    if (!modal) return;
    const promo = document.getElementById('profile-modal-promo');
    if (promo) {
      if (pendingCoins !== null) {
        promo.textContent = `🏆 特工，你剛剛賺取了 ${pendingCoins.toLocaleString('zh-TW')} 💰 獎金！請立刻輸入您的身份，將此極速紀錄永久同步至雲端排行榜！`;
        promo.classList.remove('hidden');
      } else {
        promo.classList.add('hidden');
      }
    }
    const inputClass = document.getElementById('profile-class');
    const inputSeat = document.getElementById('profile-seat');
    const inputNickname = document.getElementById('profile-nickname');
    const classGroup = document.getElementById('profile-class-group');
    const seatGroup = document.getElementById('profile-seat-group');
    const cloudLoginBtn = document.getElementById('profile-cloud-login-btn');
    const customBtn = document.getElementById('profile-open-customization-btn');
    if (errorMsg) errorMsg.classList.add('hidden');
    const skipBtn = document.getElementById('profile-skip-btn');
    if (isEditMode) {
      if (skipBtn) skipBtn.classList.add('hidden');
      if (cloudLoginBtn) cloudLoginBtn.classList.add('hidden');
      if (classGroup) classGroup.classList.add('hidden');
      if (seatGroup) seatGroup.classList.add('hidden');
      if (customBtn) customBtn.classList.remove('hidden');
      const profile = JSON.parse(localStorage.getItem('limit180_user_profile') || '{}');
      if (inputClass) {
        inputClass.value = profile.grade_class || '';
        inputClass.readOnly = true;
        inputClass.classList.add('opacity-50', 'cursor-not-allowed');
      }
      if (inputSeat) {
        inputSeat.value = profile.seat_number || '';
        inputSeat.readOnly = true;
        inputSeat.classList.add('opacity-50', 'cursor-not-allowed');
      }
      if (inputNickname) {
        inputNickname.value = profile.nickname || '';
      }
    } else {
      if (skipBtn) skipBtn.classList.remove('hidden');
      if (cloudLoginBtn) cloudLoginBtn.classList.remove('hidden');
      if (classGroup) classGroup.classList.remove('hidden');
      if (seatGroup) seatGroup.classList.remove('hidden');
      if (customBtn) customBtn.classList.add('hidden');
      if (inputClass) {
        inputClass.value = '';
        inputClass.readOnly = false;
        inputClass.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      if (inputSeat) {
        inputSeat.value = '';
        inputSeat.readOnly = false;
        inputSeat.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      if (inputNickname) {
        inputNickname.value = '';
      }
      if (preset && typeof preset === 'object') {
        if (inputClass && preset.grade_class) inputClass.value = String(preset.grade_class).toUpperCase();
        if (inputSeat && preset.seat_number) inputSeat.value = String(preset.seat_number);
        if (inputNickname && preset.nickname) inputNickname.value = String(preset.nickname);
      }
    }
    modal.classList.remove('hidden');
  }

  function showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = `⚠️ ${msg}`;
    errorMsg.classList.remove('hidden');
  }

  function updateUserProfileBar(profile) {
    if (!profileBar) return;
    const infoEl = profileInfo || document.getElementById('home-agent-class-info');
    const nameEl = document.getElementById('home-agent-nickname');
    if (!infoEl) return;
    const editBtn = document.getElementById('edit-profile-btn');
    if (profile.grade_class === '訪客') {
      if (nameEl) nameEl.textContent = profile.nickname || '訪客特工';
      infoEl.textContent = `訪客狀態・建議先登入`;
      if (editBtn) {
        editBtn.classList.remove('hidden');
        editBtn.textContent = '會員登入';
      }
      profileBar.classList.remove('hidden');
      return;
    }
    if (editBtn) {
      editBtn.classList.remove('hidden');
      editBtn.textContent = '個人化設定';
    }
    const grade = profile.grade_class.charAt(0);
    const num = parseInt(profile.grade_class.substring(1));
    const cns = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const displayClass = (grade >= '1' && grade <= '9' && !isNaN(num))
      ? `${cns[parseInt(grade)] || grade}年${num}班`
      : `${profile.grade_class}班`;
    if (nameEl) nameEl.textContent = profile.nickname || '特工';
    infoEl.textContent = `${displayClass} 座號${profile.seat_number}`;
    profileBar.classList.remove('hidden');

    // 通知首頁名牌元件即時刷新徽章/外框等狀態
    window.dispatchEvent(new CustomEvent('mathSprintProfileUpdated'));
  }

  async function checkUserOnboarding() {
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      updateUserProfileBar(profile);
      await window.MathSprintOnboardingActions?.grantDailyLoginRewardIfNeeded?.(profile);
    } else {
      updateUserProfileBar({ grade_class: '訪客', seat_number: '0', nickname: '未註冊特工' });
    }
  }

  window.addEventListener('limit180ComponentsLoaded', () => {
    const getEl = (id) => document.getElementById(id);
    modal = getEl('profile-modal');
    form = getEl('profile-form');
    errorMsg = getEl('profile-error-msg');
    profileBar = getEl('user-profile-bar');
    profileInfo = getEl('user-profile-info');

    if (form) form.addEventListener('submit', (e) => window.MathSprintOnboardingActions?.handleFormSubmit?.(e));

    const inputClass = getEl('profile-class');
    if (inputClass) {
      inputClass.addEventListener('input', (e) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        e.target.value = val.substring(0, 2).replace(/[^A-Z]/g, '') + val.substring(2, 5).replace(/[^0-9]/g, '');
      });
    }

    const editBtn = getEl('edit-profile-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        let identity = null;
        try { identity = JSON.parse(localStorage.getItem('limit180_user_profile') || 'null'); } catch (_) {}
        const isGuest = !identity || identity.grade_class === '訪客';
        showProfileModal(!isGuest);
      });
    }
    getEl('profile-close-btn')?.addEventListener('click', () => modal?.classList.add('hidden'));
    getEl('profile-skip-btn')?.addEventListener('click', () => modal?.classList.add('hidden'));
    getEl('profile-cloud-login-btn')?.addEventListener('click', () => window.MathSprintOnboardingActions?.handleCloudLogin?.());
    getEl('profile-open-customization-btn')?.addEventListener('click', () => {
      modal?.classList.add('hidden');
      window.AgentCustomization?.openModal?.();
    });

    checkUserOnboarding().catch((err) => console.warn('[Onboarding] 初始化失敗：', err?.message || err));
  });

  window.MathSprintOnboardingContext = {
    get modal() { return modal; },
    get errorMsg() { return errorMsg; },
    get profileInfo() { return profileInfo; },
    get isSubmitting() { return isSubmitting; },
    set isSubmitting(v) { isSubmitting = !!v; },
    showError,
    updateUserProfileBar
  };

  window.MathSprintOnboarding = {
    showProfileModal,
    syncCurrentStatsToCloud: (missionId) => window.MathSprintOnboardingActions?.syncCurrentStatsToCloud?.(missionId)
  };
})();
