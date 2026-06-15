// MathSprint Game Helper Module
// Contains SPA view switcher, background scanner visual effects, session validation, reward notification, and cloud sync helper.

(function() {
  // SPA views switcher
  let currentView = 'view-home';
  window.currentView = currentView; // 掛載至全域以利子元件存取
  
  // 動態切換雙軌流光相同霓虹顏色
  function changeScannerColor() {
    const scanner1 = document.querySelector('.scanner-line-1');
    const scanner2 = document.querySelector('.scanner-line-2');
    if (scanner1 && scanner2) {
      let neonColors = ['#ff007f', '#39ff14', '#00f0ff'];
      if (window.ThemeManager && window.MathSprintStorage) {
        const profile = window.MathSprintStorage.getProfile();
        const themeId = profile.equipped_theme || 'akaimon';
        const theme = window.ThemeManager.THEMES[themeId];
        if (theme && theme.id !== 'akaimon') {
          neonColors = theme.preview;
        }
      }
      const color = neonColors[Math.floor(Math.random() * neonColors.length)];
      scanner1.style.background = color;
      scanner1.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;
      scanner2.style.background = color;
      scanner2.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;
    }
  }
  window.changeScannerColor = changeScannerColor;
  
  // 首次載入時初始化雙軌流光為同色
  changeScannerColor();

  function showView(viewId) {
    changeScannerColor();

    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
      currentView = viewId;
      window.currentView = viewId; // 同步更新全域變數
    }
    
    // 如果進入首頁，自動渲染反應數據圖表
    if (viewId === 'view-home') {
      if (window.MathSprintDashboard) {
        window.MathSprintDashboard.renderCharts();
      }
    }

    // 如果進入商店，自動渲染商店介面
    if (viewId === 'view-store') {
      if (window.GameStore) {
        window.GameStore.renderStore();
      }
    }
    
    // 如果進入遊戲或複習，隱藏 header 與 footer
    if (viewId === 'view-game' || viewId === 'view-review') {
      document.body.classList.add('body-in-game');
    } else {
      document.body.classList.remove('body-in-game');
    }
    
    const warning = document.getElementById('input-warning');
    const scannerLine = document.querySelector('.scanner-line');
    if (viewId === 'view-game') {
      warning.classList.remove('hidden');
      if (scannerLine) scannerLine.style.display = 'none';
    } else {
      warning.classList.add('hidden');
      if (scannerLine) scannerLine.style.display = '';
    }
  }
  window.showView = showView; // 掛載至全域，供 ui-controller 與其它元件呼叫

  const Helper = {
    async verifySession(profile) {
      if (!window.MathSprintSupabaseService) return;
      try {
        const db = window.MathSprintSupabaseService.initSupabase();
        if (!db) return;

        const { data, error } = await db
          .from('users_profile')
          .select('id')
          .eq('grade_class', profile.grade_class)
          .eq('seat_number', profile.seat_number)
          .limit(1);

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn('[Session Verification] 偵測到雲端帳號不存在，啟動自動淨化機制...');
          localStorage.clear();
          window.location.reload();
          await new Promise(() => {});
        } else {
          console.log('[Session Verification] 雲端身份驗證通過。');
        }
      } catch (err) {
        console.warn('[Session Verification] 雲端身份校驗跳過（網路或服務波動）：', err.message || err);
      }
    },

    showBonusStarAlert(detail) {
      alert(detail.text);
      
      if (typeof confetti !== 'undefined') {
        if (detail.type === 'mission_complete' || detail.type === 'daily_first_win') {
          let duration = 3 * 1000;
          let end = Date.now() + duration;

          (function frame() {
            confetti({
              particleCount: 6,
              angle: 60,
              spread: 55,
              origin: { x: 0 }
            });
            confetti({
              particleCount: 6,
              angle: 120,
              spread: 55,
              origin: { x: 1 }
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        } else {
          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.6 }
          });
        }
      }
    },

    async _submitCloudResult(missionNum, levelNum, questionTimes, correctCount, totalQuestions, avgTime) {
      const CFG = window.MATH_SPRINT_CONFIG;
      if (!CFG || !CFG.CLOUD_ENABLED) return;
      if (!navigator.onLine) return;

      try {
        if (window.MathSprintOnboarding && window.MathSprintOnboarding.syncCurrentStatsToCloud) {
          await window.MathSprintOnboarding.syncCurrentStatsToCloud(missionNum);
        }
      } catch (e) {
        console.warn('[Game] _submitCloudResult 例外:', e.message);
      }
    }
  };

  // Mixin into MathSprintGame
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Helper);
})();
