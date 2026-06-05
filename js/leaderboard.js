// Limit 180 — 全校速算聯賽排行榜模組 (Leaderboard)
// 負責首頁排行榜的資料獲取、DOM 動態渲染與即時刷新。
(function() {
  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  const Leaderboard = {
    // 渲染全校排行榜
    async renderLeaderboard() {
      const container = document.getElementById('leaderboard-list');
      const emptyState = document.getElementById('leaderboard-empty');
      const offlineNotice = document.getElementById('leaderboard-offline-notice');
      
      if (!container) return;

      // 確保將離線提示隱藏
      if (offlineNotice) {
        offlineNotice.classList.add('hidden');
      }

      try {
        if (!window.MathSprintSupabaseService) {
          throw new Error("Supabase 服務未加載");
        }

        // 調用 supabase-service.js 的 getLeaderboard 函式 (內建前端 SHA-256 防竄改驗證)
        const data = await window.MathSprintSupabaseService.getLeaderboard();

        if (!data || data.length === 0) {
          container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8 leading-relaxed">暫無數據，新賽季等待全台強者開拓！</div>`;
          if (emptyState) emptyState.classList.add('hidden');
          return;
        }

        if (emptyState) {
          emptyState.classList.add('hidden');
        }

        container.innerHTML = data.map((row, idx) => {
          const rank = idx + 1;
          const icon = RANK_ICONS[rank] || `#${rank}`;
          const isTop3 = rank <= 3;
          
          // 格式化速度 (保留兩位小數)
          const avgTimeStr = typeof row.best_avg_time === 'number' ? row.best_avg_time.toFixed(2) : '99.90';
          
          // 格式化年級班級 (如 501 顯示為 [501班])
          const displayClass = `${row.grade_class}班`;

          const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';

          return `
            <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} flex justify-between items-center py-2 px-3 border-b border-slate-900/50 hover:bg-slate-800/10 text-xs font-pixel">
              <div class="flex items-center gap-2">
                <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
                <span class="text-slate-400 text-[9px] font-tech">[${displayClass}]</span>
                <span class="text-white text-[11px] font-bold">${this._escapeHtml(row.nickname)}</span>
              </div>
              <div class="text-right">
                <span class="text-green-400 font-bold">${row.total_stars}⭐</span>
                <span class="text-slate-500 text-[9px] font-tech ml-1">(${avgTimeStr}s)</span>
              </div>
            </div>
          `;
        }).join('');

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

    // 初始化
    async init() {
      // 隱藏分關 Mission 選擇器下拉選單，因為聯賽排行是總分制綜合排名
      const missionSelect = document.getElementById('leaderboard-mission-select');
      if (missionSelect) {
        const parent = missionSelect.parentElement;
        if (parent) parent.classList.add('hidden');
      }

      await this.renderLeaderboard();
    }
  };

  // 當 SPA 視圖加載完成後自動初始化 (Fetch on Load)
  window.addEventListener('limit180ComponentsLoaded', () => {
    Leaderboard.init().catch(() => {});
  });

  window.MathSprintLeaderboard = Leaderboard;
})();
