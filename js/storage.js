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
    history_log: [] // Play history logs for Parent Dashboard
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

      // 從 Mission 1 往上依序檢查，任何一關前置條件不滿足就中斷
      for (let m = 2; m <= missionNum; m++) {
        const prevMission = m - 1;
        let starsInPrevMission = 0;
        for (let l = 1; l <= 20; l++) {
          const record = profile.level_records[`mission-${prevMission}-level-${l}`];
          starsInPrevMission += record ? record.stars : 0;
        }
        if (starsInPrevMission < 3) return false;
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

    // 檢查 Mission 關卡獨立徽章是否全集滿 (100% Complete)
    checkMissionCompleteReward(profile, missionNum) {
      if (!profile.claimed_milestones) {
        profile.claimed_milestones = {};
      }
      if (!profile.claimed_milestones.mission_complete) {
        profile.claimed_milestones.mission_complete = [];
      }
      
      if (profile.claimed_milestones.mission_complete.includes(missionNum)) return;

      let allCleared = true;
      for (let l = 1; l <= 20; l++) {
        const key = `mission-${missionNum}-level-${l}`;
        const record = profile.level_records[key];
        if (!record || !(record.stars > 0)) {
          allCleared = false;
          break;
        }
      }

      if (allCleared) {
        profile.claimed_milestones.mission_complete.push(missionNum);
        profile.bonus_stars = (profile.bonus_stars || 0) + 5;
        this.recalculateTotalStars(profile);
        this.saveProfile(profile);

        // 觸發自訂事件
        window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
          detail: { 
            type: 'mission_complete', 
            text: `🔥 滿集暴擊！您已集滿 Mission ${missionNum} 所有關卡徽章！獲得 5 顆額外星星！` 
          }
        }));
      }
    },

    // 檢查連續 7 天上線且每天至少玩 5 回合的獎勵
    check7DayStreakReward(profile) {
      if (!profile.claimed_milestones) {
        profile.claimed_milestones = {};
      }
      if (profile.claimed_milestones.streak_7day) return;

      const history = profile.history_log || [];
      if (history.length < 35) return; // 每天至少5筆，連續7天

      const dateCounts = {};
      history.forEach(session => {
        if (session.date) {
          dateCounts[session.date] = (dateCounts[session.date] || 0) + 1;
        }
      });

      const validDates = Object.keys(dateCounts)
        .filter(d => dateCounts[d] >= 5)
        .sort();

      if (validDates.length < 7) return;

      let consecutiveCount = 1;
      let hasStreak = false;

      for (let i = 1; i < validDates.length; i++) {
        const prevDate = new Date(validDates[i - 1]);
        const currDate = new Date(validDates[i]);
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          consecutiveCount++;
          if (consecutiveCount >= 7) {
            hasStreak = true;
            break;
          }
        } else if (diffDays > 1) {
          consecutiveCount = 1;
        }
      }

      if (hasStreak) {
        profile.claimed_milestones.streak_7day = true;
        profile.bonus_stars = (profile.bonus_stars || 0) + 5;
        this.recalculateTotalStars(profile);
        this.saveProfile(profile);

        window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
          detail: { type: 'streak_7day', text: '🏆 恭喜！您連續 7 天上線玩滿 5 回合，獲得 5 顆額外星星！' }
        }));
      }
    },

    // Save or update level score record
    saveLevelRecord(missionNum, levelNum, stars, avgTime, maxCombo, minTime) {
      const profile = this.getProfile();
      const levelKey = `mission-${missionNum}-level-${levelNum}`;
      
      const record = profile.level_records[levelKey] || { stars: 0, best_avg_time: 999, max_combo: 0, min_time: 999 };
      
      // Update record values
      record.stars = Math.max(record.stars, stars);
      if (avgTime) {
        record.best_avg_time = Math.min(record.best_avg_time, avgTime);
      }
      if (minTime) {
        record.min_time = Math.min(record.min_time || 999, minTime);
      }
      record.max_combo = Math.max(record.max_combo, maxCombo);
      record.is_passed = true;
      profile.level_records[levelKey] = record;

      // 重新計算總星數
      this.recalculateTotalStars(profile);

      this.saveProfile(profile);

      // 檢查滿集暴擊成就 (100% 收集)
      this.checkMissionCompleteReward(profile, missionNum);

      // 檢查連續 7 天上線玩滿 5 回合獎勵
      this.check7DayStreakReward(profile);

      // 同步新進度到 Supabase 雲端 (單表 users_profile)
      if (window.MathSprintOnboarding && window.MathSprintOnboarding.syncCurrentStatsToCloud) {
        window.MathSprintOnboarding.syncCurrentStatsToCloud(missionNum).catch(() => {});
      }

      return profile;
    },

    // Record correct answer and handle correct-answer milestones (every 100 correct answers adds 1 star)
    recordCorrectAnswer() {
      const profile = this.getProfile();
      profile.total_correct_count = (profile.total_correct_count || 0) + 1;
      
      const count = profile.total_correct_count;
      if (count > 0 && count % 100 === 0) {
        if (!profile.claimed_milestones) {
          profile.claimed_milestones = {};
        }
        if (!profile.claimed_milestones.correct_100) {
          profile.claimed_milestones.correct_100 = [];
        }
        
        if (!profile.claimed_milestones.correct_100.includes(count)) {
          profile.claimed_milestones.correct_100.push(count);
          profile.bonus_stars = (profile.bonus_stars || 0) + 1;
          this.recalculateTotalStars(profile);
          
          window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
            detail: { type: 'correct_100', text: `🏆 恭喜！您累計答對滿 ${count} 題，獲得 1 顆額外星星！` }
          }));
        }
      }
      this.saveProfile(profile);
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
              profile.bonus_stars = (profile.bonus_stars || 0) + 1;
              this.recalculateTotalStars(profile);
              
              window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
                detail: { type: 'wrong_cleared_10', text: `🏆 恭喜！您累計成功消除滿 ${wrongClearedCount} 題錯題，獲得 1 顆額外星星！` }
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
