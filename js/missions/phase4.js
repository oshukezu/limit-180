(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  const randInt = Gen.randInt;
  const randChoice = Gen.randChoice;

  // Mission 41: 雙位整十數除法
  Gen.missions[41] = function() {
    const divisor = randInt(2, 9) * 10;
    const quotient = randInt(2, 9) * 10;
    const dividend = divisor * quotient;
    const qText = `${dividend} &divide; ${divisor} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: quotient.toString(),
      explanation: `${dividend} &divide; ${divisor} = ${quotient}。`,
      key: `M41:div:${dividend}:${divisor}`
    };
  };

  // Mission 42: 全卷加法總動員
  Gen.missions[42] = function() {
    const sub = randChoice([1, 3, 4, 7, 8, 12, 13, 14, 15, 20, 21, 22, 23]);
    const raw = Gen.missions[sub]();
    raw.key = `M42:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 43: 全卷減法總動員
  Gen.missions[43] = function() {
    const sub = randChoice([2, 3, 5, 9, 17, 18, 29, 30, 31, 32, 33, 34, 35, 36]);
    const raw = Gen.missions[sub]();
    if (raw.questionText.includes('+')) {
      return Gen.missions[43]();
    }
    raw.key = `M43:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 44: 加減交替抗干擾特訓
  Gen.missions[44] = function() {
    const sub = Math.random() < 0.5 ? 42 : 43;
    const raw = Gen.missions[sub]();
    raw.key = `M44:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 45: 全卷乘法總動員
  Gen.missions[45] = function() {
    const sub = randChoice([6, 11, 16, 24]);
    const raw = Gen.missions[sub]();
    raw.key = `M45:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 46: 全卷除法總動員
  Gen.missions[46] = function() {
    const sub = randChoice([10, 19, 25, 37, 38, 39, 40, 41]);
    const raw = Gen.missions[sub]();
    raw.key = `M46:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 47: 乘除交替抗干擾特訓
  Gen.missions[47] = function() {
    const sub = Math.random() < 0.5 ? 45 : 46;
    const raw = Gen.missions[sub]();
    raw.key = `M47:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 48: 前半戰半馬特訓
  Gen.missions[48] = function() {
    const sub = randInt(1, 23);
    const raw = Gen.missions[sub]();
    raw.key = `M48:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 49: 後半戰半馬特訓
  Gen.missions[49] = function() {
    const sub = randInt(24, 41);
    const raw = Gen.missions[sub]();
    raw.key = `M49:subL${sub}:${raw.key}`;
    return raw;
  };

  // Mission 50: 東大特訓班 100 題完全體
  Gen.missions[50] = function() {
    const sub = randInt(1, 41);
    const raw = Gen.missions[sub]();
    raw.key = `M50:subL${sub}:${raw.key}`;
    return raw;
  };
})();
