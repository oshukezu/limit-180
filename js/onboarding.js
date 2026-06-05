// Limit 180 玩家身份綁定與 Onboarding 模組
(function() {
  // 敏感詞過濾清單 (簡易防霸凌過濾)
  const SENSITIVE_WORDS = [
    '幹', '傻逼', '垃圾', '智障', '死', '白癡', '白痴', '廢物', 
    'fuck', 'shit', 'bitch', '幹你娘', '機掰', '屁股', '笨蛋', '智障'
  ];

  let modal = null;
  let form = null;
  let errorMsg = null;
  let profileBar = null;
  let profileInfo = null;

  // 1. 初始化監聽與 UI 元件
  window.addEventListener('limit180ComponentsLoaded', () => {
    modal = document.getElementById('profile-modal');
    form = document.getElementById('profile-form');
    errorMsg = document.getElementById('profile-error-msg');
    profileBar = document.getElementById('user-profile-bar');
    profileInfo = document.getElementById('user-profile-info');

    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => showProfileModal(true));
    }

    checkUserOnboarding();
  });

  // 2. 檢查是否已進行 Onboarding
  function checkUserOnboarding() {
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (profileStr) {
      updateUserProfileBar(JSON.parse(profileStr));
    } else {
      // 未綁定身分，強制跳出彈窗並鎖定背景
      showProfileModal(false);
    }
  }

  // 3. 顯示/隱藏綁定彈窗
  function showProfileModal(isEditMode = false) {
    if (!modal) return;
    
    const inputClass = document.getElementById('profile-class');
    const inputSeat = document.getElementById('profile-seat');
    const inputNickname = document.getElementById('profile-nickname');
    
    if (errorMsg) errorMsg.classList.add('hidden');

    if (isEditMode) {
      // 編輯模式：班級與座號唯讀，不能修改，防止惡意佔用他人數據
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
      // 首次綁定模式
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
    }

    modal.classList.remove('hidden');
  }

  // 4. 表單提交處理
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!errorMsg) return;

    const inputClass = document.getElementById('profile-class').value.trim();
    const inputSeat = document.getElementById('profile-seat').value.trim();
    const inputNickname = document.getElementById('profile-nickname').value.trim();

    // 驗證班級 (需為 3 位數字)
    if (!/^[0-9]{3}$/.test(inputClass)) {
      showError("班級格式錯誤，須為 3 位數字（如 501）");
      return;
    }

    // 驗證座號 (1-50號)
    const seatNum = parseInt(inputSeat);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > 50) {
      showError("座號錯誤，須為 1 至 50 號");
      return;
    }

    // 驗證暱稱長度 (2-8字元)
    if (inputNickname.length < 2 || inputNickname.length > 8) {
      showError("暱稱長度須在 2 至 8 個字元之間");
      return;
    }

    // 防霸凌過濾
    const lowercaseNick = inputNickname.toLowerCase();
    const containsSensitive = SENSITIVE_WORDS.some(word => lowercaseNick.includes(word));
    if (containsSensitive) {
      showError("暱稱包含敏感詞，請重新輸入");
      return;
    }

    errorMsg.classList.add('hidden');
    
    // 取得當前本地的累計成績
    let totalStars = 0;
    let bestAvgTime = 999;

    if (window.MathSprintStorage) {
      const localProfile = window.MathSprintStorage.getProfile();
      totalStars = localProfile.total_stars || 0;
      
      let totalTime = 0;
      let count = 0;
      for (let key in localProfile.level_records) {
        const rec = localProfile.level_records[key];
        if (rec && rec.stars > 0 && rec.best_avg_time && rec.best_avg_time < 999) {
          totalTime += rec.best_avg_time;
          count++;
        }
      }
      if (count > 0) {
        bestAvgTime = parseFloat((totalTime / count).toFixed(3));
      }
    }

    // 封裝 JSON 並寫入 LocalStorage
    const userProfile = {
      grade_class: inputClass,
      seat_number: inputSeat,
      nickname: inputNickname
    };

    try {
      // 顯示提交中狀態
      const submitBtn = document.getElementById('profile-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "傳輸中...";
      submitBtn.disabled = true;

      // 呼叫 Supabase 進行 Upsert 雲端掛號
      if (window.MathSprintSupabaseService) {
        await window.MathSprintSupabaseService.saveRecord(
          inputClass,
          inputSeat,
          inputNickname,
          totalStars,
          bestAvgTime
        );
      }

      localStorage.setItem('limit180_user_profile', JSON.stringify(userProfile));
      updateUserProfileBar(userProfile);
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      modal.classList.add('hidden');
    } catch (err) {
      showError(`雲端綁定失敗：${err.message || '連線中斷'}`);
      const submitBtn = document.getElementById('profile-submit-btn');
      submitBtn.textContent = "進入 180 禁區";
      submitBtn.disabled = false;
    }
  }

  // 顯示錯誤訊息
  function showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = `⚠️ ${msg}`;
    errorMsg.classList.remove('hidden');
  }

  // 5. 更新首頁右上角的身份顯示
  function updateUserProfileBar(profile) {
    if (!profileBar || !profileInfo) return;
    
    // 解析班級名稱 (e.g. 501 轉為 五年一班，或者直接顯示 [501班])
    const grade = profile.grade_class.charAt(0);
    const classNum = parseInt(profile.grade_class.substring(1));
    const chineseNumbers = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    
    let displayClass = `${profile.grade_class}班`;
    if (grade >= '1' && grade <= '9' && !isNaN(classNum)) {
      const gradeStr = chineseNumbers[parseInt(grade)] || grade;
      displayClass = `${gradeStr}年${classNum}班`;
    }

    profileInfo.textContent = `[${displayClass}] 座號: ${profile.seat_number} | ${profile.nickname}`;
    profileBar.classList.remove('hidden');
  }

  // 6. 全域同步最新成績至雲端方法 (供 storage.js 連動)
  async function syncCurrentStatsToCloud() {
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (!profileStr) return;
    const u = JSON.parse(profileStr);

    let totalStars = 0;
    let bestAvgTime = 999;
    if (window.MathSprintStorage) {
      const localProfile = window.MathSprintStorage.getProfile();
      totalStars = localProfile.total_stars || 0;
      
      let totalTime = 0;
      let count = 0;
      for (let key in localProfile.level_records) {
        const rec = localProfile.level_records[key];
        if (rec && rec.stars > 0 && rec.best_avg_time && rec.best_avg_time < 999) {
          totalTime += rec.best_avg_time;
          count++;
        }
      }
      if (count > 0) {
        bestAvgTime = parseFloat((totalTime / count).toFixed(3));
      }
    }

    try {
      if (window.MathSprintSupabaseService) {
        await window.MathSprintSupabaseService.saveRecord(
          u.grade_class,
          u.seat_number,
          u.nickname,
          totalStars,
          bestAvgTime
        );
        console.log("[Onboarding] 雲端遊戲進度同步成功。");
      }
    } catch (e) {
      console.warn("[Onboarding] 雲端遊戲進度自動同步失敗：", e.message);
    }
  }

  // 掛載到全域
  window.MathSprintOnboarding = {
    showProfileModal,
    syncCurrentStatsToCloud
  };
})();
