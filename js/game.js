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
  for (let m = 1; m <= 10; m++) {
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
  // SPA views switcher
  let currentView = 'view-home';
  window.currentView = currentView; // 掛載至全域以利子元件存取
  
  // 動態切換雙軌流光相同霓虹顏色
  function changeScannerColor() {
    const scanner1 = document.querySelector('.scanner-line-1');
    const scanner2 = document.querySelector('.scanner-line-2');
    if (scanner1 && scanner2) {
      const neonColors = ['#ff007f', '#39ff14', '#00f0ff'];
      const color = neonColors[Math.floor(Math.random() * neonColors.length)];
      scanner1.style.background = color;
      scanner1.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;
      scanner2.style.background = color;
      scanner2.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;
    }
  }
  window.changeScannerColor = changeScannerColor;
  
  // 首次載入時初始化雙軌流光為同色
  changeScannerColor();

  function showView(viewId) {
    // 發生「切換頁面/Tab」行為時，光條顏色才允許整體改變
    changeScannerColor();

    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
      currentView = viewId;
      window.currentView = viewId; // 同步更新全域變數
    }
    
    // 如果進入遊戲或複習，隱藏 header 與 footer
    if (viewId === 'view-game' || viewId === 'view-review') {
      document.body.classList.add('body-in-game');
    } else {
      document.body.classList.remove('body-in-game');
    }
    
    const warning = document.getElementById('input-warning');
    const scannerLine = document.querySelector('.scanner-line');
    if (viewId === 'view-game') {
      warning.classList.remove('hidden');
      if (scannerLine) scannerLine.style.display = 'none';
    } else {
      warning.classList.add('hidden');
      if (scannerLine) scannerLine.style.display = '';
    }
  }
  window.showView = showView; // 掛載至全域，供 ui-controller 與其它元件呼叫

  const Game = {
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

    async verifySession(profile) {
      if (!window.MathSprintSupabaseService) return;
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) return;

        // 輕量化查詢：只撈取單一欄位 id，以 grade_class 與 seat_number 作為 match 條件
        const { data, error } = await db
          .from('users_profile')
          .select('id')
          .eq('grade_class', profile.grade_class)
          .eq('seat_number', profile.seat_number)
          .limit(1);

        if (error) {
          throw error;
        }

        // 狀況 B：若 Supabase 回傳陣列長度為 0 或是 data === null，代表帳號已被重置
        if (!data || data.length === 0) {
          console.warn('[Session Verification] 偵測到雲端帳號不存在（可能已被資料庫重置），啟動自動淨化機制...');
          localStorage.clear();
          window.location.reload();
          await new Promise(() => {});
        } else {
          console.log('[Session Verification] 雲端身份驗證通過。');
        }
      } catch (err) {
        console.warn('[Session Verification] 雲端身份校驗跳過（網路或服務波動）：', err.message || err);
      }
    },

    async init() {
      console.log('[Game Debug] this in init:', this, 'bindEvents type:', typeof this.bindEvents, 'MathSprintGame keys:', Object.keys(window.MathSprintGame || {}));
      try {
        // 舊快取防呆：檢查本地 profile 班級規格是否為全新的「2英+3數」
        const profileStr = localStorage.getItem('limit180_user_profile');
        if (profileStr) {
          try {
            const profile = JSON.parse(profileStr);
            const gradeClass = profile.grade_class || '';
            if (!/^[A-Z]{2}[0-9]{3}$/i.test(gradeClass)) {
              console.warn('[Session Verification] 本地班級格式不符 2英+3數 規格，清除髒資料並重新整理網頁...');
              localStorage.clear();
              window.location.reload();
              return;
            }
            
            // 雲端身份校驗（非阻塞非同步，優雅降級）
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

        // 監聽全新四維星星獎勵事件 (Gamification Reward)
        window.addEventListener('mathSprintBonusStarAwarded', (e) => {
          // 只有在遊戲進行中 才進行暫存防打斷
          const inGame = (currentView === 'view-game' && !this.gameState.isGameOver) ||
                         (currentView === 'view-review' && !this.gameState.isGameOver);
          if (inGame) {
            this._pendingRewards = this._pendingRewards || [];
            this._pendingRewards.push(e.detail);
          } else {
            this.showBonusStarAlert(e.detail);
          }
        });

        // 2.0：初始化雲端排行榜（非阻塞）
        if (window.MathSprintLeaderboard) {
          window.MathSprintLeaderboard.init().catch(() => {});
        }
      } catch (globalErr) {
        console.warn('[Game Init] 發生非預期錯誤，已自動降級為 Guest 試玩模式：', globalErr);
      }
    },

    // --- GAME STAGE INITIATION ---
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
      this.gameState.combo = 0;
      this.gameState.maxCombo = 0;
      
      const progress = (levelNum - 1) / 19;
      const initLimit = config.initStart - progress * (config.initStart - config.initEnd);
      const targetLimit = config.targetStart - progress * (config.targetStart - config.targetEnd);

      this.gameState.initLimitTime = initLimit;
      this.gameState.limitTime = initLimit;
      this.gameState.targetSpeed = targetLimit;
      this.gameState.correctRateTarget = 0.60;
      
      this.gameState.questionTimes = [];
      this.gameState.recentQueue = [];
      this.gameState.isGameOver = false;
      this.gameState.isPaused = false;
      this.gameState.isReviewMode = false;
      this.gameState.pauseCount = 0;

      // Sync HUD
      document.getElementById('game-shields').textContent = profile.shields_count;
      document.getElementById('game-level-title').textContent = `Mission ${missionNum} - Stage ${String(levelNum).padStart(2, '0')} / 20`;

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
      this.gameState.maxCombo = 0;
      this.gameState.correctCount = 0;
      this.gameState.questionTimes = [];
      this.gameState.recentQueue = [];
      
      this._tempPendingRecord = null;
      console.log('[Game] 挑戰已安全中斷，記憶體已歸零，已拒絕寫入雲端與本地存檔。');
    },

    showBonusStarAlert(detail) {
      alert(detail.text);
      
      if (typeof confetti !== 'undefined') {
        if (detail.type === 'mission_complete') {
          let duration = 3 * 1000;
          let end = Date.now() + duration;

          (function frame() {
            confetti({
              particleCount: 6,
              angle: 60,
              spread: 55,
              origin: { x: 0 }
            });
            confetti({
              particleCount: 6,
              angle: 120,
              spread: 55,
              origin: { x: 1 }
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        } else {
          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.6 }
          });
        }
      }
    },

    async _submitCloudResult(missionNum, levelNum, questionTimes, correctCount, totalQuestions, avgTime) {
      const CFG = window.MATH_SPRINT_CONFIG;
      if (!CFG || !CFG.CLOUD_ENABLED) return;
      if (!navigator.onLine) return;

      try {
        if (window.MathSprintOnboarding && window.MathSprintOnboarding.syncCurrentStatsToCloud) {
          await window.MathSprintOnboarding.syncCurrentStatsToCloud(missionNum);
        }
      } catch (e) {
        console.warn('[Game] _submitCloudResult 例外:', e.message);
      }
    },

    nextQuestion() {
      if (this.gameState.questionIndex >= this.gameState.totalQuestions) {
        this.endGame(true);
        return;
      }

      this.gameState.questionIndex++;
      this.gameState.limitTime = this.getRoundTimeLimit(this.gameState.questionIndex);
      
      document.getElementById('game-progress').textContent = `${this.gameState.questionIndex}/${this.gameState.totalQuestions}`;
      document.getElementById('game-combo').textContent = this.gameState.combo;
      document.getElementById('shield-alert').classList.add('hidden');

      const q = window.MathSprintGenerator.generateQuestion(this.gameState.currentMission, this.gameState.recentQueue);
      this.gameState.currentQuestion = q;

      document.getElementById('question-text').innerHTML = q.questionText;

      const isCompareMode = q.type === 'compare' && !this.gameState.isReviewMode;
      const warning = document.getElementById('input-warning');
      
      if (isCompareMode) {
        document.getElementById('control-input-mode').classList.add('hidden');
        document.getElementById('control-binary-mode').classList.remove('hidden');
        warning.classList.add('hidden');
        document.getElementById('binary-left-text').innerHTML = q.leftText;
        document.getElementById('binary-right-text').innerHTML = q.rightText;
      } else {
        document.getElementById('control-input-mode').classList.remove('hidden');
        document.getElementById('control-binary-mode').classList.add('hidden');
        warning.classList.remove('hidden');
        
        const input = document.getElementById('calc-input');
        if (input) {
          input.value = '';
          setTimeout(() => input.focus(), 50);
        }
      }

      if (this.renderScaffold) {
        this.renderScaffold(q);
      }

      this.gameState.startTime = performance.now();
      this.startTimer();
    },

    startTimer() {
      clearInterval(this.timerInterval);
      
      const duration = this.gameState.limitTime * 1000;
      let timeSpent = 0;
      const step = 50;

      const timeBar = document.getElementById('game-time-bar');
      if (!timeBar) return;
      timeBar.style.width = '100%';
      timeBar.style.backgroundColor = 'var(--neon-green)';
      timeBar.style.boxShadow = '0 0 10px var(--neon-green)';

      this.timerInterval = setInterval(() => {
        if (this.gameState.isPaused) return;

        timeSpent += step;
        const pct = Math.max(0, 100 - (timeSpent / duration) * 100);
        timeBar.style.width = `${pct}%`;

        if (pct < 30) {
          timeBar.style.backgroundColor = 'var(--neon-pink)';
          timeBar.style.boxShadow = '0 0 10px var(--neon-pink)';
        } else if (pct < 60) {
          timeBar.style.backgroundColor = 'var(--neon-yellow)';
          timeBar.style.boxShadow = '0 0 10px var(--neon-yellow)';
        } else {
          timeBar.style.backgroundColor = 'var(--neon-green)';
          timeBar.style.boxShadow = '0 0 10px var(--neon-green)';
        }

        if (timeSpent >= duration) {
          clearInterval(this.timerInterval);
          this.handleTimeout();
        }
      }, step);
    },

    handleTimeout() {
      playSound('wrong');
      this.gameState.combo = 0;
      this.handleFailure("超時！算力加載失敗。");
    },

    getRoundTimeLimit(round) {
      const base = this.gameState.initLimitTime;
      let timeLimit;
      
      if (round >= 1 && round <= 5) {
        if (this.gameState.currentMission === 1 && this.gameState.currentLevel <= 3) {
          timeLimit = base + 2.0;
        } else {
          timeLimit = base + 1.0;
        }
      } else if (round >= 6 && round <= 15) {
        timeLimit = base + 0.5;
      } else {
        timeLimit = base;
      }

      if (this.gameState.currentMission !== 10) {
        const comboReduction = Math.floor(this.gameState.combo / 4) * 0.5;
        timeLimit = Math.max(this.gameState.targetSpeed, timeLimit - comboReduction);
      }

      return timeLimit;
    },

    checkAutoSubmit() {
      if (this.gameState.isPaused || this.gameState.isGameOver) return;
      const isCompare = this.gameState.currentQuestion?.type === 'compare' && !this.gameState.isReviewMode;
      if (isCompare) return;

      const input = document.getElementById('calc-input');
      if (!input) return;

      const inputVal = input.value.trim();
      const correctAnswer = this.gameState.currentQuestion?.correctAnswer;
      if (!correctAnswer) return;

      const correctLen = correctAnswer.length;
      if (inputVal.length === correctLen && correctLen > 0) {
        this.submitCalcAnswer();
      }
    },

    submitCalcAnswer() {
      if (this.gameState.isPaused || this.gameState.isGameOver) return;
      const inputVal = document.getElementById('calc-input').value.trim();
      if (inputVal === '') return;

      const isCorrect = inputVal === this.gameState.currentQuestion.correctAnswer;
      const timeTaken = (performance.now() - this.gameState.startTime) / 1000;
      this.gameState.questionTimes.push(timeTaken);

      if (isCorrect) {
        this.handleSuccess(timeTaken);
      } else {
        this.handleFailure(inputVal);
      }
    },

    submitCompareAnswer(symbol) {
      if (this.gameState.isPaused || this.gameState.isGameOver) return;
      
      const isCorrect = symbol === this.gameState.currentQuestion.correctAnswer;
      const timeTaken = (performance.now() - this.gameState.startTime) / 1000;
      this.gameState.questionTimes.push(timeTaken);

      if (isCorrect) {
        this.handleSuccess(timeTaken);
      } else {
        const wrongText = symbol === '>' ? `${this.gameState.currentQuestion.leftText} 比 ${this.gameState.currentQuestion.rightText} 大` : `${this.gameState.currentQuestion.leftText} 比 ${this.gameState.currentQuestion.rightText} 小`;
        this.handleFailure(wrongText);
      }
    },

    handleSuccess(timeTaken) {
      playSound('correct');
      window.MathSprintStorage.recordCorrectAnswer();
      
      if (window.MathSprintAchievements && timeTaken) {
        window.MathSprintAchievements.checkSpeed(timeTaken);
      }

      this.gameState.correctCount++;
      this.gameState.combo++;
      this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);

      this.nextQuestion();
    },

    handleFailure(wrongAnswerText) {
      playSound('wrong');
      clearInterval(this.timerInterval);

      this.gameState.combo = 0;

      const mainBody = document.querySelector('body');
      if (mainBody) {
        mainBody.classList.add('shake');
        setTimeout(() => mainBody.classList.remove('shake'), 300);
      }

      window.MathSprintStorage.logWrongQuestion(
        this.gameState.currentQuestion.questionText.replace(/&times;/g, '×').replace(/&divide;/g, '÷'),
        this.gameState.currentQuestion.correctAnswer,
        wrongAnswerText,
        this.gameState.currentMission,
        this.gameState.currentLevel
      );

      if (this.gameState.currentMission === 10) {
        this.endGame(false);
        return;
      }

      this.gameState.isPaused = true;
      const feedback = document.getElementById('error-feedback');
      if (feedback) {
        const correctText = this.gameState.currentQuestion.type === 'compare' ? 
          (this.gameState.currentQuestion.correctAnswer === '>' ? '左邊較大 (>)' : '右邊較大 (<)') : 
          this.gameState.currentQuestion.correctAnswer;
        
        document.getElementById('error-correct-answer').textContent = correctText;
        document.getElementById('error-explanation').innerHTML = this.gameState.currentQuestion.explanation;
        feedback.classList.remove('hidden');

        setTimeout(() => {
          feedback.classList.add('hidden');
          this.gameState.isPaused = false;
          this.nextQuestion();
        }, 1800);
      }
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

      if (!hasProfile) {
        let guest_bonus_stars = 0;
        if (this.gameState.maxCombo === 20) {
          guest_bonus_stars = 1;
          console.log('[Lazy Registration] 訪客獲得 20-Combo 完美連斬加成 1 星');
        }

        const minTime = validTimes.length > 0 ? Math.min(...validTimes) : 99.9;
        this._tempPendingRecord = {
          missionNum: this.gameState.currentMission,
          levelNum: this.gameState.currentLevel,
          stars: starsEarned,
          guest_bonus_stars: guest_bonus_stars,
          avgTime: avgTime,
          maxCombo: this.gameState.maxCombo,
          minTime: minTime,
          isPass: isPass,
          correctCount: this.gameState.correctCount,
          totalQuestions: this.gameState.totalQuestions
        };
        console.log('[Lazy Registration] 訪客首玩第一局，成績已暫存：', this._tempPendingRecord);
      } else {
        if (this.gameState.maxCombo === 20) {
          const profile = window.MathSprintStorage.getProfile();
          const levelKey = `mission-${this.gameState.currentMission}-level-${this.gameState.currentLevel}`;
          if (!profile.claimed_milestones) profile.claimed_milestones = {};
          if (!profile.claimed_milestones.combo_20) profile.claimed_milestones.combo_20 = [];
          
          if (!profile.claimed_milestones.combo_20.includes(levelKey)) {
            profile.claimed_milestones.combo_20.push(levelKey);
            profile.bonus_stars = (profile.bonus_stars || 0) + 1;
            window.MathSprintStorage.recalculateTotalStars(profile);
            window.MathSprintStorage.saveProfile(profile);

            window.dispatchEvent(new CustomEvent('mathSprintBonusStarAwarded', {
              detail: { type: 'combo_20', text: '🏆 完美連斬！您在此關卡連續答對 20 題，獲得 1 顆額外星星！' }
            }));
          }
        }

        if (isPass) {
          const minTime = validTimes.length > 0 ? Math.min(...validTimes) : 99.9;
          window.MathSprintStorage.saveLevelRecord(
            this.gameState.currentMission,
            this.gameState.currentLevel,
            starsEarned,
            avgTime,
            this.gameState.maxCombo,
            minTime
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

      // 調用 Mixin 的成果畫質渲染
      if (this.renderEndGameResult) {
        this.renderEndGameResult(isCompleted, accuracy, starsEarned, avgTime, isPass, hasProfile);
      }
    },

    pauseGame() {
      if (this.gameState.isPaused || this.gameState.isGameOver || !this.gameState.currentQuestion) return;

      this.gameState.pauseCount++;
      this.updatePauseBtnUI();

      if (this.gameState.pauseCount <= 3) {
        this.gameState.isPaused = true;
      } else {
        const warningText = document.getElementById('pause-warning-text');
        if (warningText) {
          warningText.innerHTML = `<span class="text-red-500 font-pixel">⚠️ 暫停次數已用盡！時間照常扣減中！</span>`;
        }
      }

      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.classList.remove('hidden');
    },

    resumeGame() {
      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.classList.add('hidden');

      this.gameState.isPaused = false;
      
      const isCompare = this.gameState.currentQuestion?.type === 'compare' && !this.gameState.isReviewMode;
      if (!isCompare) {
        const input = document.getElementById('calc-input');
        if (input) input.focus();
      }
    },

    updatePauseBtnUI() {
      const btn = document.getElementById('game-pause-btn');
      if (btn) {
        const remaining = Math.max(0, 3 - this.gameState.pauseCount);
        btn.textContent = `暫停 (${remaining}/3)`;
        if (remaining === 0) {
          btn.classList.remove('text-pink-400', 'border-pink-500');
          btn.classList.add('text-red-500', 'border-red-600', 'animate-pulse');
        } else {
          btn.classList.remove('text-red-500', 'border-red-600', 'animate-pulse');
          btn.classList.add('text-pink-400', 'border-pink-500');
        }
      }
      
      const warningText = document.getElementById('pause-warning-text');
      if (warningText) {
        warningText.innerHTML = `前 3 次暫停時間會停止倒數。<br>第 4 次暫停起，時間將照常扣減！`;
      }
    }
  };

  // Export to window
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Game);

  window.addEventListener('limit180ComponentsLoaded', () => {
    window.MathSprintGame.init();
  });
})();
