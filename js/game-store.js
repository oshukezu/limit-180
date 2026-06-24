// Limit 180 Game Store Module
// Manages theme preview rendering, coin validation, purchasing, and applying new themes.

(function() {
  const Store = {
    currentTab: 'theme', // theme, avatar, border, badge
    rarityFilter: 'all', // all, common, rare, legendary

    getRarityByPrice(price) {
      const p = Number(price || 0);
      if (p >= 150000) {
        return { key: 'legendary', label: '傳說', className: 'text-yellow-300 border-yellow-500/60 bg-yellow-950/30' };
      }
      if (p >= 50000) {
        return { key: 'rare', label: '稀有', className: 'text-violet-300 border-violet-500/60 bg-violet-950/30' };
      }
      return { key: 'common', label: '一般', className: 'text-cyan-300 border-cyan-500/60 bg-cyan-950/30' };
    },

    shouldShowByRarity(price) {
      if (this.rarityFilter === 'all') return true;
      return this.getRarityByPrice(price).key === this.rarityFilter;
    },

    updateRarityFilterButtons() {
      const defs = [
        { id: 'store-rarity-all', key: 'all' },
        { id: 'store-rarity-common', key: 'common' },
        { id: 'store-rarity-rare', key: 'rare' },
        { id: 'store-rarity-legendary', key: 'legendary' }
      ];
      defs.forEach(({ id, key }) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (this.rarityFilter === key) {
          btn.className = 'px-2 py-1 rounded border border-cyan-500 text-cyan-300 bg-cyan-950/20';
        } else {
          btn.className = 'px-2 py-1 rounded border border-slate-800 text-slate-400 hover:text-white';
        }
      });
    },

    renderStore() {
      const storeList = document.getElementById('theme-store-list');
      const coinsDisplay = document.getElementById('store-coins-balance');
      if (!storeList) return;

      const profile = window.MathSprintStorage.getProfile();
      const currentCoins = profile.total_stars || 0;
      
      profile.unlocked_assets = profile.unlocked_assets || ['avatar-default', 'border-none'];
      profile.unlocked_achievements = profile.unlocked_achievements || [];

      if (coinsDisplay) {
        coinsDisplay.textContent = window.formatCoins(currentCoins);
      }

      storeList.innerHTML = '';
      this.updateTabButtons();
      this.updateRarityFilterButtons();
      const rarityWrap = document.getElementById('store-rarity-filter');
      if (rarityWrap) {
        rarityWrap.classList.toggle('hidden', this.currentTab === 'theme');
      }

      if (this.currentTab === 'theme') {
        // --- 1. 渲染主題配色 ---
        const themes = window.ThemeManager?.THEMES || window.LIMIT180_THEME_DEFS || {};
        if (!Object.keys(themes).length) {
          storeList.innerHTML = `<div class="text-center text-slate-500 text-xs py-6">主題資料尚未載入，請重新整理頁面。</div>`;
          return;
        }
        const equippedTheme = profile.equipped_theme || 'akaimon';
        const purchasedThemes = Array.from(new Set([...(profile.purchased_themes || []), 'akaimon']));
        profile.purchased_themes = purchasedThemes;

        Object.keys(themes).forEach(key => {
          const theme = themes[key];
          const isPurchased = purchasedThemes.includes(theme.id);
          const isEquipped = equippedTheme === theme.id;

          let buttonHtml = this.generateButtonHtml(theme.id, theme.price, isPurchased, isEquipped, currentCoins, 'theme');

          const card = document.createElement('div');
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

      } else if (this.currentTab === 'avatar') {
        // --- 2. 渲染特工頭像 ---
        const avatars = window.MATH_SPRINT_AVATARS || {};
        const equippedAvatar = profile.equipped_avatar || 'avatar-default';
        const unlockedAvatars = profile.unlocked_assets;

        Object.keys(avatars).forEach(key => {
          const av = avatars[key];
          if (!this.shouldShowByRarity(av.price)) return;
          const isPurchased = unlockedAvatars.includes(av.id);
          const isEquipped = equippedAvatar === av.id;
          const rarity = this.getRarityByPrice(av.price);

          let buttonHtml = this.generateButtonHtml(av.id, av.price, isPurchased, isEquipped, currentCoins, 'avatar');

          const card = document.createElement('div');
          card.className = `hud-panel px-4 py-3 bg-slate-900/90 border border-slate-800 rounded flex items-center gap-3 relative overflow-hidden transition-all duration-300 hover:border-[var(--neon-pink)]`;
          card.style.boxShadow = isEquipped ? '0 0 8px var(--neon-pink)' : 'none';

          card.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-2xl shrink-0 select-none border border-slate-800">
              ${av.icon}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-pixel text-white truncate">${av.name}</span>
                <span class="text-[7px] font-pixel border px-1 py-0.5 rounded shrink-0 ${rarity.className}">${rarity.label}</span>
                ${isEquipped ? '<span class="text-[7px] font-pixel text-pink-400 border border-pink-500/50 px-1 py-0.5 rounded animate-pulse shrink-0">EQUIPPED</span>' : ''}
              </div>
              <span class="text-[10px] text-slate-500 font-pixel">
                ${av.price > 0 ? `💰 ${av.price.toLocaleString()}` : '🎁 初始贈送'}
              </span>
            </div>
            <div class="shrink-0">
              ${buttonHtml}
            </div>
          `;
          storeList.appendChild(card);
        });

      } else if (this.currentTab === 'border') {
        // --- 3. 渲染頭貼外框 ---
        const borders = window.MATH_SPRINT_BORDERS || {};
        const equippedBorder = profile.equipped_border || 'border-none';
        const unlockedBorders = profile.unlocked_assets;

        Object.keys(borders).forEach(key => {
          const bor = borders[key];
          if (!this.shouldShowByRarity(bor.price)) return;
          const isPurchased = unlockedBorders.includes(bor.id);
          const isEquipped = equippedBorder === bor.id;
          const rarity = this.getRarityByPrice(bor.price);

          let buttonHtml = this.generateButtonHtml(bor.id, bor.price, isPurchased, isEquipped, currentCoins, 'border');

          const card = document.createElement('div');
          card.className = `hud-panel px-4 py-3 bg-slate-900/90 border border-slate-800 rounded flex items-center gap-3 relative overflow-hidden transition-all duration-300 hover:border-[var(--neon-pink)]`;
          card.style.boxShadow = isEquipped ? '0 0 8px var(--neon-pink)' : 'none';

          // 預覽邊框樣式
          let borderStyle = `border: 3px solid ${bor.color};`;
          if (bor.id !== 'border-none') {
            borderStyle += `box-shadow: 0 0 5px ${bor.color};`;
          }

          card.innerHTML = `
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-800" style="${borderStyle}">
              <span class="text-slate-500 text-xs">👤</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-pixel text-white truncate">${bor.name}</span>
                <span class="text-[7px] font-pixel border px-1 py-0.5 rounded shrink-0 ${rarity.className}">${rarity.label}</span>
                ${isEquipped ? '<span class="text-[7px] font-pixel text-pink-400 border border-pink-500/50 px-1 py-0.5 rounded animate-pulse shrink-0">EQUIPPED</span>' : ''}
              </div>
              <span class="text-[10px] text-slate-500 font-pixel">
                ${bor.price > 0 ? `💰 ${bor.price.toLocaleString()}` : '🎁 初始贈送'}
              </span>
            </div>
            <div class="shrink-0">
              ${buttonHtml}
            </div>
          `;
          storeList.appendChild(card);
        });

      } else if (this.currentTab === 'badge') {
        // --- 4. 渲染成就徽章 ---
        const badges = window.MATH_SPRINT_BADGES || {};
        const equippedBadges = profile.equipped_badges || [];
        const unlockedAchievements = profile.unlocked_achievements || [];

        Object.keys(badges).forEach(key => {
          const bd = badges[key];
          if (!this.shouldShowByRarity(bd.price)) return;
          const rarity = this.getRarityByPrice(bd.price);
          
          // 徽章是否已解鎖 (已購買，或是原本的成就解鎖)
          const isPurchased = unlockedAchievements.includes(bd.id);
          const isEquipped = equippedBadges.includes(bd.id);

          let buttonHtml = this.generateButtonHtml(bd.id, bd.price, isPurchased, isEquipped, currentCoins, 'badge');

          const card = document.createElement('div');
          card.className = `hud-panel px-4 py-3 bg-slate-900/90 border border-slate-800 rounded flex items-center gap-3 relative overflow-hidden transition-all duration-300 hover:border-[var(--neon-pink)]`;
          card.style.boxShadow = isEquipped ? '0 0 8px var(--neon-pink)' : 'none';

          card.innerHTML = `
            <div class="w-10 h-10 rounded bg-slate-950 flex items-center justify-center text-2xl shrink-0 select-none border border-slate-800">
              ${bd.icon}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1">
                <span class="text-xs font-pixel text-white truncate">${bd.name}</span>
                <span class="text-[7px] font-pixel border px-1 py-0.5 rounded shrink-0 ${rarity.className}">${rarity.label}</span>
                ${isEquipped ? '<span class="text-[7px] font-pixel text-pink-400 border border-pink-500/50 px-1 py-0.5 rounded animate-pulse shrink-0">EQUIPPED</span>' : ''}
              </div>
              <div class="text-[8px] text-slate-500 font-tech truncate">${bd.desc}</div>
              <span class="text-[9px] text-slate-500 font-pixel">
                ${bd.price > 0 ? `💰 ${bd.price.toLocaleString()}` : '🏆 成就解鎖'}
              </span>
            </div>
            <div class="shrink-0">
              ${buttonHtml}
            </div>
          `;
          storeList.appendChild(card);
        });
      }
    },

    // 產生按鈕的 HTML (商店只負責購買)
    generateButtonHtml(itemId, price, isPurchased, isEquipped, currentCoins, type) {
      if (isPurchased || isEquipped) {
        // 已擁有商品：顯示狀態 + 賣出（免費商品不可賣）
        if (price > 0) {
          const sellPrice = Math.floor(Number(price || 0) / 2);
          return `
            <div class="flex flex-col items-end gap-1">
              <span class="text-slate-500 text-[10px] font-pixel">已解鎖</span>
              <button class="px-3 py-1 text-[10px] font-pixel rounded bg-red-950/40 text-red-300 border border-red-500/60 hover:bg-red-500 hover:text-black transition-all duration-200" onclick="window.GameStore.sell('${itemId}', ${price}, '${type}')">
                賣出 +${sellPrice.toLocaleString('zh-TW')}
              </button>
            </div>
          `;
        }
        return `
          <span class="text-slate-500 text-xs font-pixel">已解鎖</span>
        `;
      }

      const canAfford = currentCoins >= price;
      if (price === 0 && type === 'badge') {
        // 免費且未解鎖的徽章 (代表需通過成就解鎖)
        return `
          <button class="px-4 py-2 text-xs font-pixel rounded bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50" disabled>
            需解鎖成就
          </button>
        `;
      }
      if (canAfford) {
        return `
          <button class="px-4 py-2 text-xs font-pixel rounded bg-yellow-950/40 text-yellow-400 border border-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-200" onclick="window.GameStore.purchase('${itemId}', ${price}, '${type}')">
            購買
          </button>
        `;
      }
      return `
        <button class="px-4 py-2 text-xs font-pixel rounded bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50" disabled>
          餘額不足
        </button>
      `;
    },

    // 購買商品
    async purchase(itemId, price, type) {
      return window.GameStoreOps?.purchase?.call(this, itemId, price, type);
    },

    // 賣出商品（回收價 = 原價 1/2）
    async sell(itemId, price, type) {
      return window.GameStoreOps?.sell?.call(this, itemId, price, type);
    },

    // 更新 Tab 按鈕的 CSS 狀態
    updateTabButtons() {
      const tabs = ['theme', 'avatar', 'border', 'badge'];
      tabs.forEach(t => {
        const btn = document.getElementById(`store-tab-${t}`);
        if (btn) {
          if (t === this.currentTab) {
            btn.className = "flex-1 text-center py-3 text-cyan-400 border-b-2 border-cyan-500 font-bold focus:outline-none cursor-pointer";
          } else {
            btn.className = "flex-1 text-center py-3 text-slate-400 hover:text-white border-b border-slate-800 focus:outline-none cursor-pointer";
          }
        }
      });
    },

    // 切換分頁
    switchTab(tabType) {
      this.currentTab = tabType;
      this.renderStore();
    },

    switchRarityFilter(filterKey) {
      this.rarityFilter = filterKey;
      this.renderStore();
    }
  };

  // Export or Merge Store
  window.GameStore = window.GameStore || {};
  Object.assign(window.GameStore, Store);

  // 綁定商店 Tab 分頁按鈕
  window.addEventListener('limit180ComponentsLoaded', () => {
    ['theme', 'avatar', 'border', 'badge'].forEach(tab => {
      const tabBtn = document.getElementById(`store-tab-${tab}`);
      if (tabBtn) {
        tabBtn.addEventListener('click', () => {
          window.GameStore.switchTab(tab);
        });
      }
    });

    const filterMap = {
      'store-rarity-all': 'all',
      'store-rarity-common': 'common',
      'store-rarity-rare': 'rare',
      'store-rarity-legendary': 'legendary'
    };
    Object.keys(filterMap).forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        window.GameStore.switchRarityFilter(filterMap[id]);
      });
    });
  });

  // 監聽存檔變更以自動重新渲染（例如玩家在大廳賺取金幣回到商店時）
  window.addEventListener('mathSprintProfileUpdated', () => {
    if (window.currentView === 'view-store' || window.currentView === 'view-home') {
      window.GameStore.renderStore();
    }
  });
})();
