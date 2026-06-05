// MathSprint Local Storage Module (Missions & Sub-levels Edition)
// Built for 100% offline local profile caching and progression locking.

(function() {
  const STORAGE_KEY = 'math_sprint_profile';

  // Default initial profile structure
  const DEFAULT_PROFILE = {
    total_stars: 0,
    shields_count: 0,
    total_correct_count: 0, // Used for computing shields (every 50 correct answers adds 1 shield)
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
      const profile = this.getProfile();
      const totalStars = profile.total_stars || 0;

      // Mission 10 (Legend) requirement: Mission 1-9 must ALL be fully 3-starred
      if (missionNum === 10) {
        let allPassedThree = true;
        for (let m = 1; m <= 9; m++) {
          for (let l = 1; l <= 20; l++) {
            const rec = profile.level_records[`mission-${m}-level-${l}`];
            if (!rec || rec.stars < 3) {
              allPassedThree = false;
              break;
            }
          }
          if (!allPassedThree) break;
        }
        return allPassedThree;
      }

      // Mission 1-9 Star Threshold requirements
      const thresholds = {
        1: 0,
        2: 10,
        3: 30,
        4: 60,
        5: 100,
        6: 150,
        7: 210,
        8: 280,
        9: 360
      };

      return totalStars >= (thresholds[missionNum] || 0);
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
      
      return prevRecord && (prevRecord.stars || 0) > 0;
    },

    // Save or update level score record
    saveLevelRecord(missionNum, levelNum, stars, avgTime, maxCombo) {
      const profile = this.getProfile();
      const levelKey = `mission-${missionNum}-level-${levelNum}`;
      
      const record = profile.level_records[levelKey] || { stars: 0, best_avg_time: 999, max_combo: 0 };
      
      // Update record values
      record.stars = Math.max(record.stars, stars);
      if (avgTime) {
        record.best_avg_time = Math.min(record.best_avg_time, avgTime);
      }
      record.max_combo = Math.max(record.max_combo, maxCombo);
      profile.level_records[levelKey] = record;

      // Re-calculate total stars across all missions and sub-levels
      let totalStars = 0;
      for (let key in profile.level_records) {
        totalStars += profile.level_records[key].stars || 0;
      }
      profile.total_stars = totalStars;

      this.saveProfile(profile);
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
