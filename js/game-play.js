(function() {
  const PlayGame = {
    nextQuestion() {
      if (this.gameState.questionIndex >= this.gameState.totalQuestions) {
        this.endGame(true);
        return;
      }

      this.gameState.questionIndex++;
      this.gameState.limitTime = this.getRoundTimeLimit(this.gameState.questionIndex);
      
      document.getElementById('game-progress').textContent = `${this.gameState.questionIndex}/${this.gameState.totalQuestions}`;
      document.getElementById('game-combo').textContent = this.gameState.combo;
      document.getElementById('shield-alert').classList.add('hidden');

      const q = window.MathSprintGenerator.generateQuestion(this.gameState.currentMission, this.gameState.recentQueue);
      this.gameState.currentQuestion = q;

      document.getElementById('question-text').innerHTML = q.questionText;

      const isCompareMode = q.type === 'compare' && !this.gameState.isReviewMode;
      const warning = document.getElementById('input-warning');
      
      if (isCompareMode) {
        document.getElementById('control-input-mode').classList.add('hidden');
        document.getElementById('control-binary-mode').classList.remove('hidden');
        warning.classList.add('hidden');
        document.getElementById('binary-left-text').innerHTML = q.leftText;
        document.getElementById('binary-right-text').innerHTML = q.rightText;
      } else {
        document.getElementById('control-input-mode').classList.remove('hidden');
        document.getElementById('control-binary-mode').classList.add('hidden');
        warning.classList.remove('hidden');
        
        const input = document.getElementById('calc-input');
        if (input) {
          input.value = '';
          setTimeout(() => input.focus(), 50);
        }
      }

      if (this.renderScaffold) {
        this.renderScaffold(q);
      }

      this.gameState.startTime = performance.now();
      this.startTimer();
    },

    startTimer() {
      clearInterval(this.timerInterval);
      
      const timeBar = document.getElementById('game-time-bar');
      if (!timeBar) return;
      timeBar.style.width = '100%';
      timeBar.style.backgroundColor = 'var(--neon-green)';
      timeBar.style.boxShadow = '0 0 10px var(--neon-green)';

      // 自由計時，無時間限制
      if (this.gameState.limitTime >= 999) {
        return;
      }

      const duration = this.gameState.limitTime * 1000;
      let timeSpent = 0;
      const step = 50;

      this.timerInterval = setInterval(() => {
        if (this.gameState.isPaused) return;

        timeSpent += step;
        const pct = Math.max(0, 100 - (timeSpent / duration) * 100);
        timeBar.style.width = `${pct}%`;

        if (pct < 30) {
          timeBar.style.backgroundColor = 'var(--neon-pink)';
          timeBar.style.boxShadow = '0 0 10px var(--neon-pink)';
        } else if (pct < 60) {
          timeBar.style.backgroundColor = 'var(--neon-yellow)';
          timeBar.style.boxShadow = '0 0 10px var(--neon-yellow)';
        } else {
          timeBar.style.backgroundColor = 'var(--neon-green)';
          timeBar.style.boxShadow = '0 0 10px var(--neon-green)';
        }

        if (timeSpent >= duration) {
          clearInterval(this.timerInterval);
          this.handleTimeout();
        }
      }, step);
    },

    handleTimeout() {
      playSound('wrong');
      this.gameState.combo = 0;
      this.handleFailure("超時！算力加載失敗。");
    },

    getRoundTimeLimit(round) {
      return this.gameState.initLimitTime;
    },

    checkAutoSubmit() {
      if (this.gameState.isPaused || this.gameState.isGameOver) return;
      const isCompare = this.gameState.currentQuestion?.type === 'compare' && !this.gameState.isReviewMode;
      if (isCompare) return;

      const input = document.getElementById('calc-input');
      if (!input) return;

      const inputVal = input.value.trim();
      const correctAnswer = this.gameState.currentQuestion?.correctAnswer;
      if (!correctAnswer) return;

      const correctLen = correctAnswer.length;
      if (inputVal.length === correctLen && correctLen > 0) {
        this.submitCalcAnswer();
      }
    },

    submitCalcAnswer() {
      if (this.gameState.isPaused || this.gameState.isGameOver) return;
      const inputVal = document.getElementById('calc-input').value.trim();
      if (inputVal === '') return;

      const isCorrect = inputVal === this.gameState.currentQuestion.correctAnswer;
      const timeTaken = (performance.now() - this.gameState.startTime) / 1000;
      this.gameState.questionTimes.push(timeTaken);

      if (isCorrect) {
        this.handleSuccess(timeTaken);
      } else {
        this.handleFailure(inputVal);
      }
    },

    submitCompareAnswer(symbol) {
      if (this.gameState.isPaused || this.gameState.isGameOver) return;
      
      const isCorrect = symbol === this.gameState.currentQuestion.correctAnswer;
      const timeTaken = (performance.now() - this.gameState.startTime) / 1000;
      this.gameState.questionTimes.push(timeTaken);

      if (isCorrect) {
        this.handleSuccess(timeTaken);
      } else {
        const wrongText = symbol === '>' ? `${this.gameState.currentQuestion.leftText} 比 ${this.gameState.currentQuestion.rightText} 大` : `${this.gameState.currentQuestion.leftText} 比 ${this.gameState.currentQuestion.rightText} 小`;
        this.handleFailure(wrongText);
      }
    },

    handleSuccess(timeTaken) {
      playSound('correct');
      window.MathSprintStorage.recordCorrectAnswer();
      
      if (window.MathSprintAchievements && timeTaken) {
        window.MathSprintAchievements.checkSpeed(timeTaken);
      }

      this.gameState.correctCount++;
      this.gameState.combo++;
      this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);

      this.nextQuestion();
    },

    handleFailure(wrongAnswerText) {
      playSound('wrong');
      clearInterval(this.timerInterval);

      this.gameState.combo = 0;

      const mainBody = document.querySelector('body');
      if (mainBody) {
        mainBody.classList.add('shake');
        setTimeout(() => mainBody.classList.remove('shake'), 300);
      }

      window.MathSprintStorage.logWrongQuestion(
        this.gameState.currentQuestion.questionText.replace(/&times;/g, '×').replace(/&divide;/g, '÷'),
        this.gameState.currentQuestion.correctAnswer,
        wrongAnswerText,
        this.gameState.currentMission,
        this.gameState.currentLevel
      );

      if (this.gameState.currentMission === 10) {
        this.endGame(false);
        return;
      }

      this.gameState.isPaused = true;
      const feedback = document.getElementById('error-feedback');
      if (feedback) {
        const correctText = this.gameState.currentQuestion.type === 'compare' ? 
          (this.gameState.currentQuestion.correctAnswer === '>' ? '左邊較大 (>)' : '右邊較大 (<)') : 
          this.gameState.currentQuestion.correctAnswer;
        
        document.getElementById('error-correct-answer').textContent = correctText;
        document.getElementById('error-explanation').innerHTML = this.gameState.currentQuestion.explanation;
        feedback.classList.remove('hidden');

        setTimeout(() => {
          feedback.classList.add('hidden');
          this.gameState.isPaused = false;
          this.nextQuestion();
        }, 1800);
      }
    },

    pauseGame() {
      if (this.gameState.isPaused || this.gameState.isGameOver || !this.gameState.currentQuestion) return;

      this.gameState.pauseCount++;
      this.updatePauseBtnUI();

      if (this.gameState.pauseCount <= 3) {
        this.gameState.isPaused = true;
      } else {
        const warningText = document.getElementById('pause-warning-text');
        if (warningText) {
          warningText.innerHTML = `<span class="text-red-500 font-pixel">⚠️ 暫停次數已用盡！時間照常扣減中！</span>`;
        }
      }

      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.classList.remove('hidden');
    },

    resumeGame() {
      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.classList.add('hidden');

      this.gameState.isPaused = false;
      
      const isCompare = this.gameState.currentQuestion?.type === 'compare' && !this.gameState.isReviewMode;
      if (!isCompare) {
        const input = document.getElementById('calc-input');
        if (input) input.focus();
      }
    },

    updatePauseBtnUI() {
      const btn = document.getElementById('game-pause-btn');
      if (btn) {
        const remaining = Math.max(0, 3 - this.gameState.pauseCount);
        btn.textContent = `暫停 (${remaining}/3)`;
        if (remaining === 0) {
          btn.classList.remove('text-pink-400', 'border-pink-500');
          btn.classList.add('text-red-500', 'border-red-600', 'animate-pulse');
        } else {
          btn.classList.remove('text-red-500', 'border-red-600', 'animate-pulse');
          btn.classList.add('text-pink-400', 'border-pink-500');
        }
      }
      
      const warningText = document.getElementById('pause-warning-text');
      if (warningText) {
        warningText.innerHTML = `前 3 次暫停時間會停止倒數。<br>第 4 次暫停起，時間將照常扣減！`;
      }
    }
  };

  // Mixin to global MathSprintGame
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, PlayGame);
})();
