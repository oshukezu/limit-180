(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 7 [魔王關]: 兩步驟四則混合運算 (原 L4 遞延)
  Gen.missions[7] = function() {
    const format = Gen.randInt(1, 8);
    let a, b, c, qText, ans, key;

    if (format <= 4) {
      a = Gen.randInt(2, 9);
      b = Gen.randInt(2, 9);
      [a, b] = Gen.adjustReverseOrder(a, b); // 套用逆向認知乘載
      c = Gen.randInt(2, 30);
      
      if (format === 1) {
        qText = `${a} &times; ${b} + ${c} = ?`;
        ans = (a * b + c).toString();
      } else if (format === 2) {
        c = Gen.randInt(1, a * b - 1);
        qText = `${a} &times; ${b} - ${c} = ?`;
        ans = (a * b - c).toString();
      } else if (format === 3) {
        qText = `${c} + ${a} &times; ${b} = ?`;
        ans = (c + a * b).toString();
      } else {
        c = Gen.randInt(a * b + 1, a * b + 30);
        qText = `${c} - ${a} &times; ${b} = ?`;
        ans = (c - a * b).toString();
      }
    } else {
      b = Gen.randInt(2, 9);
      const divRes = Gen.randInt(2, 9);
      a = b * divRes;
      c = Gen.randInt(2, 30);

      if (format === 5) {
        qText = `${a} &divide; ${b} + ${c} = ?`;
        ans = (divRes + c).toString();
      } else if (format === 6) {
        c = Gen.randInt(1, divRes - 1);
        qText = `${a} &divide; ${b} - ${c} = ?`;
        ans = (divRes - c).toString();
      } else if (format === 7) {
        qText = `${c} + ${a} &divide; ${b} = ?`;
        ans = (c + divRes).toString();
      } else {
        c = Gen.randInt(divRes + 1, divRes + 30);
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
  };
})();
