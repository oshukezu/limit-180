// MathSprint Local Storage Module (Missions & Sub-levels Edition)
// Built for 100% offline local profile caching and progression locking.

(function() {
  const STORAGE_KEY = 'math_sprint_profile';

  // Default initial profile structure
  const DEFAULT_PROFILE = {
    total_stars: 0,
    shields_count: 0, // 保留相容性，實際已廢除
    bonus_stars: 0,   // 新增：四維給星獎勵的額外星星
    total_correct_count: 0, // 累計答對題數
    total_cleared_wrong_count: 0, // 累計成功消除的錯題數
    today_earnings: 0, // 新增：今日獲得獎金
    last_active_date: "", // 新增：上次活躍日期 (YYYY-MM-DD)
    claimed_milestones: {
      streak_7day: false,
      combo_20: [],
      correct_100: [],
      wrong_cleared_10: [],
      mission_complete: []
    },
    level_records: {}, // Keyed by: mission-[M]-level-[L]
    wrong_questions_db: [], // Wrong answers ledger
    unlocked_achievements: [], // Achievement list
    history_log: [], // Play history logs for Parent Dashboard
    equipped_theme: 'akaimon', // 目前裝備的主題 (akaimon / neon / lava / aurora / gold)
    purchased_themes: ['akaimon'], // 已購買的主題清單
    placement_status: 'JUNIOR', // 狀態：JUNIOR (基礎), ELITE (舊版菁英相容)
    placement_score: 0,            // 測試答對題數 (0-10)
    max_unlocked_phase: 1,          // 解鎖最大階段 (1:第一階段, 2:第二階段, 3:第三階段菁英起點)
    equipped_avatar: 'avatar-default',
    equipped_border: 'border-none',
    equipped_badges: [],
    unlocked_assets: ['avatar-default', 'border-none'],
    purchased_missions: [],
    skip_exam_tickets: 0,
    coins_spent: 0
  };

  const Storage = {
    isNightRewardBlocked(date = new Date()) {
      const h = date.getHours();
      return h >= 22 || h < 8;
    },

    // Get current profile
    getProfile() {
      let data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        data = JSON.stringify(DEFAULT_PROFILE);
        localStorage.setItem(STORAGE_KEY, data);
      }
      
      let profile;
      try {
        profile = JSON.parse(data);
      } catch (e) {
        console.error("Error parsing math_sprint_profile", e);
        profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
      }

      // Ensure all fields exist (backward compatibility/migration)
      for (let key in DEFAULT_PROFILE) {
        if (profile[key] === undefined) {
          profile[key] = JSON.parse(JSON.stringify(DEFAULT_PROFILE[key]));
        }
      }

      // 清除 Level 11-20 的舊關卡紀錄
      let needSave = false;
      if (profile.level_records) {
        for (let key in profile.level_records) {
          // 格式為 mission-[M]-level-[L]
          const match = key.match(/^mission-\d+-level-(\d+)$/);
          if (match) {
            const levelVal = parseInt(match[1]);
            if (levelVal > 10) {
              delete profile.level_records[key];
              needSave = true;
            }
          }
        }
      }

      if (needSave) {
        this.recalculateTotalStars(profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }

      // 每日清零獎金邏輯
      const todayStr = new Date().toLocaleDateString('sv');
      if (profile.last_active_date !== todayStr) {
        profile.today_earnings = 0;
        profile.last_active_date = todayStr;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }

      return profile;
    },

    // Save profile to LocalStorage
    saveProfile(profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('mathSprintProfileUpdated', { detail: profile }));

      // 2.0：非阻塞雲端同步（不影響遊戲效能）
      if (window.MathSprintCloudSync && window.MathSprintCloudSync.isOnline()) {
        setTimeout(() => {
          window.MathSprintCloudSync.syncToCloud(profile).catch(() => {});
        }, 0);
      }
    },

    // Reset whole game profile
    resetProfile() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
      window.dispatchEvent(new CustomEvent('mathSprintProfileUpdated', { detail: DEFAULT_PROFILE }));
      return DEFAULT_PROFILE;
    },

    // 重新計算總星數 (best record 星數之和 + 額外獎勵星等)
    recalculateTotalStars(profile) {
      let totalStars = 0;
      for (let key in profile.level_records) {
        totalStars += profile.level_records[key].stars || 0;
      }
      profile.total_stars = Math.max(0, totalStars + (profile.bonus_stars || 0) - (profile.coins_spent || 0));
    },

    saveLevelRecord(missionNum, levelNum, stars, avgTime, maxCombo, minTime, accuracy) {
      const profile = this.getProfile();
      const levelKey = `mission-${missionNum}-level-${levelNum}`;
      
      const record = profile.level_records[levelKey] || { stars: 0, best_avg_time: 999, max_combo: 0, min_time: 999, accuracy: 0 };
      
      // 獲取基礎金幣
      function getBaseCoin(m) {
        if (m >= 1 && m <= 5) return 200;
        if (m >= 6 && m <= 10) return 300;
        if (m >= 11 && m <= 15) return 1000;
        if (m >= 16 && m <= 20) return 2000;
        if (m >= 21 && m <= 25) return 5000;
        if (m >= 26 && m <= 30) return 10000;
        if (m >= 31 && m <= 35) return 20000;
        if (m >= 36 && m <= 40) return 40000;
        if (m >= 41 && m <= 44) return 100000;
        if (m >= 45 && m <= 47) return 250000;
        if (m >= 48 && m <= 49) return 500000;
        return 0;
      }

      // 計算該次取得金幣數
      let newCoins = 0;
      if (missionNum === 50) {
        if (stars === 3) newCoins = 1500000 * levelNum;
        else if (stars === 2) newCoins = 1000000 * levelNum;
        else if (stars === 1) newCoins = 500000 * levelNum;
      } else {
        const base = getBaseCoin(missionNum);
        if (stars === 3) newCoins = base * levelNum;
        else if (stars === 2) newCoins = Math.floor(base * levelNum * 2 / 3);
        else if (stars === 1) newCoins = Math.floor(base * levelNum * 1 / 3);
      }

      const isCleared = !!record.is_passed;
      const isNightBlocked = this.isNightRewardBlocked();
      const oldCoins = record.stars || 0;
      if (isNightBlocked) {
        newCoins = 0;
      }
      const diff = Math.max(0, newCoins - oldCoins);
      if (diff > 0) {
        profile.today_earnings = (profile.today_earnings || 0) + diff;
      }

      // 每日首勝 2 倍金幣動態加成邏輯
      let dailyFirstWinBonus = 0;
      let isDailyFirstWin = false;
      const dateObj = new Date();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      if (!isNightBlocked && stars === 3 && profile.last_win_date !== todayStr) {
        isDailyFirstWin = true;
        profile.last_win_date = todayStr;

        if (isCleared) {
          // 重複刷題：獲得 [該關基礎金幣 × 階段倍數 × 60% 刷題折扣] × 2.0 = 1.2 倍
          dailyFirstWinBonus = Math.floor(newCoins * 1.2);
        } else {
          // 首次通關：獲得 [該關基礎金幣 × 階段倍數] × 2.0 = 2.0 倍（正常流程加了 1.0 倍，此處補足剩餘 1.0 倍）
          dailyFirstWinBonus = newCoins;
        }

        profile.bonus_stars = (profile.bonus_stars || 0) + dailyFirstWinBonus;
        profile.today_earnings = (profile.today_earnings || 0) + dailyFirstWinBonus;
      }

      // Update record values
      record.stars = Math.max(record.stars, newCoins);
      if (avgTime) {
        record.best_avg_time = Math.min(record.best_avg_time, avgTime);
      }
      if (minTime) {
        record.min_time = Math.min(record.min_time || 999, minTime);
      }
      record.max_combo = Math.max(record.max_combo, maxCombo);
      if (accuracy !== undefined) {
        record.accuracy = Math.max(record.accuracy || 0, accuracy);
      }
      record.is_passed = true;
      profile.level_records[levelKey] = record;

      // 重新計算總星數
      this.recalculateTotalStars(profile);

      this.saveProfile(profile);

      // 每日首勝特殊事件與特效通知
      if (isDailyFirstWin) {
        const burstCoins = isCleared ? Math.floor(newCoins * 1.2) : (newCoins * 2);
        window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
          detail: { 
            type: 'daily_first_win', 
            text: `🔥 每日首勝！您今天首次挑戰成功（正確率達 90% 以上），獲得額外首勝 2 倍加成金幣 ${burstCoins.toLocaleString('zh-TW')} 💰！` 
          }
        }));
      }

      // 檢查滿集暴擊成就 (100% 收集)
      if (this.checkMissionCompleteReward) {
        this.checkMissionCompleteReward(profile, missionNum);
      }

      // 同步新進度到 Supabase 雲端 (單表 users_profile)
      if (window.MathSprintOnboarding && window.MathSprintOnboarding.syncCurrentStatsToCloud) {
        window.MathSprintOnboarding.syncCurrentStatsToCloud(missionNum).catch(() => {});
      }

      if (isNightBlocked) {
        window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
          detail: {
            type: 'night_no_reward',
            text: '目前為夜間時段（22:00-08:00），本局僅保留練習紀錄，不發放獎勵。'
          }
        }));
      }

      return profile;
    },

    // Use a shield (已廢除，保持空實作維持相容性)
    useShield() {
      return false;
    },

    // Add game session history log for statistics
    logHistory(missionNum, levelNum, totalQuestions, correctCount, avgTime, maxCombo, isPass) {
      const profile = this.getProfile();
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const session = {
        date: dateStr,
        timestamp: now.getTime(),
        mission: missionNum,
        level: levelNum,
        totalQuestions: totalQuestions,
        correctCount: correctCount,
        accuracy: Math.round((correctCount / totalQuestions) * 100),
        avgTime: parseFloat(avgTime.toFixed(2)),
        maxCombo: maxCombo,
        isPass: isPass
      };
      
      profile.history_log.push(session);
      
      // Cap history log size to 200 items to avoid LocalStorage bloat
      if (profile.history_log.length > 200) {
        profile.history_log.shift();
      }
      
      this.saveProfile(profile);
    },

    // Save unlocked achievements
    unlockAchievement(id) {
      const profile = this.getProfile();
      if (!profile.unlocked_achievements.includes(id)) {
        profile.unlocked_achievements.push(id);
        this.saveProfile(profile);
        // Dispatch achievement event
        window.dispatchEvent(new CustomEvent('mathSprintAchievementUnlocked', { detail: { id: id } }));
        return true;
      }
      return false;
    }
  };

  // 全域金幣格式化邏輯
  window.formatCoins = function(amount, forceFull = false) {
    if (amount === undefined || amount === null) return '0';
    if (!forceFull && amount >= 1000000) {
      const mVal = amount / 1000000;
      return (mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toFixed(2)) + 'M';
    }
    return amount.toLocaleString('zh-TW');
  };

  // Export to window
  window.MathSprintStorage = Storage;
})();
