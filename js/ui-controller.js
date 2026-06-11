// Limit 180 — UI & 導航控制器 (UI & Navigation Controller)
// 負責處理各分頁的「X」關閉按鈕點擊事件，並確保在退出時觸發正確的清理與保存邏輯。
(function() {
  const UIController = {
    hasInitialized: false,

    init() {
      if (this.hasInitialized) return;
      this.hasInitialized = true;

      // 綁定大廳的 X 按鈕
      const lobbyClose = document.getElementById('lobby-close-btn');
      if (lobbyClose) {
        lobbyClose.addEventListener('click', () => {
          this.closeToHome();
        });
      }

      // 綁定家長戰報的 X 按鈕
      const dashboardClose = document.getElementById('dashboard-close-btn');
      if (dashboardClose) {
        dashboardClose.addEventListener('click', () => {
          this.closeToHome();
        });
      }

      // 綁定成就牆的 X 按鈕
      const achievementsClose = document.getElementById('achievements-close-btn');
      if (achievementsClose) {
        achievementsClose.addEventListener('click', () => {
          this.closeToHome();
        });
      }

      // 綁定錯題消除的 X 按鈕
      const reviewClose = document.getElementById('review-close-btn');
      if (reviewClose) {
        reviewClose.addEventListener('click', () => {
          this.closeReview();
        });
      }

      // 綁定遊戲介面的 X 按鈕
      const gameClose = document.getElementById('game-close-btn');
      if (gameClose) {
        gameClose.addEventListener('click', () => {
          this.closeGame();
        });
      }

      console.log('[UIController] 成功初始化並綁定各視圖的右上角「X」關閉按鈕事件。');
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

  const checkAndInit = () => {
    // 雙重防禦：如果 DOM 中已經加載了任何一個 X 按鈕，則直接開始初始化事件綁定
    if (document.getElementById('lobby-close-btn') || 
        document.getElementById('game-close-btn') || 
        document.getElementById('review-close-btn')) {
      UIController.init();
    }
  };

  // 當 SPA 元件加載完成後自動初始化
  window.addEventListener('limit180ComponentsLoaded', () => {
    UIController.init();
  });

  // 立即檢查一次（防止在事件監聽註冊前就已經完成了 fetch 載入的競態問題）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }

  window.MathSprintUIController = UIController;
})();
