// Limit 180 Game Store Module
// Manages theme preview rendering, coin validation, purchasing, and applying new themes.

(function() {
  const Store = {
    // 渲染商店頁面
    renderStore() {
      const storeList = document.getElementById('theme-store-list');
      const coinsDisplay = document.getElementById('store-coins-balance');
      if (!storeList) return;

      const profile = window.MathSprintStorage.getProfile();
      const currentCoins = profile.total_stars || 0; // 使用 total_stars (累積獎金) 作為購買用金幣
      const equippedTheme = profile.equipped_theme || 'akaimon';
      const purchasedThemes = profile.purchased_themes || ['akaimon'];

      // 更新金幣餘額顯示
      if (coinsDisplay) {
        coinsDisplay.textContent = currentCoins.toLocaleString();
      }

      storeList.innerHTML = '';

      // 從 ThemeManager 取得所有主題
      const themes = window.ThemeManager.THEMES;
      Object.keys(themes).forEach(key => {
        const theme = themes[key];
        const isPurchased = purchasedThemes.includes(theme.id);
        const isEquipped = equippedTheme === theme.id;

        let buttonHtml = '';
        if (isEquipped) {
          buttonHtml = `
            <button class="px-4 py-2 text-xs font-pixel rounded bg-slate-800 text-slate-500 border border-slate-700 cursor-default" disabled>
              裝備中
            </button>
          `;
        } else if (isPurchased) {
          buttonHtml = `
            <button class="px-4 py-2 text-xs font-pixel rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-200" onclick="window.GameStore.equip('${theme.id}')">
              裝備
            </button>
          `;
        } else {
          const canAfford = currentCoins >= theme.price;
          if (canAfford) {
            buttonHtml = `
              <button class="px-4 py-2 text-xs font-pixel rounded bg-yellow-950/40 text-yellow-400 border border-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-200" onclick="window.GameStore.purchase('${theme.id}', ${theme.price})">
                購買
              </button>
            `;
          } else {
            buttonHtml = `
              <button class="px-4 py-2 text-xs font-pixel rounded bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50" disabled>
                餘額不足
              </button>
            `;
          }
        }

        const card = document.createElement('div');
        // 扁平水平條狀卡片，減少垂直佔用，方便手機滑動與未來擴充
        card.className = `hud-panel px-4 py-3 bg-slate-900/90 border border-slate-800 rounded flex items-center gap-3 relative overflow-hidden transition-all duration-300 hover:border-[var(--neon-pink)]`;
        card.style.boxShadow = isEquipped ? '0 0 8px var(--neon-pink)' : 'none';

        card.innerHTML = `
          <div class="flex -space-x-1.5 shrink-0">
            <div class="w-5 h-5 rounded-full border-2 border-slate-950" style="background-color: ${theme.preview[0]}; z-index: 3;"></div>
            <div class="w-5 h-5 rounded-full border-2 border-slate-950" style="background-color: ${theme.preview[1]}; z-index: 2;"></div>
            <div class="w-5 h-5 rounded-full border-2 border-slate-950" style="background-color: ${theme.preview[2]}; z-index: 1;"></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-pixel text-white truncate">${theme.name}</span>
              ${isEquipped ? '<span class="text-[7px] font-pixel text-pink-400 border border-pink-500/50 px-1 py-0.5 rounded animate-pulse shrink-0">ACTIVE</span>' : ''}
            </div>
            <span class="text-[10px] text-slate-500 font-pixel">
              ${theme.price > 0 ? `💰 ${theme.price.toLocaleString()}` : '🎁 解鎖贈送'}
            </span>
          </div>
          <div class="shrink-0">
            ${buttonHtml}
          </div>
        `;

        storeList.appendChild(card);
      });
    },

    // 裝備主題
    equip(themeId) {
      const profile = window.MathSprintStorage.getProfile();
      if (!profile.purchased_themes.includes(themeId)) return;

      profile.equipped_theme = themeId;
      window.MathSprintStorage.saveProfile(profile);

      // 即時更換樣式與動畫
      window.ThemeManager.applyTheme(themeId);
      
      // 重新渲染商店清單以更新裝備狀態
      this.renderStore();
    },

    // 購買主題
    purchase(themeId, price) {
      const themeName = window.ThemeManager.THEMES[themeId]?.name || '新主題';
      if (!confirm(`確定要花費 💰${price.toLocaleString()} 金幣解鎖主題「${themeName}」嗎？`)) {
        return;
      }

      const profile = window.MathSprintStorage.getProfile();
      const currentCoins = profile.total_stars || 0;

      if (currentCoins < price) {
        alert('特工，您的金幣餘額不足！');
        return;
      }

      if (profile.purchased_themes.includes(themeId)) return;

      // 扣除金幣並新增至已擁有清單
      profile.total_stars -= price;
      profile.purchased_themes.push(themeId);
      
      // 自動裝備新購買的主題
      profile.equipped_theme = themeId;
      
      window.MathSprintStorage.saveProfile(profile);

      // 即時更換樣式與動畫
      window.ThemeManager.applyTheme(themeId);

      // 重新渲染
      this.renderStore();
      
      // 觸發音效 (若有載入音效模組)
      if (window.MathSprintAudio && window.MathSprintAudio.play) {
        window.MathSprintAudio.play('success');
      }

    },
    
    // 兌換代碼功能
    redeemCode(code) {
      const normalized = code.trim().toUpperCase();
      const msgEl = document.getElementById('redeem-msg');
      if (!msgEl) return;
      
      msgEl.classList.remove('hidden', 'text-green-400', 'text-red-400');
      msgEl.classList.add('text-slate-400');
      
      if (!normalized) {
        msgEl.textContent = '❌ 請輸入代碼！';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }

      const profile = window.MathSprintStorage.getProfile();
      let success = false;
      let alertMsg = '';

      // 檢查兌換代碼
      if (normalized === 'UNLOCK7') {
        // 作弊測試碼：解鎖全關卡 + 200萬金幣
        profile.total_stars = (profile.total_stars || 0) + 2000000;
        profile.today_earnings = (profile.today_earnings || 0) + 2000000;
        profile.max_unlocked_phase = 5; // 五個階段全解鎖
        profile.placement_status = 'ELITE'; // 段位直接成菁英
        
        // 將 M1-M50 所有關卡標記為已通過 (100% 正確率 3星)
        const MISSION_CONFIGS = window.MathSprintConfigs.MISSION_CONFIGS;
        Object.keys(MISSION_CONFIGS).forEach(mId => {
          for (let lId = 1; lId <= 20; lId++) {
            const key = `mission-${mId}-level-${lId}`;
            if (!profile.level_records[key]) {
              profile.level_records[key] = {
                stars: 200 * lId, // 賦予基礎星等分數
                best_avg_time: 1.5,
                max_combo: 20,
                min_time: 1.0,
                accuracy: 1.0,
                is_passed: true
              };
            } else {
              profile.level_records[key].is_passed = true;
              profile.level_records[key].accuracy = Math.max(profile.level_records[key].accuracy || 0, 1.0);
            }
          }
        });
        
        window.MathSprintStorage.saveProfile(profile);
        success = true;
        alertMsg = '🔓 測試代碼生效：已解鎖全關卡與 Mission！並獲得 2,000,000 💰 金幣！';
      } else if (normalized === 'COINS88') {
        // 一般獎勵碼 1：+88,000 金幣
        profile.total_stars = (profile.total_stars || 0) + 88000;
        profile.today_earnings = (profile.today_earnings || 0) + 88000;
        window.MathSprintStorage.saveProfile(profile);
        success = true;
        alertMsg = '🎁 兌換成功：獲得 88,000 💰 金幣！';
      } else if (normalized === 'SECRET7') {
        // 一般獎勵碼 2：+150,000 金幣
        profile.total_stars = (profile.total_stars || 0) + 150000;
        profile.today_earnings = (profile.today_earnings || 0) + 150000;
        window.MathSprintStorage.saveProfile(profile);
        success = true;
        alertMsg = '🎁 兌換成功：獲得 150,000 💰 金幣！';
      } else {
        msgEl.textContent = '❌ 無效的兌換代碼！';
        msgEl.className = 'text-[9px] text-red-400 font-tech';
        msgEl.classList.remove('hidden');
        return;
      }

      if (success) {
        msgEl.textContent = '✓ 兌換成功！';
        msgEl.className = 'text-[9px] text-green-400 font-tech';
        msgEl.classList.remove('hidden');
        
        // 重新渲染商店餘額與首頁
        this.renderStore();
        if (window.MathSprintGame && window.MathSprintGame.renderHome) {
          window.MathSprintGame.renderHome();
        }
        
        // 撥放音效
        if (window.MathSprintAudio && window.MathSprintAudio.play) {
          window.MathSprintAudio.play('success');
        }
        
        alert(alertMsg);
        document.getElementById('redeem-code-input').value = '';
      }
    }
  };

  window.GameStore = Store;

  // 監聽元件載入，綁定兌換事件
  window.addEventListener('limit180ComponentsLoaded', () => {
    // 綁定商店按鈕
    const submitBtn = document.getElementById('redeem-submit-btn');
    const inputEl = document.getElementById('redeem-code-input');
    
    if (submitBtn && inputEl) {
      submitBtn.addEventListener('click', () => {
        Store.redeemCode(inputEl.value);
      });
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          Store.redeemCode(inputEl.value);
        }
      });
    }
  });

  // 監聽存檔變更以自動重新渲染（例如玩家在大廳賺取金幣回到商店時）
  window.addEventListener('mathSprintProfileUpdated', () => {
    if (window.currentView === 'view-store') {
      Store.renderStore();
    }
  });
})();
