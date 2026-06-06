(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 5: 100以內加減法（進/借位，原 L2 遞延）
  Gen.missions[5] = function() {
    const isAdd = Math.random() < 0.5;
    let a, b, qText, ans, key;

    if (isAdd) {
      let aUnits = Gen.randInt(1, 9);
      let bUnits = Gen.randInt(10 - aUnits, 9);
      let aTens = Gen.randInt(0, 8);
      let bTens = Gen.randInt(0, 8 - aTens);
      
      a = aTens * 10 + aUnits;
      b = bTens * 10 + bUnits;
      if (a === 0) a = Gen.randInt(10, 19);
      if (b === 0) b = Gen.randInt(10, 19);
      if (a + b > 100) {
        a = 48; b = 35; // Fallback
      }
      [a, b] = Gen.adjustReverseOrder(a, b); // 套用逆向認知乘載
      
      qText = `${a} + ${b} = ?`;
      ans = (a + b).toString();
      key = `L5:add:${a}:${b}`;
    } else {
      let bUnits = Gen.randInt(2, 9);
      let aUnits = Gen.randInt(1, bUnits - 1);
      let aTens = Gen.randInt(2, 9);
      let bTens = Gen.randInt(1, aTens - 1);
      
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
  };
})();
