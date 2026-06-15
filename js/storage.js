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
    placement_status: 'NOT_TESTED', // 狀態：NOT_TESTED, JUNIOR (基礎), ELITE (菁英)
    placement_score: 0,            // 測試答對題數 (0-10)
    max_unlocked_phase: 1          // 解鎖最大階段 (1:第一階段, 2:第二階段, 3:第三階段菁英起點)
  };

  const Storage = {
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

    // --- MISSION & LEVEL LOCK LOGIC ---

    // 檢查 Mission 是否已解鎖 (M1-M10)
    // 優化：迭代式判斷（避免遞迴造成大量 getProfile / JSON.parse）
    isMissionUnlocked(missionNum, _profile) {
      if (missionNum === 1) return true;
      const profile = _profile || this.getProfile();

      // 彈性跳級：如果解鎖階段達到 3 (極速菁英)，直接解鎖 Mission 21 及以下關卡
      if ((profile.max_unlocked_phase || 1) >= 3 && missionNum <= 21) {
        return true;
      }

      function getRequiredAccuracy(m) {
        if (m >= 41) return 0.90;
        if (m >= 31) return 0.80;
        if (m >= 21) return 0.70;
        return 0.60;
      }
 
      // 從 Mission 1 往上依序檢查，前一個 Mission 的 20 個關卡都必須通過且正確率達到該階段門檻
      for (let m = 2; m <= missionNum; m++) {
        // 如果是菁英玩家，且我們正在檢查小於等於 21 的關卡，直接跳過基礎關卡的檢查
        if ((profile.max_unlocked_phase || 1) >= 3 && m <= 21) {
          continue;
        }
        const prevMission = m - 1;
        const reqAcc = getRequiredAccuracy(m);
        for (let l = 1; l <= 20; l++) {
          const record = profile.level_records[`mission-${prevMission}-level-${l}`];
          if (!record || !record.is_passed || (record.accuracy !== undefined && record.accuracy < reqAcc)) {
            return false;
          }
        }
      }
      return true;
    },

    // 檢查 Sub-level 是否已解鎖 (L1-L20)
    isLevelUnlocked(missionNum, levelNum, _profile) {
      const profile = _profile || this.getProfile();

      // 必須先解鎖所屬 Mission
      if (!this.isMissionUnlocked(missionNum, profile)) return false;

      // Level 1 在 Mission 解鎖時自動開放
      if (levelNum === 1) return true;

      // 其他 Level：前一關星數必須 > 0 (已通過)
      const prevKey = `mission-${missionNum}-level-${levelNum - 1}`;
      const prevRecord = profile.level_records[prevKey];
      
      return prevRecord && (prevRecord.is_passed === true || (prevRecord.stars || 0) > 0);
    },

    // 重新計算總星數 (best record 星數之和 + 額外獎勵星等)
    recalculateTotalStars(profile) {
      let totalStars = 0;
      for (let key in profile.level_records) {
        totalStars += profile.level_records[key].stars || 0;
      }
      profile.total_stars = totalStars + (profile.bonus_stars || 0);
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
      const oldCoins = record.stars || 0;
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

      if (stars === 3 && profile.last_win_date !== todayStr) {
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
      this.checkMissionCompleteReward(profile, missionNum);

      // 同步新進度到 Supabase 雲端 (單表 users_profile)
      if (window.MathSprintOnboarding && window.MathSprintOnboarding.syncCurrentStatsToCloud) {
        window.MathSprintOnboarding.syncCurrentStatsToCloud(missionNum).catch(() => {});
      }

      return profile;
    },



    // Use a shield (已廢除，保持空實作維持相容性)
    useShield() {
      return false;
    },

    // Log wrong question to DB
    logWrongQuestion(questionText, correctAnswer, wrongAnswer, mission, level) {
      const profile = this.getProfile();
      const existing = profile.wrong_questions_db.find(q => q.questionText === questionText);

      if (existing) {
        existing.failCount++;
        existing.solvedCount = 0; // reset solve count on another failure
        existing.wrongAnswer = wrongAnswer;
      } else {
        profile.wrong_questions_db.push({
          questionText: questionText,
          correctAnswer: correctAnswer,
          wrongAnswer: wrongAnswer,
          failCount: 1,
          solvedCount: 0,
          mission: mission,
          level: level,
          loggedAt: new Date().toISOString()
        });
      }
      this.saveProfile(profile);
    },

    // Record progress when solving a wrong question
    solveWrongQuestion(questionText) {
      const profile = this.getProfile();
      const index = profile.wrong_questions_db.findIndex(q => q.questionText === questionText);
      
      if (index !== -1) {
        const item = profile.wrong_questions_db[index];
        item.solvedCount++;
        
        let removed = false;
        if (item.solvedCount >= 3) {
          profile.wrong_questions_db.splice(index, 1);
          removed = true;

          // 累計成功消除的錯題數
          profile.total_cleared_wrong_count = (profile.total_cleared_wrong_count || 0) + 1;
          
          // 錯題消除每滿 10 題獎勵 1 顆星
          const wrongClearedCount = profile.total_cleared_wrong_count;
          if (wrongClearedCount > 0 && wrongClearedCount % 10 === 0) {
            if (!profile.claimed_milestones) {
              profile.claimed_milestones = {};
            }
            if (!profile.claimed_milestones.wrong_cleared_10) {
              profile.claimed_milestones.wrong_cleared_10 = [];
            }
            
            if (!profile.claimed_milestones.wrong_cleared_10.includes(wrongClearedCount)) {
              profile.claimed_milestones.wrong_cleared_10.push(wrongClearedCount);
              profile.bonus_stars = (profile.bonus_stars || 0) + 2000;
              profile.today_earnings = (profile.today_earnings || 0) + 2000;
              this.recalculateTotalStars(profile);
              
              window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
                detail: { type: 'wrong_cleared_10', text: `🏆 恭喜！您累計成功消除滿 ${wrongClearedCount} 題錯題，獲得 2,000 💰 額外獎金！` }
              }));
            }
          }

          // Trigger custom event for achievement tracking
          window.dispatchEvent(new CustomEvent('mathSprintWrongQuestionCleared'));
        }
        
        this.saveProfile(profile);
        return { item: item, removed: removed };
      }
      return null;
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

  // Export to window
  window.MathSprintStorage = Storage;
})();
