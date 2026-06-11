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

        if (id === 'lobby-close-btn' || id === 'dashboard-close-btn' || id === 'achievements-close-btn') {
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
      if (window.MathSprintGame && window.MathSprintGame.stopGame) {
        window.MathSprintGame.stopGame();
      }
      if (window.showView) {
        window.showView('view-home');
      }
    },

    closeReview() {
      // 觸發錯題消除進度序列化保存
      if (window.MathSprintGame && window.MathSprintGame.saveReviewProgress) {
        window.MathSprintGame.saveReviewProgress();
      }
      this.closeToHome();
    },

    closeGame() {
      if (confirm(`確定要放棄本次挑戰，返回首頁嗎？`)) {
        if (window.MathSprintGame && window.MathSprintGame.interruptGame) {
          window.MathSprintGame.interruptGame();
        }
        if (window.showView) {
          window.showView('view-home');
        }
      }
    }
  };

  // 立即初始化（事件代理不需要等待 DOMContentLoaded 或元件異步 fetch 載入）
  UIController.init();

  window.MathSprintUIController = UIController;
})();
