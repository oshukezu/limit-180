// MathSprint Local Storage Module (Missions & Sub-levels Edition)
// Built for 100% offline local profile caching and progression locking.

(function() {
  const STORAGE_KEY = 'math_sprint_profile';

  // Default initial profile structure
  const DEFAULT_PROFILE = {
    total_stars: 0,
    shields_count: 0,
    total_correct_count: 0, // Used for computing shields (every 50 correct answers adds 1 shield)
    total_cleared_wrong_count: 0, // 成功消除錯題累計數（每 10 題獲得 1 個盾）
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

    // Check if a Mission is unlocked (M1-M10)
    isMissionUnlocked(missionNum) {
      if (missionNum === 1) return true;
      const profile = this.getProfile();

      const prevMission = missionNum - 1;
      let starsInPrevMission = 0;
      for (let l = 1; l <= 20; l++) {
        const record = profile.level_records[`mission-${prevMission}-level-${l}`];
        starsInPrevMission += record ? record.stars : 0;
      }

      return starsInPrevMission >= 3 && this.isMissionUnlocked(prevMission);
    },

    // Check if a Sub-level within a Mission is unlocked (L1-L20)
    isLevelUnlocked(missionNum, levelNum) {
      // Must be mission unlocked first
      if (!this.isMissionUnlocked(missionNum)) return false;

      // Level 1 is always unlocked when the mission is unlocked
      if (levelNum === 1) return true;

      // Other levels: previous level stars must be > 0 (passed)
      const profile = this.getProfile();
      const prevKey = `mission-${missionNum}-level-${levelNum - 1}`;
      const prevRecord = profile.level_records[prevKey];
      
      return prevRecord && (prevRecord.is_passed === true || (prevRecord.stars || 0) > 0);
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

      // Re-calculate total stars across all missions and sub-levels
      let totalStars = 0;
      for (let key in profile.level_records) {
        totalStars += profile.level_records[key].stars || 0;
      }
      profile.total_stars = totalStars;

      this.saveProfile(profile);

      // 同步新進度到 Supabase 雲端 (單表 users_profile)
      if (window.MathSprintOnboarding && window.MathSprintOnboarding.syncCurrentStatsToCloud) {
        window.MathSprintOnboarding.syncCurrentStatsToCloud(missionNum).catch(() => {});
      }

      return profile;
    },

    // Record correct answer and handle Shield award (every 50 correct answers adds 1 shield)
    recordCorrectAnswer() {
      const profile = this.getProfile();
      profile.total_correct_count = (profile.total_correct_count || 0) + 1;
      
      // Award shield
      if (profile.total_correct_count > 0 && profile.total_correct_count % 50 === 0) {
        profile.shields_count = (profile.shields_count || 0) + 1;
        // Trigger a custom event for floating shield toast alert
        window.dispatchEvent(new CustomEvent('mathSprintShieldAwarded', { detail: { count: profile.shields_count } }));
      }
      this.saveProfile(profile);
    },

    // Use a shield
    useShield() {
      const profile = this.getProfile();
      if (profile.shields_count > 0) {
        profile.shields_count--;
        this.saveProfile(profile);
        return true;
      }
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
          
          // 錯題消除每滿 10 題獎勵 1 個超時防禦盾
          if (profile.total_cleared_wrong_count > 0 && profile.total_cleared_wrong_count % 10 === 0) {
            profile.shields_count = (profile.shields_count || 0) + 1;
            // 發送超時防禦盾獲獎自訂事件（彈出提示）
            window.dispatchEvent(new CustomEvent('mathSprintShieldAwarded', { detail: { count: profile.shields_count } }));
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
