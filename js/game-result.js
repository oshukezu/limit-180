// Limit 180 — 結算與激勵畫面渲染模組 (Result Module)
(function() {
  const Result = {
    renderEndGameResult(isCompleted, accuracy, starsEarned, avgTime, isPass, hasProfile) {
      const MISSION_CONFIGS = window.MathSprintConfigs.MISSION_CONFIGS;
      
      // 渲染結算文字與數值
      document.getElementById('result-level').textContent = `Mission ${this.gameState.currentMission} Stage ${String(this.gameState.currentLevel).padStart(2, '0')} / 20 - ${MISSION_CONFIGS[this.gameState.currentMission].desc}`;
      document.getElementById('result-score').textContent = `${this.gameState.correctCount} / ${this.gameState.totalQuestions} (正確率：${Math.round(accuracy * 100)}%)`;
      document.getElementById('result-avg-time').textContent = `${avgTime.toFixed(2)} 秒 / 題`;
      document.getElementById('result-max-combo').textContent = this.gameState.maxCombo;
      document.getElementById('result-target-speed').textContent = `${this.gameState.targetSpeed.toFixed(2)} 秒`;

      const statusTitle = document.getElementById('result-status-title');
      const motivationBox = document.getElementById('result-motivation-box');

      if (!statusTitle || !motivationBox) return;

      // 檢查成就解鎖
      if (window.MathSprintAchievements) {
        window.MathSprintAchievements.checkAllAchievements(
          this.gameState.currentMission,
          this.gameState.currentLevel,
          avgTime,
          this.gameState.maxCombo,
          isPass,
          this.gameState.correctCount,
          this.gameState.totalQuestions
        );
      }

      if (isPass) {
        statusTitle.textContent = "挑戰成功！";
        statusTitle.className = "text-2xl font-pixel text-green-400 glow-green mb-2";
        
        const nextBtn = document.getElementById('result-next-btn');
        if (nextBtn) nextBtn.classList.remove('hidden');

        const starsEl = document.getElementById('result-stars');
        if (starsEl) {
          let starsStr = '';
          for (let s = 1; s <= 3; s++) {
            starsStr += s <= starsEarned ? '★ ' : '☆ ';
          }
          starsEl.textContent = starsStr.trim();
          starsEl.className = `flex justify-center gap-4 text-4xl my-2 ${
            starsEarned === 3 ? 'text-green-400' : starsEarned === 2 ? 'text-cyan-400' : starsEarned === 1 ? 'text-yellow-400' : 'text-slate-600'
          }`;
        }

        if (starsEarned === 3) {
          motivationBox.textContent = "表現絕佳！您已獲得最大榮譽 3 顆星！";
          motivationBox.className = "p-3 bg-slate-900/60 border border-green-800 text-xs font-tech rounded text-green-300 text-center";
        } else if (starsEarned === 2) {
          motivationBox.textContent = "表現極佳！繼續加油，將正確率提升到 90% 以上就能取得 3 星！";
          motivationBox.className = "p-3 bg-slate-900/60 border border-yellow-800 text-xs font-tech rounded text-yellow-300 text-center";
        } else if (starsEarned === 1) {
          motivationBox.textContent = "成功通過！再接再厲，將正確率提升到 80% 以上就能獲得 2 顆星！";
          motivationBox.className = "p-3 bg-slate-900/60 border border-cyan-800 text-xs font-tech rounded text-cyan-300 text-center";
        } else {
          motivationBox.textContent = "安全過關！挑戰更精準的心算反應，將正確率提升到 70% 以上來獲取星星吧！";
          motivationBox.className = "p-3 bg-slate-900/60 border border-slate-700 text-xs font-tech rounded text-slate-400 text-center";
        }
      } else {
        const nextBtn = document.getElementById('result-next-btn');
        if (nextBtn) nextBtn.classList.add('hidden');
        statusTitle.textContent = "挑戰失敗！";
        statusTitle.className = "text-2xl font-pixel text-red-500 glow-pink mb-2";
        
        const starsEl = document.getElementById('result-stars');
        if (starsEl) starsEl.textContent = '☆ ☆ ☆';
        
        const accDiff = this.gameState.correctRateTarget - accuracy;
        if (accuracy >= this.gameState.correctRateTarget && avgTime - this.gameState.targetSpeed < 0.3) {
          motivationBox.textContent = "殘念！你的平均思考速度只差目標不到 0.3 秒！再試一次，你絕對可以的！";
        } else if (accDiff > 0 && accDiff <= 0.08) {
          motivationBox.textContent = "殘念！答對率距離通過門檻僅差一兩題！就快成功了，再試一次！";
        } else {
          motivationBox.textContent = `很遺憾，本次正確率未達目標 ${Math.round(this.gameState.correctRateTarget * 100)}% 或是途中超時。別氣餒，勤能補拙！`;
        }
        motivationBox.className = "p-3 bg-slate-900/60 border border-red-950 text-xs font-tech rounded text-red-400 text-center";

        // Demote triggers
        if (this.gameState.consecutiveFailures >= 3 && (this.gameState.currentMission > 1 || this.gameState.currentLevel > 1)) {
          this.gameState.consecutiveFailures = 0;
          
          if (this._demoteAbortController) {
            this._demoteAbortController.abort();
          }
          this._demoteAbortController = new AbortController();

          const demoteBtn = document.getElementById('demote-modal-prev-btn');
          if (demoteBtn) {
            demoteBtn.addEventListener('click', () => {
              document.getElementById('demote-modal').classList.add('hidden');
              if (this.gameState.currentLevel > 1) {
                this.startGame(this.gameState.currentMission, this.gameState.currentLevel - 1);
              } else {
                this.startGame(Math.max(1, this.gameState.currentMission - 1), 20);
              }
            }, { signal: this._demoteAbortController.signal });
          }

          setTimeout(() => {
            const modal = document.getElementById('demote-modal');
            if (modal) modal.classList.remove('hidden');
          }, 800);
        }
      }
      
      window.showView('view-result');

      // 延遲註冊：如果當前是訪客，播放完結算後彈出註冊身分彈窗
      if (!hasProfile) {
        const totalPendingStars = starsEarned + (this._tempPendingRecord?.guest_bonus_stars || 0);
        setTimeout(() => {
          if (window.MathSprintOnboarding && window.MathSprintOnboarding.showProfileModal) {
            window.MathSprintOnboarding.showProfileModal(false, totalPendingStars);
          }
        }, 1500);
      }

      // 處理被暫存的星星獎勵提示，在遊戲結束後再顯示
      if (this._pendingRewards && this._pendingRewards.length > 0) {
        setTimeout(() => {
          this._pendingRewards.forEach(detail => {
            this.showBonusStarAlert(detail);
          });
          this._pendingRewards = [];
        }, 600);
      }
    }
  };

  // Mixin 到全域的 MathSprintGame 物件，維持無縫相容性
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Result);
})();
