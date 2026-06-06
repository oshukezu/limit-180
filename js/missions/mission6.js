(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 6: 九九乘法與基本除法 (原 L3 遞延)
  Gen.missions[6] = function() {
    const isMul = Math.random() < 0.5;
    let a, b, qText, ans, key;

    if (isMul) {
      a = Gen.randInt(2, 9);
      b = Gen.randInt(2, 9);
      [a, b] = Gen.adjustReverseOrder(a, b); // 套用逆向認知乘載
      qText = `${a} &times; ${b} = ?`;
      ans = (a * b).toString();
      key = `L6:mul:${a}:${b}`;
    } else {
      b = Gen.randInt(2, 9);
      ans = Gen.randInt(2, 9);
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
  };
})();
