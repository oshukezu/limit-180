// MathSprint Game Lifecycle Module
// Manages startGame, startPlacementTest, stopGame, interruptGame, and endGame core lifecycle methods.

(function() {
  const LifecycleGame = {
    startGame(missionNum, levelNum) {
      this.stopGame();

      if (window.MathSprintGenerator && window.MathSprintGenerator.resetLastAnswer) {
        window.MathSprintGenerator.resetLastAnswer();
      }

      if (this.gameState.currentMission !== missionNum || this.gameState.currentLevel !== levelNum) {
        this.gameState.consecutiveFailures = 0;
      }

      const MISSION_CONFIGS = window.MathSprintConfigs.MISSION_CONFIGS;
      const config = MISSION_CONFIGS[missionNum];
      const profile = window.MathSprintStorage.getProfile();

      this.gameState.isPlacementTest = false;
      this.gameState.errorsCount = 0;
      this.gameState.currentMission = missionNum;
      this.gameState.currentLevel = levelNum;
      this.gameState.questionIndex = 0;
      this.gameState.totalQuestions = config.totalQuestions;
      this.gameState.correctCount = 0;
      this.gameState.combo = parseInt(localStorage.getItem('math_sprint_current_combo')) || 0;
      this.gameState.combo200RewardPending = localStorage.getItem('math_sprint_combo_200_pending') === 'true';
      this.gameState.maxCombo = 0;
      
      let initLimit;
      if (levelNum <= 5) {
        initLimit = config.stages[1];
      } else if (levelNum <= 10) {
        initLimit = config.stages[2];
      } else if (levelNum <= 15) {
        initLimit = config.stages[3];
      } else {
        initLimit = config.stages[4];
      }

      this.gameState.initLimitTime = initLimit;
      this.gameState.limitTime = initLimit;
      this.gameState.targetSpeed = initLimit;
      this.gameState.correctRateTarget = 0.60;
      
      this.gameState.isStageTimer = (missionNum <= 30);
      if (this.gameState.isStageTimer) {
        const stageTotalTime = initLimit * this.gameState.totalQuestions;
        this.gameState.stageTimeTotal = stageTotalTime;
        this.gameState.stageTimeRemaining = stageTotalTime;
      }
      
      this.gameState.questionTimes = [];
      this.gameState.recentQueue = [];
      this.gameState.isGameOver = false;
      this.gameState.isPaused = false;
      this.gameState.isReviewMode = false;
      this.gameState.pauseCount = 0;

      // Sync HUD
      document.getElementById('game-shields').textContent = profile.shields_count;
      document.getElementById('game-level-title').textContent = `M${missionNum} ${String(levelNum).padStart(2, '0')}/20`;

      document.getElementById('error-feedback').classList.add('hidden');
      document.getElementById('shield-alert').classList.add('hidden');

      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.classList.add('hidden');
      this.updatePauseBtnUI();

      showView('view-game');
      this.nextQuestion();
    },

    // 啟動大腦段位定級測試
    startPlacementTest() {
      this.stopGame();

      if (window.MathSprintGenerator && window.MathSprintGenerator.resetLastAnswer) {
        window.MathSprintGenerator.resetLastAnswer();
      }

      this.gameState.isPlacementTest = true;
      this.gameState.errorsCount = 0;
      this.gameState.questionIndex = 0;
      this.gameState.totalQuestions = 10; // 10 題階梯式定級測試
      this.gameState.correctCount = 0;
      this.gameState.combo = 0;
      this.gameState.maxCombo = 0;
      
      this.gameState.initLimitTime = 2.0; // 預設 2 秒，會在出題時動態覆寫
      this.gameState.limitTime = 2.0;
      this.gameState.targetSpeed = 2.0;
      this.gameState.correctRateTarget = 0.80; // 通過門檻為正確 8 題 (80%)
      
      this.gameState.isStageTimer = false; // 定級測試每題獨立倒數

      this.gameState.questionTimes = [];
      this.gameState.recentQueue = [];
      this.gameState.isGameOver = false;
      this.gameState.isPaused = false;
      this.gameState.isReviewMode = false;
      this.gameState.pauseCount = 0;

      // Sync HUD
      document.getElementById('game-shields').textContent = 0;
      document.getElementById('game-level-title').textContent = `段位定級測驗`;

      document.getElementById('error-feedback').classList.add('hidden');
      document.getElementById('shield-alert').classList.add('hidden');

      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.classList.add('hidden');
      this.updatePauseBtnUI();

      showView('view-game');
      this.nextQuestion();
    },

    stopGame() {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      const scaffoldCanvas = document.getElementById('scaffold-canvas-container');
      if (scaffoldCanvas) scaffoldCanvas.innerHTML = '';
    },

    interruptGame() {
      this.stopGame();
      
      this.gameState.combo = 0;
      localStorage.setItem('math_sprint_current_combo', 0);
      localStorage.setItem('math_sprint_combo_200_claimed', 'false');
      localStorage.setItem('math_sprint_combo_200_pending', 'false');
      this.gameState.maxCombo = 0;
      this.gameState.correctCount = 0;
      this.gameState.questionTimes = [];
      this.gameState.recentQueue = [];
      
      this._tempPendingRecord = null;
      console.log('[Game] 挑戰已安全中斷，記憶體已歸零，已拒絕寫入雲端與本地存檔。');
    },

    endGame(isCompleted) {
      this.stopGame();
      this.gameState.isGameOver = true;

      // 1. 若為段位定級測驗
      if (this.gameState.isPlacementTest) {
        const score = this.gameState.correctCount;
        const passed = score >= 8;
        
        // 隱藏遊戲面板
        document.body.classList.remove('body-in-game');
        
        // 根據通過與否，調用 placement 專屬結算 Modal 顯示
        if (window.MathSprintPlacementModal && typeof window.MathSprintPlacementModal.showResult === 'function') {
          window.MathSprintPlacementModal.showResult(passed, score);
        } else {
          // 備用 Alert 機制以防萬一
          if (passed) {
            alert(`🎉 通過測試！大腦成功超頻！已為您解鎖至 Mission 21 並發放 120,000 💰 開局補貼！`);
            const profile = window.MathSprintStorage.getProfile();
            profile.placement_status = 'ELITE';
            profile.placement_score = score;
            profile.max_unlocked_phase = 3;
            profile.total_stars = (profile.total_stars || 0) + 120000;
            window.MathSprintStorage.saveProfile(profile);
            showView('view-lobby');
          } else {
            alert(`測試完成！大腦神經元已成功活化。引導您前往基礎鍛鍊區！`);
            const profile = window.MathSprintStorage.getProfile();
            profile.placement_status = 'JUNIOR';
            profile.placement_score = score;
            profile.max_unlocked_phase = 1;
            window.MathSprintStorage.saveProfile(profile);
            showView('view-lobby');
          }
        }
        return;
      }

      const accuracy = this.gameState.correctCount / this.gameState.totalQuestions;
      const isPass = isCompleted && accuracy >= 0.60;
      
      const validTimes = this.gameState.questionTimes;
      const avgTime = validTimes.length > 0 ? (validTimes.reduce((s, x) => s + x, 0) / validTimes.length) : 99.9;

      let starsEarned = 0;
      if (isPass) {
        if (accuracy >= 0.90) {
          starsEarned = 3;
        } else if (accuracy >= 0.80) {
          starsEarned = 2;
        } else if (accuracy >= 0.70) {
          starsEarned = 1;
        } else {
          starsEarned = 0;
        }
      }

      const hasProfile = !!localStorage.getItem('limit180_user_profile');

      // 檢查 200 Combo 跨關獎勵發放
      let comboBonusAwarded = 0;
      if (isPass && this.gameState.combo200RewardPending) {
        comboBonusAwarded = 10000;
        this.gameState.combo200RewardPending = false;
        localStorage.setItem('math_sprint_combo_200_pending', 'false');
        
        window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
          detail: { type: 'combo_200', text: '🏆 終極連斬！您累計連續答對 200 題，獲得 10,000 💰 額外獎金！' }
        }));

        if (hasProfile) {
          const profile = window.MathSprintStorage.getProfile();
          profile.bonus_stars = (profile.bonus_stars || 0) + 10000;
          profile.today_earnings = (profile.today_earnings || 0) + 10000;
          window.MathSprintStorage.recalculateTotalStars(profile);
          window.MathSprintStorage.saveProfile(profile);
        }
      }

      if (!hasProfile) {
        let guest_bonus_stars = comboBonusAwarded;

        const minTime = validTimes.length > 0 ? Math.min(...validTimes) : 99.9;
        
        // 判斷是否需要更新暫存紀錄（保留較佳紀錄）
        let shouldUpdate = true;
        const levelKey = `mission-${this.gameState.currentMission}-level-${this.gameState.currentLevel}`;
        this._tempPendingRecords = this._tempPendingRecords || {};
        const existing = this._tempPendingRecords[levelKey];
        if (existing) {
          if (accuracy < existing.accuracy) {
            shouldUpdate = false;
          } else if (accuracy === existing.accuracy && avgTime > existing.avgTime) {
            shouldUpdate = false;
          }
        }

        if (shouldUpdate) {
          // 金幣還原與星等對應的新增金幣 (用以在 onboarding 顯示累計金額)
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
          let newCoins = 0;
          const mNum = this.gameState.currentMission;
          const lNum = this.gameState.currentLevel;
          if (mNum === 50) {
            if (starsEarned === 3) newCoins = 1500000 * lNum;
            else if (starsEarned === 2) newCoins = 1000000 * lNum;
            else if (starsEarned === 1) newCoins = 500000 * lNum;
          } else {
            const base = getBaseCoin(mNum);
            if (starsEarned === 3) newCoins = base * lNum;
            else if (starsEarned === 2) newCoins = Math.floor(base * lNum * 2 / 3);
            else if (starsEarned === 1) newCoins = Math.floor(base * lNum * 1 / 3);
          }

          this._tempPendingRecords[levelKey] = {
            missionNum: mNum,
            levelNum: lNum,
            stars: starsEarned,
            coins: newCoins,
            guest_bonus_stars: guest_bonus_stars,
            avgTime: avgTime,
            maxCombo: this.gameState.maxCombo,
            minTime: minTime,
            isPass: isPass,
            correctCount: this.gameState.correctCount,
            totalQuestions: this.gameState.totalQuestions,
            accuracy: accuracy
          };
          console.log('[Lazy Registration] 訪客關卡成績已暫存：', this._tempPendingRecords);
        } else {
          console.log('[Lazy Registration] 訪客此局成績未優於歷史暫存，保留原有紀錄。', existing);
        }
      } else {

        if (isPass) {
          const minTime = validTimes.length > 0 ? Math.min(...validTimes) : 99.9;
          window.MathSprintStorage.saveLevelRecord(
            this.gameState.currentMission,
            this.gameState.currentLevel,
            starsEarned,
            avgTime,
            this.gameState.maxCombo,
            minTime,
            accuracy
          );
          this.gameState.consecutiveFailures = 0;
        } else {
          this.gameState.consecutiveFailures++;
        }

        window.MathSprintStorage.logHistory(
          this.gameState.currentMission,
          this.gameState.currentLevel,
          this.gameState.totalQuestions,
          this.gameState.correctCount,
          avgTime,
          this.gameState.maxCombo,
          isPass
        );

        if (isPass && starsEarned >= 1) {
          this._submitCloudResult(
            this.gameState.currentMission,
            this.gameState.currentLevel,
            this.gameState.questionTimes,
            this.gameState.correctCount,
            this.gameState.totalQuestions,
            avgTime
          );
        }
      }

      if (isPass && starsEarned >= 1 && typeof confetti !== 'undefined') {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (this.renderEndGameResult) {
        this.renderEndGameResult(isCompleted, accuracy, starsEarned, avgTime, isPass, hasProfile);
      }
    }
  };

  // Mixin into MathSprintGame
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, LifecycleGame);
})();
