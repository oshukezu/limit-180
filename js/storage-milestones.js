(function() {
  const Milestones = {
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
        profile.bonus_stars = (profile.bonus_stars || 0) + 2000;
        profile.today_earnings = (profile.today_earnings || 0) + 2000;
        this.recalculateTotalStars(profile);
        this.saveProfile(profile);

        window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
          detail: { 
            type: 'mission_complete', 
            text: `🔥 滿集暴擊！您已集滿 Mission ${missionNum} 所有關卡徽章！獲得 2,000 💰 額外獎金！` 
          }
        }));
      }
    },

    // 檢查連續 7 天上線且每天至少玩 5 回合的獎勵 (已廢除)
    check7DayStreakReward(profile) {
      // 已取消七天連續上線獎勵
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
          profile.bonus_stars = (profile.bonus_stars || 0) + 2000;
          profile.today_earnings = (profile.today_earnings || 0) + 2000;
          this.recalculateTotalStars(profile);
          
          window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
            detail: { type: 'correct_100', text: `🏆 恭喜！您累計答對滿 ${count} 題，獲得 2,000 💰 額外獎金！` }
          }));
        }
      }
      this.saveProfile(profile);
    }
  };

  // Mixin
  window.MathSprintStorage = window.MathSprintStorage || {};
  Object.assign(window.MathSprintStorage, Milestones);
})();
