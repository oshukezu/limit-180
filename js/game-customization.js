// Limit 180 — 特工個人外觀客製化邏輯模組
(function() {
  
  // ============================================================
  // 1. 特工個人外觀定義 (直接讀取全域定義，防止加載順序 Bug)
  // ============================================================
  const AVATARS = window.MATH_SPRINT_AVATARS || {};
  const BORDERS = window.MATH_SPRINT_BORDERS || {};
  const BADGES = window.MATH_SPRINT_BADGES || {};

  function renderHomeIdentityCard() {
    const profile = window.MathSprintStorage.getProfile();
    const avImg = document.getElementById('home-avatar-img');
    const avBorder = document.getElementById('home-avatar-border');
    const agentName = document.getElementById('home-agent-nickname');
    const classInfo = document.getElementById('home-agent-class-info');
    const lastSyncEl = document.getElementById('home-last-sync-time');
    const badgesContainer = document.getElementById('home-agent-badges');
    const maxStageBadge = document.getElementById('home-max-stage-badge');

    const avObj = AVATARS[profile.equipped_avatar] || AVATARS['avatar-default'] || { icon: '🛡️' };
    const borObj = BORDERS[profile.equipped_border] || BORDERS['border-none'] || { color: 'transparent', id: 'border-none' };

    if (avImg) avImg.textContent = avObj.icon;
    if (avBorder) {
      avBorder.style.borderColor = borObj.color;
      avBorder.style.boxShadow = borObj.id !== 'border-none' ? `0 0 10px ${borObj.color}` : 'none';
    }

    let identity = null;
    try {
      identity = JSON.parse(localStorage.getItem('limit180_user_profile') || 'null');
    } catch (_) {
      identity = null;
    }
    const nickname = identity?.nickname || '訪客特工';
    if (agentName) agentName.textContent = nickname;

    if (classInfo) {
      if (identity?.grade_class && identity?.seat_number && identity.grade_class !== '訪客') {
        classInfo.textContent = `${identity.grade_class} 班 座號 ${identity.seat_number} 號`;
      } else {
        classInfo.textContent = '訪客狀態・通關後建議綁定身份';
      }
    }

    if (lastSyncEl) {
      const raw = localStorage.getItem('limit180_last_sync_at');
      if (raw) {
        const d = new Date(raw);
        lastSyncEl.textContent = Number.isNaN(d.getTime())
          ? '最後同步：--'
          : `最後同步：${d.toLocaleString('zh-TW')}`;
      } else {
        lastSyncEl.textContent = '最後同步：--';
      }
    }

    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      const equippedBadges = profile.equipped_badges || [];
      if (equippedBadges.length === 0) {
        badgesContainer.innerHTML = `<span class="text-[9px] text-slate-500">// 尚未配戴徽章 //</span>`;
      } else {
        equippedBadges.forEach((bId) => {
          const b = window.MATH_SPRINT_BADGES[bId];
          if (!b) return;
          const span = document.createElement('span');
          span.className = 'text-sm cursor-help';
          span.textContent = b.icon;
          span.title = `${b.name}: ${b.desc}`;
          badgesContainer.appendChild(span);
        });
      }
    }

    if (maxStageBadge) {
      let maxMission = 1;
      let maxLevel = 1;
      let hasAnyRecord = false;
      if (profile.level_records) {
        Object.keys(profile.level_records).forEach((key) => {
          const match = key.match(/mission-(\d+)-level-(\d+)/);
          if (match && profile.level_records[key]?.is_passed) {
            hasAnyRecord = true;
            const m = parseInt(match[1], 10);
            const l = parseInt(match[2], 10);
            if (m > maxMission || (m === maxMission && l > maxLevel)) {
              maxMission = m;
              maxLevel = l;
            }
          }
        });
      }
      maxStageBadge.textContent = hasAnyRecord ? `M${maxMission} L${maxLevel}` : 'M1 L1';
    }
  }

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

      // 更新頭像
      const avObj = AVATARS[this.tempProfile.equipped_avatar] || AVATARS['avatar-default'];
      if (avImg) avImg.textContent = avObj ? avObj.icon : '🛡️';

      // 更新頭像框
      const borObj = BORDERS[this.tempProfile.equipped_border] || BORDERS['border-none'];
      if (avBorder && borObj) {
        avBorder.style.borderColor = borObj.color;
        if (borObj.id !== 'border-none') {
          avBorder.style.boxShadow = `0 0 10px ${borObj.color}`;
        } else {
          avBorder.style.boxShadow = 'none';
        }
      }

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
            const b = window.MATH_SPRINT_BADGES[bId];
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
        Object.keys(AVATARS).forEach(key => {
          const av = AVATARS[key];
          const isUnlocked = this.tempProfile.unlocked_assets.includes(av.id);
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
        Object.keys(BORDERS).forEach(key => {
          const bor = BORDERS[key];
          const isUnlocked = this.tempProfile.unlocked_assets.includes(bor.id);
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
        const badgeMeta = window.MATH_SPRINT_BADGES;

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
      profile.equipped_avatar = this.tempProfile.equipped_avatar;
      profile.equipped_border = this.tempProfile.equipped_border;
      profile.equipped_badges = this.tempProfile.equipped_badges;
      
      window.MathSprintStorage.saveProfile(profile);
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

    // 實時裝備框線與檔案名牌渲染至首頁大卡片
    window.addEventListener('mathSprintProfileUpdated', () => {
      renderHomeIdentityCard();
    });

    // 首次載入即渲染，避免首頁長時間顯示「特工載入中...」
    renderHomeIdentityCard();
  });

})();
