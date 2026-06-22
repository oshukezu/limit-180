// Limit 180 玩家身份綁定與 Onboarding 模組
(function() {
  let modal = null;
  let form = null;
  let errorMsg = null;
  let profileBar = null;
  let profileInfo = null;
  let isSubmitting = false;

  // 1. 初始化監聽與 UI 元件
  window.addEventListener('limit180ComponentsLoaded', () => {
    const getEl = id => document.getElementById(id);
    modal = getEl('profile-modal');
    form = getEl('profile-form');
    errorMsg = getEl('profile-error-msg');
    profileBar = getEl('user-profile-bar');
    profileInfo = getEl('user-profile-info');

    if (form) form.addEventListener('submit', handleFormSubmit);

    const inputClass = getEl('profile-class');
    if (inputClass) {
      inputClass.addEventListener('input', (e) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        e.target.value = val.substring(0, 2).replace(/[^A-Z]/g, '') + val.substring(2, 5).replace(/[^0-9]/g, '');
      });
    }

    const editBtn = getEl('edit-profile-btn');
    if (editBtn) editBtn.addEventListener('click', () => showProfileModal(true));

    const closeBtn = getEl('profile-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => modal?.classList.add('hidden'));

    const skipBtn = getEl('profile-skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', () => modal?.classList.add('hidden'));

    checkUserOnboarding();
  });

  // 2. 檢查是否已進行 Onboarding
  function checkUserOnboarding() {
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (profileStr) {
      updateUserProfileBar(JSON.parse(profileStr));
    } else {
      // 匿名首玩：不強制跳出彈窗，改為在首頁身份欄提示訪客特工
      updateUserProfileBar({
        grade_class: '訪客',
        seat_number: '0',
        nickname: '未註冊特工'
      });
    }
  }

  // 3. 顯示/隱藏綁定彈窗
  function showProfileModal(isEditMode = false, pendingCoins = null) {
    if (!modal) return;
    
    // 動態更新局後攔截金幣獎金提示語 (Lazy Registration)
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
    
    if (errorMsg) errorMsg.classList.add('hidden');

    // 控制「暫時略過」按鈕的顯示/隱藏
    const skipBtn = document.getElementById('profile-skip-btn');
    if (isEditMode) {
      if (skipBtn) skipBtn.classList.add('hidden');
      
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
      if (skipBtn) skipBtn.classList.remove('hidden');

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
    if (isSubmitting) return;
    if (!errorMsg) return;

    const inputClass = document.getElementById('profile-class').value.trim();
    const inputSeat = document.getElementById('profile-seat').value.trim();
    const inputNickname = document.getElementById('profile-nickname').value.trim();

    const validator = window.MathSprintOnboardingValidator;
    if (validator) {
      const clsRes = validator.validateClass(inputClass);
      if (!clsRes.valid) {
        showError(clsRes.error);
        return;
      }

      const seatRes = validator.validateSeat(inputSeat);
      if (!seatRes.valid) {
        showError(seatRes.error);
        return;
      }

      const nickRes = validator.validateNickname(inputNickname);
      if (!nickRes.valid) {
        showError(nickRes.error);
        return;
      }
    }

    // 取得提交按鈕
    const submitBtn = document.getElementById('profile-submit-btn');
    const originalText = submitBtn ? submitBtn.textContent : "進入 180 禁區";

    // 鎖定狀態，並停用提交按鈕以防重複點擊或按 Enter
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.textContent = "傳輸中...";
      submitBtn.disabled = true;
    }

    // 檢查是否為首次綁定（若是首次綁定，班級與座號輸入框不是唯讀的）
    const isEditMode = document.getElementById('profile-class').readOnly;

    // 比對資料庫：同一個班級裡面座號不能一樣 (只在首次註冊時檢查)
    if (!isEditMode && window.MathSprintSupabaseService) {
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (db) {
          const { data, error } = await db
            .from('users_profile')
            .select('nickname')
            .eq('grade_class', inputClass)
            .eq('seat_number', inputSeat)
            .limit(1);

          if (error) {
            throw error;
          }

          if (data && data.length > 0) {
            showError(`該班級與座號已被註冊（暱稱: "${data[0].nickname}" 佔用），座號不能重複！`);
            isSubmitting = false;
            if (submitBtn) {
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            }
            return;
          }
        }
      } catch (dbErr) {
        console.warn("[Onboarding] 無法連接資料庫檢查座號重複性：", dbErr.message || dbErr);
      }
    }

    // 送出之前確認警示框 (只在首次註冊時提示)
    if (!isEditMode) {
      const confirmSubmit = confirm(
        `【確定要建立此特工身份嗎？】\n\n班級：${inputClass}\n座號：${inputSeat} 號\n暱稱：${inputNickname}\n\n⚠️ 注意：一經送出後，班級與座號將無法再修改！`
      );
      if (!confirmSubmit) {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
        return; // 使用者取消送出
      }
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

    // 封裝 JSON
    const userProfile = {
      grade_class: inputClass,
      seat_number: inputSeat,
      nickname: inputNickname
    };

    try {
      // 1. 先寫入玩家身份資訊至 localStorage，以便後續 saveLevelRecord 與 Supabase 能讀取到合法身分
      localStorage.setItem('limit180_user_profile', JSON.stringify(userProfile));
      updateUserProfileBar(userProfile);

      // 2. 處理延遲註冊 (Lazy Registration) 暫存成績寫入
      const tempRecords = window.MathSprintGame?._tempPendingRecords;
      if (tempRecords) {
        for (let key in tempRecords) {
          const tempRecord = tempRecords[key];
          
          // 合流運算：若有 20-Combo 額外星星，寫入 bonus_stars
          if (tempRecord.guest_bonus_stars > 0) {
            const profile = window.MathSprintStorage.getProfile();
            profile.bonus_stars = (profile.bonus_stars || 0) + tempRecord.guest_bonus_stars;
            const levelKey = `mission-${tempRecord.missionNum}-level-${tempRecord.levelNum}`;
            if (!profile.claimed_milestones) profile.claimed_milestones = {};
            if (!profile.claimed_milestones.combo_20) profile.claimed_milestones.combo_20 = [];
            if (!profile.claimed_milestones.combo_20.includes(levelKey)) {
              profile.claimed_milestones.combo_20.push(levelKey);
            }
            window.MathSprintStorage.recalculateTotalStars(profile);
            window.MathSprintStorage.saveProfile(profile);
          }

          // 保存成績至本地
          if (tempRecord.isPass) {
            window.MathSprintStorage.saveLevelRecord(
              tempRecord.missionNum,
              tempRecord.levelNum,
              tempRecord.stars,
              tempRecord.avgTime,
              tempRecord.maxCombo,
              tempRecord.minTime,
              tempRecord.accuracy
            );
          }

          // 記錄遊玩歷史日誌
          window.MathSprintStorage.logHistory(
            tempRecord.missionNum,
            tempRecord.levelNum,
            tempRecord.totalQuestions,
            tempRecord.correctCount,
            tempRecord.avgTime,
            tempRecord.maxCombo,
            tempRecord.isPass
          );
        }

        // 清除暫存變數
        delete window.MathSprintGame._tempPendingRecords;
      }

      // 3. 呼叫 Supabase 進行 Upsert 雲端掛號 (委派至 onboarding-sync.js)
      if (window.MathSprintOnboarding && window.MathSprintOnboarding.uploadAllLocalStats) {
        await window.MathSprintOnboarding.uploadAllLocalStats(inputClass, inputSeat, inputNickname);
      }

      isSubmitting = false;
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
      modal.classList.add('hidden');
    } catch (err) {
      showError(`雲端綁定失敗：${err.message || '連線中斷'}`);
      isSubmitting = false;
      const submitBtn = document.getElementById('profile-submit-btn');
      if (submitBtn) {
        submitBtn.textContent = "進入 180 禁區";
        submitBtn.disabled = false;
      }
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
    const editBtn = document.getElementById('edit-profile-btn');
    if (profile.grade_class === '訪客') {
      profileInfo.textContent = `訪客特工 通關首局後綁定成績`;
      if (editBtn) editBtn.classList.add('hidden');
      profileBar.classList.remove('hidden');
      return;
    }
    if (editBtn) editBtn.classList.remove('hidden');
    const grade = profile.grade_class.charAt(0);
    const num = parseInt(profile.grade_class.substring(1));
    const cns = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const displayClass = (grade >= '1' && grade <= '9' && !isNaN(num))
      ? `${cns[parseInt(grade)] || grade}年${num}班`
      : `${profile.grade_class}班`;
    profileInfo.textContent = `${displayClass} 座號${profile.seat_number} ${profile.nickname}`;
    profileBar.classList.remove('hidden');
  }

  // 6. 全域同步特定關卡成績至雲端 (單表 users_profile，以 mission_id 為約束鍵)
  async function syncCurrentStatsToCloud(missionId) {
    if (!missionId) return;
    const profileStr = localStorage.getItem('limit180_user_profile');
    if (!profileStr) return;
    const u = JSON.parse(profileStr);
    if (!window.MathSprintStorage) return;

    const lp = window.MathSprintStorage.getProfile();
    let stars = 0, totalTime = 0, count = 0, minTime = 999;

    for (let l = 1; l <= 20; l++) {
      const rec = lp.level_records[`mission-${missionId}-level-${l}`];
      if (rec) {
        stars += rec.stars || 0;
        if (rec.stars > 0 && rec.best_avg_time && rec.best_avg_time < 999) {
          totalTime += rec.best_avg_time;
          count++;
        }
        if (rec.min_time && rec.min_time < minTime) minTime = rec.min_time;
      }
    }
    if (Number(missionId) === 1) stars += (lp.bonus_stars || 0);

    const avgTime = count > 0 ? parseFloat((totalTime / count).toFixed(3)) : 999;
    
    if (stars > 0 && avgTime < 999 && window.MathSprintSupabaseService?.saveRecord) {
      try {
        await window.MathSprintSupabaseService.saveRecord(
          u.grade_class, u.seat_number, u.nickname, missionId, stars, avgTime,
          minTime === 999 ? 99.9 : parseFloat(minTime.toFixed(3))
        );
        window.MathSprintLeaderboard?.renderLeaderboard().catch(() => {});
      } catch (e) {
        console.warn(`[Onboarding] 雲端同步失敗：`, e.message);
      }
    }
  }

  // 掛載到全域
  window.MathSprintOnboarding = {
    showProfileModal,
    syncCurrentStatsToCloud
  };
})();
