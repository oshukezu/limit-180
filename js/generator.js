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
    },

    // 產生大腦段位定級測驗專用題目 (10題動態矩陣)
    generatePlacementQuestion(qIndex) {
      let qText = "";
      let ans = "";
      let exp = "";
      let limit = 2.0;
      let key = `placement:q${qIndex}`;

      switch (qIndex) {
        case 1: // Q1: 雙位數基礎整十加法，限時 2.0 秒
          {
            const a = randChoice([20, 30, 40, 50, 60, 70, 80]);
            const b = randChoice([10, 20, 30, 40, 50, 60, 70, 80, 90]);
            const x = a, y = b;
            const [fx, fy] = adjustReverseOrder(x, y);
            qText = `${fx} + ${fy} = ?`;
            ans = (fx + fy).toString();
            exp = `${fx} + ${fy} = ${ans}。`;
            limit = 2.0;
          }
          break;
        case 2: // Q2: 雙位數基礎整十減法，限時 2.0 秒
          {
            const a = randChoice([40, 50, 60, 70, 80, 90]);
            const b = randChoice([10, 20, 30, 40]);
            const x = a, y = b;
            qText = `${x} - ${y} = ?`;
            ans = (x - y).toString();
            exp = `${x} - ${y} = ${ans}。`;
            limit = 2.0;
          }
          break;
        case 3: // Q3: 雙位數不退位減法，限時 2.0 秒
          {
            const tens = randInt(2, 9);
            const unit = randInt(3, 9);
            const a = tens * 10 + unit;
            const b = randInt(1, unit);
            qText = `${a} - ${b} = ?`;
            ans = (a - b).toString();
            exp = `${a} - ${b} = ${ans}。`;
            limit = 2.0;
          }
          break;
        case 4: // Q4: 雙位數湊整進位加法，限時 4.0 秒
          {
            const tens1 = randInt(1, 7);
            const unit1 = randInt(1, 9);
            const a = tens1 * 10 + unit1;
            const b = 10 - unit1 + randInt(1, 2) * 10; // 湊成整十數
            const [fx, fy] = adjustReverseOrder(a, b);
            qText = `${fx} + ${fy} = ?`;
            ans = (fx + fy).toString();
            exp = `${fx} + ${fy} = ${ans}。`;
            limit = 4.0;
          }
          break;
        case 5: // Q5: 雙位數跨百進位加法，限時 4.0 秒
          {
            const a = randInt(55, 89);
            const b = randInt(15, 45); // 加起來超過 100
            const [fx, fy] = adjustReverseOrder(a, b);
            qText = `${fx} + ${fy} = ?`;
            ans = (fx + fy).toString();
            exp = `${fx} + ${fy} = ${ans}。`;
            limit = 4.0;
          }
          break;
        case 6: // Q6: 雙位數連續借位退位減法，限時 4.0 秒
          {
            const tens1 = randInt(4, 9);
            const unit1 = randInt(0, 5);
            const a = tens1 * 10 + unit1;
            const b = randInt(1, tens1 - 2) * 10 + randInt(unit1 + 1, 9); // 退位減法
            qText = `${a} - ${b} = ?`;
            ans = (a - b).toString();
            exp = `${a} - ${b} = ${ans}。`;
            limit = 4.0;
          }
          break;
        case 7: // Q7: 基礎九九乘法，限時 2.0 秒
          {
            const a = randInt(3, 9);
            const b = randInt(3, 9);
            const [fx, fy] = adjustReverseOrder(a, b);
            qText = `${fx} &times; ${fy} = ?`;
            ans = (fx * fy).toString();
            exp = `${fx} &times; ${fy} = ${ans}。`;
            limit = 2.0;
          }
          break;
        case 8: // Q8: 基礎單數除法，限時 2.0 秒
          {
            const divisor = randInt(3, 9);
            const quotient = randInt(3, 9);
            const dividend = divisor * quotient;
            qText = `${dividend} &divide; ${divisor} = ?`;
            ans = quotient.toString();
            exp = `${dividend} &divide; ${divisor} = ${quotient}。`;
            limit = 2.0;
          }
          break;
        case 9: // Q9: 三位數大數值跨百退位減法，限時 5.0 秒
          {
            const a = randChoice([600, 700, 800, 900]);
            const b = randInt(11, 49) * 10; // 如 380, 240 等
            qText = `${a} - ${b} = ?`;
            ans = (a - b).toString();
            exp = `${a} - ${b} = ${ans}。`;
            limit = 5.0;
          }
          break;
        case 10: // Q10: 多位數整十除法，限時 4.0 秒
          {
            const divisor = randChoice([3, 4, 6, 7, 8, 9]);
            const quotient = randChoice([30, 40, 50, 60, 70, 80, 90]);
            const dividend = divisor * quotient;
            qText = `${dividend} &divide; ${divisor} = ?`;
            ans = quotient.toString();
            exp = `${dividend} &divide; ${divisor} = ${quotient}。`;
            limit = 4.0;
          }
          break;
      }

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: exp,
        limitTime: limit,
        key: key
      };
    }
  };

  // Export
  window.MathSprintGenerator = Generator;
})();
