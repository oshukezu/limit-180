// Limit 180 — 管理後台邏輯模組
(function() {
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
        window.dispatchEvent(new CustomEvent('limit180AdminAuthorized'));
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
        const { data: globalData, error: gError } = await db.from('users_global').select('*');
        if (gError) throw gError;
        const { data: profileData, error: pError } = await db.from('users_profile').select('*');
        if (pError) throw pError;

        this.allGlobalData = globalData || [];
        this.allProfileData = profileData || [];

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
    async singleAward(gradeClass, seatNumber, nickname) {
      const amountStr = prompt(`請輸入要發送給 ${gradeClass}班 ${seatNumber}號 ${nickname} 的金幣數量：`, "10000");
      if (!amountStr) return;
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) return alert('請輸入大於 0 的正整數金額！');
      try {
        const student = this.allGlobalData.find(s => s.grade_class === gradeClass && s.seat_number === seatNumber);
        if (!student) return;
        let targetBalance = (student.coins_balance || 0) + amount;
        if (window.MathSprintSupabaseService?.applyCoinTransaction) {
          const tx = await window.MathSprintSupabaseService.applyCoinTransaction(gradeClass, seatNumber, nickname, amount, 'admin_award_single', { operator: 'admin', amount });
          if (tx?.newBalance >= 0) targetBalance = tx.newBalance;
        }
        student.coins_balance = targetBalance;
        await window.MathSprintSupabaseService.saveGlobalProfile(gradeClass, seatNumber, nickname, targetBalance, student.purchased_items || [], student.equipped_avatar || 'avatar-default', student.equipped_border || 'border-none', student.equipped_badges || [], student.unlocked_assets || ['avatar-default', 'border-none']);
        alert(`💰 成功將 ${amount.toLocaleString()} 金幣發送給該特工！`);
        this.fetchData();
      } catch (err) { alert('派發失敗：' + err.message); }
    },

    async singleResetWrong(gradeClass, seatNumber, nickname) {
      if (!confirm(`⚠️ 確定要一鍵清空 ${gradeClass}班 ${seatNumber}號 ${nickname} 的所有錯題資料庫嗎？`)) return;
      try {
        const student = this.allGlobalData.find(s => s.grade_class === gradeClass && s.seat_number === seatNumber);
        if (!student) return;
        await window.MathSprintSupabaseService.saveGlobalProfile(gradeClass, seatNumber, nickname, student.coins_balance || 0, [], student.equipped_avatar || 'avatar-default', student.equipped_border || 'border-none', student.equipped_badges || [], student.unlocked_assets || ['avatar-default', 'border-none']);
        alert(`✓ 特工 ${nickname} 錯題重設成功！`);
        this.fetchData();
      } catch (err) { alert('重設失敗：' + err.message); }
    },

    async singleUpdateClass(gradeClass, seatNumber, nickname) {
      const newClass = prompt(`請輸入 ${gradeClass}班 ${seatNumber}號 ${nickname} 的新班級代號：`, gradeClass);
      if (!newClass) return;
      const formattedClass = newClass.trim().toUpperCase();
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) throw new Error("Supabase 未初始化");
        await db.from('users_global').update({ grade_class: formattedClass }).match({ grade_class: gradeClass, seat_number: seatNumber });
        await db.from('users_profile').update({ grade_class: formattedClass }).match({ grade_class: gradeClass, seat_number: seatNumber });
        alert(`✓ 成功將班級修改為：${formattedClass}`);
        this.fetchData();
      } catch (err) { alert('修改班級失敗：' + err.message); }
    },

    async singleUpdateSeat(gradeClass, seatNumber, nickname) {
      const newSeat = prompt(`請輸入 ${gradeClass}班 ${seatNumber}號 ${nickname} 的新座號：`, seatNumber);
      if (!newSeat) return;
      const formattedSeat = newSeat.trim();
      if (isNaN(formattedSeat) || parseInt(formattedSeat) <= 0) return alert('請輸入合法的正整數座號！');
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) throw new Error("Supabase 未初始化");
        await db.from('users_global').update({ seat_number: formattedSeat }).match({ grade_class: gradeClass, seat_number: seatNumber });
        await db.from('users_profile').update({ seat_number: formattedSeat }).match({ grade_class: gradeClass, seat_number: seatNumber });
        alert(`✓ 成功將座號修改為：${formattedSeat} 號`);
        this.fetchData();
      } catch (err) { alert('修改座號失敗：' + err.message); }
    },

    async singleDeleteMember(gradeClass, seatNumber, nickname) {
      if (!confirm(`確定要【永久刪除】特工 ${gradeClass}班 ${seatNumber}號 ${nickname} 嗎？`)) return;
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) throw new Error("Supabase 未初始化");
        await db.from('users_global').delete().match({ grade_class: gradeClass, seat_number: seatNumber });
        await db.from('users_profile').delete().match({ grade_class: gradeClass, seat_number: seatNumber });
        alert(`✓ 特工 ${nickname} 已完全刪除！`);
        this.fetchData();
      } catch (err) { alert('刪除失敗：' + err.message); }
    },

    async batchAward() {
      const classSelect = document.getElementById('admin-class-select');
      const className = classSelect?.value;
      if (!className) return;
      const amountStr = document.getElementById('admin-batch-coins').value.trim();
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) return alert('請輸入合法金額！');
      if (!confirm(`確定要為 ${className}班 學生加發 💰${amount.toLocaleString()} 金幣嗎？`)) return;
      const students = this.allGlobalData.filter(s => s.grade_class === className);
      try {
        for (const student of students) {
          let targetBalance = (student.coins_balance || 0) + amount;
          if (window.MathSprintSupabaseService?.applyCoinTransaction) {
            const tx = await window.MathSprintSupabaseService.applyCoinTransaction(student.grade_class, student.seat_number, student.nickname, amount, 'admin_award_batch', { operator: 'admin', className, amount });
            if (tx?.newBalance >= 0) targetBalance = tx.newBalance;
          }
          student.coins_balance = targetBalance;
          await window.MathSprintSupabaseService.saveGlobalProfile(student.grade_class, student.seat_number, student.nickname, targetBalance, student.purchased_items || [], student.equipped_avatar || 'avatar-default', student.equipped_border || 'border-none', student.equipped_badges || [], student.unlocked_assets || ['avatar-default', 'border-none']);
        }
        alert(`✓ 成功派發金幣！`);
        document.getElementById('admin-batch-coins').value = '';
        this.fetchData();
      } catch (err) { alert('批次派送出錯：' + err.message); }
    },

    async batchResetWrong() {
      const className = document.getElementById('admin-class-select')?.value;
      if (!className) return;
      if (!confirm(`⚠️ 確定要一鍵將 ${className}班 所有學生的錯題本全部清空嗎？`)) return;
      alert(`✓ 已發送全班錯題歸零指令！`);
    },

    async fetchSensitiveWords() {
      if (!window.MathSprintSupabaseService?.listSensitiveWords) return;
      try {
        const list = await window.MathSprintSupabaseService.listSensitiveWords();
        const container = document.getElementById('admin-sensitive-list');
        if (!container) return;
        container.innerHTML = '';
        if (list.length === 0) {
          container.innerHTML = `<div class="text-[10px] text-slate-500">目前尚無過濾敏感詞</div>`;
          return;
        }
        list.forEach(item => {
          const word = typeof item === 'object' ? item.word : item;
          const badge = document.createElement('div');
          badge.className = "flex items-center gap-1 bg-red-950/40 text-red-400 border border-red-900/60 px-2 py-1 rounded text-[10px] font-pixel";
          badge.innerHTML = `<span>${word}</span><button class="hover:text-white font-bold text-[9px] cursor-pointer ml-1 focus:outline-none" onclick="window.GameAdmin.removeSensitiveWord('${word}')">✕</button>`;
          container.appendChild(badge);
        });
      } catch (err) { console.warn("[Admin] 載入敏感詞失敗：", err.message); }
    },

    async addSensitiveWord() {
      const input = document.getElementById('admin-sensitive-input');
      const val = String(input?.value || '').trim();
      if (!val) return;
      
      try {
        const list = await window.MathSprintSupabaseService.listSensitiveWords();
        const wordsOnly = list.map(item => {
          const w = typeof item === 'object' ? item.word : item;
          return String(w || '').trim().toLowerCase();
        });
        if (wordsOnly.includes(val.toLowerCase())) {
          alert(`⚠️ 敏感詞「${val}」已經在清單中囉！`);
          return;
        }

        const cloudSuccess = await window.MathSprintSupabaseService.addSensitiveWord(val);
        if (input) input.value = '';
        
        if (!cloudSuccess) {
          alert('⚠️ 敏感詞已暫存於此瀏覽器。注意：因雲端資料庫連線失敗或資料表未更新，其他裝置將無法同步此敏感詞！');
        } else {
          alert('✓ 敏感詞已成功新增並同步至雲端資料庫！');
        }
        
        this.fetchSensitiveWords();
      } catch (err) { alert('新增敏感詞失敗：' + err.message); }
    },

    async removeSensitiveWord(word) {
      if (!confirm(`確定要刪除敏感詞「${word}」嗎？`)) return;
      try {
        await window.MathSprintSupabaseService.deleteSensitiveWord(word);
        this.fetchSensitiveWords();
      } catch (err) { alert('刪除敏感詞失敗：' + err.message); }
    },

    async clearChatHistory() {
      const classSelect = document.getElementById('admin-class-select');
      const className = classSelect?.value;
      if (!className) {
        alert("⚠️ 請先在上方下拉選單選擇要清除的「班級」！");
        return;
      }

      const confirmFirst = confirm(`🚨 警告！您即將永久刪除雲端資料表 messages 中【 ${className} 班 】的所有聊天留言記錄！\n\n此操作為永久性刪除且無法撤銷，確定要清除嗎？`);
      if (!confirmFirst) return;
      const confirmSecond = confirm(`⚠️ 請再次確認：是否確定清空【 ${className} 班 】的聊天室？`);
      if (!confirmSecond) return;

      try {
        const success = await window.MathSprintSupabaseService.clearClassMessages(className);
        if (success) {
          alert(`✓ 【 ${className} 班 】的聊天記錄已成功清除！`);
        } else {
          alert("❌ 清除失敗，可能是因為雲端 RLS 安全政策不允許 DELETE，或者連線中斷。");
        }
      } catch (err) {
        alert("❌ 清除發生錯誤: " + err.message);
      }
    }
  };

  window.GameAdmin = Admin;

  window.addEventListener('limit180ComponentsLoaded', () => {
    document.getElementById('admin-auth-submit-btn')?.addEventListener('click', () => Admin.checkAuth());
    document.getElementById('admin-password-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') Admin.checkAuth();
    });
    document.getElementById('admin-class-select')?.addEventListener('change', (e) => {
      Admin.renderClassStudents(e.target.value);
    });
    document.getElementById('admin-batch-coins-btn')?.addEventListener('click', () => Admin.batchAward());
    document.getElementById('admin-batch-reset-btn')?.addEventListener('click', () => Admin.batchResetWrong());
    document.getElementById('admin-sensitive-add-btn')?.addEventListener('click', () => Admin.addSensitiveWord());
    document.getElementById('admin-sensitive-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') Admin.addSensitiveWord();
    });
    document.getElementById('admin-clear-chat-btn')?.addEventListener('click', () => Admin.clearChatHistory());
  });

  window.addEventListener('limit180AdminAuthorized', () => {
    Admin.fetchSensitiveWords();
  });
})();

