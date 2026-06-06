// Limit 180 — 全校速算聯賽排行榜模組 (Leaderboard)
// 負責首頁排行榜的資料獲取、DOM 動態渲染與即時刷新。
(function() {
  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  const Leaderboard = {
    currentTab: 'personal',   // 預設為個人總榜
    currentMission: 1,        // 預設為 Mission 1

    // 渲染排行榜主方法
    async renderLeaderboard() {
      const container = document.getElementById('leaderboard-list');
      const emptyState = document.getElementById('leaderboard-empty');
      const offlineNotice = document.getElementById('leaderboard-offline-notice');
      const rankBlock = document.getElementById('leaderboard-my-rank-block');
      
      if (!container) return;

      // 隱藏離線提示與空狀態
      if (offlineNotice) offlineNotice.classList.add('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      // 讀取當前登入玩家資訊
      const profileStr = localStorage.getItem('limit180_user_profile');
      const currentUser = profileStr ? JSON.parse(profileStr) : null;

      let allRecords = [];
      try {
        if (!window.MathSprintSupabaseService) {
          throw new Error("Supabase 服務未加載");
        }

        // 1. 單表架構：拉取 users_profile 所有資料（前 1000 筆）用於前端聚合與關卡篩選
        allRecords = await window.MathSprintSupabaseService.getLeaderboard(1000);
      } catch (err) {
        console.warn("[Leaderboard] 雲端載入連線失敗：", err.message);
        container.innerHTML = `<div class="text-center text-red-500 font-pixel text-[10px] py-8">⚠️ 排行榜載入失敗，請確認資料庫設定！</div>`;
        if (rankBlock) rankBlock.classList.add('hidden');
        return;
      }

      // 防空防呆：確保 allRecords 是陣列
      if (!Array.isArray(allRecords)) {
        allRecords = [];
      }

      // 2. 依據不同的 Tab 進行渲染邏輯，實作 Error Isolation 獨立錯誤隔離
      if (this.currentTab === 'personal') {
        // --- 個人總榜 ---
        
        // 前端分組聚合個人數據 (一個人的所有關卡星星加總與均速平均)
        const personMap = {};
        allRecords.forEach(row => {
          if (!row || !row.grade_class || !row.seat_number) return; // 防空
          const key = `${row.grade_class}:${row.seat_number}`;
          if (!personMap[key]) {
            personMap[key] = {
              grade_class: row.grade_class,
              seat_number: row.seat_number,
              nickname: row.nickname || '特工',
              total_stars: 0,
              total_time: 0,
              mission_count: 0
            };
          }
          personMap[key].total_stars += row.stars || 0;
          if (row.best_avg_time && row.best_avg_time < 999) {
            personMap[key].total_time += row.best_avg_time;
            personMap[key].mission_count += 1;
          }
        });

        const personalList = Object.values(personMap).map(p => {
          return {
            grade_class: p.grade_class,
            seat_number: p.seat_number,
            nickname: p.nickname,
            total_stars: p.total_stars,
            avg_time: p.mission_count > 0 ? parseFloat((p.total_time / p.mission_count).toFixed(2)) : 99.9
          };
        });

        // 排序：總星星數降序，平均秒數升序
        personalList.sort((a, b) => {
          if (b.total_stars !== a.total_stars) {
            return b.total_stars - a.total_stars;
          }
          return a.avg_time - b.avg_time;
        });

        // (A) 獨立渲染我的個人排名 Block (Error Isolation)
        try {
          if (rankBlock) {
            rankBlock.classList.remove('hidden');
            if (!currentUser) {
              rankBlock.innerHTML = `<div>👤 尚未建立特工身分，無法查看您的排行</div>`;
            } else {
              const myRank = personalList.findIndex(p => p.grade_class === currentUser.grade_class && p.seat_number === currentUser.seat_number);
              if (myRank === -1) {
                rankBlock.innerHTML = `<div>👤 特工 ${this._escapeHtml(currentUser.nickname)} | 尚未進入個人總榜（需至少通關一小關）</div>`;
              } else {
                const myRec = personalList[myRank];
                rankBlock.innerHTML = `
                  <div>👤 我的名次：第 <span class="text-green-400 font-bold">${myRank + 1}</span> 名</div>
                  <div>成績：<span class="text-green-400 font-bold">${myRec.total_stars} ⭐</span> (${myRec.avg_time.toFixed(2)}s)</div>
                `;
              }
            }
          }
        } catch (rankErr) {
          console.error("[Leaderboard] 個人榜 Block 渲染崩潰：", rankErr);
          if (rankBlock) rankBlock.innerHTML = `<div>⚠️ 載入個人排名卡片失敗</div>`;
        }

        // (B) 獨立渲染個人總榜 Top 50 列表 (Error Isolation)
        try {
          if (personalList.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台強者開拓！</div>`;
            return;
          }

          const top50 = personalList.slice(0, 50);
          container.innerHTML = top50.map((row, idx) => {
            const rank = idx + 1;
            const icon = RANK_ICONS[rank] || `#${rank}`;
            const isTop3 = rank <= 3;
            const isMe = currentUser && row.grade_class === currentUser.grade_class && row.seat_number === currentUser.seat_number;
            const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
            const meBorderClass = isMe ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_8px_rgba(0,240,255,0.2)]' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

            return `
              <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
                <div class="flex items-center gap-2">
                  <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
                  <span class="text-slate-400 text-[9px] font-tech">[${row.grade_class}班 ${row.seat_number}號]</span>
                  <span class="text-white text-[11px] font-bold">${this._escapeHtml(row.nickname)}</span>
                  ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
                </div>
                <div class="text-right">
                  <span class="text-green-400 font-bold">${row.total_stars}⭐</span>
                  <span class="text-slate-500 text-[9px] font-tech ml-1">(${row.avg_time.toFixed(2)}s)</span>
                </div>
              </div>
            `;
          }).join('');
        } catch (listErr) {
          console.error("[Leaderboard] 個人榜列表渲染崩潰：", listErr);
          container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">⚠️ 載入排行榜列表失敗</div>`;
        }

      } else if (this.currentTab === 'team') {
        // --- 團隊對抗榜 ---

        // 前端分組聚合團隊數據 (同班級內所有玩家的關卡加總，與各關均速平均)
        const teamMap = {};
        allRecords.forEach(row => {
          if (!row || !row.grade_class) return;
          const cls = row.grade_class;
          if (!teamMap[cls]) {
            teamMap[cls] = {
              grade_class: cls,
              total_stars: 0,
              total_time: 0,
              record_count: 0,
              players: new Set()
            };
          }
          teamMap[cls].total_stars += row.stars || 0;
          if (row.best_avg_time && row.best_avg_time < 999) {
            teamMap[cls].total_time += row.best_avg_time;
            teamMap[cls].record_count += 1;
          }
          if (row.seat_number) {
            teamMap[cls].players.add(row.seat_number);
          }
        });

        const teamList = Object.values(teamMap).map(g => {
          return {
            grade_class: g.grade_class,
            total_stars: g.total_stars,
            avg_time: g.record_count > 0 ? parseFloat((g.total_time / g.record_count).toFixed(2)) : 99.9,
            player_count: g.players.size
          };
        });

        // 排序：團隊總星數降序，平均秒數升序
        teamList.sort((a, b) => {
          if (b.total_stars !== a.total_stars) {
            return b.total_stars - a.total_stars;
          }
          return a.avg_time - b.avg_time;
        });

        // (A) 獨立渲染團隊對抗榜 Block (Error Isolation)
        try {
          if (rankBlock) {
            rankBlock.classList.remove('hidden');
            if (!currentUser) {
              rankBlock.innerHTML = `<div>👥 尚未建立特工身分，無法查看您的班級排行</div>`;
            } else {
              const myTeamRank = teamList.findIndex(g => g.grade_class === currentUser.grade_class);
              if (myTeamRank === -1) {
                rankBlock.innerHTML = `<div>👥 特工班級 ${this._escapeHtml(currentUser.grade_class)} | 尚未進入團隊對抗榜</div>`;
              } else {
                const myTeamRec = teamList[myTeamRank];
                rankBlock.innerHTML = `
                  <div>👥 我班排名：第 <span class="text-green-400 font-bold">${myTeamRank + 1}</span> 名 (${myTeamRec.grade_class}班)</div>
                  <div>團隊星星：<span class="text-green-400 font-bold">${myTeamRec.total_stars} ⭐</span> | 均速：${myTeamRec.avg_time}s | 人數：${myTeamRec.player_count}人</div>
                `;
              }
            }
          }
        } catch (rankErr) {
          console.error("[Leaderboard] 團隊榜 Block 渲染崩潰：", rankErr);
          if (rankBlock) rankBlock.innerHTML = `<div>⚠️ 載入班級排名卡片失敗</div>`;
        }

        // (B) 獨立渲染團隊榜 Top 50 列表 (Error Isolation)
        try {
          if (teamList.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台團隊開拓！</div>`;
            return;
          }

          const top50Teams = teamList.slice(0, 50);
          container.innerHTML = top50Teams.map((row, idx) => {
            const rank = idx + 1;
            const icon = RANK_ICONS[rank] || `#${rank}`;
            const isTop3 = rank <= 3;
            const isMyTeam = currentUser && row.grade_class === currentUser.grade_class;
            const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
            const meBorderClass = isMyTeam ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_8px_rgba(0,240,255,0.2)]' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

            return `
              <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
                <div class="flex items-center gap-2">
                  <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
                  <span class="text-white text-[11px] font-bold">${row.grade_class} 班級團隊</span>
                  ${isMyTeam ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我班</span>' : ''}
                  <span class="text-slate-500 text-[8px] font-tech">(${row.player_count} 人參賽)</span>
                </div>
                <div class="text-right">
                  <span class="text-green-400 font-bold">${row.total_stars}⭐</span>
                  <span class="text-slate-500 text-[9px] font-tech ml-1">(團隊均速: ${row.avg_time}s)</span>
                </div>
              </div>
            `;
          }).join('');
        } catch (listErr) {
          console.error("[Leaderboard] 團隊榜列表渲染崩潰：", listErr);
          container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">⚠️ 載入團隊排行榜失敗</div>`;
        }

      } else if (this.currentTab === 'mission') {
        // --- 答題速度榜 (原關卡分類榜) ---

        // 做好防空與防崩潰篩選 (Null-Defense)
        let missionData = [];
        try {
          missionData = allRecords.filter(item => item && parseInt(item.mission_id) === this.currentMission);
        } catch (filterErr) {
          console.error("[Leaderboard] filter 關卡數據崩潰：", filterErr);
          missionData = [];
        }

        // 排序演算法：完全不看星星，嚴格以「平均答題秒數 (best_avg_time)」進行升序 (Ascending) 排列
        missionData.sort((a, b) => {
          const timeA = a.best_avg_time || 999;
          const timeB = b.best_avg_time || 999;
          return timeA - timeB;
        });

        // (A) 獨立渲染答題速度榜 Block (Error Isolation)
        try {
          if (rankBlock) {
            rankBlock.classList.remove('hidden');
            if (!currentUser) {
              rankBlock.innerHTML = `<div>🎯 尚未建立特工身分，無法查看您的速度排行</div>`;
            } else {
              const myMissionRank = missionData.findIndex(r => r.grade_class === currentUser.grade_class && r.seat_number === currentUser.seat_number);
              if (myMissionRank === -1) {
                rankBlock.innerHTML = `<div>🎯 特工 ${this._escapeHtml(currentUser.nickname)} | 本關卡（Mission ${this.currentMission}）尚未進入答題速度榜</div>`;
              } else {
                const myRec = missionData[myMissionRank];
                const myAvg = typeof myRec.best_avg_time === 'number' ? myRec.best_avg_time.toFixed(2) : '99.90';
                const myMin = typeof myRec.min_time === 'number' ? myRec.min_time.toFixed(2) : '99.90';
                rankBlock.innerHTML = `
                  <div class="w-full text-center">🎯 ${myMissionRank + 1} ${this._escapeHtml(currentUser.nickname)} ${currentUser.grade_class} ${myAvg}s</div>
                `;
              }
            }
          }
        } catch (rankErr) {
          console.error("[Leaderboard] 答題速度榜 Block 渲染崩潰：", rankErr);
          if (rankBlock) rankBlock.innerHTML = `<div>⚠️ 載入速度排名卡片失敗</div>`;
        }

        // (B) 獨立渲染答題速度榜 Top 50 列表 (Error Isolation)
        try {
          if (missionData.length === 0) {
            // 消除錯誤警語，改為優雅的空資料提示
            container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">該任務目前尚無挑戰數據，等待強者開拓！</div>`;
            return;
          }

          const top50Missions = missionData.slice(0, 50);
          container.innerHTML = top50Missions.map((row, idx) => {
            const rank = idx + 1;
            const icon = RANK_ICONS[rank] || `#${rank}`;
            const isTop3 = rank <= 3;
            const isMe = currentUser && row.grade_class === currentUser.grade_class && row.seat_number === currentUser.seat_number;
            const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
            const meBorderClass = isMe ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_8px_rgba(0,240,255,0.2)]' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

            const avgTime = typeof row.best_avg_time === 'number' ? row.best_avg_time.toFixed(2) : '99.90';
            const minTime = typeof row.min_time === 'number' ? row.min_time.toFixed(2) : '99.90';

            // 欄位精簡鎖定為：「名次、暱稱、班級座號、平均答題秒數、單題最快秒數」，移除星星數與所有負面指標
            return `
              <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
                <div class="flex items-center gap-2">
                  <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
                  <span class="text-slate-400 text-[9px] font-tech">[${row.grade_class}班 ${row.seat_number}號]</span>
                  <span class="text-white text-[11px] font-bold">${this._escapeHtml(row.nickname)}</span>
                  ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
                </div>
                <div class="text-right flex items-center gap-3">
                  <span class="text-green-400 font-bold">均速: ${avgTime}s</span>
                  <span class="text-cyan-400 text-[9px] font-tech">最快: ${minTime}s</span>
                </div>
              </div>
            `;
          }).join('');
        } catch (listErr) {
          console.error("[Leaderboard] 答題速度榜列表渲染崩潰：", listErr);
          container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">⚠️ 載入答題速度排行榜失敗</div>`;
        }
      }
    },

    // 防 XSS
    _escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(text));
      return div.innerHTML;
    },

    // 初始化與綁定事件
    async init() {
      // 1. 動態生成關卡下拉選單 options
      const missionSelect = document.getElementById('leaderboard-mission-select');
      if (missionSelect) {
        missionSelect.innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">Mission ${i + 1}</option>`).join('');
        missionSelect.addEventListener('change', (e) => {
          this.currentMission = parseInt(e.target.value);
          this.renderLeaderboard().catch(() => {});
        });
      }

      // 2. 綁定 Tab 切換按鈕
      const tabs = {
        personal: document.getElementById('tab-leaderboard-personal'),
        team: document.getElementById('tab-leaderboard-team'),
        mission: document.getElementById('tab-leaderboard-mission')
      };

      const selectContainer = document.getElementById('leaderboard-select-container');

      const switchTab = (tabName) => {
        this.currentTab = tabName;
        
        // 發生「切換頁面/Tab」行為時，光條顏色才允許整體改變
        if (window.changeScannerColor) window.changeScannerColor();

        // 更新 Tab 按鈕樣式
        Object.keys(tabs).forEach(k => {
          if (!tabs[k]) return;
          if (k === tabName) {
            tabs[k].classList.remove('text-slate-400');
            tabs[k].classList.add('text-cyan-400', 'border-b-2', 'border-cyan-500', 'font-bold');
          } else {
            tabs[k].classList.add('text-slate-400');
            tabs[k].classList.remove('text-cyan-400', 'border-b-2', 'border-cyan-500', 'font-bold');
          }
        });

        // 答題速度榜時顯示 Mission 下拉選單，其餘隱藏
        if (tabName === 'mission') {
          if (selectContainer) selectContainer.classList.remove('hidden');
        } else {
          if (selectContainer) selectContainer.classList.add('hidden');
        }

        this.renderLeaderboard().catch(() => {});
      };

      if (tabs.personal) tabs.personal.addEventListener('click', () => switchTab('personal'));
      if (tabs.team) tabs.team.addEventListener('click', () => switchTab('team'));
      if (tabs.mission) tabs.mission.addEventListener('click', () => switchTab('mission'));

      // 預設先觸發一次個人總榜渲染
      await this.renderLeaderboard();
    }
  };

  // 當 SPA 視圖加載完成後自動初始化 (Fetch on Load)
  window.addEventListener('limit180ComponentsLoaded', () => {
    Leaderboard.init().catch(() => {});
  });

  window.MathSprintLeaderboard = Leaderboard;
})();
