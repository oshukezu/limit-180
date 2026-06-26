// MathSprint Game Helper Module
// Contains SPA view switcher, background scanner visual effects, session validation, reward notification, and cloud sync helper.

(function() {
  // Unified UI feedback layer: toast + confirm modal
  const UIFeedback = {
    ensureMounted() {
      if (document.getElementById('limit180-toast-root')) return;
      const toastRoot = document.createElement('div');
      toastRoot.id = 'limit180-toast-root';
      toastRoot.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:100000;display:flex;flex-direction:column;gap:8px;max-width:360px;';
      document.body.appendChild(toastRoot);

      const modal = document.createElement('div');
      modal.id = 'limit180-confirm-modal';
      modal.className = 'hidden';
      modal.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:16px;';
      modal.innerHTML = `
        <div style="width:min(460px,100%);background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.5);">
          <div id="limit180-confirm-title" style="font-size:16px;color:#f8fafc;font-weight:700;margin-bottom:8px;">請確認</div>
          <div id="limit180-confirm-message" style="font-size:13px;color:#cbd5e1;line-height:1.6;white-space:pre-wrap;"></div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
            <button id="limit180-confirm-cancel" class="cyber-btn px-4 py-2 text-xs text-slate-200">取消</button>
            <button id="limit180-confirm-ok" class="cyber-btn cyber-btn-green px-4 py-2 text-xs text-green-300">確定</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    },

    toast(message, type = 'info') {
      this.ensureMounted();
      const root = document.getElementById('limit180-toast-root');
      if (!root) return;
      const color = type === 'error' ? '#ef4444' : (type === 'success' ? '#22c55e' : '#38bdf8');
      const item = document.createElement('div');
      item.style.cssText = `background:#020617;border:1px solid ${color};color:#e2e8f0;padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.5;box-shadow:0 8px 16px rgba(0,0,0,.35);`;
      item.textContent = message;
      root.appendChild(item);
      setTimeout(() => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(6px)';
        item.style.transition = 'all .2s ease';
      }, 2600);
      setTimeout(() => item.remove(), 2900);
    },

    confirm(message, title = '請確認') {
      this.ensureMounted();
      const modal = document.getElementById('limit180-confirm-modal');
      const titleEl = document.getElementById('limit180-confirm-title');
      const msgEl = document.getElementById('limit180-confirm-message');
      const okBtn = document.getElementById('limit180-confirm-ok');
      const cancelBtn = document.getElementById('limit180-confirm-cancel');
      if (!modal || !titleEl || !msgEl || !okBtn || !cancelBtn) return Promise.resolve(false);

      titleEl.textContent = title;
      msgEl.textContent = message;
      modal.style.display = 'flex';

      return new Promise((resolve) => {
        const onOk = () => done(true);
        const onCancel = () => done(false);
        const onOverlay = (e) => { if (e.target === modal) done(false); };
        const done = (v) => {
          modal.style.display = 'none';
          okBtn.removeEventListener('click', onOk);
          cancelBtn.removeEventListener('click', onCancel);
          modal.removeEventListener('click', onOverlay);
          resolve(v);
        };
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        modal.addEventListener('click', onOverlay);
      });
    }
  };
  window.UIFeedback = UIFeedback;

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

    // 如果進入大廳，自動更新渲染大廳數據
    if (viewId === 'view-lobby') {
      if (window.MathSprintGame && typeof window.MathSprintGame.renderLobby === 'function') {
        window.MathSprintGame.renderLobby();
      }
    }

    // 如果進入錯題消除，自動更新渲染錯題消除工作區與側欄金幣
    if (viewId === 'view-review') {
      if (window.MathSprintGame && typeof window.MathSprintGame.setupLobbyReviewMode === 'function') {
        window.MathSprintGame.setupLobbyReviewMode();
      }
      const profile = window.MathSprintStorage ? window.MathSprintStorage.getProfile() : null;
      if (profile) {
        const displayEl = document.getElementById('review-stars-display');
        if (displayEl) displayEl.textContent = window.formatCoins(profile.total_stars || 0, true);
        document.querySelectorAll('.skip-exam-ticket-count').forEach(el => {
          el.textContent = Number(profile.skip_exam_tickets || 0).toLocaleString('zh-TW');
        });
      }
    }

    // 如果進入商店，自動渲染商店介面
    if (viewId === 'view-store') {
      if (window.GameStore) {
        window.GameStore.renderStore();
      }
    }
    
    // 如果進入遊戲，隱藏 header 與 footer
    if (viewId === 'view-game') {
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
      if (window.UIFeedback) {
        window.UIFeedback.toast(detail.text, 'success');
      } else {
        alert(detail.text);
      }
      
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
