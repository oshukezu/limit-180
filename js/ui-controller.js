// Limit 180 — UI & 導航控制器 (UI & Navigation Controller)
// 負責處理各分頁的「X」關閉按鈕點擊事件，並確保在退出時觸發正確的清理與保存邏輯。
(function() {
  const UIController = {
    hasInitialized: false,

    init() {
      if (this.hasInitialized) return;
      this.hasInitialized = true;
      this.initAccessibilityMode();
      this.initHomeAccordion();

      // 使用事件代理 (Event Delegation) 監聽全域點擊事件，防止 Race Condition 與動態渲染 DOM 失效
      document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('.close-btn, #game-close-btn');
        if (!closeBtn) return;

        const id = closeBtn.id;
        console.log(`[UIController] 偵測到關閉按鈕點擊，ID: ${id}`);

        if (id === 'lobby-close-btn' || id === 'dashboard-close-btn' || id === 'achievements-close-btn' || id === 'store-close-btn' || id === 'admin-close-btn') {
          this.closeToHome();
        } else if (id === 'review-close-btn') {
          this.closeReview();
        } else if (id === 'game-close-btn') {
          this.closeGame();
        }
      });

      // 綁定 Hamburger Drawer 選單邏輯
      const drawerToggle = document.getElementById('drawer-toggle-btn');
      const drawerClose = document.getElementById('drawer-close-btn');
      const drawer = document.getElementById('side-drawer');
      const overlay = document.getElementById('drawer-overlay');

      if (drawerToggle && drawer && overlay) {
        drawerToggle.addEventListener('click', () => {
          drawer.classList.remove('translate-x-full');
          overlay.classList.remove('hidden');
        });

        const closeDrawer = () => {
          drawer.classList.add('translate-x-full');
          overlay.classList.add('hidden');
        };

        if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);

        // 點擊導航項時僅關閉抽屜；路由一律交由 game-events.js 處理，避免雙重綁定衝突
        drawer.addEventListener('click', (e) => {
          const navBtn = e.target.closest('#main-nav button');
          if (navBtn) closeDrawer();
        });
      }

      // 偵測獨立管理員網址 `?admin=true` 或 `?admin`
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('admin')) {
        console.log('[UIController] 偵測到管理員入口參數，正在載入管理後台...');
        window.addEventListener('limit180ComponentsLoaded', () => {
          setTimeout(() => {
            window.showView('view-admin');
            if (window.GameAdmin && typeof window.GameAdmin.initAdmin === 'function') {
              window.GameAdmin.initAdmin();
            }
          }, 200);
        });
      }

      console.log('[UIController] 成功以事件代理 (Event Delegation) 初始化全域「X」關閉與 Drawer 監聽。');
    },

    initAccessibilityMode() {
      const toggleBtn = document.getElementById('accessibility-toggle-btn');
      const saved = localStorage.getItem('limit180_accessible_mode') === '1';
      document.body.classList.toggle('accessible-mode', saved);
      if (toggleBtn) {
        toggleBtn.textContent = `易讀模式：${saved ? '開' : '關'}`;
        toggleBtn.addEventListener('click', () => {
          const enabled = !document.body.classList.contains('accessible-mode');
          document.body.classList.toggle('accessible-mode', enabled);
          localStorage.setItem('limit180_accessible_mode', enabled ? '1' : '0');
          toggleBtn.textContent = `易讀模式：${enabled ? '開' : '關'}`;
        });
      }
    },

    initHomeAccordion() {
      window.addEventListener('limit180ComponentsLoaded', () => {
        const ids = [
          'home-dashboard-wrapper',
          'home-rules-wrapper',
          'home-achievements-wrapper',
          'home-store-wrapper'
        ];
        const wrappers = ids
          .map((id) => document.getElementById(id))
          .filter(Boolean);
        if (wrappers.length === 0) return;

        const renderOnOpen = (id) => {
          if (id === 'home-achievements-wrapper' && window.MathSprintAchievements?.renderAchievements) {
            const mission = window.MathSprintGame?.gameState?.currentMission || 1;
            const select = document.getElementById('achievements-mission-select');
            if (select) select.value = mission;
            window.MathSprintAchievements.renderAchievements(mission);
          }
          if (id === 'home-store-wrapper' && window.GameStore?.renderStore) {
            window.GameStore.renderStore();
          }
          if (id === 'home-dashboard-wrapper' && window.MathSprintDashboard?.renderCharts) {
            window.MathSprintDashboard.renderCharts();
          }
        };

        wrappers.forEach((current) => {
          current.addEventListener('toggle', () => {
            if (!current.open) return;
            wrappers.forEach((other) => {
              if (other !== current) other.open = false;
            });
            renderOnOpen(current.id);
          });
        });
      });
    },

    closeToHome() {
      // 1. 安全停損：離開遊戲頁時統一中斷流程，避免殘留計時器與狀態
      if (window.MathSprintGame) {
        if ((window.currentView === 'view-game' || window.currentView === 'view-review') && window.MathSprintGame.interruptGame) {
          window.MathSprintGame.interruptGame();
        } else if (window.MathSprintGame.stopGame) {
          window.MathSprintGame.stopGame();
        }

        // 顯示被暫存的星星獎勵提示
        if (window.MathSprintGame._pendingRewards && window.MathSprintGame._pendingRewards.length > 0) {
          setTimeout(() => {
            window.MathSprintGame._pendingRewards.forEach(detail => {
              window.MathSprintGame.showBonusStarAlert(detail);
            });
            window.MathSprintGame._pendingRewards = [];
          }, 500);
        }
      }

      // 2. 回首頁統一使用 showView，確保 currentView、body class 與 scanner 狀態一致
      if (window.showView) {
        window.showView('view-home');
      }
    },

    closeReview() {
      // 3. 進度保存：若在錯題消除中，僅以 JSON 儲存回本地，完全不牽涉 Supabase 的非同步等待
      if (window.MathSprintGame && window.MathSprintGame.saveReviewProgress) {
        window.MathSprintGame.saveReviewProgress();
      }
      this.closeToHome();
    },

    async closeGame() {
      const shouldLeave = window.UIFeedback
        ? await window.UIFeedback.confirm('確定要放棄本次挑戰並返回首頁嗎？', '離開挑戰')
        : confirm(`確定要放棄本次挑戰，返回首頁嗎？`);
      if (shouldLeave) {
        this.closeToHome();
      }
    }
  };

  // 立即初始化（事件代理不需要等待 DOMContentLoaded 或元件異步 fetch 載入）
  UIController.init();

  window.MathSprintUIController = UIController;
})();
