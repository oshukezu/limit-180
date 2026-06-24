// Limit 180 — 全校速算聯賽排行榜模組 (Leaderboard)
// 負責首頁排行榜的資料獲取、DOM 動態渲染與即時刷新。
(function() {
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

      if (offlineNotice) offlineNotice.classList.add('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      const profileStr = localStorage.getItem('limit180_user_profile');
      const currentUser = profileStr ? JSON.parse(profileStr) : null;

      let allRecords = [];
      try {
        if (!window.MathSprintSupabaseService) {
          throw new Error("Supabase 服務未加載");
        }
        allRecords = await window.MathSprintSupabaseService.getLeaderboard(1000);
      } catch (err) {
        console.warn("[Leaderboard] 雲端載入連線失敗：", err.message);
        container.innerHTML = `<div class="text-center text-red-500 font-pixel text-[10px] py-8">⚠️ 排行榜載入失敗，請確認資料庫設定！</div>`;
        if (rankBlock) rankBlock.classList.add('hidden');
        return;
      }

      if (!Array.isArray(allRecords)) {
        allRecords = [];
      }

      const Renders = window.MathSprintLeaderboardRenders;
      if (!Renders) {
        container.innerHTML = `<div class="text-center text-red-500 font-pixel text-[10px] py-8">⚠️ 渲染器未加載</div>`;
        return;
      }

      try {
        if (this.currentTab === 'personal') {
          Renders.renderPersonal(container, rankBlock, allRecords, currentUser);
        } else if (this.currentTab === 'team') {
          Renders.renderTeam(container, rankBlock, allRecords, currentUser);
        } else if (this.currentTab === 'mission') {
          Renders.renderMission(container, rankBlock, allRecords, currentUser, this.currentMission);
        }
      } catch (renderErr) {
        console.error("[Leaderboard] 渲染失敗：", renderErr);
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">⚠️ 載入排行榜列表失敗</div>`;
      }
    },

    // 初始化與綁定事件
    async init() {
      const missionSelect = document.getElementById('leaderboard-mission-select');
      if (missionSelect) {
        const count = Object.keys(window.MathSprintConfigs.MISSION_CONFIGS).length;
        missionSelect.innerHTML = Array.from({ length: count }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
        missionSelect.addEventListener('change', (e) => {
          this.currentMission = parseInt(e.target.value);
          this.renderLeaderboard().catch(() => {});
        });
      }

      const tabs = {
        personal: document.getElementById('tab-leaderboard-personal'),
        team: document.getElementById('tab-leaderboard-team'),
        mission: document.getElementById('tab-leaderboard-mission')
      };

      const selectContainer = document.getElementById('leaderboard-select-container');

      const switchTab = (tabName) => {
        this.currentTab = tabName;
        if (window.changeScannerColor) window.changeScannerColor();

        Object.keys(tabs).forEach(k => {
          if (!tabs[k]) return;
          if (k === tabName) {
            tabs[k].classList.remove('text-slate-400');
            tabs[k].classList.add('text-white', 'border-b-2', 'border-white', 'font-bold');
          } else {
            tabs[k].classList.add('text-slate-400');
            tabs[k].classList.remove('text-white', 'border-b-2', 'border-white', 'font-bold');
          }
        });

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

      await this.renderLeaderboard();
    }
  };

  window.addEventListener('limit180ComponentsLoaded', () => {
    Leaderboard.init().catch(() => {});
  });

  window.MathSprintLeaderboard = Leaderboard;
})();
