// MathSprint Game Core Module (Missions & Sub-levels Edition)
// Controls SPA screens, Game Loop, timer, input restrictions, and core challenge lifecycle.

// 全域環境變數配置與獨立徽章配置 (原 config.js)
if (!window.MATH_SPRINT_CONFIG) {
  window.MATH_SPRINT_CONFIG = {
    CLOUD_ENABLED: true,
    SUPABASE_URL: "https://kzlvuyxsijsffigmcnti.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_U1YrJqNz18LedymnrjcoTg_2SxZQhd_",
    EDGE_FUNCTION_URL: ""
  };

  window.MATH_SPRINT_CONFIG.STAGE_BADGES = {};
  for (let m = 1; m <= 50; m++) {
    window.MATH_SPRINT_CONFIG.STAGE_BADGES[m] = {};
    for (let l = 1; l <= 20; l++) {
      window.MATH_SPRINT_CONFIG.STAGE_BADGES[m][l] = {
        badgeId: `badge-m${m}-l${l}`,
        name: `Mission ${m} Stage ${l} 探索者`,
        description: `成功通關 Mission ${m} 關卡 ${l}`
      };
    }
  }
}
window.CFG = window.MATH_SPRINT_CONFIG;

(function() {
  const CoreGame = {
    // Runtime gameState variables
    gameState: {
      currentMission: 1,
      currentLevel: 1, // Sub-level 1-20
      questionIndex: 0,
      totalQuestions: 20,
      correctCount: 0,
      combo: 0,
      maxCombo: 0,
      limitTime: 5.0,
      initLimitTime: 5.0,
      targetSpeed: 3.0,
      correctRateTarget: 0.90,
      
      startTime: 0,
      questionTimes: [],
      currentQuestion: null,
      recentQueue: [],
      isGameOver: false,
      isPaused: false,
      consecutiveFailures: 0,
      pauseCount: 0, // 單關已暫停次數
      
      // Review Mode variables
      isReviewMode: false,
      reviewList: [],
      reviewIndex: 0,
      reviewCorrectStrike: 0
    },

    timerInterval: null,
    scannerAnimFrame: null,


    async init() {
      console.log('[Game Debug] this in init:', this, 'bindEvents type:', typeof this.bindEvents);
      try {
        const profileStr = localStorage.getItem('limit180_user_profile');
        if (profileStr) {
          try {
            const profile = JSON.parse(profileStr);
            const gradeClass = profile.grade_class || '';
            if (!/^[A-Z]{2}[0-9]{3}$/i.test(gradeClass)) {
              console.warn('[Session Verification] 本地班級格式不符規格，清除髒資料並重新整理網頁...');
              localStorage.clear();
              window.location.reload();
              return;
            }
            
            if (profile.grade_class && profile.seat_number) {
              this.verifySession(profile).catch(e => {
                console.error('[Session Verification] 驗證過程出錯:', e);
              });
            }
          } catch (e) {
            console.error('[Session Verification] 解析本地 profile 錯誤，清除資料:', e);
            localStorage.clear();
            window.location.reload();
            return;
          }
        }

        this.bindEvents();
        this.renderHome();
        this.renderLobby();
        this.initScanner();

        window.addEventListener('mathSprintProfileUpdated', () => {
          this.renderHome();
          this.renderLobby();
        });

        window.addEventListener('mathSprintBonusStarAwarded', (e) => {
          const inGame = (currentView === 'view-game' && !this.gameState.isGameOver) ||
                         (currentView === 'view-review' && !this.gameState.isGameOver);
          if (inGame) {
            this._pendingRewards = this._pendingRewards || [];
            this._pendingRewards.push(e.detail);
          } else {
            this.showBonusStarAlert(e.detail);
          }
        });

        if (window.MathSprintLeaderboard) {
          window.MathSprintLeaderboard.init().catch(() => {});
        }
      } catch (globalErr) {
        console.warn('[Game Init] 發生非預期錯誤，已自動降級為 Guest 試玩模式：', globalErr);
      }
    },

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
      document.getElementById('game-level-title').textContent = `M${missionNum} - Stage ${String(levelNum).padStart(2, '0')}/20`;

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

  // Export to window
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, CoreGame);

  window.addEventListener('limit180ComponentsLoaded', () => {
    window.MathSprintGame.init();
  });
})();
