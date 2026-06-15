// Limit 180 — 輸入事件代理與導航模組 (Events Module)
(function() {
  const Events = {
    bindEvents() {
      // 導航點擊事件
      const logoTitle = document.getElementById('nav-logo-title');
      if (logoTitle) {
        logoTitle.addEventListener('click', () => {
          this.stopGame();
          window.showView('view-home');
        });
      }
      
      const navHomeBtn = document.getElementById('nav-home-btn');
      if (navHomeBtn) {
        navHomeBtn.addEventListener('click', () => {
          this.stopGame();
          window.showView('view-home');
        });
      }
      
      const navDashboard = document.getElementById('nav-dashboard-btn');
      if (navDashboard) {
        navDashboard.addEventListener('click', () => {
          this.stopGame();
          window.showView('view-home');
          if (window.MathSprintDashboard) {
            window.MathSprintDashboard.renderCharts();
          }
          setTimeout(() => {
            const target = document.getElementById('home-dashboard-section');
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        });
      }

      const navAchievements = document.getElementById('nav-achievements-btn');
      if (navAchievements) {
        navAchievements.addEventListener('click', () => {
          this.stopGame();
          if (window.MathSprintAchievements) {
            const select = document.getElementById('achievements-mission-select');
            if (select) select.value = this.gameState.currentMission;
            window.MathSprintAchievements.renderAchievements(this.gameState.currentMission);
          }
          window.showView('view-achievements');
        });
      }

      const navStoreBtn = document.getElementById('nav-store-btn');
      if (navStoreBtn) {
        navStoreBtn.addEventListener('click', () => {
          this.stopGame();
          window.showView('view-store');
        });
      }

      // Lobby navigation
      const lobbyBtnHandler = () => {
        this.stopGame();
        this.renderLobby();
        window.showView('view-lobby');
      };

      const startLevelsBtn = document.getElementById('start-levels-btn');
      if (startLevelsBtn) {
        startLevelsBtn.addEventListener('click', lobbyBtnHandler);
      }
      const navLobbyBtn = document.getElementById('nav-lobby-btn');
      if (navLobbyBtn) {
        navLobbyBtn.addEventListener('click', lobbyBtnHandler);
      }
      
      // Result actions
      const resLobbyBtn = document.getElementById('result-lobby-btn');
      if (resLobbyBtn) {
        resLobbyBtn.addEventListener('click', () => {
          const hasProfile = !!localStorage.getItem('limit180_user_profile');
          if (hasProfile) {
            this.renderLobby();
            window.showView('view-lobby');
          } else {
            const skip = confirm("【建立特工身份】\n\n建議您先註冊身份，以便儲存您辛苦挑戰的成績並同步到排行榜！\n\n按「確定」前往註冊，按「取消」即可「暫時略過」並以訪客身份前往大廳。");
            if (skip) {
              if (window.MathSprintOnboarding && window.MathSprintOnboarding.showProfileModal) {
                let totalPendingCoins = 0;
                if (this._tempPendingRecords) {
                  for (let key in this._tempPendingRecords) {
                    const rec = this._tempPendingRecords[key];
                    totalPendingCoins += (rec.coins || 0) + (rec.guest_bonus_stars || 0);
                  }
                }
                window.MathSprintOnboarding.showProfileModal(false, totalPendingCoins);
              }
            } else {
              this.renderLobby();
              window.showView('view-lobby');
            }
          }
        });
      }

      const resRetryBtn = document.getElementById('result-retry-btn');
      if (resRetryBtn) {
        resRetryBtn.addEventListener('click', () => {
          if (this.gameState.isReviewMode) {
            this.startReviewMode();
          } else {
            this.startGame(this.gameState.currentMission, this.gameState.currentLevel);
          }
        });
      }

      // 往下一關按鈕事件
      const resNextBtn = document.getElementById('result-next-btn');
      if (resNextBtn) {
        resNextBtn.addEventListener('click', () => {
          let nextMission = this.gameState.currentMission;
          let nextLevel = this.gameState.currentLevel + 1;
          if (nextLevel > 20) {
            nextLevel = 1;
            nextMission = this.gameState.currentMission + 1;
          }

          if (nextMission > 10) {
            alert("🎉 恭喜您通關了所有的 Limit 180 關卡！");
            this.renderLobby();
            window.showView('view-lobby');
            return;
          }

          const hasProfile = !!localStorage.getItem('limit180_user_profile');
          if (hasProfile) {
            this.startGame(nextMission, nextLevel);
          } else {
            const skip = confirm("【建立特工身份】\n\n建議您先註冊身份，以便儲存您辛苦挑戰的成績並同步到排行榜！\n\n按「確定」前往註冊，按「取消」即可「暫時略過」並以訪客身份挑戰下一關。");
            if (skip) {
              if (window.MathSprintOnboarding && window.MathSprintOnboarding.showProfileModal) {
                let totalPendingCoins = 0;
                if (this._tempPendingRecords) {
                  for (let key in this._tempPendingRecords) {
                    const rec = this._tempPendingRecords[key];
                    totalPendingCoins += (rec.coins || 0) + (rec.guest_bonus_stars || 0);
                  }
                }
                window.MathSprintOnboarding.showProfileModal(false, totalPendingCoins);
              }
            } else {
              this.startGame(nextMission, nextLevel);
            }
          }
        });
      }
      
      // Input submitting (Calc Mode)
      const calcSubmit = document.getElementById('calc-submit-btn');
      if (calcSubmit) {
        calcSubmit.addEventListener('click', () => this.submitCalcAnswer());
      }
      const calcInput = document.getElementById('calc-input');
      if (calcInput) {
        calcInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.submitCalcAnswer();
          }
        });
        calcInput.addEventListener('input', () => this.checkAutoSubmit());

        // Input keys filter
        const blockKeys = (e) => {
          if (this.gameState.isPaused || this.gameState.isGameOver) {
            e.preventDefault();
            return;
          }
          const allowedKeys = [
            'Backspace', 'Delete', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '.'
          ];
          if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
        };
        calcInput.addEventListener('keydown', blockKeys);
      }

      // Focus pull
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      document.addEventListener('click', (e) => {
        if (!isTouchDevice && window.currentView === 'view-game' && !this.gameState.isPaused && !this.gameState.isGameOver) {
          const isCompare = this.gameState.currentQuestion?.type === 'compare';
          if ((!isCompare || this.gameState.isReviewMode) && e.target !== calcInput && e.target.tagName !== 'BUTTON') {
            if (calcInput) calcInput.focus();
          }
        }
      });

      // Virtual Keypad binding
      document.querySelectorAll('.keypad-grid button[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.gameState.isPaused || this.gameState.isGameOver) return;
          const key = btn.getAttribute('data-key');
          const input = document.getElementById('calc-input');
          if (!input) return;
          if (key === 'back') {
            input.value = input.value.slice(0, -1);
          } else if (key === 'clear') {
            input.value = '';
          } else {
            input.value += key;
          }
          input.focus();
          this.checkAutoSubmit();
        });
      });

      // Binary Compare Choice Clicks
      const leftBtn = document.getElementById('binary-left-btn');
      if (leftBtn) {
        leftBtn.addEventListener('click', () => this.submitCompareAnswer('>'));
      }
      const rightBtn = document.getElementById('binary-right-btn');
      if (rightBtn) {
        rightBtn.addEventListener('click', () => this.submitCompareAnswer('<'));
      }

      // Keyboard Arrow Hotkeys for comparisons
      document.addEventListener('keydown', (e) => {
        if (window.currentView === 'view-game' && !this.gameState.isPaused && !this.gameState.isGameOver) {
          const isCompare = this.gameState.currentQuestion?.type === 'compare';
          if (isCompare && !this.gameState.isReviewMode) {
            if (e.key === 'ArrowLeft') {
              this.submitCompareAnswer('>');
            } else if (e.key === 'ArrowRight') {
              this.submitCompareAnswer('<');
            }
          }
        }
      });

      // --- Review Mode Events ---
      const startRevBtn = document.getElementById('start-review-btn');
      if (startRevBtn) {
        startRevBtn.addEventListener('click', () => this.startReviewMode());
      }
      const revSubmit = document.getElementById('review-submit-btn');
      if (revSubmit) {
        revSubmit.addEventListener('click', () => this.submitReviewAnswer());
      }
      const reviewInput = document.getElementById('review-input');
      if (reviewInput) {
        reviewInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.submitReviewAnswer();
        });
        reviewInput.addEventListener('input', () => this.checkReviewAutoSubmit());

        reviewInput.addEventListener('keydown', (e) => {
          const allowedKeys = [
            'Backspace', 'Delete', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '.'
          ];
          if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
        });
      }

      document.querySelectorAll('.keypad-grid button[data-review-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-review-key');
          const input = document.getElementById('review-input');
          if (!input) return;
          if (key === 'back') {
            input.value = input.value.slice(0, -1);
          } else if (key === 'clear') {
            input.value = '';
          } else {
            input.value += key;
          }
          input.focus();
          this.checkReviewAutoSubmit();
        });
      });

      // --- Pause/Resume Events ---
      const pauseBtn = document.getElementById('game-pause-btn');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => this.pauseGame());
      }
      const resumeBtn = document.getElementById('game-resume-btn');
      if (resumeBtn) {
        resumeBtn.addEventListener('click', () => this.resumeGame());
      }

      // --- Demote Modal Events ---
      const demoteStayBtn = document.getElementById('demote-modal-stay-btn');
      if (demoteStayBtn) {
        demoteStayBtn.addEventListener('click', () => {
          document.getElementById('demote-modal').classList.add('hidden');
        });
      }
    }
  };

  // Mixin 到全域的 MathSprintGame 物件，維持無縫相容性
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Events);
})();
