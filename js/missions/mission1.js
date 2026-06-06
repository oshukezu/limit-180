(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 1: 20以內加減法 (含進位/借位，結果 <= 20)
  Gen.missions[1] = function() {
    const isAdd = Math.random() < 0.5;
    let a, b, qText, ans, key;

    if (isAdd) {
      a = Gen.randInt(1, 19);
      b = Gen.randInt(1, 20 - a);
      [a, b] = Gen.adjustReverseOrder(a, b); // 套用逆向認知乘載
      qText = `${a} + ${b} = ?`;
      ans = (a + b).toString();
      key = `L1:add:${a}:${b}`;
    } else {
      a = Gen.randInt(2, 20);
      b = Gen.randInt(1, a - 1);
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
  };
})();
