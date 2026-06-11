// Limit 180 — 大廳渲染模組 (Lobby Module)
(function() {
  const Lobby = {
    // 控制背景掃描光標：保持相容性
    initScanner() {},

    renderHome() {
      const profile = window.MathSprintStorage.getProfile();
      const starsEl = document.getElementById('profile-total-stars');
      const wrongEl = document.getElementById('profile-wrong-count');
      if (starsEl) starsEl.textContent = profile.total_stars;
      if (wrongEl) wrongEl.textContent = profile.wrong_questions_db.length;
    },

    // Renders the Mission Lobby Card list with Expandable Sub-level grids
    renderLobby() {
      const profile = window.MathSprintStorage.getProfile();
      const grid = document.getElementById('levels-grid');
      if (!grid) return;
      grid.innerHTML = '';
      
      const starsEl = document.getElementById('lobby-stars');
      const shieldsEl = document.getElementById('lobby-shields');
      const maxLvlEl = document.getElementById('lobby-max-level');
      
      if (starsEl) starsEl.textContent = profile.total_stars;
      if (shieldsEl) shieldsEl.textContent = profile.shields_count;

      const MISSION_CONFIGS = window.MathSprintConfigs.MISSION_CONFIGS;

      // Unlocked highest category text calculation
      let maxUnlockedMission = 1;
      for (let m = 1; m <= 10; m++) {
        if (window.MathSprintStorage.isMissionUnlocked(m, profile)) {
          maxUnlockedMission = m;
        }
      }
      if (maxLvlEl) maxLvlEl.textContent = `Mission ${maxUnlockedMission}`;

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
                e.stopPropagation();
                this.startGame(i, L);
              });
            }
            subGrid.appendChild(btn);
          }
        }

        grid.appendChild(card);
      }
    }
  };

  // Mixin 到全域的 MathSprintGame 物件，維持無縫相容性
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Lobby);
})();
