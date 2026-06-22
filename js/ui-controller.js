// Limit 180 — UI & 導航控制器 (UI & Navigation Controller)
// 負責處理各分頁的「X」關閉按鈕點擊事件，並確保在退出時觸發正確的清理與保存邏輯。
(function() {
  const UIController = {
    hasInitialized: false,

    init() {
      if (this.hasInitialized) return;
      this.hasInitialized = true;

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

        // 點擊導航項時自動關閉抽屜
        const navButtons = drawer.querySelectorAll('#main-nav button');
        navButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            closeDrawer();
            
            // 路由控制邏輯
            const id = btn.id;
            if (id === 'nav-home-btn') {
              this.closeToHome();
            } else if (id === 'nav-lobby-btn') {
              window.showView('view-lobby');
            } else if (id === 'nav-dashboard-btn') {
              window.showView('view-dashboard');
            } else if (id === 'nav-achievements-btn') {
              window.showView('view-achievements');
            } else if (id === 'nav-store-btn') {
              window.showView('view-store');
            }
          });
        });
      }

      // 偵測獨立管理員網址 `?admin=true` 或 `?admin`
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('admin')) {
        console.log('[UIController] 偵測到管理員入口參數，正在載入教師管理後台...');
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

    closeToHome() {
      // 1. 立即切換 UI，0.1 秒內順暢跳轉
      document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
      });
      const home = document.getElementById('view-home');
      if (home) {
        home.classList.remove('hidden');
      }
      const adminView = document.getElementById('view-admin');
      if (adminView) adminView.classList.add('hidden');
      
      document.body.classList.remove('body-in-game');
      const scannerLine = document.querySelector('.scanner-line');
      if (scannerLine) scannerLine.style.display = '';

      // 2. 安全停損：若在遊戲中，關閉計時器並清理記憶體暫存，絕不向 Supabase 發送請求
      if (window.MathSprintGame) {
        if (window.MathSprintGame.timerInterval) {
          clearInterval(window.MathSprintGame.timerInterval);
          window.MathSprintGame.timerInterval = null;
        }
        if (window.MathSprintGame.interruptGame) {
          window.MathSprintGame.interruptGame();
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
    },

    closeReview() {
      // 3. 進度保存：若在錯題消除中，僅以 JSON 儲存回本地，完全不牽涉 Supabase 的非同步等待
      if (window.MathSprintGame && window.MathSprintGame.saveReviewProgress) {
        window.MathSprintGame.saveReviewProgress();
      }
      this.closeToHome();
    },

    closeGame() {
      if (confirm(`確定要放棄本次挑戰，返回首頁嗎？`)) {
        this.closeToHome();
      }
    }
  };

  // 立即初始化（事件代理不需要等待 DOMContentLoaded 或元件異步 fetch 載入）
  UIController.init();

  window.MathSprintUIController = UIController;
})();
