// MathSprint Game Lifecycle Module
// Manages startGame, startPlacementTest, stopGame, interruptGame, and endGame core lifecycle methods.

(function() {
  const REST_LOCK_KEY = 'limit180_rest_lock_until';
  const PLAY_ACC_KEY = 'limit180_play_acc_seconds';

  const LifecycleGame = {
    _isRestLocked() {
      const until = Number(localStorage.getItem(REST_LOCK_KEY) || 0);
      return Number.isFinite(until) && until > Date.now();
    },

    _remainingRestSeconds() {
      const until = Number(localStorage.getItem(REST_LOCK_KEY) || 0);
      return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    },

    _beginFocusSession() {
      this._focusSessionStartedAt = Date.now();
    },

    _finalizeFocusSession() {
      if (!this._focusSessionStartedAt) return;
      const elapsedSec = Math.max(0, Math.floor((Date.now() - this._focusSessionStartedAt) / 1000));
      this._focusSessionStartedAt = null;
      if (elapsedSec <= 0) return;

      const acc = Number(localStorage.getItem(PLAY_ACC_KEY) || 0);
      const nextAcc = acc + elapsedSec;
      if (nextAcc >= 25 * 60) {
        localStorage.setItem(PLAY_ACC_KEY, '0');
        localStorage.setItem(REST_LOCK_KEY, String(Date.now() + 5 * 60 * 1000));
        if (window.UIFeedback) {
          window.UIFeedback.toast('已連續遊玩 25 分鐘，進入 5 分鐘休息。', 'info');
        }
      } else {
        localStorage.setItem(PLAY_ACC_KEY, String(nextAcc));
      }
    },

    startGame(missionNum, levelNum) {
      if (this._isRestLocked()) {
        const sec = this._remainingRestSeconds();
        if (window.UIFeedback) {
          window.UIFeedback.toast(`休息中，約 ${sec} 秒後可繼續挑戰。`, 'error');
        } else {
          alert(`休息中，約 ${sec} 秒後可繼續挑戰。`);
        }
        return;
      }
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
      const levelStage = missionNum >= 11 ? Math.max(2, Math.ceil(levelNum / 5)) : Math.ceil(levelNum / 5);
      if (levelStage <= 1) {
        initLimit = config.stages[1];
      } else if (levelStage <= 2) {
        initLimit = config.stages[2];
      } else if (levelStage <= 3) {
        initLimit = config.stages[3];
      } else {
        initLimit = config.stages[4];
      }

      this.gameState.initLimitTime = initLimit;
      this.gameState.limitTime = initLimit;
      this.gameState.targetSpeed = initLimit;
      this.gameState.correctRateTarget = 0.60;
      
      // 若為第一關 (Level 1) 則不倒數 (設為9999，即自由計時)
      if (levelNum === 1) {
        this.gameState.initLimitTime = 9999;
        this.gameState.limitTime = 9999;
        this.gameState.targetSpeed = 9999;
      }
      
      this.gameState.isStageTimer = (missionNum <= 10 && levelNum > 1);
      if (this.gameState.isStageTimer) {
        const stageTotalTime = this.gameState.initLimitTime * this.gameState.totalQuestions;
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
      document.getElementById('game-level-title').textContent = `M${missionNum} ${String(levelNum).padStart(2, '0')}/10`;

      document.getElementById('error-feedback').classList.add('hidden');
      document.getElementById('shield-alert').classList.add('hidden');

      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.classList.add('hidden');
      this.updatePauseBtnUI();

      showView('view-game');
      this._beginFocusSession();
      this.nextQuestion();
    },

    // 啟動跳級考試
    startPlacementTest() {
      this.stopGame();

      if (window.MathSprintGenerator && window.MathSprintGenerator.resetLastAnswer) {
        window.MathSprintGenerator.resetLastAnswer();
      }

      this.gameState.isPlacementTest = true;
      this.gameState.errorsCount = 0;
      this.gameState.questionIndex = 0;
      this.gameState.totalQuestions = 10; // 10 題階梯式跳級考試
      this.gameState.correctCount = 0;
      this.gameState.combo = 0;
      this.gameState.maxCombo = 0;
      
      this.gameState.initLimitTime = 2.0; // 預設 2 秒，會在出題時動態覆寫
      this.gameState.limitTime = 2.0;
      this.gameState.targetSpeed = 2.0;
      this.gameState.correctRateTarget = 0.80; // 通過門檻為正確 8 題 (80%)
      
      this.gameState.isStageTimer = false; // 跳級考試每題獨立倒數

      this.gameState.questionTimes = [];
      this.gameState.recentQueue = [];
      this.gameState.isGameOver = false;
      this.gameState.isPaused = false;
      this.gameState.isReviewMode = false;
      this.gameState.pauseCount = 0;

      // Sync HUD
      document.getElementById('game-shields').textContent = 0;
      document.getElementById('game-level-title').textContent = `跳級考試`;

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
      this._finalizeFocusSession();
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

      // 1. 若為跳級考試
      if (this.gameState.isPlacementTest) {
        const score = this.gameState.correctCount;
        const passed = score >= 8;
        
        // 隱藏遊戲面板
        document.body.classList.remove('body-in-game');
        
        if (window.MathSprintPlacementModal && typeof window.MathSprintPlacementModal.showResult === 'function') {
          window.MathSprintPlacementModal.showResult(passed, score);
        } else {
          alert(passed ? '跳級考試通過！' : '跳級考試未通過，考試券已消耗。');
          showView('view-lobby');
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
      const isNightBlocked = window.MathSprintStorage?.isNightRewardBlocked?.() || false;
      if (isPass && this.gameState.combo200RewardPending && !isNightBlocked) {
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
