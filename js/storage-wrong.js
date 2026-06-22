// Limit 180 Storage Wrong Questions Module
// Manages logging and solving wrong questions in local storage profile.

(function() {
  const StorageWrong = {
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
          
          // 錯題消除每滿 10 題獎勵 1 顆星 (2,000金幣)
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
    }
  };

  // Mixin into MathSprintStorage
  window.MathSprintStorage = window.MathSprintStorage || {};
  Object.assign(window.MathSprintStorage, StorageWrong);
})();
