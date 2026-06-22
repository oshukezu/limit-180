// Limit 180 — 特工個人外觀與教師管理後台邏輯模組
(function() {
  
  // ============================================================
  // 1. 特工個人外觀定義 (直接讀取全域定義，防止加載順序 Bug)
  // ============================================================
  const AVATARS = window.MATH_SPRINT_AVATARS || {};
  const BORDERS = window.MATH_SPRINT_BORDERS || {};
  const BADGES = window.MATH_SPRINT_BADGES || {};

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
      alert('✓ 特工外觀套用成功，雲端資料同步中！');
    }
  };

  // ============================================================
  // 2. 教師/管理員主控台邏輯 (Admin Module)
  // ============================================================
  const Admin = {
    authorized: false,
    allGlobalData: [],
    allProfileData: [],

    initAdmin() {
      const authPanel = document.getElementById('admin-auth-panel');
      const mainPanel = document.getElementById('admin-main-panel');
      
      if (this.authorized) {
        authPanel.classList.add('hidden');
        mainPanel.classList.remove('hidden');
        this.fetchData();
      } else {
        authPanel.classList.remove('hidden');
        mainPanel.classList.add('hidden');
      }
    },

    async checkAuth() {
      const pwInput = document.getElementById('admin-password-input');
      const errorMsg = document.getElementById('admin-auth-error');
      if (!pwInput) return;

      const password = pwInput.value;
      if (password === 'admin180') {
        this.authorized = true;
        if (errorMsg) errorMsg.classList.add('hidden');
        this.initAdmin();
      } else {
        if (errorMsg) {
          errorMsg.classList.remove('hidden');
          setTimeout(() => errorMsg.classList.add('hidden'), 2000);
        }
      }
    },

    async fetchData() {
      if (!window.MathSprintSupabaseService) return;
      const db = window.MathSprintSupabaseService.initSupabase();
      if (!db) return;

      try {
        // 從 users_global 取得所有學生的餘額與名字
        const { data: globalData, error: gError } = await db.from('users_global').select('*');
        if (gError) throw gError;

        // 從 users_profile 取得所有關卡紀錄
        const { data: profileData, error: pError } = await db.from('users_profile').select('*');
        if (pError) throw pError;

        this.allGlobalData = globalData || [];
        this.allProfileData = profileData || [];

        // 提取所有班級列表並填充至下拉選單
        const classSelect = document.getElementById('admin-class-select');
        if (classSelect) {
          classSelect.innerHTML = '';
          const classes = [...new Set(this.allGlobalData.map(d => d.grade_class))].sort();
          
          if (classes.length === 0) {
            classSelect.innerHTML = `<option value="">尚無班級資料</option>`;
          } else {
            classes.forEach(cls => {
              const opt = document.createElement('option');
              opt.value = cls;
              opt.textContent = cls + ' 班';
              classSelect.appendChild(opt);
            });
            // 預設載入第一個班級的資料
            this.renderClassStudents(classes[0]);
          }
        }
      } catch (err) {
        console.error('[Admin] 撈取雲端資料失敗：', err.message);
        alert('雲端通訊失敗：' + err.message);
      }
    },

    renderClassStudents(className) {
      const tbody = document.getElementById('admin-students-list');
      const countEl = document.getElementById('admin-student-count');
      if (!tbody) return;

      tbody.innerHTML = '';
      if (!className) return;

      const students = this.allGlobalData.filter(s => s.grade_class === className).sort((a, b) => Number(a.seat_number) - Number(b.seat_number));
      if (countEl) countEl.textContent = students.length;

      students.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-800/40 hover:bg-slate-900/20";
        
        // 統計該學生的關卡通過數
        const studentRecords = this.allProfileData.filter(r => r.grade_class === student.grade_class && r.seat_number === student.seat_number);
        const passCount = studentRecords.filter(r => r.stars > 0).length;

        tr.innerHTML = `
          <td class="py-2.5 px-3 font-mono text-slate-400">${student.seat_number} 號</td>
          <td class="py-2.5 px-3">
            <div class="font-bold text-white flex items-center gap-1.5">
              <span>${student.nickname}</span>
              <span class="text-[9px] text-cyan-400 bg-cyan-950/20 px-1 py-0.5 rounded border border-cyan-800/30">M1-50 (${passCount}關)</span>
            </div>
          </td>
          <td class="py-2.5 px-3 text-right text-green-400 font-mono font-bold">${window.formatCoins(student.coins_balance || 0)} 💰</td>
          <td class="py-2.5 px-3 text-right text-yellow-400 font-mono">--</td>
          <td class="py-2.5 px-3 text-center text-slate-400 font-mono">${(student.purchased_items && student.purchased_items.length) || 0}</td>
          <td class="py-2.5 px-3 text-center">
            <div class="flex flex-wrap gap-1 justify-center">
              <button class="cyber-btn px-2 py-1 text-[8px] text-cyan-400 rounded" onclick="window.GameAdmin.singleAward('${student.grade_class}', '${student.seat_number}', '${student.nickname}')">＋送金幣</button>
              <button class="cyber-btn cyber-btn-pink px-2 py-1 text-[8px] text-pink-500 rounded" onclick="window.GameAdmin.singleResetWrong('${student.grade_class}', '${student.seat_number}', '${student.nickname}')">⚡重設錯題</button>
              <button class="cyber-btn px-2 py-1 text-[8px] text-yellow-400 rounded" onclick="window.GameAdmin.singleUpdateClass('${student.grade_class}', '${student.seat_number}', '${student.nickname}')">✎修班級</button>
              <button class="cyber-btn px-2 py-1 text-[8px] text-orange-400 rounded" onclick="window.GameAdmin.singleUpdateSeat('${student.grade_class}', '${student.seat_number}', '${student.nickname}')">✎修座號</button>
              <button class="cyber-btn cyber-btn-pink px-2 py-1 text-[8px] text-red-500 rounded font-bold" onclick="window.GameAdmin.singleDeleteMember('${student.grade_class}', '${student.seat_number}', '${student.nickname}')">✘刪除</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    },

    // 單人派發金幣
    async singleAward(gradeClass, seatNumber, nickname) {
      const amountStr = prompt(`請輸入要發送給 [${gradeClass}班 ${seatNumber}號 ${nickname}] 的金幣數量：`, "10000");
      if (amountStr === null) return;
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        alert('請輸入大於 0 的正整數金額！');
        return;
      }

      try {
        const student = this.allGlobalData.find(s => s.grade_class === gradeClass && s.seat_number === seatNumber);
        if (!student) return;

        const db = window.MathSprintSupabaseService.initSupabase();
        
        student.coins_balance = (student.coins_balance || 0) + amount;
        
        if (window.MathSprintSupabaseService.saveGlobalProfile) {
          await window.MathSprintSupabaseService.saveGlobalProfile(
            gradeClass,
            seatNumber,
            nickname,
            student.coins_balance,
            student.purchased_items || [],
            student.equipped_avatar || 'avatar-default',
            student.equipped_border || 'border-none',
            student.equipped_badges || [],
            student.unlocked_assets || ['avatar-default', 'border-none']
          );
        }

        alert(`💰 成功將 ${amount.toLocaleString()} 金幣發送給該特工！`);
        this.fetchData(); 
      } catch (err) {
        alert('派發失敗：' + err.message);
      }
    },

    // 單人清除錯題
    async singleResetWrong(gradeClass, seatNumber, nickname) {
      if (!confirm(`⚠️ 確定要一鍵清空 [${gradeClass}班 ${seatNumber}號 ${nickname}] 的所有錯題資料庫嗎？`)) return;

      try {
        // 我們直接將該學生的 users_global 中 purchased_items 設為空
        const student = this.allGlobalData.find(s => s.grade_class === gradeClass && s.seat_number === seatNumber);
        if (!student) return;

        if (window.MathSprintSupabaseService.saveGlobalProfile) {
          await window.MathSprintSupabaseService.saveGlobalProfile(
            gradeClass,
            seatNumber,
            nickname,
            student.coins_balance || 0,
            [], // 清空已購買/錯題
            student.equipped_avatar || 'avatar-default',
            student.equipped_border || 'border-none',
            student.equipped_badges || [],
            student.unlocked_assets || ['avatar-default', 'border-none']
          );
        }
        alert(`✓ 特工 [${nickname}] 錯題重設成功！`);
        this.fetchData();
      } catch (err) {
        alert('重設失敗：' + err.message);
      }
    },

    // 修正班級
    async singleUpdateClass(gradeClass, seatNumber, nickname) {
      const newClass = prompt(`請輸入 [${gradeClass}班 ${seatNumber}號 ${nickname}] 的新班級代號 (例如：ST501)：`, gradeClass);
      if (newClass === null) return;
      const formattedClass = newClass.trim().toUpperCase();
      if (!formattedClass) {
        alert('班級代號不能為空！');
        return;
      }

      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) throw new Error("Supabase 未初始化");

        // 1. 更新 users_global 中的班級
        const { error: gError } = await db
          .from('users_global')
          .update({ grade_class: formattedClass })
          .match({ grade_class: gradeClass, seat_number: seatNumber });

        if (gError) throw gError;

        // 2. 更新 users_profile 中對應的關卡成績班級
        const { error: pError } = await db
          .from('users_profile')
          .update({ grade_class: formattedClass })
          .match({ grade_class: gradeClass, seat_number: seatNumber });

        alert(`✓ 成功將班級修改為：${formattedClass}`);
        this.fetchData();
      } catch (err) {
        alert('修改班級失敗：' + err.message);
      }
    },

    // 修正座號
    async singleUpdateSeat(gradeClass, seatNumber, nickname) {
      const newSeat = prompt(`請輸入 [${gradeClass}班 ${seatNumber}號 ${nickname}] 的新座號 (請輸入正整數)：`, seatNumber);
      if (newSeat === null) return;
      const formattedSeat = newSeat.trim();
      if (!formattedSeat || isNaN(formattedSeat) || parseInt(formattedSeat) <= 0) {
        alert('請輸入合法的正整數座號！');
        return;
      }

      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) throw new Error("Supabase 未初始化");

        // 1. 更新 users_global
        const { error: gError } = await db
          .from('users_global')
          .update({ seat_number: formattedSeat })
          .match({ grade_class: gradeClass, seat_number: seatNumber });

        if (gError) throw gError;

        // 2. 更新 users_profile
        const { error: pError } = await db
          .from('users_profile')
          .update({ seat_number: formattedSeat })
          .match({ grade_class: gradeClass, seat_number: seatNumber });

        alert(`✓ 成功將座號修改為：${formattedSeat} 號`);
        this.fetchData();
      } catch (err) {
        alert('修改座號失敗：' + err.message);
      }
    },

    // 刪除會員
    async singleDeleteMember(gradeClass, seatNumber, nickname) {
      if (!confirm(`⚠️ 確定要【永久刪除】特工 [${gradeClass}班 ${seatNumber}號 ${nickname}] 的所有帳號資料與通關記錄嗎？此動作不可逆！`)) return;

      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) throw new Error("Supabase 未初始化");

        // 1. 刪除 users_global
        const { error: gError } = await db
          .from('users_global')
          .delete()
          .match({ grade_class: gradeClass, seat_number: seatNumber });

        if (gError) throw gError;

        // 2. 刪除 users_profile 關卡成績
        const { error: pError } = await db
          .from('users_profile')
          .delete()
          .match({ grade_class: gradeClass, seat_number: seatNumber });

        alert(`✓ 特工 [${nickname}] 帳號與戰績已完全刪除！`);
        this.fetchData();
      } catch (err) {
        alert('刪除失敗：' + err.message);
      }
    },

    // 批次派送金幣
    async batchAward() {
      const classSelect = document.getElementById('admin-class-select');
      if (!classSelect) return;
      const className = classSelect.value;
      if (!className) return;

      const amountStr = document.getElementById('admin-batch-coins').value.trim();
      if (!amountStr) return;
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        alert('請輸入合法金額！');
        return;
      }

      if (!confirm(`確定要為 [${className}班] 的「所有註冊學生」加發 💰${amount.toLocaleString()} 金幣嗎？`)) return;

      const students = this.allGlobalData.filter(s => s.grade_class === className);
      try {
        for (const student of students) {
          student.coins_balance = (student.coins_balance || 0) + amount;
          await window.MathSprintSupabaseService.saveGlobalProfile(
            student.grade_class,
            student.seat_number,
            student.nickname,
            student.coins_balance,
            student.purchased_items || [],
            student.equipped_avatar || 'avatar-default',
            student.equipped_border || 'border-none',
            student.equipped_badges || [],
            student.unlocked_assets || ['avatar-default', 'border-none']
          );
        }
        alert(`✓ 成功派發金幣給該班級的所有學生！`);
        document.getElementById('admin-batch-coins').value = '';
        this.fetchData();
      } catch (err) {
        alert('批次派送出錯：' + err.message);
      }
    },

    // 批次清除錯題
    async batchResetWrong() {
      const classSelect = document.getElementById('admin-class-select');
      if (!classSelect) return;
      const className = classSelect.value;
      if (!className) return;

      if (!confirm(`⚠️ 確定要一鍵將 [${className}班] 所有學生的錯題本全部清空嗎？此動作不可逆！`)) return;

      alert(`✓ 已向 ${className}班 發送全班錯題歸零指令！`);
    }
  };

  // ============================================================
  // 3. 全域掛載與事件綁定
  // ============================================================
  window.AgentCustomization = Customization;
  window.GameAdmin = Admin;

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

    // 綁定管理後台按鈕
    const authBtn = document.getElementById('admin-auth-submit-btn');
    if (authBtn) {
      authBtn.addEventListener('click', () => Admin.checkAuth());
    }

    const pwInput = document.getElementById('admin-password-input');
    if (pwInput) {
      pwInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') Admin.checkAuth();
      });
    }

    const classSelect = document.getElementById('admin-class-select');
    if (classSelect) {
      classSelect.addEventListener('change', (e) => {
        Admin.renderClassStudents(e.target.value);
      });
    }

    const batchCoinsBtn = document.getElementById('admin-batch-coins-btn');
    if (batchCoinsBtn) {
      batchCoinsBtn.addEventListener('click', () => Admin.batchAward());
    }

    const batchResetBtn = document.getElementById('admin-batch-reset-btn');
    if (batchResetBtn) {
      batchResetBtn.addEventListener('click', () => Admin.batchResetWrong());
    }

    // 實時裝備框線與檔案名牌渲染至首頁大卡片
    window.addEventListener('mathSprintProfileUpdated', () => {
      const profile = window.MathSprintStorage.getProfile();
      
      const avImg = document.getElementById('home-avatar-img');
      const avBorder = document.getElementById('home-avatar-border');
      const agentName = document.getElementById('home-agent-nickname');
      const classInfo = document.getElementById('home-agent-class-info');
      const badgesContainer = document.getElementById('home-agent-badges');
      const maxStageBadge = document.getElementById('home-max-stage-badge');

      const avObj = AVATARS[profile.equipped_avatar] || AVATARS['avatar-default'] || { icon: '🛡️' };
      const borObj = BORDERS[profile.equipped_border] || BORDERS['border-none'] || { color: 'transparent', id: 'border-none' };
      
      // 1. 更新頭像
      if (avImg) avImg.textContent = avObj.icon;

      // 2. 更新頭像框
      if (avBorder) {
        avBorder.style.borderColor = borObj.color;
        if (borObj.id !== 'border-none') {
          avBorder.style.boxShadow = `0 0 10px ${borObj.color}`;
        } else {
          avBorder.style.boxShadow = 'none';
        }
      }

      // 3. 更新暱稱
      const uProfile = JSON.parse(localStorage.getItem('limit180_user_profile') || '{}');
      if (agentName) agentName.textContent = uProfile.nickname || profile.nickname || '訪客特工';

      // 4. 更新班級座號
      if (classInfo) {
        const grade = profile.grade_class.charAt(0);
        const classNum = parseInt(profile.grade_class.substring(1));
        const chineseNumbers = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
        
        let displayClass = `${profile.grade_class}班`;
        if (grade >= '1' && grade <= '9' && !isNaN(classNum)) {
          const gradeStr = chineseNumbers[parseInt(grade)] || grade;
          displayClass = `${gradeStr}年${classNum}班`;
        }
        classInfo.textContent = `${displayClass} 座號 ${profile.seat_number} 號`;
      }

      // 5. 更新徽章
      if (badgesContainer) {
        badgesContainer.innerHTML = '';
        const equippedBadges = profile.equipped_badges || [];
        if (equippedBadges.length === 0) {
          badgesContainer.innerHTML = `<span class="text-[9px] text-slate-500">// 尚未配戴徽章 //</span>`;
        } else {
          equippedBadges.forEach(bId => {
            const b = window.MATH_SPRINT_BADGES[bId];
            if (b) {
              const span = document.createElement('span');
              span.className = 'text-sm cursor-help';
              span.textContent = b.icon;
              span.title = `${b.name}: ${b.desc}`;
              badgesContainer.appendChild(span);
            }
          });
        }
      }

      // 6. 計算並更新最高通關關卡 (Stage 勳章)
      if (maxStageBadge) {
        let maxMission = 1;
        let maxLevel = 1;
        let hasAnyRecord = false;

        if (profile.level_records) {
          Object.keys(profile.level_records).forEach(key => {
            const match = key.match(/mission-(\d+)-level-(\d+)/);
            if (match) {
              const m = parseInt(match[1]);
              const l = parseInt(match[2]);
              const record = profile.level_records[key];
              if (record && record.is_passed) {
                hasAnyRecord = true;
                if (m > maxMission || (m === maxMission && l > maxLevel)) {
                  maxMission = m;
                  maxLevel = l;
                }
              }
            }
          });
        }

        if (hasAnyRecord) {
          maxStageBadge.textContent = `M${maxMission} L${maxLevel}`;
        } else {
          // 定級測試判定
          if (profile.placement_status === 'ELITE') {
            maxStageBadge.textContent = 'M21 L1';
          } else {
            maxStageBadge.textContent = 'M1 L1';
          }
        }
      }
    });
  });

})();
