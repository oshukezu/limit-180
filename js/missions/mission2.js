(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 2: 九九乘法表 (1..9 乘法)
  Gen.missions[2] = function() {
    let a = Gen.randInt(1, 9);
    let b = Gen.randInt(1, 9);
    [a, b] = Gen.adjustReverseOrder(a, b); // 套用逆向認知乘載
    
    const qText = `${a} &times; ${b} = ?`;
    const ans = (a * b).toString();
    const key = `L2:mul:${Math.min(a,b)}:${Math.max(a,b)}`;

    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${a} 乘以 ${b} 等於 ${ans}。`,
      key: key
    };
  };
})();
