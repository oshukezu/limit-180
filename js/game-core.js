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
      reviewCorrectStrike: 0,

      // Placement Test variables
      isPlacementTest: false,
      errorsCount: 0
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
          if (window.GameStore && typeof window.GameStore.renderStore === 'function') {
            window.GameStore.renderStore();
          }
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
    }
  };

  // Export to window
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, CoreGame);

  window.addEventListener('limit180ComponentsLoaded', () => {
    window.MathSprintGame.init();
  });
})();
