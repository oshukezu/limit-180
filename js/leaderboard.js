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

      try {
        if (!window.MathSprintSupabaseService) {
          throw new Error("Supabase 服務未加載");
        }

        if (this.currentTab === 'personal') {
          // 1. 個人總榜：拉取前 200 筆，列表中渲染前 50 筆
          const allProfiles = await window.MathSprintSupabaseService.getLeaderboard(200);

          if (!allProfiles || allProfiles.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台強者開拓！</div>`;
            if (rankBlock) rankBlock.classList.add('hidden');
            return;
          }

          // 尋找我自己的排名
          let myRank = -1;
          let myRecord = null;
          if (currentUser) {
            myRank = allProfiles.findIndex(p => p.grade_class === currentUser.grade_class && p.seat_number === currentUser.seat_number);
            if (myRank !== -1) {
              myRecord = allProfiles[myRank];
            }
          }

          // 渲染頂端高亮 Block
          if (rankBlock) {
            rankBlock.classList.remove('hidden');
            if (!currentUser) {
              rankBlock.innerHTML = `<div>👤 尚未建立特工身分，無法查看您的排行</div>`;
            } else if (myRank === -1) {
              rankBlock.innerHTML = `<div>👤 特工 ${this._escapeHtml(currentUser.nickname)} | 尚未進入個人總榜（需至少通關一小關）</div>`;
            } else {
              rankBlock.innerHTML = `
                <div>👤 我的名次：第 <span class="text-green-400 font-bold">${myRank + 1}</span> 名</div>
                <div>成績：<span class="text-green-400 font-bold">${myRecord.total_stars} ⭐</span> (${myRecord.best_avg_time.toFixed(2)}s)</div>
              `;
            }
          }

          // 渲染列表前 50 筆
          const top50 = allProfiles.slice(0, 50);
          container.innerHTML = top50.map((row, idx) => {
            const rank = idx + 1;
            const icon = RANK_ICONS[rank] || `#${rank}`;
            const isTop3 = rank <= 3;
            const isMe = currentUser && row.grade_class === currentUser.grade_class && row.seat_number === currentUser.seat_number;
            const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
            const meBorderClass = isMe ? 'border-2 border-cyan-500 bg-cyan-950/20' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

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
                  <span class="text-slate-500 text-[9px] font-tech ml-1">(${row.best_avg_time.toFixed(2)}s)</span>
                </div>
              </div>
            `;
          }).join('');

        } else if (this.currentTab === 'team') {
          // 2. 團隊對抗榜：拉取前 500 筆資料進行前端 Group By
          const allProfiles = await window.MathSprintSupabaseService.getLeaderboard(500);

          if (!allProfiles || allProfiles.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台團隊開拓！</div>`;
            if (rankBlock) rankBlock.classList.add('hidden');
            return;
          }

          // 前端團隊加總聚合
          const groups = {};
          allProfiles.forEach(row => {
            const cls = row.grade_class;
            if (!groups[cls]) {
              groups[cls] = {
                grade_class: cls,
                total_stars: 0,
                total_avg_time: 0,
                player_count: 0
              };
            }
            groups[cls].total_stars += row.total_stars;
            groups[cls].total_avg_time += row.best_avg_time;
            groups[cls].player_count += 1;
          });

          const groupList = Object.values(groups).map(g => {
            return {
              grade_class: g.grade_class,
              total_stars: g.total_stars,
              avg_time: parseFloat((g.total_avg_time / g.player_count).toFixed(2)),
              player_count: g.player_count
            };
          });

          // 排序：團隊總星數降序，平均秒數升序
          groupList.sort((a, b) => {
            if (b.total_stars !== a.total_stars) {
              return b.total_stars - a.total_stars;
            }
            return a.avg_time - b.avg_time;
          });

          // 尋找我班級的排名
          let myTeamRank = -1;
          let myTeamRecord = null;
          if (currentUser) {
            myTeamRank = groupList.findIndex(g => g.grade_class === currentUser.grade_class);
            if (myTeamRank !== -1) {
              myTeamRecord = groupList[myTeamRank];
            }
          }

          // 渲染頂端高亮 Block
          if (rankBlock) {
            rankBlock.classList.remove('hidden');
            if (!currentUser) {
              rankBlock.innerHTML = `<div>👥 尚未建立特工身分，無法查看您的班級排行</div>`;
            } else if (myTeamRank === -1) {
              rankBlock.innerHTML = `<div>👥 特工班級 ${this._escapeHtml(currentUser.grade_class)} | 尚未進入團隊對抗榜</div>`;
            } else {
              rankBlock.innerHTML = `
                <div>👥 我班排名：第 <span class="text-green-400 font-bold">${myTeamRank + 1}</span> 名 (${myTeamRecord.grade_class}班)</div>
                <div>團隊星星：<span class="text-green-400 font-bold">${myTeamRecord.total_stars} ⭐</span> | 均速：${myTeamRecord.avg_time}s | 人數：${myTeamRecord.player_count}人</div>
              `;
            }
          }

          // 渲染前 50 筆團隊列表
          const top50Teams = groupList.slice(0, 50);
          container.innerHTML = top50Teams.map((row, idx) => {
            const rank = idx + 1;
            const icon = RANK_ICONS[rank] || `#${rank}`;
            const isTop3 = rank <= 3;
            const isMyTeam = currentUser && row.grade_class === currentUser.grade_class;
            const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
            const meBorderClass = isMyTeam ? 'border-2 border-cyan-500 bg-cyan-950/20' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

            return `
              <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
                <div class="flex items-center gap-2">
                  <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
                  <span class="text-white text-[11px] font-bold">${row.grade_class} 班級團隊</span>
                  ${isMyTeam ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我班</span>' : ''}
                  <span class="text-slate-500 text-[8px] font-tech">(${row.player_count} 人參戰)</span>
                </div>
                <div class="text-right">
                  <span class="text-green-400 font-bold">${row.total_stars}⭐</span>
                  <span class="text-slate-500 text-[9px] font-tech ml-1">(團隊均速: ${row.avg_time}s)</span>
                </div>
              </div>
            `;
          }).join('');

        } else if (this.currentTab === 'mission') {
          // 3. 關卡分類榜：拉取 mission_records
          if (!window.MathSprintSupabaseService.getMissionLeaderboard) {
            throw new Error("getMissionLeaderboard 服務未加載");
          }

          const missionRecords = await window.MathSprintSupabaseService.getMissionLeaderboard(this.currentMission);

          if (!missionRecords || missionRecords.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">此關卡暫無速算紀錄，快去通關搶下第一名！</div>`;
            if (rankBlock) rankBlock.classList.add('hidden');
            return;
          }

          // 尋找我自己在該 Mission 的排名
          let myMissionRank = -1;
          let myMissionRecord = null;
          if (currentUser) {
            myMissionRank = missionRecords.findIndex(r => r.grade_class === currentUser.grade_class && r.seat_number === currentUser.seat_number);
            if (myMissionRank !== -1) {
              myMissionRecord = missionRecords[myMissionRank];
            }
          }

          // 渲染頂端高亮 Block
          if (rankBlock) {
            rankBlock.classList.remove('hidden');
            if (!currentUser) {
              rankBlock.innerHTML = `<div>🎯 尚未建立特工身分，無法查看您的關卡排行</div>`;
            } else if (myMissionRank === -1) {
              rankBlock.innerHTML = `<div>🎯 特工 ${this._escapeHtml(currentUser.nickname)} | 本關卡（Mission ${this.currentMission}）尚未入榜</div>`;
            } else {
              rankBlock.innerHTML = `
                <div>🎯 我的本關排名：第 <span class="text-green-400 font-bold">${myMissionRank + 1}</span> 名</div>
                <div>成績：<span class="text-green-400 font-bold">${myMissionRecord.stars} ⭐</span> | 均速：${myMissionRecord.avg_time.toFixed(2)}s | 最快：${myMissionRecord.min_time.toFixed(2)}s</div>
              `;
            }
          }

          // 渲染列表 Top 50 關卡紀錄 (僅顯示名次、暱稱、班級座號、獲得星星數、平均秒數、單題最快秒數)
          const top50Missions = missionRecords.slice(0, 50);
          container.innerHTML = top50Missions.map((row, idx) => {
            const rank = idx + 1;
            const icon = RANK_ICONS[rank] || `#${rank}`;
            const isTop3 = rank <= 3;
            const isMe = currentUser && row.grade_class === currentUser.grade_class && row.seat_number === currentUser.seat_number;
            const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
            const meBorderClass = isMe ? 'border-2 border-cyan-500 bg-cyan-950/20' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

            return `
              <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
                <div class="flex items-center gap-2">
                  <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
                  <span class="text-slate-400 text-[9px] font-tech">[${row.grade_class}班 ${row.seat_number}號]</span>
                  <span class="text-white text-[11px] font-bold">${this._escapeHtml(row.nickname)}</span>
                  ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
                </div>
                <div class="text-right flex items-center gap-2">
                  <span class="text-green-400 font-bold">${row.stars}⭐</span>
                  <span class="text-slate-500 text-[9px] font-tech">均速: ${row.avg_time.toFixed(2)}s</span>
                  <span class="text-cyan-400 text-[9px] font-tech">最快: ${row.min_time.toFixed(2)}s</span>
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (err) {
        console.warn("[Leaderboard] 載入排行榜失敗：", err.message);
        container.innerHTML = `<div class="text-center text-red-500 font-pixel text-[10px] py-8">⚠️ 排行榜載入失敗，請確認資料庫設定！</div>`;
      }
    },

    // 防 XSS
    _escapeHtml(text) {
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

        // 關卡分類榜時顯示 Mission 下拉選單，其餘隱藏
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
