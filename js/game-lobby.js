// Limit 180 — 大廳渲染模組 (Lobby Module)
(function() {
  const Lobby = {
    // 控制背景掃描光標：保持相容性
    initScanner() {},

    renderHome() {
      const profile = window.MathSprintStorage.getProfile();
      const starsEl = document.getElementById('profile-total-stars');
      const todayEl = document.getElementById('profile-today-earnings');
      const wrongEl = document.getElementById('profile-wrong-count');
      if (starsEl) starsEl.textContent = window.formatCoins(profile.total_stars || 0, false);
      if (todayEl) todayEl.textContent = window.formatCoins(profile.today_earnings || 0, false);
      if (wrongEl) wrongEl.textContent = profile.wrong_questions_db.length;
    },

    // Renders the Mission Lobby Card list with Expandable Sub-level grids
    renderLobby() {
      const profile = window.MathSprintStorage.getProfile();
      const grid = document.getElementById('levels-grid');
      if (!grid) return;
      grid.innerHTML = '';
      
      const starsEl = document.getElementById('lobby-stars');
      const todayEl = document.getElementById('lobby-today-earnings');
      const maxLvlEl = document.getElementById('lobby-max-level');
      
      if (starsEl) starsEl.textContent = window.formatCoins(profile.total_stars || 0, true);
      if (todayEl) todayEl.textContent = window.formatCoins(profile.today_earnings || 0, true);
      document.querySelectorAll('.skip-exam-ticket-count').forEach(el => {
        el.textContent = Number(profile.skip_exam_tickets || 0).toLocaleString('zh-TW');
      });

      const MISSION_CONFIGS = window.MathSprintConfigs.MISSION_CONFIGS;

      // Unlocked highest category text calculation
      let maxUnlockedMission = 1;
      const count = Object.keys(MISSION_CONFIGS).length;
      for (let m = 1; m <= count; m++) {
        if (window.MathSprintStorage.isMissionUnlocked(m, profile)) {
          maxUnlockedMission = m;
        }
      }
      if (maxLvlEl) maxLvlEl.textContent = `Mission ${maxUnlockedMission}`;

      const minMission = this.currentMinMission || window.MathSprintGame.currentMinMission || 1;
      const maxMission = this.currentMaxMission || window.MathSprintGame.currentMaxMission || 10;

      for (let i = minMission; i <= maxMission; i++) {
        const config = MISSION_CONFIGS[i];
        const isMUnlocked = window.MathSprintStorage.isMissionUnlocked(i, profile);
        
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

        // Calculate average accuracy rate for the cleared levels of this mission
        let totalAcc = 0;
        let clearedCount = 0;
        for (let l = 1; l <= 20; l++) {
          const record = profile.level_records[`mission-${i}-level-${l}`];
          if (record && record.is_passed && record.accuracy !== undefined) {
            totalAcc += record.accuracy;
            clearedCount++;
          }
        }
        const avgAccPct = clearedCount > 0 ? Math.round((totalAcc / clearedCount) * 100) : 0;

        const card = document.createElement('div');
        card.className = `hud-panel p-5 bg-slate-900/90 flex flex-col justify-between transition-all duration-300 relative w-full ${
          !isMUnlocked ? 'opacity-70 border-slate-950' : 'hover:border-cyan-400'
        }`;
        
        let reqPct = 60;
        if (i >= 41) reqPct = 90;
        else if (i >= 31) reqPct = 80;
        else if (i >= 21) reqPct = 70;

        const unlockCost = window.MathSprintStorage.getMissionUnlockCost
          ? window.MathSprintStorage.getMissionUnlockCost(i)
          : 0;

        card.innerHTML = `
          <div class="cursor-pointer">
            <div class="flex justify-between items-start mb-2">
               <span class="text-xs font-pixel ${i <= 10 ? 'text-cyan-400' : i <= 25 ? 'text-green-400' : i <= 40 ? 'text-pink-500 glow-pink' : 'text-yellow-400 glow-yellow'}">
                ${config.name.toUpperCase()}
               </span>
              <div class="text-xs font-pixel text-yellow-400">${isMUnlocked ? `${avgAccPct}%` : `🔒 前任務達 ${reqPct}%正確`}</div>
            </div>
            <h4 class="text-base font-bold text-white mb-1">${config.desc}</h4>
            ${!isMUnlocked ? `
              <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                <span class="text-[11px] text-slate-300">可用金幣解鎖：<b class="text-green-400">${window.formatCoins(unlockCost, true)}</b> 💰</span>
                <button class="mission-unlock-btn px-3 py-2 rounded border border-yellow-500 bg-yellow-950/30 text-yellow-300 text-xs font-bold" type="button">
                  購買解鎖
                </button>
              </div>
            ` : ''}
            
            <!-- Hidden levels select grid -->
            <div class="mission-levels-grid grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-800 hidden" id="levels-grid-${i}">
            </div>
          </div>
        `;

        if (isMUnlocked) {
          card.querySelector('div').addEventListener('click', (e) => {
            const subGrid = card.querySelector('.mission-levels-grid');
            if (!subGrid) return;
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
            
            // 金幣還原成星等用以顯示
            let recordStars = 0;
            const c = record.stars || 0;
            if (i === 50) {
              if (c >= 1500000 * L) recordStars = 3;
              else if (c >= 1000000 * L) recordStars = 2;
              else if (c >= 500000 * L) recordStars = 1;
            } else {
              const base = getBaseCoin(i);
              if (c >= base * L) recordStars = 3;
              else if (c >= Math.floor(base * L * 2 / 3)) recordStars = 2;
              else if (c >= Math.floor(base * L * 1 / 3)) recordStars = 1;
            }

            // 計算答對率的評級字母 (S, A, B, C, D)
            let grade = '';
            if (record && record.is_passed) {
              if (record.accuracy !== undefined) {
                const acc = record.accuracy;
                if (acc >= 1.0) grade = 'S';
                else if (acc >= 0.90) grade = 'A';
                else if (acc >= 0.80) grade = 'B';
                else if (acc >= 0.70) grade = 'C';
                else if (acc >= 0.60) grade = 'D';
              } else {
                // 相容舊紀錄的星等估算
                if (recordStars === 3) grade = 'A';
                else if (recordStars === 2) grade = 'B';
                else if (recordStars === 1) grade = 'C';
                else grade = 'D';
              }
            }

            let btnStarsClass = '';
            if (grade === 'S') {
              btnStarsClass = 'three-stars'; 
            } else if (grade === 'A') {
              btnStarsClass = 'three-stars';
            } else if (grade === 'B') {
              btnStarsClass = 'two-stars';
            } else if (grade === 'C') {
              btnStarsClass = 'one-star';
            } else if (grade === 'D') {
              btnStarsClass = 'one-star';
            }

            btn.className = `lvl-btn ${btnStarsClass}`;
            
            if (!isLUnlocked) {
              btn.classList.add('locked');
              btn.innerHTML = `<span class="text-[8px]">🔒</span>`;
            } else {
              if (grade) {
                // 已過關：只顯示等級評級，移除數字與霓虹效果，S級用黃色，其餘等級用白色
                const colorClass = (grade === 'S') ? 'text-yellow-400 font-bold' : 'text-white font-bold';
                btn.innerHTML = `<span class="text-[1.9rem] leading-none font-pixel ${colorClass}">${grade}</span>`;
              } else {
                // 未過關（但已解鎖）：顯示關卡數字
                btn.innerHTML = `<span class="text-[1.2rem] leading-none font-pixel text-slate-300">${L}</span>`;
              }
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.MathSprintGame && typeof window.MathSprintGame.startGame === 'function') {
                  window.MathSprintGame.startGame(i, L);
                } else if (typeof this.startGame === 'function') {
                  this.startGame(i, L);
                }
              });
            }
            subGrid.appendChild(btn);
          }
        } else {
          const unlockBtn = card.querySelector('.mission-unlock-btn');
          if (unlockBtn) {
            unlockBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const ok = await window.MathSprintStorage.purchaseMissionUnlock(i);
              if (ok && window.MathSprintGame?.renderLobby) {
                window.MathSprintGame.renderLobby();
              }
            });
          }
        }

        grid.appendChild(card);
      }
    }
  };

  // Mixin 到全域的 MathSprintGame 物件，維持無縫相容性
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Lobby);

  // 監聽元件載入完成事件，動態為大分類按鈕綁定點擊事件
  window.addEventListener('limit180ComponentsLoaded', () => {
    const tabsContainer = document.getElementById('lobby-category-tabs');
    if (tabsContainer) {
      tabsContainer.querySelectorAll('button[data-min]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // 清除所有 tabs 啟用樣式
          tabsContainer.querySelectorAll('button[data-min]').forEach(b => {
            b.className = "px-3 py-2 text-[10px] font-pixel rounded border border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 focus:outline-none transition-all duration-200";
          });
          // 設定目前 tab 啟用樣式 (Cyan 霓虹)
          btn.className = "px-3 py-2 text-[10px] font-pixel rounded border border-cyan-500 bg-cyan-950/20 text-cyan-400 focus:outline-none transition-all duration-200";
          
          // 更新大廳目前的篩選區間
          const minVal = parseInt(btn.getAttribute('data-min'));
          const maxVal = parseInt(btn.getAttribute('data-max'));
          Lobby.currentMinMission = minVal;
          Lobby.currentMaxMission = maxVal;
          if (window.MathSprintGame) {
            window.MathSprintGame.currentMinMission = minVal;
            window.MathSprintGame.currentMaxMission = maxVal;
            window.MathSprintGame.renderLobby();
          } else {
            Lobby.renderLobby();
          }
        });
      });
    }
    const skipExamBtn = document.getElementById('start-skip-exam-btn');
    if (skipExamBtn) {
      skipExamBtn.addEventListener('click', () => {
        window.MathSprintPlacementModal?.openSkipExam?.();
      });
    }
  });
})();
