(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 3: 81以內除法 (被除數 <= 81, 可整除)
  Gen.missions[3] = function() {
    const divisor = Gen.randInt(2, 9);
    const quotient = Gen.randInt(2, 9);
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
  };
})();
