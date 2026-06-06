// MathSprint Question Generator Module (Deferred Levels Edition)
// Generates 10 difficulty levels of math questions and supports a 15-question duplicate ledger.

(function() {
  // Valid denominators for fractions to ensure terminating decimals
  const VALID_DENOMINATORS = [2, 4, 5, 8, 10, 20, 25, 50];

  let lastAnswer = null;

  // 逆向認知乘載調整 helper：當 A > B 時，有 65% 的機率調換為 B 和 A（即讓較小的數在前面）
  function adjustReverseOrder(a, b) {
    if (a > b && Math.random() < 0.65) {
      return [b, a];
    }
    return [a, b];
  }

  // Helper: Get random integer in range [min, max] inclusive
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Helper: Choose random element from array
  function randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Helper: Convert fraction value to string representation
  function formatFraction(num, den) {
    return `<span class="inline-block text-center"><span class="block border-b border-white">${num}</span><span class="block">${den}</span></span>`;
  }

  // Helper: Generate a unique fraction and its value
  function generateFractionObj() {
    const den = randChoice(VALID_DENOMINATORS);
    const num = randInt(1, den - 1);
    const value = num / den;
    return {
      text: formatFraction(num, den),
      value: value,
      raw: `${num}/${den}`
    };
  }

  // Helper: Generate a terminating decimal and its value
  function generateDecimalObj() {
    const val = randInt(1, 99) / 100; // e.g., 0.01 to 0.99
    return {
      text: val.toFixed(2).replace(/\.?0+$/, ""), // strip trailing zeros
      value: val,
      raw: `dec:${val}`
    };
  }

  // Helper: Generate a percentage and its value
  function generatePercentObj() {
    const pct = randInt(5, 95);
    return {
      text: `${pct}%`,
      value: pct / 100,
      raw: `${pct}%`
    };
  }

  const Generator = {
    // 獨立 Mission 模組掛載點
    missions: {},

    // 共享 Helpers (暴露給外部 Mission 模組使用)
    randInt,
    randChoice,
    formatFraction,
    generateFractionObj,
    generateDecimalObj,
    generatePercentObj,
    adjustReverseOrder,

    // 重置上一題正確答案的方法
    resetLastAnswer() {
      lastAnswer = null;
    },

    // 根據 missionId 路由至對應的 Mission 獨立生成器
    generateRawQuestion(missionId) {
      const generatorFunc = this.missions[missionId];
      if (typeof generatorFunc === 'function') {
        return generatorFunc();
      }
      console.error(`[Generator] 未找到 Mission ${missionId} 的生成器，使用 Mission 1 作為備用。`);
      return this.missions[1] ? this.missions[1]() : null;
    },

    // Wrap raw generation with Recent Question Queue check and Anti-Repeat Answer Filter
    generateQuestion(level, recentQueue) {
      let attempts = 0;
      let question = null;
      
      // Ensure we have a valid array reference
      const queue = recentQueue || [];

      while (attempts < 100) {
        question = this.generateRawQuestion(level);
        if (!question) break;
        
        // 檢查 1: 避免近期重複題目
        const isDuplicateKey = queue.includes(question.key);
        // 檢查 2: 連續答案防重複機制
        const isDuplicateAnswer = lastAnswer !== null && question.correctAnswer === lastAnswer;

        if (!isDuplicateKey && !isDuplicateAnswer) {
          break;
        }
        attempts++;
      }
      
      if (question) {
        queue.push(question.key);
        if (queue.length > 15) {
          queue.shift();
        }
        // 紀錄當前題目正確答案
        lastAnswer = question.correctAnswer;
      }
      
      return question;
    }
  };

  // Export
  window.MathSprintGenerator = Generator;
})();
