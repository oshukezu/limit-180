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
        const closeBtn = e.target.closest('.close-btn');
        if (!closeBtn) return;

        const id = closeBtn.id;
        console.log(`[UIController] 偵測到關閉按鈕點擊，ID: ${id}`);

        if (id === 'lobby-close-btn' || id === 'dashboard-close-btn' || id === 'achievements-close-btn' || id === 'store-close-btn') {
          this.closeToHome();
        } else if (id === 'review-close-btn') {
          this.closeReview();
        } else if (id === 'game-close-btn') {
          this.closeGame();
        }
      });

      console.log('[UIController] 成功以事件代理 (Event Delegation) 初始化全域「X」關閉監聽。');
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
