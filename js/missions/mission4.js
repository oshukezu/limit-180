(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 4: 50以內加減法（不進/借位，原 L1 遞延）
  Gen.missions[4] = function() {
    const isAdd = Math.random() < 0.5;
    let a, b, qText, ans, key;
    
    if (isAdd) {
      const aTens = Gen.randInt(0, 4);
      const aUnits = Gen.randInt(1, 8);
      const bTens = Gen.randInt(0, 4 - aTens);
      const bUnits = Gen.randInt(1, 9 - aUnits);
      
      a = aTens * 10 + aUnits;
      b = bTens * 10 + bUnits;
      if (a === 0) a = Gen.randInt(1, 9);
      [a, b] = Gen.adjustReverseOrder(a, b); // 套用逆向認知乘載
      
      qText = `${a} + ${b} = ?`;
      ans = (a + b).toString();
      key = `L4:add:${a}:${b}`;
    } else {
      const aTens = Gen.randInt(1, 4);
      const aUnits = Gen.randInt(1, 9);
      const bTens = Gen.randInt(0, aTens);
      const bUnits = Gen.randInt(0, aUnits);
      
      a = aTens * 10 + aUnits;
      b = bTens * 10 + bUnits;
      if (a === b || a < b) {
        // 確保 a > b 且 a <= 50
        a = b + Gen.randInt(1, Math.min(9, 50 - b));
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
  };
})();
