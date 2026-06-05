// MathSprint 2.0 — 排行榜模組 (Leaderboard)
// 負責即時排行榜的讀取、訂閱與渲染

(function() {
  const CFG = window.MATH_SPRINT_CONFIG;

  // 即使雲端未啟用，仍提供空殼函式避免其他模組出錯
  if (!CFG || !CFG.CLOUD_ENABLED) {
    window.MathSprintLeaderboard = {
      init: () => {},
      subscribeRealtime: () => {},
      fetchLeaderboard: async () => [],
      submitScore: async () => {}
    };
    return;
  }

  const supabase = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  // 名次圖示
  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const MISSION_NAMES = {
    1: 'M1 加減入門', 2: 'M2 乘法特訓', 3: 'M3 除法突破',
    4: 'M4 進位加減', 5: 'M5 百位加減', 6: 'M6 九九乘除',
    7: 'M7 混合四則', 8: 'M8 分數小數', 9: 'M9 代數負數',
    10: 'M10 傳奇殿堂'
  };

  let realtimeChannel = null;
  let currentMissionFilter = 1;

  const Leaderboard = {
    // 從 Supabase 讀取指定 Mission 的前 100 名
    async fetchLeaderboard(missionNum) {
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('nickname, mission_num, best_avg_time, recorded_at')
          .eq('mission_num', missionNum)
          .order('best_avg_time', { ascending: true })
          .limit(100);

        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn('[Leaderboard] fetchLeaderboard 失敗:', e.message);
        return [];
      }
    },

    // 提交分數至排行榜（通過防作弊驗證後呼叫）
    async submitScore(missionNum, avgTime) {
      const userId = window.MathSprintAuth?.currentUser?.id;
      if (!userId) return;

      const nickname = window.MathSprintAuth?.getNickname() || 'PIXEL-????';

      try {
        const { error } = await supabase
          .from('leaderboard')
          .upsert({
            user_id: userId,
            nickname: nickname,
            mission_num: missionNum,
            best_avg_time: parseFloat(avgTime.toFixed(3)),
            recorded_at: new Date().toISOString()
          }, { onConflict: 'user_id,mission_num' });

        // 只有在新成績比舊成績更好時更新（利用 DB trigger 或在前端判斷）
        if (error) throw error;
        console.log('[Leaderboard] ✅ 分數提交成功');
      } catch (e) {
        console.warn('[Leaderboard] submitScore 失敗:', e.message);
      }
    },

    // 訂閱 Realtime 更新（排行榜有新資料時自動刷新 UI）
    subscribeRealtime() {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }

      realtimeChannel = supabase
        .channel('leaderboard-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leaderboard' },
          async (payload) => {
            console.log('[Leaderboard] 即時更新收到:', payload.eventType);
            // 若更新的 Mission 與目前顯示的相同，重新渲染
            if (payload.new?.mission_num === currentMissionFilter ||
                payload.old?.mission_num === currentMissionFilter) {
              await this.renderLeaderboardPanel(currentMissionFilter);
              this._pulseIndicator();
            }
          }
        )
        .subscribe();
    },

    // 渲染首頁排行榜面板
    async renderLeaderboardPanel(missionNum) {
      missionNum = missionNum || currentMissionFilter;
      currentMissionFilter = missionNum;

      const container = document.getElementById('leaderboard-list');
      const emptyState = document.getElementById('leaderboard-empty');
      if (!container) return;

      container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-xs py-4 animate-pulse">載入中...</div>`;

      const rows = await this.fetchLeaderboard(missionNum);

      if (!rows || rows.length === 0) {
        container.innerHTML = '';
        emptyState && emptyState.classList.remove('hidden');
        return;
      }

      emptyState && emptyState.classList.add('hidden');

      container.innerHTML = rows.map((row, idx) => {
        const rank = idx + 1;
        const icon = RANK_ICONS[rank] || `#${rank}`;
        const isTop3 = rank <= 3;
        const timeStr = row.best_avg_time.toFixed(2) + 's';

        const rankClass = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-orange-400' : 'text-slate-500';

        return `
          <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''}">
            <span class="leaderboard-rank ${rankClass}">${icon}</span>
            <span class="leaderboard-nick">${this._escapeHtml(row.nickname)}</span>
            <span class="leaderboard-time">${timeStr} / 題</span>
          </div>
        `;
      }).join('');
    },

    // 渲染 Mission 選擇器下拉
    renderMissionSelector() {
      const sel = document.getElementById('leaderboard-mission-select');
      if (!sel) return;

      sel.innerHTML = Object.entries(MISSION_NAMES).map(([num, name]) =>
        `<option value="${num}" ${num == currentMissionFilter ? 'selected' : ''}>${name}</option>`
      ).join('');

      sel.addEventListener('change', async (e) => {
        currentMissionFilter = parseInt(e.target.value);
        await this.renderLeaderboardPanel(currentMissionFilter);
      });
    },

    // 即時更新指示器閃爍效果
    _pulseIndicator() {
      const dot = document.getElementById('leaderboard-live-dot');
      if (!dot) return;
      dot.style.transform = 'scale(1.6)';
      dot.style.background = '#39ff14';
      setTimeout(() => {
        dot.style.transform = 'scale(1)';
        dot.style.background = '';
      }, 600);
    },

    // 防 XSS
    _escapeHtml(text) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(text));
      return div.innerHTML;
    },

    // 初始化
    async init() {
      this.renderMissionSelector();
      await this.renderLeaderboardPanel(1);
      this.subscribeRealtime();
    }
  };

  window.MathSprintLeaderboard = Leaderboard;
})();
