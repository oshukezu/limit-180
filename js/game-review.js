// Limit 180 — 錯題消除模式模組 (Review Module)
(function() {
  const Review = {
    // 新增：初始化大廳右側錯題消除版面
    setupLobbyReviewMode() {
      const profile = window.MathSprintStorage.getProfile();
      this.gameState.isReviewMode = true;
      
      // 優先讀取本機快取以實現續接
      const cachedQueue = localStorage.getItem('error_questions_queue');
      let loadedFromCache = false;
      if (cachedQueue) {
        try {
          const parsed = JSON.parse(cachedQueue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.gameState.reviewList = parsed;
            loadedFromCache = true;
            console.log('[Game] 成功載入本機快取的錯題消除進度，續接上次挑戰。');
          }
        } catch (e) {
          console.warn('[Game] 解析本機錯題快取失敗，將 fallback 讀取資料庫：', e);
        }
      }
      
      if (!loadedFromCache) {
        this.gameState.reviewList = [...profile.wrong_questions_db];
      }

      this.gameState.reviewCorrectStrike = 0;
      this.gameState.isPaused = false;
      this.gameState.isGameOver = false;
      
      const emptyState = document.getElementById('review-empty-state');
      const workspace = document.getElementById('review-workspace');

      if (!emptyState || !workspace) return;

      if (this.gameState.reviewList.length === 0) {
        emptyState.classList.remove('hidden');
        workspace.classList.add('hidden');
      } else {
        emptyState.classList.add('hidden');
        workspace.classList.remove('hidden');
        
        this.renderReviewList();
        this.loadReviewQuestion();
      }
    },

    // --- REVIEW MODE METHODS ---
    startReviewMode() {
      const until = Number(localStorage.getItem('limit180_rest_lock_until') || 0);
      if (Number.isFinite(until) && until > Date.now()) {
        const sec = Math.ceil((until - Date.now()) / 1000);
        if (window.UIFeedback) {
          window.UIFeedback.toast(`休息中，約 ${sec} 秒後可進入錯題消除。`, 'error');
        } else {
          alert(`休息中，約 ${sec} 秒後可進入錯題消除。`);
        }
        return;
      }
      
      // 轉向 view-review 獨立頁面
      if (window.currentView !== 'view-review') {
        window.showView('view-review');
      } else {
        this.setupLobbyReviewMode();
      }

      // 渲染右側特工金幣
      const displayEl = document.getElementById('review-stars-display');
      if (displayEl) {
        displayEl.textContent = window.formatCoins(profile.total_stars || 0, true);
      }
      document.querySelectorAll('.skip-exam-ticket-count').forEach(el => {
        el.textContent = Number(profile.skip_exam_tickets || 0).toLocaleString('zh-TW');
      });

      // 聚焦輸入框
      setTimeout(() => {
        const input = document.getElementById('review-input');
        if (input) input.focus();
      }, 150);
    },

    renderReviewList() {
      const itemsContainer = document.getElementById('review-list-items');
      if (!itemsContainer) return;
      itemsContainer.innerHTML = '';
      
      document.getElementById('review-total-count').textContent = this.gameState.reviewList.length;

      this.gameState.reviewList.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = `p-3 bg-slate-950 border text-xs font-tech flex justify-between items-center rounded ${
          index === 0 ? 'border-pink-500 bg-pink-950/10' : 'border-slate-800'
        }`;
        
        row.innerHTML = `
          <div>
            <div class="font-bold text-white">${item.questionText}</div>
            <div class="text-[10px] text-slate-500">消除進度: ${item.solvedCount || 0}/3</div>
          </div>
          <span class="text-[9px] text-pink-500 font-pixel">M${item.mission} L${item.level}</span>
        `;
        itemsContainer.appendChild(row);
      });
    },

    loadReviewQuestion() {
      if (this.gameState.reviewList.length === 0) {
        this.setupLobbyReviewMode();
        return;
      }

      const item = this.gameState.reviewList[0];
      this.gameState.reviewCurrentItem = item;
      this.gameState.reviewCorrectStrike = item.solvedCount || 0;

      document.getElementById('review-item-correct-count').textContent = this.gameState.reviewCorrectStrike;
      document.getElementById('review-question-text').textContent = item.questionText;
      document.getElementById('review-input').value = '';
      document.getElementById('review-feedback').classList.add('hidden');

      this.renderReviewList();
      setTimeout(() => document.getElementById('review-input').focus(), 50);
    },

    submitReviewAnswer() {
      const inputVal = document.getElementById('review-input').value.trim();
      if (inputVal === '') return;

      const item = this.gameState.reviewCurrentItem;
      const isCorrect = inputVal === item.correctAnswer;
      const feedbackBox = document.getElementById('review-feedback');

      feedbackBox.classList.remove('hidden');

      if (isCorrect) {
        playSound('correct');
        const result = window.MathSprintStorage.solveWrongQuestion(item.questionText);
        
        // 累計答對錯題數
        const profile = window.MathSprintStorage.getProfile();
        profile.total_review_correct_count = (profile.total_review_correct_count || 0) + 1;
        window.MathSprintStorage.saveProfile(profile);

        // 答對 20 題解鎖「錯題終結者」
        if (profile.total_review_correct_count >= 20 && window.MathSprintAchievements) {
          window.MathSprintAchievements.unlock('error_buster');
        }

        feedbackBox.textContent = "回答正確！消除進度增加！";
        feedbackBox.className = "p-3 mb-4 rounded text-center text-xs font-pixel bg-green-950/80 border border-green-500 text-green-400";
        
        setTimeout(() => {
          if (result && result.removed) {
            this.gameState.reviewList.shift();
            if (this.gameState.reviewList.length === 0) {
              localStorage.removeItem('error_questions_queue');
              console.log('[Game] 所有錯題已完全消除，本機快取已清空。');
              this.setupLobbyReviewMode();
              return;
            }
          } else {
            const current = this.gameState.reviewList.shift();
            if (current) {
              current.solvedCount = (current.solvedCount || 0) + 1;
              this.gameState.reviewList.push(current);
            }
          }
          // 在每次答題進度更新時，也即時同步寫入快取，以防突發關閉
          localStorage.setItem('error_questions_queue', JSON.stringify(this.gameState.reviewList));
          this.loadReviewQuestion();
        }, 1200);

      } else {
        playSound('wrong');
        item.solvedCount = 0;
        window.MathSprintStorage.logWrongQuestion(item.questionText, item.correctAnswer, inputVal, item.mission, item.level);

        feedbackBox.innerHTML = `回答錯誤！進度歸零。 正確答案是：<span class="text-green-400 font-bold">${item.correctAnswer}</span>`;
        feedbackBox.className = "p-3 mb-4 rounded text-center text-xs font-pixel bg-red-950/80 border border-red-500 text-red-400";
        
        setTimeout(() => {
          const current = this.gameState.reviewList.shift();
          if (current) {
            current.solvedCount = 0;
            this.gameState.reviewList.push(current);
          }
          // 答錯進度重置時，也更新本機快取
          localStorage.setItem('error_questions_queue', JSON.stringify(this.gameState.reviewList));
          this.loadReviewQuestion();
        }, 2200);
      }
    },

    checkReviewAutoSubmit() {
      const input = document.getElementById('review-input');
      if (!input) return;

      const inputVal = input.value.trim();
      const currentItem = this.gameState.reviewCurrentItem;
      if (!currentItem) return;

      const correctAnswer = currentItem.correctAnswer;
      if (!correctAnswer) return;

      const correctLen = correctAnswer.length;
      if (inputVal.length === correctLen && correctLen > 0) {
        this.submitReviewAnswer();
      }
    },

    saveReviewProgress() {
      if (this.gameState.isReviewMode) {
        localStorage.setItem('error_questions_queue', JSON.stringify(this.gameState.reviewList));
        console.log('[Game] 錯題消除進度已即時序列化並保存至本機快取。');
      }
    }
  };

  // Mixin 到全域的 MathSprintGame 物件，維持無縫相容性
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Review);
})();
