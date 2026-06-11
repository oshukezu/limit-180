// MathSprint Game Core Module (Missions & Sub-levels Edition)
// Controls SPA screens, Missions selection grids, Game Loop, timer, input restrictions, sound generator and visual scaffolds.

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
  // Mission Configurations (10 Missions difficulty metadata & speed ranges)
  // Mission Configurations — passRate 已移除（統一使用 0.60 通關門檻）
  const MISSION_CONFIGS = {
    1: { name: "Mission 1", totalQuestions: 20, desc: "20以內加減法（含進/借位）", initStart: 6.0, initEnd: 3.0, targetStart: 4.0, targetEnd: 1.5 },
    2: { name: "Mission 2", totalQuestions: 20, desc: "九九乘法表", initStart: 5.5, initEnd: 2.5, targetStart: 3.5, targetEnd: 1.5 },
    3: { name: "Mission 3", totalQuestions: 20, desc: "81以內除法（被除數81以內）", initStart: 5.0, initEnd: 2.5, targetStart: 3.0, targetEnd: 1.5 },
    4: { name: "Mission 4", totalQuestions: 25, desc: "50以內加減法（無進/借位）", initStart: 4.5, initEnd: 2.0, targetStart: 2.5, targetEnd: 1.3 },
    5: { name: "Mission 5 [魔王]", totalQuestions: 30, desc: "100以內加減法（有進/借位）", initStart: 4.0, initEnd: 2.0, targetStart: 2.2, targetEnd: 1.3 },
    6: { name: "Mission 6", totalQuestions: 35, desc: "九九乘法與基本除法", initStart: 3.5, initEnd: 1.8, targetStart: 2.0, targetEnd: 1.2 },
    7: { name: "Mission 7 [魔王]", totalQuestions: 40, desc: "兩步驟四則混合運算", initStart: 3.0, initEnd: 1.8, targetStart: 1.8, targetEnd: 1.2 },
    8: { name: "Mission 8", totalQuestions: 50, desc: "分數/小數/百分比混搭二選一", initStart: 2.5, initEnd: 1.5, targetStart: 1.8, targetEnd: 0.9 },
    9: { name: "Mission 9", totalQuestions: 60, desc: "國中正負數代數與高難度比大小", initStart: 2.0, initEnd: 1.5, targetStart: 1.8, targetEnd: 1.0 },
    10: { name: "Limit 180 終極挑戰", totalQuestions: 100, desc: "在 3 分鐘 (180秒) 內挑戰做完 100 題！", initStart: 1.8, initEnd: 1.8, targetStart: 1.8, targetEnd: 1.8 }
  };

  // Sound generator using Web Audio API（模組級單例 AudioContext 以避免快速答題時超出瀏覽器限制）
  const _audioCtx = (function() {
    const AC = window.AudioContext || window.webkitAudioContext;
    return AC ? new AC() : null;
  })();

  function playSound(type) {
    try {
      if (!_audioCtx) return;
      // 自動恢復被瀏覽器暫停的 AudioContext（需要使用者互動後才會生效）
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      const ctx = _audioCtx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.50, now + 0.24);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'shield') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.5);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch (e) {
      console.warn("Web Audio context blocked", e);
    }
  }

  //SPA views switcher
  let currentView = 'view-home';
  
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
      pauseCount: 0, // 新增：單關已暫停次數
      
      // Review Mode variables
      isReviewMode: false,
      reviewList: [],
      reviewIndex: 0,
      reviewCorrectStrike: 0
    },

    timerInterval: null,
    scannerAnimFrame: null,

    // 控制背景掃描光標：5 色 × 4 方向 隨機片段
    initScanner() {
      // 雙軌平行流光效果已改用 CSS (@keyframes scan-double) 渲染，此處保持空實作以維持相容性。
    },


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
          throw error; // 拋出異常，交由 catch 統一處理 (視為網路/服務波動)
        }

        // 狀況 B（查無此人 / Null）：若 Supabase 回傳陣列長度為 0 或是 data === null
        if (!data || data.length === 0) {
          console.warn('[Session Verification] 偵測到雲端帳號不存在（可能已被資料庫重置），啟動自動淨化機制...');
          localStorage.clear();
          window.location.reload();
          // 阻斷後續非同步鏈執行
          await new Promise(() => {});
        } else {
          console.log('[Session Verification] 雲端身份驗證通過。');
        }
      } catch (err) {
        // 非同步異常防禦：若網路斷線或 Supabase 服務波動，絕對禁止 clear()，優雅放行
        console.warn('[Session Verification] 雲端身份校驗跳過（網路或服務波動）：', err.message || err);
      }
    },

    async init() {
      try {
        // 舊快取防呆：檢查本地 profile 班級規格是否為全新的「2英+3數」
        const profileStr = localStorage.getItem('limit180_user_profile');
        if (profileStr) {
          try {
            const profile = JSON.parse(profileStr);
            const gradeClass = profile.grade_class || '';
            // 正則校驗：必須是 2 位字母 + 3 位數字
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
          alert(e.detail.text);
          
          // 滿集暴擊或里程碑成就 Confetti 特效
          if (typeof confetti !== 'undefined') {
            if (e.detail.type === 'mission_complete') {
              // 滿集暴擊特效：酷炫的霓虹流星暴擊雨
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
              // 普通星星加發
              confetti({
                particleCount: 80,
                spread: 50,
                origin: { y: 0.6 }
              });
            }
          }
        });

        // 2.0：初始化雲端認證與排行榜（非阻塞）
        if (window.MathSprintAuth) {
          window.MathSprintAuth.init().catch(() => {});
        }
        if (window.MathSprintLeaderboard) {
          window.MathSprintLeaderboard.init().catch(() => {});
        }
      } catch (globalErr) {
        // 連線與解析降級：一律優雅降級為匿名 Guest 模式，絕不允許中斷 JavaScript 執行
        console.warn('[Game Init] 發生非預期錯誤，已自動降級為 Guest 試玩模式：', globalErr);
      }
    },


    bindEvents() {
      // Navigation
      const logoTitle = document.getElementById('nav-logo-title');
      if (logoTitle) {
        logoTitle.addEventListener('click', () => {
          this.stopGame();
          showView('view-home');
        });
      }
      document.getElementById('nav-dashboard-btn').addEventListener('click', () => {
        this.stopGame();
        if (window.MathSprintDashboard) {
          window.MathSprintDashboard.renderCharts();
        }
        showView('view-dashboard');
      });
      document.getElementById('nav-achievements-btn').addEventListener('click', () => {
        this.stopGame();
        if (window.MathSprintAchievements) {
          const select = document.getElementById('achievements-mission-select');
          if (select) select.value = this.gameState.currentMission;
          window.MathSprintAchievements.renderAchievements(this.gameState.currentMission);
        }
        showView('view-achievements');
      });

      // Lobby navigation (延遲註冊大廳鎖定：無帳號訪客強制進試玩)
      const lobbyBtnHandler = () => {
        this.stopGame();
        const hasProfile = !!localStorage.getItem('limit180_user_profile');
        if (hasProfile) {
          this.renderLobby();
          showView('view-lobby');
        } else {
          alert("【訪客特工試玩模式】\n\n您目前為訪客身份，請先完成第一局「Mission 1 Stage 01」試玩，即可註冊身份並解鎖所有功能！");
          this.startGame(1, 1);
        }
      };

      const startLevelsBtn = document.getElementById('start-levels-btn');
      if (startLevelsBtn) {
        startLevelsBtn.addEventListener('click', lobbyBtnHandler);
      }
      const navLobbyBtn = document.getElementById('nav-lobby-btn');
      if (navLobbyBtn) {
        navLobbyBtn.addEventListener('click', lobbyBtnHandler);
      }
      
      
      // Result actions
      document.getElementById('result-lobby-btn').addEventListener('click', () => {
        const hasProfile = !!localStorage.getItem('limit180_user_profile');
        if (hasProfile) {
          this.renderLobby();
          showView('view-lobby');
        } else {
          alert("【訪客身份限制】\n\n您目前為訪客身份，必須先註冊身份才能解鎖大廳！");
          if (window.MathSprintOnboarding && window.MathSprintOnboarding.showProfileModal) {
            const totalPending = (this._tempPendingRecord?.stars || 0) + (this._tempPendingRecord?.guest_bonus_stars || 0);
            window.MathSprintOnboarding.showProfileModal(false, totalPending);
          }
        }
      });
      document.getElementById('result-retry-btn').addEventListener('click', () => {
        if (this.gameState.isReviewMode) {
          this.startReviewMode();
        } else {
          this.startGame(this.gameState.currentMission, this.gameState.currentLevel);
        }
      });

      // 往下一關按鈕事件
      document.getElementById('result-next-btn').addEventListener('click', () => {
        const hasProfile = !!localStorage.getItem('limit180_user_profile');
        if (!hasProfile) {
          alert("【訪客身份限制】\n\n您目前為訪客身份，必須註冊身份後才能解鎖後續關卡！");
          if (window.MathSprintOnboarding && window.MathSprintOnboarding.showProfileModal) {
            const totalPending = (this._tempPendingRecord?.stars || 0) + (this._tempPendingRecord?.guest_bonus_stars || 0);
            window.MathSprintOnboarding.showProfileModal(false, totalPending);
          }
          return;
        }

        let nextMission = this.gameState.currentMission;
        let nextLevel = this.gameState.currentLevel + 1;
        if (nextLevel > 20) {
          nextLevel = 1;
          nextMission = this.gameState.currentMission + 1;
        }

        if (nextMission > 10) {
          alert("🎉 恭喜您通關了所有的 Limit 180 關卡！");
          this.renderLobby();
          showView('view-lobby');
        } else {
          this.startGame(nextMission, nextLevel);
        }
      });
      // 舊有 game-exit-btn 已移除，改由 ui-controller.js 統一處理右上角 X 關閉事件
      
      // Input submitting (Calc Mode)
      document.getElementById('calc-submit-btn').addEventListener('click', () => this.submitCalcAnswer());
      document.getElementById('calc-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitCalcAnswer();
        }
      });
      document.getElementById('calc-input').addEventListener('input', () => this.checkAutoSubmit());

      // Input keys filter
      const calcInput = document.getElementById('calc-input');
      const blockKeys = (e) => {
        if (this.gameState.isPaused || this.gameState.isGameOver) {
          e.preventDefault();
          return;
        }
        const allowedKeys = [
          'Backspace', 'Delete', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '.'
        ];
        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      };
      calcInput.addEventListener('keydown', blockKeys);

      // Focus pull
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      document.addEventListener('click', (e) => {
        if (!isTouchDevice && currentView === 'view-game' && !this.gameState.isPaused && !this.gameState.isGameOver) {
          const isCompare = this.gameState.currentQuestion?.type === 'compare';
          if ((!isCompare || this.gameState.isReviewMode) && e.target !== calcInput && e.target.tagName !== 'BUTTON') {
            calcInput.focus();
          }
        }
      });

      // Virtual Keypad binding
      document.querySelectorAll('.keypad-grid button[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.gameState.isPaused || this.gameState.isGameOver) return;
          const key = btn.getAttribute('data-key');
          const input = document.getElementById('calc-input');
          if (key === 'back') {
            input.value = input.value.slice(0, -1);
          } else if (key === 'clear') {
            input.value = '';
          } else {
            input.value += key;
          }
          input.focus();
          this.checkAutoSubmit();
        });
      });

      // Binary Compare Choice Clicks
      document.getElementById('binary-left-btn').addEventListener('click', () => this.submitCompareAnswer('>'));
      document.getElementById('binary-right-btn').addEventListener('click', () => this.submitCompareAnswer('<'));

      // Keyboard Left/Right Arrow Hotkeys for comparisons
      document.addEventListener('keydown', (e) => {
        if (currentView === 'view-game' && !this.gameState.isPaused && !this.gameState.isGameOver) {
          const isCompare = this.gameState.currentQuestion?.type === 'compare';
          if (isCompare && !this.gameState.isReviewMode) {
            if (e.key === 'ArrowLeft') {
              this.submitCompareAnswer('>');
            } else if (e.key === 'ArrowRight') {
              this.submitCompareAnswer('<');
            }
          }
        }
      });

      // --- Review Mode Events ---
      document.getElementById('start-review-btn').addEventListener('click', () => this.startReviewMode());
      
      
       document.getElementById('review-submit-btn').addEventListener('click', () => this.submitReviewAnswer());
      document.getElementById('review-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.submitReviewAnswer();
      });
      document.getElementById('review-input').addEventListener('input', () => this.checkReviewAutoSubmit());

      const reviewInput = document.getElementById('review-input');
      reviewInput.addEventListener('keydown', (e) => {
        const allowedKeys = [
          'Backspace', 'Delete', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight',
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '.'
        ];
        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      });

      document.querySelectorAll('.keypad-grid button[data-review-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-review-key');
          const input = document.getElementById('review-input');
          if (key === 'back') {
            input.value = input.value.slice(0, -1);
          } else if (key === 'clear') {
            input.value = '';
          } else {
            input.value += key;
          }
          input.focus();
          this.checkReviewAutoSubmit();
        });
      });

      // --- Pause/Resume Events ---
      const pauseBtn = document.getElementById('game-pause-btn');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => this.pauseGame());
      }
      const resumeBtn = document.getElementById('game-resume-btn');
      if (resumeBtn) {
        resumeBtn.addEventListener('click', () => this.resumeGame());
      }

      // --- Demote Modal Events ---
      const demoteStayBtn = document.getElementById('demote-modal-stay-btn');
      if (demoteStayBtn) {
        demoteStayBtn.addEventListener('click', () => {
          document.getElementById('demote-modal').classList.add('hidden');
        });
      }
    },

    renderHome() {
      const profile = window.MathSprintStorage.getProfile();
      document.getElementById('profile-total-stars').textContent = profile.total_stars;
      document.getElementById('profile-wrong-count').textContent = profile.wrong_questions_db.length;
    },

    // Renders the Mission Lobby Card list with Expandable Sub-level grids
    renderLobby() {
      const profile = window.MathSprintStorage.getProfile();
      const grid = document.getElementById('levels-grid');
      grid.innerHTML = '';
      
      document.getElementById('lobby-stars').textContent = profile.total_stars;
      document.getElementById('lobby-shields').textContent = profile.shields_count;

      // Unlocked highest category text calculation
      let maxUnlockedMission = 1;
      for (let m = 1; m <= 10; m++) {
        if (window.MathSprintStorage.isMissionUnlocked(m, profile)) {
          maxUnlockedMission = m;
        }
      }
      document.getElementById('lobby-max-level').textContent = `Mission ${maxUnlockedMission}`;

      for (let i = 1; i <= 10; i++) {
        const config = MISSION_CONFIGS[i];
        const isMUnlocked = window.MathSprintStorage.isMissionUnlocked(i, profile);
        
        // Sum stars earned in this mission
        let starsInM = 0;
        for (let l = 1; l <= 20; l++) {
          const record = profile.level_records[`mission-${i}-level-${l}`];
          starsInM += record ? record.stars : 0;
        }

        const card = document.createElement('div');
        card.className = `hud-panel p-5 bg-slate-900/90 flex flex-col justify-between transition-all duration-300 relative ${
          !isMUnlocked ? 'opacity-40 border-slate-950 pointer-events-none' : 'hover:border-cyan-400'
        }`;
        
        card.innerHTML = `
          <div class="cursor-pointer">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-pixel ${i === 5 || i === 7 ? 'text-pink-500 glow-pink' : i === 10 ? 'text-yellow-400 glow-yellow' : 'text-cyan-400'}">
                ${config.name.toUpperCase()}
              </span>
              <div class="text-xs font-pixel text-yellow-400">${isMUnlocked ? `★ ${starsInM} / 60` : '🔒 需前一關滿 ★3'}</div>
            </div>
            <h4 class="text-base font-bold text-white mb-1">${config.desc}</h4>
            <p class="text-[11px] text-slate-400 font-tech mb-2">
              點擊卡片展開子關卡 (20關點陣挑戰)
            </p>
            
            <!-- Hidden levels select grid -->
            <div class="mission-levels-grid grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-800 hidden" id="levels-grid-${i}">
            </div>
          </div>
        `;

        if (isMUnlocked) {
          // Card body triggers sub-level grid expand
          card.querySelector('div').addEventListener('click', (e) => {
            const subGrid = card.querySelector('.mission-levels-grid');
            const isHidden = subGrid.classList.contains('hidden');
            
            // Hide all other grids
            document.querySelectorAll('.mission-levels-grid').forEach(g => g.classList.add('hidden'));
            
            if (isHidden) {
              subGrid.classList.remove('hidden');
            }
          });

          // Draw the 20 levels grids inside
          const subGrid = card.querySelector('.mission-levels-grid');
          for (let L = 1; L <= 20; L++) {
            const isLUnlocked = window.MathSprintStorage.isLevelUnlocked(i, L, profile);
            const key = `mission-${i}-level-${L}`;
            const record = profile.level_records[key] || { stars: 0, best_avg_time: null, max_combo: 0 };
            
            const btn = document.createElement('button');
            
            let btnStarsClass = '';
            let starsIndicator = '☆☆☆';
            if (record.stars === 3) {
              btnStarsClass = 'three-stars';
              starsIndicator = '★★★';
            } else if (record.stars === 2) {
              btnStarsClass = 'two-stars';
              starsIndicator = '★★☆';
            } else if (record.stars === 1) {
              btnStarsClass = 'one-star';
              starsIndicator = '★☆☆';
            }

            btn.className = `lvl-btn ${btnStarsClass}`;
            
            if (!isLUnlocked) {
              btn.classList.add('locked');
              btn.innerHTML = `<span class="text-[8px]">🔒</span>`;
            } else {
              btn.innerHTML = `
                <span class="text-[9px] font-pixel">${L}</span>
                <span class="text-[6px] tracking-tighter opacity-80" style="font-size: 5px;">${starsIndicator}</span>
              `;
              btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop collapsing card event
                this.startGame(i, L);
              });
            }
            subGrid.appendChild(btn);
          }
        }

        grid.appendChild(card);
      }
    },

    // --- GAME STAGE INITIATION ---
    startGame(missionNum, levelNum) {
      this.stopGame();

      if (window.MathSprintGenerator && window.MathSprintGenerator.resetLastAnswer) {
        window.MathSprintGenerator.resetLastAnswer();
      }

      // 只有當切換到與上一次不同的關卡時，才重置連續失敗次數
      if (this.gameState.currentMission !== missionNum || this.gameState.currentLevel !== levelNum) {
        this.gameState.consecutiveFailures = 0;
      }

      const config = MISSION_CONFIGS[missionNum];
      const profile = window.MathSprintStorage.getProfile();

      this.gameState.currentMission = missionNum;
      this.gameState.currentLevel = levelNum;
      this.gameState.questionIndex = 0; // 修正：重設題目索引以避免一進關卡即判定結束/失敗的 Bug
      this.gameState.totalQuestions = config.totalQuestions;
      this.gameState.correctCount = 0;
      this.gameState.combo = 0;
      this.gameState.maxCombo = 0;
      
      // Interpolate Speed Limits based on Sub-Level index 1-20
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
      document.getElementById('scaffold-canvas-container').innerHTML = '';
    },

    interruptGame() {
      // 1. 計時器斷電
      this.stopGame();
      
      // 2. 記憶體重置
      this.gameState.combo = 0;
      this.gameState.maxCombo = 0;
      this.gameState.correctCount = 0;
      this.gameState.questionTimes = [];
      this.gameState.recentQueue = [];
      
      // 3. 拒絕寫入：將暫存成績標記為 null 且絕對禁止 Supabase 數據發送
      this._tempPendingRecord = null;
      console.log('[Game] 挑戰已安全中斷，記憶體已歸零，已拒絕寫入雲端與本地存檔。');
    },

    saveReviewProgress() {
      if (this.gameState.isReviewMode) {
        localStorage.setItem('error_questions_queue', JSON.stringify(this.gameState.reviewList));
        console.log('[Game] 錯題消除進度已即時序列化並保存至本機快取。');
      }
    },

    // 2.0：非同步提交雲端成績（不阻塞結算畫面顯示）
    async _submitCloudResult(missionNum, levelNum, questionTimes, correctCount, totalQuestions, avgTime) {
      const CFG = window.MATH_SPRINT_CONFIG;
      if (!CFG || !CFG.CLOUD_ENABLED) return;
      if (!navigator.onLine) return;

      try {
        // Mission 10（傳奇）需走 Edge Function 防作弊驗證
        if (missionNum === 10 && CFG.EDGE_FUNCTION_URL) {
          const user = window.MathSprintAuth?.currentUser;
          if (!user) return;

          const { data: { session } } = await window.MathSprintAuth.supabase.auth.getSession();
          if (!session?.access_token) return;

          const resp = await fetch(CFG.EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              mission_num: missionNum,
              level_num: levelNum,
              question_times: questionTimes,
              correct_count: correctCount,
              total_questions: totalQuestions
            })
          });

          const result = await resp.json();
          if (!resp.ok || !result.success) {
            console.warn('[Game] Mission 10 防作弊驗證拒絕：', result.verdict || result.error);
            // 不顯示特別提示（靜默拒絕，避免教育作弊者邊界）
            return;
          }

          console.log('[Game] Mission 10 ✅ 防作弊通過，已記錄傳奇殿堂成績');

        } else if (missionNum < 10) {
          // Mission 1-9：直接同步排行榜
          if (window.MathSprintOnboarding && window.MathSprintOnboarding.syncCurrentStatsToCloud) {
            await window.MathSprintOnboarding.syncCurrentStatsToCloud(missionNum);
          }
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
      
      // 動態梯度計時：依 sub-level 基準 + 題號微調 + combo 加速計算本題限時
      this.gameState.limitTime = this.getRoundTimeLimit(this.gameState.questionIndex);
      
      document.getElementById('game-progress').textContent = `${this.gameState.questionIndex}/${this.gameState.totalQuestions}`;
      document.getElementById('game-combo').textContent = this.gameState.combo;
      document.getElementById('shield-alert').classList.add('hidden');

      // Call generator.js using currentMission as sub-difficulty
      const q = window.MathSprintGenerator.generateQuestion(this.gameState.currentMission, this.gameState.recentQueue);
      this.gameState.currentQuestion = q;

      document.getElementById('question-text').innerHTML = q.questionText;

      // Dynamic view panels control based on raw question types
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
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }

      this.renderScaffold(q);

      this.gameState.startTime = performance.now();
      this.startTimer();
    },

    startTimer() {
      clearInterval(this.timerInterval);
      
      const duration = this.gameState.limitTime * 1000;
      let timeSpent = 0;
      const step = 50;

      const timeBar = document.getElementById('game-time-bar');
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
      // 1. 如果是輸入模式，且輸入框有值，時間到時自動送出
      const isCompare = this.gameState.currentQuestion?.type === 'compare' && !this.gameState.isReviewMode;
      if (!isCompare) {
        const inputVal = document.getElementById('calc-input').value.trim();
        if (inputVal !== '') {
          this.submitCalcAnswer();
          return;
        }
      }

      const profile = window.MathSprintStorage.getProfile();
      if (profile.shields_count > 0) {
        // Bug 5 修正：先扣除盾牌，再讀取最新 profile 更新 UI（避免 race condition）
        window.MathSprintStorage.useShield();
        const updatedProfile = window.MathSprintStorage.getProfile();
        playSound('shield');
        document.getElementById('game-shields').textContent = updatedProfile.shields_count;
        document.getElementById('shield-alert').classList.remove('hidden');
        
        this.gameState.questionTimes.push(this.gameState.limitTime);
        
        this.gameState.isPaused = true;
        setTimeout(() => {
          this.gameState.isPaused = false;
          document.getElementById('shield-alert').classList.add('hidden');
          this.nextQuestion();
        }, 1200);
      } else {
        this.handleFailure("超時！算力加載失敗。");
      }
    },

    /**
     * 動態計時核心函式（Bug 1/2/3 修正）
     * 整合三大因素：sub-level 梯度基準 + 題號熱身微調 + combo 連擊加速
     * @param {number} round - 當前第幾題（1-based）
     * @returns {number} 本題的限時秒數
     */
    getRoundTimeLimit(round) {
      // 基準時間：來自 startGame() 依 sub-level 插值計算的 initLimitTime
      const base = this.gameState.initLimitTime;
      let timeLimit;
      
      // 題號熱身微調：前幾題給較多時間，後段壓榨
      if (round >= 1 && round <= 5) {
        if (this.gameState.currentMission === 1 && this.gameState.currentLevel <= 3) {
          timeLimit = base + 2.0; // Mission 1 前 3 個子關卡新手防禦：第 1-5 題加給 2.0 秒
        } else {
          timeLimit = base + 1.0; // 起跑熱身：第 1-5 題加給 1.0 秒
        }
      } else if (round >= 6 && round <= 15) {
        timeLimit = base + 0.5; // 中段加速：第 6-15 題加給 0.5 秒
      } else {
        timeLimit = base; // 壓榨極限：第 16 題以後回歸基準秒數
      }

      // Combo 連擊加速（M10 不受 combo 影響）
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

    checkReviewAutoSubmit() {
      const input = document.getElementById('review-input');
      if (!input) return;

      const inputVal = input.value.trim();
      const currentItem = this.gameState.reviewCurrentItem;
      if (!currentItem) return;

      const correctAnswer = currentItem.correctAnswer;
      if (!correctAnswer) return;

      const correctLen = correctAnswer.length;
      if (inputVal.length === correctLen && correctLen > 0) {
        this.submitReviewAnswer();
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

      // Combo 加速已整合進 getRoundTimeLimit()，不再在此處直接修改 limitTime
      this.nextQuestion();
    },

    handleFailure(wrongAnswerText) {
      playSound('wrong');
      clearInterval(this.timerInterval);

      // combo 歸零即可，limitTime 重置由 nextQuestion → getRoundTimeLimit 自動處理
      this.gameState.combo = 0;

      const mainBody = document.querySelector('body');
      mainBody.classList.add('shake');
      setTimeout(() => mainBody.classList.remove('shake'), 300);

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
        // 延遲註冊：訪客首玩第一局，不寫入本地與雲端，暫存在記憶體
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
        // 已註冊玩家：正常保存與同步
        // 檢查與發放 20-Combo 獎勵
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

        // 2.0：雲端防作弊驗證 + 排行榜提交（非阻塞）
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

      // Render score screen
      document.getElementById('result-level').textContent = `Mission ${this.gameState.currentMission} Stage ${String(this.gameState.currentLevel).padStart(2, '0')} / 20 - ${MISSION_CONFIGS[this.gameState.currentMission].desc}`;
      document.getElementById('result-score').textContent = `${this.gameState.correctCount} / ${this.gameState.totalQuestions} (正確率：${Math.round(accuracy * 100)}%)`;
      document.getElementById('result-avg-time').textContent = `${avgTime.toFixed(2)} 秒 / 題`;
      document.getElementById('result-max-combo').textContent = this.gameState.maxCombo;
      document.getElementById('result-target-speed').textContent = `${this.gameState.targetSpeed.toFixed(2)} 秒`;

      const statusTitle = document.getElementById('result-status-title');
      const motivationBox = document.getElementById('result-motivation-box');

      // achievements integration
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
        
        // 顯示往下一關按鈕
        const nextBtn = document.getElementById('result-next-btn');
        if (nextBtn) nextBtn.classList.remove('hidden');

        const starsEl = document.getElementById('result-stars');
        let starsStr = '';
        for (let s = 1; s <= 3; s++) {
          starsStr += s <= starsEarned ? '★ ' : '☆ ';
        }
        starsEl.textContent = starsStr.trim();
        starsEl.className = `flex justify-center gap-4 text-4xl my-2 ${
          starsEarned === 3 ? 'text-green-400' : starsEarned === 2 ? 'text-cyan-400' : starsEarned === 1 ? 'text-yellow-400' : 'text-slate-600'
        }`;

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
        // 隱藏往下一關按鈕
        const nextBtn = document.getElementById('result-next-btn');
        if (nextBtn) nextBtn.classList.add('hidden');
        statusTitle.textContent = "挑戰失敗！";
        statusTitle.className = "text-2xl font-pixel text-red-500 glow-pink mb-2";
        document.getElementById('result-stars').textContent = '☆ ☆ ☆';
        
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
          
          // 使用 AbortController 管理 listener（取代 cloneNode 避免 DOM 替換開銷與記憶體洩漏）
          if (this._demoteAbortController) {
            this._demoteAbortController.abort();
          }
          this._demoteAbortController = new AbortController();

          const demoteBtn = document.getElementById('demote-modal-prev-btn');
          demoteBtn.addEventListener('click', () => {
            document.getElementById('demote-modal').classList.add('hidden');
            if (this.gameState.currentLevel > 1) {
              this.startGame(this.gameState.currentMission, this.gameState.currentLevel - 1);
            } else {
              this.startGame(Math.max(1, this.gameState.currentMission - 1), 20);
            }
          }, { signal: this._demoteAbortController.signal });

          setTimeout(() => {
            document.getElementById('demote-modal').classList.remove('hidden');
          }, 800);
        }
      }
      
      showView('view-result');

      // 延遲註冊：如果當前是訪客，播放完結算後彈出註冊身分彈窗
      if (!hasProfile) {
        const totalPendingStars = starsEarned + (this._tempPendingRecord?.guest_bonus_stars || 0);
        setTimeout(() => {
          if (window.MathSprintOnboarding && window.MathSprintOnboarding.showProfileModal) {
            window.MathSprintOnboarding.showProfileModal(false, totalPendingStars);
          }
        }, 1500);
      }
    },

    // --- SCAFFOLDED VISUAL AIDS DRAWING ---
    renderScaffold(question) {
      const box = document.getElementById('scaffold-box');
      const container = document.getElementById('scaffold-canvas-container');
      container.innerHTML = '';

      // Conditions to hide scaffold completely:
      // 1. Mission is 5 (boss), 7 (boss) or 10 (legend)
      // 2. Combo >= 5
      // 3. Question is not comparison type
      const isBoss = [5, 7, 10].includes(this.gameState.currentMission);
      if (isBoss || this.gameState.combo >= 5 || question.type !== 'compare' || !question.scaffoldData) {
        box.style.display = 'none';
        return;
      }

      box.style.display = 'block';

      const data = question.scaffoldData;
      const wrapper = document.createElement('div');
      wrapper.className = "flex w-full justify-around items-center h-full";

      const leftDiv = document.createElement('div');
      leftDiv.className = "flex flex-col items-center gap-1";
      leftDiv.innerHTML = `<span class="text-[9px] text-cyan-400 font-pixel">左邊</span>`;
      leftDiv.appendChild(this.createScaffoldGraphic(data.leftType, data.leftVal, data.fracDetails));

      const vsSpan = document.createElement('span');
      vsSpan.className = "text-xs font-pixel text-pink-500 animate-pulse";
      vsSpan.textContent = "VS";

      const rightDiv = document.createElement('div');
      rightDiv.className = "flex flex-col items-center gap-1";
      rightDiv.innerHTML = `<span class="text-[9px] text-pink-400 font-pixel">右邊</span>`;
      rightDiv.appendChild(this.createScaffoldGraphic(data.rightType, data.rightVal, data.leftType === 'fraction' ? null : data.fracDetails));

      wrapper.appendChild(leftDiv);
      wrapper.appendChild(vsSpan);
      wrapper.appendChild(rightDiv);
      
      container.appendChild(wrapper);
    },

    createScaffoldGraphic(type, value, fracDetails) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "70");
      svg.setAttribute("height", "70");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.style.border = "1px solid #1f2937";
      svg.style.backgroundColor = "#020205";

      if (type === 'fraction' && fracDetails) {
        const match = fracDetails.raw.match(/(\d+)\/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          const den = parseInt(match[2]);
          const cx = 50, cy = 50, r = 35;
          const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          bgCircle.setAttribute("cx", cx);
          bgCircle.setAttribute("cy", cy);
          bgCircle.setAttribute("r", r);
          bgCircle.setAttribute("fill", "#111827");
          bgCircle.setAttribute("stroke", "#374151");
          bgCircle.setAttribute("stroke-width", "2");
          svg.appendChild(bgCircle);

          let accumAngle = -Math.PI / 2;
          const sliceAngle = (2 * Math.PI) / den;

          for (let i = 0; i < den; i++) {
            const angleStart = accumAngle;
            const angleEnd = accumAngle + sliceAngle;
            accumAngle = angleEnd;

            const x1 = cx + r * Math.cos(angleStart);
            const y1 = cy + r * Math.sin(angleStart);
            const x2 = cx + r * Math.cos(angleEnd);
            const y2 = cy + r * Math.sin(angleEnd);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            const isFilled = i < num;
            const fillCol = isFilled ? "rgba(0, 240, 255, 0.6)" : "transparent";
            const strokeCol = "#374151";

            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const dStr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            path.setAttribute("d", dStr);
            path.setAttribute("fill", fillCol);
            path.setAttribute("stroke", strokeCol);
            path.setAttribute("stroke-width", "1");
            svg.appendChild(path);
          }
        }
      } else if (type === 'decimal' || type === 'fraction') {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const boxSize = 6;
        const spacing = 1;
        const startX = 15;
        const startY = 15;
        const totalToFill = Math.round(value * 100);

        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            const idx = r * 10 + c;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", startX + c * (boxSize + spacing));
            rect.setAttribute("y", startY + r * (boxSize + spacing));
            rect.setAttribute("width", boxSize);
            rect.setAttribute("height", boxSize);
            const isFilled = idx < totalToFill;
            rect.setAttribute("fill", isFilled ? "rgba(234, 179, 8, 0.7)" : "#111827");
            rect.setAttribute("stroke", "#374151");
            rect.setAttribute("stroke-width", "0.5");
            g.appendChild(rect);
          }
        }
        svg.appendChild(g);
      } else {
        const barWidth = 20;
        const barHeight = 70;
        const rx = 15;
        const ry = 15;

        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("x", "40");
        bgRect.setAttribute("y", ry);
        bgRect.setAttribute("width", barWidth);
        bgRect.setAttribute("height", barHeight);
        bgRect.setAttribute("fill", "#111827");
        bgRect.setAttribute("stroke", "#374151");
        bgRect.setAttribute("stroke-width", "2");
        svg.appendChild(bgRect);

        const filledHeight = barHeight * value;
        const fillRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        fillRect.setAttribute("x", "40");
        fillRect.setAttribute("y", ry + (barHeight - filledHeight));
        fillRect.setAttribute("width", barWidth);
        fillRect.setAttribute("height", filledHeight);
        fillRect.setAttribute("fill", "rgba(236, 72, 153, 0.7)");
        svg.appendChild(fillRect);

        for (let i = 1; i < 4; i++) {
          const tickY = ry + (barHeight * i / 4);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", "36");
          line.setAttribute("y1", tickY);
          line.setAttribute("x2", "64");
          line.setAttribute("y2", tickY);
          line.setAttribute("stroke", "#4b5563");
          line.setAttribute("stroke-width", "1");
          svg.appendChild(line);
        }
      }

      return svg;
    },

    // --- REVIEW MODE METHODS ---
    startReviewMode() {
      const profile = window.MathSprintStorage.getProfile();
      this.gameState.isReviewMode = true;
      
      // 優先讀取本機快取以實現續接
      const cachedQueue = localStorage.getItem('error_questions_queue');
      if (cachedQueue) {
        try {
          this.gameState.reviewList = JSON.parse(cachedQueue);
          console.log('[Game] 成功載入本機快取的錯題消除進度，續接上次挑戰。');
        } catch (e) {
          console.warn('[Game] 解析本機錯題快取失敗，將 fallback 讀取資料庫：', e);
          this.gameState.reviewList = [...profile.wrong_questions_db];
        }
      } else {
        this.gameState.reviewList = [...profile.wrong_questions_db];
      }

      this.gameState.reviewCorrectStrike = 0;
      this.gameState.isPaused = false;
      this.gameState.isGameOver = false;
      
      const emptyState = document.getElementById('review-empty-state');
      const workspace = document.getElementById('review-workspace');

      if (this.gameState.reviewList.length === 0) {
        emptyState.classList.remove('hidden');
        workspace.classList.add('hidden');
      } else {
        emptyState.classList.add('hidden');
        workspace.classList.remove('hidden');
        
        this.renderReviewList();
        this.loadReviewQuestion();
      }

      showView('view-review');
    },

    renderReviewList() {
      const itemsContainer = document.getElementById('review-list-items');
      itemsContainer.innerHTML = '';
      
      document.getElementById('review-total-count').textContent = this.gameState.reviewList.length;

      this.gameState.reviewList.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = `p-3 bg-slate-950 border text-xs font-tech flex justify-between items-center rounded ${
          index === 0 ? 'border-pink-500 bg-pink-950/10' : 'border-slate-800'
        }`;
        
        row.innerHTML = `
          <div>
            <div class="font-bold text-white">${item.questionText}</div>
            <div class="text-[10px] text-slate-500">消除進度: ${item.solvedCount || 0} / 3</div>
          </div>
          <span class="text-[9px] text-pink-500 font-pixel">M${item.mission} L${item.level}</span>
        `;
        itemsContainer.appendChild(row);
      });
    },

    loadReviewQuestion() {
      if (this.gameState.reviewList.length === 0) {
        this.startReviewMode();
        return;
      }

      const item = this.gameState.reviewList[0];
      this.gameState.reviewCurrentItem = item;
      this.gameState.reviewCorrectStrike = item.solvedCount || 0;

      document.getElementById('review-item-correct-count').textContent = this.gameState.reviewCorrectStrike;
      document.getElementById('review-question-text').textContent = item.questionText;
      document.getElementById('review-input').value = '';
      document.getElementById('review-feedback').classList.add('hidden');

      this.renderReviewList();
      setTimeout(() => document.getElementById('review-input').focus(), 50);
    },

    submitReviewAnswer() {
      const inputVal = document.getElementById('review-input').value.trim();
      if (inputVal === '') return;

      const item = this.gameState.reviewCurrentItem;
      const isCorrect = inputVal === item.correctAnswer;
      const feedbackBox = document.getElementById('review-feedback');

      feedbackBox.classList.remove('hidden');

      if (isCorrect) {
        playSound('correct');
        const result = window.MathSprintStorage.solveWrongQuestion(item.questionText);
        
        // 累計答對錯題數
        const profile = window.MathSprintStorage.getProfile();
        profile.total_review_correct_count = (profile.total_review_correct_count || 0) + 1;
        window.MathSprintStorage.saveProfile(profile);

        // 答對 20 題解鎖「錯題終結者」
        if (profile.total_review_correct_count >= 20 && window.MathSprintAchievements) {
          window.MathSprintAchievements.unlock('error_buster');
        }

        feedbackBox.textContent = "回答正確！消除進度增加！";
        feedbackBox.className = "p-3 mb-4 rounded text-center text-xs font-pixel bg-green-950/80 border border-green-500 text-green-400";
        
        setTimeout(() => {
          if (result && result.removed) {
            this.gameState.reviewList.shift();
            if (this.gameState.reviewList.length === 0) {
              localStorage.removeItem('error_questions_queue');
              console.log('[Game] 所有錯題已完全消除，本機快取已清空。');
              this.startReviewMode();
              return;
            }
          } else {
            const current = this.gameState.reviewList.shift();
            if (current) {
              current.solvedCount = (current.solvedCount || 0) + 1;
              this.gameState.reviewList.push(current);
            }
          }
          // 在每次答題進度更新時，也即時同步寫入快取，以防突發關閉
          localStorage.setItem('error_questions_queue', JSON.stringify(this.gameState.reviewList));
          this.loadReviewQuestion();
        }, 1200);

      } else {
        playSound('wrong');
        item.solvedCount = 0;
        window.MathSprintStorage.logWrongQuestion(item.questionText, item.correctAnswer, inputVal, item.mission, item.level);

        feedbackBox.innerHTML = `回答錯誤！進度歸零。 正確答案是：<span class="text-green-400 font-bold">${item.correctAnswer}</span>`;
        feedbackBox.className = "p-3 mb-4 rounded text-center text-xs font-pixel bg-red-950/80 border border-red-500 text-red-400";
        
        setTimeout(() => {
          const current = this.gameState.reviewList.shift();
          if (current) {
            current.solvedCount = 0;
            this.gameState.reviewList.push(current);
          }
          // 答錯進度重置時，也更新本機快取
          localStorage.setItem('error_questions_queue', JSON.stringify(this.gameState.reviewList));
          this.loadReviewQuestion();
        }, 2200);
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
  window.MathSprintGame = Game;

  window.addEventListener('limit180ComponentsLoaded', () => {
    Game.init();
  });
})();
