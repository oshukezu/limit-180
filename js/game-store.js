// Limit 180 Game Store Module
// Manages theme preview rendering, coin validation, purchasing, and applying new themes.

(function() {
  const AVATARS = {
    'avatar-default': { id: 'avatar-default', name: '🛡️ 實習特工', icon: '🛡️', price: 0 },
    'avatar-cat': { id: 'avatar-cat', name: '🐱 靈貓算力', icon: '🐱', price: 0 },
    'avatar-cypher': { id: 'avatar-cypher', name: '🕶️ 駭客專家', icon: '🕶️', price: 20000 },
    'avatar-overlord': { id: 'avatar-overlord', name: '👑 心算霸主', icon: '👑', price: 100000 },
    'avatar-ninja': { id: 'avatar-ninja', name: '🥷 隱形忍者', icon: '🥷', price: 150000 },
    'avatar-star': { id: 'avatar-star', name: '✨ 璀璨超頻', icon: '✨', price: 250000 },
    'avatar-fox': { id: 'avatar-fox', name: '🦊 算力赤狐', icon: '🦊', price: 15000 },
    'avatar-dragon': { id: 'avatar-dragon', name: '🐉 核心神龍', icon: '🐉', price: 300000 },
    'avatar-tiger': { id: 'avatar-tiger', name: '🐯 狂暴算虎', icon: '🐯', price: 50000 },
    'avatar-rabbit': { id: 'avatar-rabbit', name: '🐰 矩陣玉兔', icon: '🐰', price: 18000 },
    'avatar-koala': { id: 'avatar-koala', name: '🐨 沉穩無尾', icon: '🐨', price: 12000 },
    'avatar-panda': { id: 'avatar-panda', name: '🐼 太極熊貓', icon: '🐼', price: 40000 },
    'avatar-lion': { id: 'avatar-lion', name: '🦁 雄獅盟主', icon: '🦁', price: 80000 },
    'avatar-unicorn': { id: 'avatar-unicorn', name: '🦄 獨角幻獸', icon: '🦄', price: 180000 },
    'avatar-alien': { id: 'avatar-alien', name: '👽 矩陣星人', icon: '👽', price: 90000 },
    'avatar-robot': { id: 'avatar-robot', name: '🤖 算力智械', icon: '🤖', price: 60000 },
    'avatar-ghost': { id: 'avatar-ghost', name: '👻 幽靈代碼', icon: '👻', price: 35000 },
    'avatar-fire': { id: 'avatar-fire', name: '🔥 烈焰特工', icon: '🔥', price: 75000 },
    'avatar-water': { id: 'avatar-water', name: '💧 脈衝流水', icon: '💧', price: 28000 },
    'avatar-earth': { id: 'avatar-earth', name: '🌱 蓋亞心靈', icon: '🌱', price: 22000 }
  };

  const BORDERS = {
    'border-none': { id: 'border-none', name: '無外框', color: 'transparent', price: 0 },
    'border-cyan': { id: 'border-cyan', name: '⚡ 脈衝電青', color: '#00f0ff', price: 30000 },
    'border-pink': { id: 'border-pink', name: '🌸 櫻花落瓣', color: '#F1C4CD', price: 50000 },
    'border-gold': { id: 'border-gold', name: '👑 帝國黃金', color: '#ffd700', price: 200000 },
    'border-red': { id: 'border-red', name: '🔥 烈火紅印', color: '#ff3b30', price: 45000 },
    'border-purple': { id: 'border-purple', name: '🔮 霓虹幽紫', color: '#af52de', price: 60000 },
    'border-green': { id: 'border-green', name: '🔋 矩陣毒綠', color: '#34c759', price: 25000 },
    'border-orange': { id: 'border-orange', name: '☄️ 火山熔岩', color: '#ff9500', price: 80000 },
    'border-blue': { id: 'border-blue', name: '💧 深海冰藍', color: '#007aff', price: 35000 },
    'border-white': { id: 'border-white', name: '◽ 純潔矩陣', color: '#ffffff', price: 10000 },
    'border-dark': { id: 'border-dark', name: '🖤 暗夜幽影', color: '#1c1c1e', price: 55000 },
    'border-rainbow': { id: 'border-rainbow', name: '🌈 彩虹光柵', color: 'linear-gradient(to right, red, orange, yellow, green, blue, purple)', price: 500000 },
    'border-platinum': { id: 'border-platinum', name: '💎 璀璨鉑金', color: '#e5e5ea', price: 400000 },
    'border-neon-pink': { id: 'border-neon-pink', name: '👙 賽博霓粉', color: '#ff007f', price: 95000 },
    'border-acid': { id: 'border-acid', name: '🥑 酸性熒光', color: '#ccff00', price: 70000 },
    'border-shadow': { id: 'border-shadow', name: '🌫️ 虛空迷霧', color: '#8e8e93', price: 48000 },
    'border-laser': { id: 'border-laser', name: '📡 激光鐳射', color: '#5856d6', price: 120000 },
    'border-sand': { id: 'border-sand', name: '🏜️ 狂沙風暴', color: '#c5a059', price: 32000 },
    'border-matrix': { id: 'border-matrix', name: '📟 虛擬矩陣', color: '#39ff14', price: 160000 }
  };

  const BADGES = {
    'first_step': { id: 'first_step', name: '初試身手', icon: '🐣', desc: '通過 Stage 01', price: 0 },
    'error_buster': { id: 'error_buster', name: '錯題終結者', icon: '🧹', desc: '消除 20 題錯題', price: 0 },
    'mission_clear': { id: 'mission_clear', name: '達成任務', icon: '👑', desc: 'Stage 20 達 S 級', price: 0 },
    'stars_50': { id: 'stars_50', name: '獎金達標', icon: '💰', desc: '累積高額金幣獎勵', price: 0 },
    'mission_perfect': { id: 'mission_perfect', name: '完美達標', icon: '💎', desc: '單關所有題 100% 正確', price: 0 },
    'badge-speedster': { id: 'badge-speedster', name: '超頻閃電', icon: '⚡', desc: '平均答題時間 < 1 秒', price: 20000 },
    'badge-persistent': { id: 'badge-persistent', name: '毅力特工', icon: '🧗', desc: '完成 100 局遊戲', price: 30000 },
    'badge-millionaire': { id: 'badge-millionaire', name: '百萬富翁', icon: '🏦', desc: '擁有 100 萬金幣', price: 50000 },
    'badge-gambler': { id: 'badge-gambler', name: '極限狂熱', icon: '🎰', desc: '挑戰 Mission 50 通關', price: 80000 },
    'badge-heart': { id: 'badge-heart', name: '心算之心', icon: '❤️', desc: '愛與計算的化身', price: 10000 },
    'badge-brain': { id: 'badge-brain', name: '超腦覺醒', icon: '🧠', desc: '算力突破天際', price: 120000 },
    'badge-comet': { id: 'badge-comet', name: '流星暴擊', icon: '☄️', desc: '連擊數突破 50 combo', price: 40000 },
    'badge-rocket': { id: 'badge-rocket', name: '火箭升空', icon: '🚀', desc: '升級速度飛快', price: 15000 },
    'badge-shield': { id: 'badge-shield', name: '護盾守護', icon: '🛡️', desc: '答對率 100% 且無失誤', price: 25000 },
    'badge-ghost': { id: 'badge-ghost', name: '幻影代碼', icon: '👻', desc: '極速通關無蹤影', price: 65000 },
    'badge-clover': { id: 'badge-clover', name: '幸運草', icon: '🍀', desc: '運氣也是實力的一部分', price: 12000 },
    'badge-cup': { id: 'badge-cup', name: '冠軍金盃', icon: '🏆', desc: '全台排行榜第一名', price: 150000 },
    'badge-music': { id: 'badge-music', name: '算術音符', icon: '🎵', desc: '計算如音樂般流暢', price: 8000 },
    'badge-skull': { id: 'badge-skull', name: '深淵霸王', icon: '💀', desc: '挑戰地獄難度 Mission', price: 100000 },
    'badge-star': { id: 'badge-star', name: '璀璨特工', icon: '⭐', desc: '獲得所有 S 級通關', price: 180000 }
  };

  window.MATH_SPRINT_AVATARS = AVATARS;
  window.MATH_SPRINT_BORDERS = BORDERS;
  window.MATH_SPRINT_BADGES = BADGES;

  const Store = {
    currentTab: 'theme', // theme, avatar, border, badge

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

      if (this.currentTab === 'theme') {
        // --- 1. 渲染主題配色 ---
        const themes = window.ThemeManager.THEMES;
        const equippedTheme = profile.equipped_theme || 'akaimon';
        const purchasedThemes = profile.purchased_themes || ['akaimon'];

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
          const isPurchased = unlockedAvatars.includes(av.id);
          const isEquipped = equippedAvatar === av.id;

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
          const isPurchased = unlockedBorders.includes(bor.id);
          const isEquipped = equippedBorder === bor.id;

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

    // 產生按鈕的 HTML
    generateButtonHtml(itemId, price, isPurchased, isEquipped, currentCoins, type) {
      if (isEquipped) {
        return `
          <button class="px-4 py-2 text-xs font-pixel rounded bg-slate-800 text-slate-500 border border-slate-700 cursor-default" disabled>
            裝備中
          </button>
        `;
      } else if (isPurchased) {
        return `
          <button class="px-4 py-2 text-xs font-pixel rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-200" onclick="window.GameStore.equip('${itemId}', '${type}')">
            裝備
          </button>
        `;
      } else {
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
        } else {
          return `
            <button class="px-4 py-2 text-xs font-pixel rounded bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50" disabled>
              餘額不足
            </button>
          `;
        }
      }
    },

    // 裝備商品
    equip(itemId, type) {
      const profile = window.MathSprintStorage.getProfile();

      if (type === 'theme') {
        if (!profile.purchased_themes.includes(itemId)) return;
        profile.equipped_theme = itemId;
        window.MathSprintStorage.saveProfile(profile);
        window.ThemeManager.applyTheme(itemId);
      } else if (type === 'avatar') {
        if (!profile.unlocked_assets.includes(itemId)) return;
        profile.equipped_avatar = itemId;
        window.MathSprintStorage.saveProfile(profile);
      } else if (type === 'border') {
        if (!profile.unlocked_assets.includes(itemId)) return;
        profile.equipped_border = itemId;
        window.MathSprintStorage.saveProfile(profile);
      } else if (type === 'badge') {
        profile.unlocked_achievements = profile.unlocked_achievements || [];
        if (!profile.unlocked_achievements.includes(itemId)) return;
        
        profile.equipped_badges = profile.equipped_badges || [];
        // 若已經裝備該徽章，點擊則解除裝備
        if (profile.equipped_badges.includes(itemId)) {
          profile.equipped_badges = profile.equipped_badges.filter(id => id !== itemId);
        } else {
          // 上限 2 個
          if (profile.equipped_badges.length >= 2) {
            alert('最多只能配戴 2 個徽章！請先點擊已配戴的徽章解除。');
            return;
          }
          profile.equipped_badges.push(itemId);
        }
        window.MathSprintStorage.saveProfile(profile);
      }

      this.renderStore();
    },

    // 購買商品
    purchase(itemId, price, type) {
      let name = '新商品';
      if (type === 'theme') {
        name = window.ThemeManager.THEMES[itemId]?.name || '新主題';
      } else if (type === 'avatar') {
        name = window.MATH_SPRINT_AVATARS[itemId]?.name || '新頭像';
      } else if (type === 'border') {
        name = window.MATH_SPRINT_BORDERS[itemId]?.name || '新外框';
      } else if (type === 'badge') {
        name = window.MATH_SPRINT_BADGES[itemId]?.name || '新徽章';
      }

      // 過濾 Icon
      name = name.replace(/[🛡️🐱🕶️👑🥷✨🦊🐉🐯🐰🐨🐼🦁🦄👽🤖👻🔥💧🌱⚡🌸🔮🔋☄️◽🖤🌈💎👙🥑🌫️📡🍡🏜️📟⭐🧗🏦🎰❤️🧠🎖️🎵💀]/g, '').trim();

      if (!confirm(`確定要花費 💰${price.toLocaleString()} 金幣購買「${name}」嗎？`)) {
        return;
      }

      const profile = window.MathSprintStorage.getProfile();
      const currentCoins = profile.total_stars || 0;

      if (currentCoins < price) {
        alert('特工，您的金幣餘額不足！');
        return;
      }

      // 扣除金幣並新增至已擁有清單
      profile.total_stars -= price;

      if (type === 'theme') {
        if (profile.purchased_themes.includes(itemId)) return;
        profile.purchased_themes.push(itemId);
        profile.equipped_theme = itemId;
        window.ThemeManager.applyTheme(itemId);
      } else if (type === 'avatar') {
        profile.unlocked_assets = profile.unlocked_assets || ['avatar-default', 'border-none'];
        if (profile.unlocked_assets.includes(itemId)) return;
        profile.unlocked_assets.push(itemId);
        profile.equipped_avatar = itemId;
      } else if (type === 'border') {
        profile.unlocked_assets = profile.unlocked_assets || ['avatar-default', 'border-none'];
        if (profile.unlocked_assets.includes(itemId)) return;
        profile.unlocked_assets.push(itemId);
        profile.equipped_border = itemId;
      } else if (type === 'badge') {
        profile.unlocked_achievements = profile.unlocked_achievements || [];
        if (profile.unlocked_achievements.includes(itemId)) return;
        profile.unlocked_achievements.push(itemId);
        
        profile.equipped_badges = profile.equipped_badges || [];
        if (profile.equipped_badges.length < 2) {
          profile.equipped_badges.push(itemId);
        }
      }

      window.MathSprintStorage.saveProfile(profile);
      this.renderStore();

      // 撥放音效
      if (window.MathSprintAudio && window.MathSprintAudio.play) {
        window.MathSprintAudio.play('success');
      }

      alert(`🔓 成功解鎖並裝備「${name}」！`);
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

    // 綁定商店 Tab 分頁按鈕
    ['theme', 'avatar', 'border', 'badge'].forEach(tab => {
      const tabBtn = document.getElementById(`store-tab-${tab}`);
      if (tabBtn) {
        tabBtn.addEventListener('click', () => {
          Store.switchTab(tab);
        });
      }
    });

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
