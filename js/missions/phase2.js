(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  const randInt = Gen.randInt;
  const randChoice = Gen.randChoice;
  const adjustReverseOrder = Gen.adjustReverseOrder;

  // Mission 11: 九九乘法：進階 3、4、6 家族
  Gen.missions[11] = function() {
    const a = randChoice([3, 4, 6]);
    const b = randInt(1, 9);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} &times; ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x * y).toString(),
      explanation: `${x} &times; ${y} = ${x * y}。`,
      key: `M11:mul:${x}:${y}`
    };
  };

  // Mission 12: 整十與整百的混和加法
  Gen.missions[12] = function() {
    const a = randChoice([10, 20, 30, 40, 50, 60, 70, 80, 90]);
    const b = randChoice([100, 110, 120, 130, 140, 150]);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x + y).toString(),
      explanation: `${x} + ${y} = ${x + y}。`,
      key: `M12:add:${x}:${y}`
    };
  };

  // Mission 13: 雙位數無進位加法
  Gen.missions[13] = function() {
    const aTens = randInt(1, 8);
    const aUnits = randInt(0, 8);
    const bTens = randInt(1, 9 - aTens);
    const bUnits = randInt(0, 9 - aUnits);
    const a = aTens * 10 + aUnits;
    const b = bTens * 10 + bUnits;
    const qText = `${a} + ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a + b).toString(),
      explanation: `${a} + ${b} = ${a + b}。`,
      key: `M13:add:${a}:${b}`
    };
  };

  // Mission 14: 雙位數進位加法（基礎）
  Gen.missions[14] = function() {
    const aTens = randInt(1, 7);
    const aUnits = randInt(2, 9);
    const bUnits = randInt(10 - aUnits, 9);
    const bTens = randInt(1, 8 - aTens);
    const a = aTens * 10 + aUnits;
    const b = bTens * 10 + bUnits;
    const qText = `${a} + ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a + b).toString(),
      explanation: `${a} + ${b} = ${a + b}。`,
      key: `M14:add:${a}:${b}`
    };
  };

  // Mission 15: 整百數跨越加法
  Gen.missions[15] = function() {
    const a = randChoice([60, 70, 80, 90, 110, 120]);
    const b = randChoice([50, 60, 70, 80, 90, 110]);
    const qText = `${a} + ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a + b).toString(),
      explanation: `${a} + ${b} = ${a + b}。`,
      key: `M15:add:${a}:${b}`
    };
  };

  // Mission 16: 九九乘法：高階 7、8、9 家族
  Gen.missions[16] = function() {
    const a = randChoice([7, 8, 9]);
    const b = randChoice([7, 8, 9]);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} &times; ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x * y).toString(),
      explanation: `${x} &times; ${y} = ${x * y}。`,
      key: `M16:mul:${x}:${y}`
    };
  };

  // Mission 17: 雙位數無借位減法
  Gen.missions[17] = function() {
    const aTens = randInt(2, 9);
    const aUnits = randInt(1, 9);
    const bTens = randInt(1, aTens - 1);
    const bUnits = randInt(0, aUnits);
    const a = aTens * 10 + aUnits;
    const b = bTens * 10 + bUnits;
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M17:sub:${a}:${b}`
    };
  };

  // Mission 18: 雙位數借位減法（入門）
  Gen.missions[18] = function() {
    const isTens = Math.random() < 0.5;
    let a, b;
    if (isTens) {
      a = randChoice([20, 30, 40, 50, 60, 70, 80, 90]);
      b = randInt(1, 19);
    } else {
      const aTens = randInt(2, 9);
      const aUnits = randInt(0, 8);
      a = aTens * 10 + aUnits;
      b = randInt(aUnits + 1, 9);
    }
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M18:sub:${a}:${b}`
    };
  };

  // Mission 19: 基礎商數搜尋
  Gen.missions[19] = function() {
    const divisor = randInt(2, 9);
    const quotient = randInt(2, 9);
    const dividend = divisor * quotient;
    const qText = `${dividend} &divide; ${divisor} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: quotient.toString(),
      explanation: `${dividend} &divide; ${divisor} = ${quotient}。`,
      key: `M19:div:${dividend}:${divisor}`
    };
  };

  // Mission 20: 雙位數湊整加法
  Gen.missions[20] = function() {
    const aTens = randInt(1, 8);
    const aUnits = randInt(1, 9);
    const a = aTens * 10 + aUnits;
    const b = 100 - a;
    const qText = `${a} + ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: "100",
      explanation: `${a} + ${b} = 100。`,
      key: `M20:add:${a}:${b}`
    };
  };

  // Mission 21: 三位數大型加法（無進位）
  Gen.missions[21] = function() {
    const a = randChoice([100, 200, 300, 400, 500, 600, 700]);
    const b = randInt(1, 29) * 10;
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x + y).toString(),
      explanation: `${x} + ${y} = ${x + y}。`,
      key: `M21:add:${x}:${y}`
    };
  };

  // Mission 22: 三位數大型加法（進位）
  Gen.missions[22] = function() {
    const a = randChoice([800, 900, 1000]);
    const b = randInt(11, 59) * 10;
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x + y).toString(),
      explanation: `${x} + ${y} = ${x + y}。`,
      key: `M22:add:${x}:${y}`
    };
  };

  // Mission 23: 大型千位加法
  Gen.missions[23] = function() {
    const a = randInt(1, 9) * 1000 + randChoice([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    const b = randInt(1, 9) * 100 + randChoice([0, 10, 20, 30, 40, 50]);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x + y).toString(),
      explanation: `${x} + ${y} = ${x + y}。`,
      key: `M23:add:${x}:${y}`
    };
  };

  // Mission 24: 九九乘法全家族隨機大亂鬥
  Gen.missions[24] = function() {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} &times; ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x * y).toString(),
      explanation: `${x} &times; ${y} = ${x * y}。`,
      key: `M24:mul:${x}:${y}`
    };
  };

  // Mission 25: 基礎除法全範圍隨機抽測
  Gen.missions[25] = function() {
    return Gen.missions[19]();
  };
})();
