// Limit 180 — 特工個人外觀客製化邏輯模組
(function() {
  
  // ============================================================
  // 1. 特工個人外觀定義 (直接讀取全域定義，防止加載順序 Bug)
  // ============================================================
  function getAvatars() {
    return window.MATH_SPRINT_AVATARS || {};
  }
  function getBorders() {
    return window.MATH_SPRINT_BORDERS || {};
  }
  function getBadges() {
    return window.MATH_SPRINT_BADGES || {};
  }
  function normalizeOwnedAssets(profile) {
    const unlocked = Array.isArray(profile.unlocked_assets) ? profile.unlocked_assets : [];
    const purchased = Array.isArray(profile.purchased_items) ? profile.purchased_items : [];
    return Array.from(new Set(['avatar-default', 'border-none', ...unlocked, ...purchased]));
  }
  function isOwnedAsset(profile, assetId) {
    return normalizeOwnedAssets(profile).includes(assetId);
  }
  const BORDER_EFFECT_CLASSES = [
    'border-effect-pulse-rose',
    'border-effect-pulse-ice',
    'border-effect-pulse-lime',
    'border-effect-pulse-violet',
    'border-effect-pulse-amber',
    'border-effect-pulse-mint',
    'border-effect-pulse-coral',
    'border-effect-pulse-silver',
    'border-effect-neon-cyan',
    'border-effect-neon-magenta',
    'border-effect-neon-lime',
    'border-effect-neon-violet',
    'border-effect-neon-gold'
  ];

  function applyAvatarBorderVisual(targetEl, borderDef) {
    if (!targetEl || !borderDef) return;
    BORDER_EFFECT_CLASSES.forEach((cls) => targetEl.classList.remove(cls));
    targetEl.style.borderColor = borderDef.color || 'transparent';
    targetEl.style.boxShadow = borderDef.id !== 'border-none' ? `0 0 10px ${borderDef.color || '#ffffff'}` : 'none';
    if (borderDef.effectClass) {
      targetEl.classList.add(borderDef.effectClass);
    }
  }

  window.AgentCustomizationHelpers = {
    getAvatars,
    getBorders,
    getBadges,
    applyAvatarBorderVisual
  };

  const Customization = {
    currentTab: 'theme', // theme, avatar, border, badge
    tempProfile: {},      // 用於暫存選擇但尚未儲存的外觀

    openModal() {
      const modal = document.getElementById('customization-modal');
      if (!modal) return;

      const profile = window.MathSprintStorage.getProfile();
      this.tempProfile = {
        equipped_theme: profile.equipped_theme || 'akaimon',
        purchased_themes: [...(profile.purchased_themes || ['akaimon'])],
        equipped_avatar: profile.equipped_avatar || 'avatar-default',
        equipped_border: profile.equipped_border || 'border-none',
        equipped_badges: [...(profile.equipped_badges || [])],
        unlocked_assets: [...(profile.unlocked_assets || ['avatar-default', 'border-none'])]
      };

      this.updatePreview();
      this.switchTab('theme');
      modal.classList.remove('hidden');
    },

    updatePreview() {
      const avImg = document.getElementById('preview-avatar-img');
      const avBorder = document.getElementById('preview-avatar-border');
      const avName = document.getElementById('preview-agent-name');
      const avBadges = document.getElementById('preview-agent-badges');

      const AVATARS = getAvatars();
      const BORDERS = getBorders();
      const avObj = AVATARS[this.tempProfile.equipped_avatar] || AVATARS['avatar-default'];
      if (avImg) avImg.textContent = avObj ? avObj.icon : '🛡️';

      const borObj = BORDERS[this.tempProfile.equipped_border] || BORDERS['border-none'];
      if (avBorder && borObj) applyAvatarBorderVisual(avBorder, borObj);

      // 更新暱稱
      const uProfile = JSON.parse(localStorage.getItem('limit180_user_profile') || '{}');
      if (avName) avName.textContent = uProfile.nickname || '訪客特工';

      // 更新配戴徽章
      if (avBadges) {
        avBadges.innerHTML = '';
        const badges = this.tempProfile.equipped_badges || [];
        if (badges.length === 0) {
          avBadges.innerHTML = `<span class="text-[9px] text-slate-600">// 未配戴徽章 //</span>`;
        } else {
          badges.forEach(bId => {
            const b = getBadges()[bId];
            if (b) {
              const span = document.createElement('span');
              span.className = 'text-base';
              span.textContent = b.icon;
              avBadges.appendChild(span);
            }
          });
        }
      }
    },

    switchTab(tabType) {
      this.currentTab = tabType;
      const tabs = ['theme', 'avatar', 'border', 'badge'];
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-custom-${t}`);
        if (btn) {
          if (t === tabType) {
            btn.className = "flex-1 text-center py-2 text-cyan-400 border-b-2 border-cyan-500 font-bold focus:outline-none cursor-pointer";
          } else {
            btn.className = "flex-1 text-center py-2 text-slate-400 hover:text-white border-b border-slate-800 focus:outline-none cursor-pointer";
          }
        }
      });
      this.renderList();
    },

    renderList() {
      const container = document.getElementById('customization-content-area');
      if (!container) return;
      container.innerHTML = '';

      const profile = window.MathSprintStorage.getProfile();

      if (this.currentTab === 'theme') {
        const themes = window.ThemeManager.THEMES;
        const ownedThemes = this.tempProfile.purchased_themes || ['akaimon'];

        Object.keys(themes).forEach(key => {
          const theme = themes[key];
          const isOwned = ownedThemes.includes(theme.id);
          if (!isOwned) return;

          const isSelected = this.tempProfile.equipped_theme === theme.id;
          const row = document.createElement('div');
          row.className = `p-3 bg-slate-900 border flex justify-between items-center rounded-xl font-pixel text-xs ${isSelected ? 'border-cyan-500' : 'border-slate-800'}`;

          let btnHtml = isSelected 
             ? `<span class="text-cyan-400">已選定</span>`
             : `<button class="cyber-btn px-4 py-1.5 text-[10px] text-cyan-400 rounded" onclick="window.AgentCustomization.selectTheme('${theme.id}')">裝備</button>`;

          row.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="flex -space-x-1.5 shrink-0">
                <div class="w-4 h-4 rounded-full border border-slate-950" style="background-color: ${theme.preview[0]};"></div>
                <div class="w-4 h-4 rounded-full border border-slate-950" style="background-color: ${theme.preview[1]};"></div>
                <div class="w-4 h-4 rounded-full border border-slate-950" style="background-color: ${theme.preview[2]};"></div>
              </div>
              <span class="text-white">${theme.name}</span>
            </div>
            <div>${btnHtml}</div>
          `;
          container.appendChild(row);
        });

      } else if (this.currentTab === 'avatar') {
        const AVATARS = getAvatars();
        Object.keys(AVATARS).forEach(key => {
          const av = AVATARS[key];
          const isUnlocked = isOwnedAsset(this.tempProfile, av.id);
          if (!isUnlocked) return;

          const isSelected = this.tempProfile.equipped_avatar === av.id;
          const row = document.createElement('div');
          row.className = `p-3 bg-slate-900 border flex justify-between items-center rounded-xl font-pixel text-xs ${isSelected ? 'border-cyan-500' : 'border-slate-800'}`;
          
          let btnHtml = isSelected 
            ? `<span class="text-cyan-400">已選定</span>`
            : `<button class="cyber-btn px-4 py-1.5 text-[10px] text-cyan-400 rounded" onclick="window.AgentCustomization.selectAvatar('${av.id}')">裝備</button>`;

          row.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="text-2xl">${av.icon}</span>
              <span class="text-white">${av.name}</span>
            </div>
            <div>${btnHtml}</div>
          `;
          container.appendChild(row);
        });

      } else if (this.currentTab === 'border') {
        const BORDERS = getBorders();
        Object.keys(BORDERS).forEach(key => {
          const bor = BORDERS[key];
          const isUnlocked = isOwnedAsset(this.tempProfile, bor.id);
          if (!isUnlocked) return;

          const isSelected = this.tempProfile.equipped_border === bor.id;
          const row = document.createElement('div');
          row.className = `p-3 bg-slate-900 border flex justify-between items-center rounded-xl font-pixel text-xs ${isSelected ? 'border-cyan-500' : 'border-slate-800'}`;

          let btnHtml = isSelected 
            ? `<span class="text-cyan-400">已選定</span>`
            : `<button class="cyber-btn px-4 py-1.5 text-[10px] text-cyan-400 rounded" onclick="window.AgentCustomization.selectBorder('${bor.id}')">裝備</button>`;

          row.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full border-4 flex items-center justify-center bg-slate-950" style="border-color: ${bor.color};">
                <span class="text-xs">👤</span>
              </div>
              <span class="text-white">${bor.name}</span>
            </div>
            <div>${btnHtml}</div>
          `;
          container.appendChild(row);
        });

      } else if (this.currentTab === 'badge') {
        const unlockedAchievements = profile.unlocked_achievements || [];
        const badgeMeta = getBadges();

        let hasBadges = false;
        Object.keys(badgeMeta).forEach(bId => {
          const isUnlocked = unlockedAchievements.includes(bId) || 
                             unlockedAchievements.some(a => a.endsWith('_' + bId)) ||
                             (bId === 'error_buster' && (profile.total_review_correct_count || 0) >= 20);
          
          if (!isUnlocked) return;
          hasBadges = true;

          const meta = badgeMeta[bId];
          const isEquipped = this.tempProfile.equipped_badges.includes(bId);

          const row = document.createElement('div');
          row.className = `p-3 bg-slate-900 border flex justify-between items-center rounded-xl font-pixel text-xs ${isEquipped ? 'border-cyan-500' : 'border-slate-800'}`;

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="cyber-btn cyber-btn-pink px-4 py-1.5 text-[10px] text-pink-500 rounded" onclick="window.AgentCustomization.unequipBadge('${bId}')">解除</button>`;
          } else {
            const canEquip = this.tempProfile.equipped_badges.length < 2;
            if (canEquip) {
              btnHtml = `<button class="cyber-btn px-4 py-1.5 text-[10px] text-cyan-400 rounded" onclick="window.AgentCustomization.equipBadge('${bId}')">配戴</button>`;
            } else {
              btnHtml = `<span class="text-slate-600 text-[9px]">// 欄位已滿 (上限2) //</span>`;
            }
          }

          row.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="text-2xl">${meta.icon}</span>
              <div>
                <div class="text-white">${meta.name}</div>
                <div class="text-[9px] text-slate-500 font-tech">${meta.desc}</div>
              </div>
            </div>
            <div>${btnHtml}</div>
          `;
          container.appendChild(row);
        });

        if (!hasBadges) {
          container.innerHTML = `
            <div class="text-center py-8 font-pixel text-slate-600 text-xs">
              🔒 尚未獲得任何特工徽章！<br>
              請至關卡挑戰中解鎖，或在商店中購買。
            </div>
          `;
        }
      }
    },

    selectTheme(themeId) {
      this.tempProfile.equipped_theme = themeId;
      this.renderList();
    },

    selectAvatar(avId) {
      this.tempProfile.equipped_avatar = avId;
      this.updatePreview();
      this.renderList();
    },

    selectBorder(borId) {
      this.tempProfile.equipped_border = borId;
      this.updatePreview();
      this.renderList();
    },

    equipBadge(bId) {
      if (this.tempProfile.equipped_badges.length >= 2) return;
      this.tempProfile.equipped_badges.push(bId);
      this.updatePreview();
      this.renderList();
    },

    unequipBadge(bId) {
      this.tempProfile.equipped_badges = this.tempProfile.equipped_badges.filter(id => id !== bId);
      this.updatePreview();
      this.renderList();
    },

    saveAndApply() {
      const profile = window.MathSprintStorage.getProfile();
      const AVATARS = getAvatars();
      const BORDERS = getBorders();
      profile.equipped_theme = this.tempProfile.equipped_theme || profile.equipped_theme || 'akaimon';
      profile.purchased_themes = Array.from(new Set(this.tempProfile.purchased_themes || profile.purchased_themes || ['akaimon']));
      profile.unlocked_assets = normalizeOwnedAssets(this.tempProfile);
      profile.equipped_avatar = AVATARS[this.tempProfile.equipped_avatar] ? this.tempProfile.equipped_avatar : 'avatar-default';
      profile.equipped_border = BORDERS[this.tempProfile.equipped_border] ? this.tempProfile.equipped_border : 'border-none';
      profile.equipped_badges = this.tempProfile.equipped_badges;
      
      window.MathSprintStorage.saveProfile(profile);
      if (window.ThemeManager && typeof window.ThemeManager.applyTheme === 'function') {
        window.ThemeManager.applyTheme(profile.equipped_theme);
      }
      document.getElementById('customization-modal').classList.add('hidden');
      if (window.UIFeedback) {
        window.UIFeedback.toast('特工外觀已套用，資料同步中', 'success');
      } else {
        alert('✓ 特工外觀套用成功，雲端資料同步中！');
      }
    }
  };

  window.AgentCustomization = Customization;

  window.addEventListener('limit180ComponentsLoaded', () => {
    // 綁定客製化視窗按鈕
    const saveBtn = document.getElementById('customization-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => Customization.saveAndApply());
    }

    const closeBtn = document.getElementById('customization-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('customization-modal').classList.add('hidden');
      });
    }

    // 綁定分頁按鈕 (包含背景主題)
    ['theme', 'avatar', 'border', 'badge'].forEach(tab => {
      const tabBtn = document.getElementById(`tab-custom-${tab}`);
      if (tabBtn) {
        tabBtn.addEventListener('click', () => Customization.switchTab(tab));
      }
    });

    window.AgentCustomizationHome?.bind?.(Customization);
  });

})();
