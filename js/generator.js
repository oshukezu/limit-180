// MathSprint Question Generator Module (Deferred Levels Edition)
// Generates 10 difficulty levels of math questions and supports a 15-question duplicate ledger.

(function() {
  // Valid denominators for fractions to ensure terminating decimals
  const VALID_DENOMINATORS = [2, 4, 5, 8, 10, 20, 25, 50];

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
    // Generate a single question for a given level
    generateRawQuestion(level) {
      switch (level) {
        case 1:
          return this.genLevel1();
        case 2:
          return this.genLevel2();
        case 3:
          return this.genLevel3();
        case 4:
          return this.genLevel4();
        case 5:
          return this.genLevel5();
        case 6:
          return this.genLevel6();
        case 7:
          return this.genLevel7();
        case 8:
          return this.genLevel8();
        case 9:
          return this.genLevel9();
        case 10:
          return this.genLevel10();
        default:
          return this.genLevel1();
      }
    },

    // Wrap raw generation with Recent Question Queue check
    generateQuestion(level, recentQueue) {
      let attempts = 0;
      let question = null;
      
      // Ensure we have a valid array reference
      const queue = recentQueue || [];

      while (attempts < 100) {
        question = this.generateRawQuestion(level);
        if (!queue.includes(question.key)) {
          break;
        }
        attempts++;
      }
      
      queue.push(question.key);
      if (queue.length > 15) {
        queue.shift();
      }
      
      return question;
    },

    // Level 1: 20以內加減法 (含進位/借位，結果 <= 20)
    genLevel1() {
      const isAdd = Math.random() < 0.5;
      let a, b, qText, ans, key;

      if (isAdd) {
        a = randInt(1, 19);
        b = randInt(1, 20 - a);
        qText = `${a} + ${b} = ?`;
        ans = (a + b).toString();
        key = `L1:add:${a}:${b}`;
      } else {
        a = randInt(2, 20);
        b = randInt(1, a - 1);
        qText = `${a} - ${b} = ?`;
        ans = (a - b).toString();
        key = `L1:sub:${a}:${b}`;
      }

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: `${qText.replace(' = ?', '')} = ${ans}。`,
        key: key
      };
    },

    // Level 2: 九九乘法表 (1..9 乘法)
    genLevel2() {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      
      const qText = `${a} &times; ${b} = ?`;
      const ans = (a * b).toString();
      const key = `L2:mul:${a}:${b}`;

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: `${a} 乘以 ${b} 等於 ${ans}。`,
        key: key
      };
    },

    // Level 3: 81以內除法 (被除數 <= 81, 可整除)
    genLevel3() {
      // 商 and 除數 range 2..9, max product 81
      const divisor = randInt(2, 9);
      const quotient = randInt(2, 9);
      const dividend = divisor * quotient;

      const qText = `${dividend} &divide; ${divisor} = ?`;
      const ans = quotient.toString();
      const key = `L3:div:${dividend}:${divisor}`;

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: `${dividend} 除以 ${divisor} 等於 ${ans} (因為 ${divisor} &times; ${ans} = ${dividend})。`,
        key: key
      };
    },

    // Level 4: 50以內加減法（不進/借位，原 L1 遞延）
    genLevel4() {
      const isAdd = Math.random() < 0.5;
      let a, b, qText, ans, key;
      
      if (isAdd) {
        const aTens = randInt(0, 4);
        const aUnits = randInt(1, 8);
        const bTens = randInt(0, 4 - aTens);
        const bUnits = randInt(1, 9 - aUnits);
        
        a = aTens * 10 + aUnits;
        b = bTens * 10 + bUnits;
        if (a === 0) a = randInt(1, 9);
        
        qText = `${a} + ${b} = ?`;
        ans = (a + b).toString();
        key = `L4:add:${a}:${b}`;
      } else {
        const aTens = randInt(1, 4);
        const aUnits = randInt(1, 9);
        const bTens = randInt(0, aTens);
        const bUnits = randInt(0, aUnits);
        
        a = aTens * 10 + aUnits;
        b = bTens * 10 + bUnits;
        if (a === b) {
          a += 10;
        }
        
        qText = `${a} - ${b} = ?`;
        ans = (a - b).toString();
        key = `L4:sub:${a}:${b}`;
      }

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: `${qText.replace(' = ?', '')} = ${ans}。`,
        key: key
      };
    },

    // Level 5: 100以內加減法（進/借位，原 L2 遞延）
    genLevel5() {
      const isAdd = Math.random() < 0.5;
      let a, b, qText, ans, key;

      if (isAdd) {
        let aUnits = randInt(1, 9);
        let bUnits = randInt(10 - aUnits, 9);
        let aTens = randInt(0, 8);
        let bTens = randInt(0, 8 - aTens);
        
        a = aTens * 10 + aUnits;
        b = bTens * 10 + bUnits;
        if (a === 0) a = randInt(10, 19);
        if (b === 0) b = randInt(10, 19);
        if (a + b > 100) {
          a = 48; b = 35; // Fallback
        }
        
        qText = `${a} + ${b} = ?`;
        ans = (a + b).toString();
        key = `L5:add:${a}:${b}`;
      } else {
        let bUnits = randInt(2, 9);
        let aUnits = randInt(1, bUnits - 1);
        let aTens = randInt(2, 9);
        let bTens = randInt(1, aTens - 1);
        
        a = aTens * 10 + aUnits;
        b = bTens * 10 + bUnits;
        
        qText = `${a} - ${b} = ?`;
        ans = (a - b).toString();
        key = `L5:sub:${a}:${b}`;
      }

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: `${qText.replace(' = ?', '')} = ${ans}。`,
        key: key
      };
    },

    // Level 6: 九九乘法與基本除法 (原 L3 遞延)
    genLevel6() {
      const isMul = Math.random() < 0.5;
      let a, b, qText, ans, key;

      if (isMul) {
        a = randInt(2, 9);
        b = randInt(2, 9);
        qText = `${a} &times; ${b} = ?`;
        ans = (a * b).toString();
        key = `L6:mul:${a}:${b}`;
      } else {
        b = randInt(2, 9);
        ans = randInt(2, 9);
        a = b * ans;
        qText = `${a} &divide; ${b} = ?`;
        key = `L6:div:${a}:${b}`;
        ans = ans.toString();
      }

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: `${qText.replace(' = ?', '')} = ${ans}。`,
        key: key
      };
    },

    // Level 7 [魔王關]: 兩步驟四則混合運算 (原 L4 遞延)
    genLevel7() {
      const format = randInt(1, 8);
      let a, b, c, qText, ans, key;

      if (format <= 4) {
        a = randInt(2, 9);
        b = randInt(2, 9);
        c = randInt(2, 30);
        
        if (format === 1) {
          qText = `${a} &times; ${b} + ${c} = ?`;
          ans = (a * b + c).toString();
        } else if (format === 2) {
          c = randInt(1, a * b - 1);
          qText = `${a} &times; ${b} - ${c} = ?`;
          ans = (a * b - c).toString();
        } else if (format === 3) {
          qText = `${c} + ${a} &times; ${b} = ?`;
          ans = (c + a * b).toString();
        } else {
          c = randInt(a * b + 1, a * b + 30);
          qText = `${c} - ${a} &times; ${b} = ?`;
          ans = (c - a * b).toString();
        }
      } else {
        b = randInt(2, 9);
        const divRes = randInt(2, 9);
        a = b * divRes;
        c = randInt(2, 30);

        if (format === 5) {
          qText = `${a} &divide; ${b} + ${c} = ?`;
          ans = (divRes + c).toString();
        } else if (format === 6) {
          c = randInt(1, divRes - 1);
          qText = `${a} &divide; ${b} - ${c} = ?`;
          ans = (divRes - c).toString();
        } else if (format === 7) {
          qText = `${c} + ${a} &divide; ${b} = ?`;
          ans = (c + divRes).toString();
        } else {
          c = randInt(divRes + 1, divRes + 30);
          qText = `${c} - ${a} &divide; ${b} = ?`;
          ans = (c - divRes).toString();
        }
      }

      key = `L7:format:${format}:${a}:${b}:${c}`;

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: `依照先乘除後加減原則，${qText.replace(' = ?', '')} = ${ans}。`,
        key: key
      };
    },

    // Level 8: 分數/小數/百分比混搭二選一 (原 L5, L6, L7 融合)
    genLevel8() {
      const subType = randInt(1, 3);
      let frac, dec, pct, ans, key, leftText, rightText, leftVal, rightVal, explanation, scaffold;

      if (subType === 1) {
        // Fraction vs Decimal (originally L5)
        let attempts = 0;
        while (attempts < 50) {
          frac = generateFractionObj();
          dec = generateDecimalObj();
          if (Math.abs(frac.value - dec.value) > 0.001) break;
          attempts++;
        }
        const fracOnLeft = Math.random() < 0.5;
        leftText = fracOnLeft ? frac.text : dec.text;
        rightText = fracOnLeft ? dec.text : frac.text;
        leftVal = fracOnLeft ? frac.value : dec.value;
        rightVal = fracOnLeft ? dec.value : frac.value;
        ans = leftVal > rightVal ? ">" : "<";
        key = `L8:FvsD:${frac.raw}:${dec.raw}:${fracOnLeft}`;
        explanation = `${fracOnLeft ? frac.raw : dec.text} 等於 ${fracOnLeft ? frac.value : frac.value}，與 ${fracOnLeft ? dec.text : frac.raw} (值為 ${fracOnLeft ? dec.value : dec.value}) 相比，所以為 ${ans}。`;
        scaffold = {
          leftType: fracOnLeft ? 'fraction' : 'decimal',
          rightType: fracOnLeft ? 'decimal' : 'fraction',
          leftVal: leftVal,
          rightVal: rightVal,
          fracDetails: frac
        };
      } else if (subType === 2) {
        // Decimal vs Percent (originally L6)
        let attempts = 0;
        while (attempts < 50) {
          dec = generateDecimalObj();
          pct = generatePercentObj();
          if (Math.abs(dec.value - pct.value) > 0.001) break;
          attempts++;
        }
        const decOnLeft = Math.random() < 0.5;
        leftText = decOnLeft ? dec.text : pct.text;
        rightText = decOnLeft ? pct.text : dec.text;
        leftVal = decOnLeft ? dec.value : pct.value;
        rightVal = decOnLeft ? pct.value : dec.value;
        ans = leftVal > rightVal ? ">" : "<";
        key = `L8:DvsP:${dec.raw}:${pct.raw}:${decOnLeft}`;
        explanation = `${pct.text} 等於 ${pct.value}。對比 ${dec.text}，所以為 ${ans}。`;
        scaffold = {
          leftType: decOnLeft ? 'decimal' : 'percent',
          rightType: decOnLeft ? 'percent' : 'decimal',
          leftVal: leftVal,
          rightVal: rightVal
        };
      } else {
        // Three-way mix two elements (originally L7)
        const types = ['fraction', 'decimal', 'percent'];
        const t1 = randChoice(types);
        let t2 = randChoice(types);
        while (t1 === t2) t2 = randChoice(types);

        let obj1, obj2;
        if (t1 === 'fraction') obj1 = generateFractionObj();
        else if (t1 === 'decimal') obj1 = generateDecimalObj();
        else obj1 = generatePercentObj();

        let attempts = 0;
        while (attempts < 50) {
          if (t2 === 'fraction') obj2 = generateFractionObj();
          else if (t2 === 'decimal') obj2 = generateDecimalObj();
          else obj2 = generatePercentObj();
          if (Math.abs(obj1.value - obj2.value) > 0.001) break;
          attempts++;
        }

        leftText = obj1.text;
        rightText = obj2.text;
        leftVal = obj1.value;
        rightVal = obj2.value;
        ans = leftVal > rightVal ? ">" : "<";
        key = `L8:mix:${obj1.raw}:${obj2.raw}`;
        explanation = `${obj1.text} 的值約為 ${obj1.value.toFixed(3).replace(/\.?0+$/, "")}，${obj2.text} 的值約為 ${obj2.value.toFixed(3).replace(/\.?0+$/, "")}。所以為 ${ans}。`;
        scaffold = {
          leftType: t1,
          rightType: t2,
          leftVal: leftVal,
          rightVal: rightVal,
          fracDetails: t1 === 'fraction' ? obj1 : (t2 === 'fraction' ? obj2 : null)
        };
      }

      return {
        type: 'compare',
        questionText: `比較大小`,
        leftText: leftText,
        rightText: rightText,
        correctAnswer: ans,
        explanation: explanation,
        key: key,
        scaffoldData: scaffold
      };
    },

    // Level 9: 國中正負數與代數 + 高難度比大小 (原 L8-9 融合)
    genLevel9() {
      const isCompare = Math.random() < 0.5;

      if (isCompare) {
        // High difficulty comparison (originally L9, tight margins)
        const types = ['fraction', 'decimal', 'percent'];
        let leftObj, rightObj, leftType, rightType;

        let attempts = 0;
        while (attempts < 100) {
          leftType = randChoice(types);
          rightType = randChoice(types);

          if (leftType === 'fraction') leftObj = generateFractionObj();
          else if (leftType === 'decimal') leftObj = generateDecimalObj();
          else leftObj = generatePercentObj();

          if (rightType === 'fraction') rightObj = generateFractionObj();
          else if (rightType === 'decimal') rightObj = generateDecimalObj();
          else rightObj = generatePercentObj();

          const diff = Math.abs(leftObj.value - rightObj.value);
          // Tight margins: between 0.005 and 0.08
          if (diff > 0.005 && diff <= 0.08) break;
          attempts++;
        }

        const leftText = leftObj.text;
        const rightText = rightObj.text;
        const leftVal = leftObj.value;
        const rightVal = rightObj.value;
        const ans = leftVal > rightVal ? ">" : "<";
        const key = `L9:comp:${leftObj.raw}:${rightObj.raw}`;

        return {
          type: 'compare',
          questionText: `比較大小 (高難度)`,
          leftText: leftText,
          rightText: rightText,
          correctAnswer: ans,
          explanation: `${leftObj.text} 的值為 ${leftObj.value.toFixed(3).replace(/\.?0+$/, "")}，而 ${rightObj.text} 的值為 ${rightObj.value.toFixed(3).replace(/\.?0+$/, "")}。所以為 ${ans}。`,
          key: key,
          scaffoldData: {
            leftType: leftType,
            rightType: rightType,
            leftVal: leftVal,
            rightVal: rightVal,
            fracDetails: leftType === 'fraction' ? leftObj : (rightType === 'fraction' ? rightObj : null)
          }
        };
      } else {
        // Algebra / Negative numbers (originally L8)
        const isAlgebra = Math.random() < 0.5;
        let qText, ans, key, exp;

        if (isAlgebra) {
          const type = randInt(1, 3);
          let a, x, b;

          if (type === 1) {
            a = randInt(2, 9);
            x = randInt(-9, 9);
            while (x === 0 || x === 1) x = randInt(-9, 9);
            b = a * x;
            qText = `${a}x = ${b}，求 x = ?`;
            ans = x.toString();
            exp = `同除以 ${a}，得 x = ${b} / ${a} = ${ans}。`;
          } else if (type === 2) {
            a = randInt(-15, 15);
            while (a === 0) a = randInt(-15, 15);
            x = randInt(-15, 15);
            b = x + a;
            const aStr = a < 0 ? `(${a})` : `${a}`;
            qText = `x + ${aStr} = ${b}，求 x = ?`;
            ans = x.toString();
            exp = `移項得 x = ${b} - (${aStr}) = ${ans}。`;
          } else {
            a = randInt(-15, 15);
            while (a === 0) a = randInt(-15, 15);
            x = randInt(-15, 15);
            b = x - a;
            const aStr = a < 0 ? `(${a})` : `${a}`;
            qText = `x - ${aStr} = ${b}，求 x = ?`;
            ans = x.toString();
            exp = `移項得 x = ${b} + (${aStr}) = ${ans}。`;
          }
          key = `L9:alg:${type}:${a}:${x}`;
        } else {
          const type = randInt(1, 3);
          let a = randInt(5, 25);
          let b = randInt(5, 25);
          
          if (type === 1) {
            qText = `(-${a}) + ${b} = ?`;
            ans = (-a + b).toString();
          } else if (type === 2) {
            qText = `${a} + (-${b}) = ?`;
            ans = (a - b).toString();
          } else {
            qText = `(-${a}) - ${b} = ?`;
            ans = (-a - b).toString();
          }
          key = `L9:neg:${type}:${a}:${b}`;
          exp = `${qText.replace(' = ?', '')} = ${ans}。`;
        }

        return {
          type: 'calc',
          questionText: qText,
          correctAnswer: ans,
          explanation: exp,
          key: key
        };
      }
    },

    // Level 10 [傳奇]: 全範疇極速衝刺
    genLevel10() {
      const subLevel = randInt(1, 9);
      const rawQ = this.generateRawQuestion(subLevel);
      rawQ.key = `L10:subL${subLevel}:${rawQ.key}`;
      return rawQ;
    }
  };

  // Export
  window.MathSprintGenerator = Generator;
})();
