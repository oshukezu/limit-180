(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  const randInt = Gen.randInt;
  const randChoice = Gen.randChoice;
  const adjustReverseOrder = Gen.adjustReverseOrder;

  // Mission 26: 雙位數進位加法（大數值）
  Gen.missions[26] = function() {
    const a = randInt(50, 99);
    const b = randInt(10, 49);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x + y).toString(),
      explanation: `${x} + ${y} = ${x + y}。`,
      key: `M26:add:${x}:${y}`
    };
  };

  // Mission 27: 雙位數進位加法（高難度）
  Gen.missions[27] = function() {
    let a = randInt(20, 99);
    let b = randInt(20, 99);
    while ((a % 10 + b % 10) < 10 || (a + b) % 10 === 0) {
      a = randInt(20, 99);
      b = randInt(20, 99);
    }
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (x + y).toString(),
      explanation: `${x} + ${y} = ${x + y}。`,
      key: `M27:add:${x}:${y}`
    };
  };

  // Mission 28: 雙位數雙進位加法
  Gen.missions[28] = function() {
    const aTens = randInt(2, 8);
    const aUnits = randInt(5, 9);
    const bUnits = randInt(10 - aUnits, 9);
    const bTens = randInt(10 - aTens, 9);
    const a = aTens * 10 + aUnits;
    const b = bTens * 10 + bUnits;
    const qText = `${a} + ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a + b).toString(),
      explanation: `${a} + ${b} = ${a + b}。`,
      key: `M28:add:${a}:${b}`
    };
  };

  // Mission 29: 三位數減法（無借位）
  Gen.missions[29] = function() {
    const a = randInt(100, 999);
    const aTens = Math.floor((a % 100) / 10);
    const aUnits = a % 10;
    const bTens = randInt(0, Math.max(1, aTens));
    const bUnits = randInt(0, Math.max(1, aUnits));
    const b = bTens * 10 + bUnits;
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M29:sub:${a}:${b}`
    };
  };

  // Mission 30: 三位數大型借位減法
  Gen.missions[30] = function() {
    const a = randChoice([300, 400, 500, 600, 700, 800, 900]);
    const b = randInt(10, a - 10);
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M30:sub:${a}:${b}`
    };
  };

  // Mission 31: 雙位數借位減法（高難度）
  Gen.missions[31] = function() {
    const aTens = randInt(3, 9);
    const aUnits = randInt(0, 8);
    const a = aTens * 10 + aUnits;
    const bTens = randInt(1, aTens - 1);
    const bUnits = randInt(aUnits + 1, 9);
    const b = bTens * 10 + bUnits;
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M31:sub:${a}:${b}`
    };
  };

  // Mission 32: 極端個位差減法
  Gen.missions[32] = function() {
    const aTens = randInt(2, 9);
    const aUnits = randInt(0, 8);
    const a = aTens * 10 + aUnits;
    const diff = randInt(1, 9);
    const b = a - diff;
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: diff.toString(),
      explanation: `${a} - ${b} = ${diff}。`,
      key: `M32:sub:${a}:${b}`
    };
  };

  // Mission 33: 三位數與雙位數減法（無借位）
  Gen.missions[33] = function() {
    const a = randInt(100, 999);
    const aTens = Math.floor((a % 100) / 10);
    const aUnits = a % 10;
    const bTens = randInt(1, Math.max(1, aTens));
    const bUnits = randInt(1, Math.max(1, aUnits));
    const b = bTens * 10 + bUnits;
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M33:sub:${a}:${b}`
    };
  };

  // Mission 34: 三位數與雙位數減法（退位）
  Gen.missions[34] = function() {
    let a, b;
    a = randInt(120, 900);
    b = randInt(25, 99);
    while (a % 10 >= b % 10) {
      b = randInt(25, 99);
    }
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M34:sub:${a}:${b}`
    };
  };

  // Mission 35: 複雜三位數退位減法
  Gen.missions[35] = function() {
    let a = randInt(200, 900);
    let b = randInt(80, 199);
    while (a % 10 >= b % 10 || Math.floor((a % 100)/10) >= Math.floor((b % 100)/10)) {
      a = randInt(200, 900);
      b = randInt(80, 199);
    }
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M35:sub:${a}:${b}`
    };
  };

  // Mission 36: 四位數超大型減法邊緣
  Gen.missions[36] = function() {
    const a = randInt(1001, 1099);
    const b = randInt(10, 99);
    const qText = `${a} - ${b} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: (a - b).toString(),
      explanation: `${a} - ${b} = ${a - b}。`,
      key: `M36:sub:${a}:${b}`
    };
  };

  // Mission 37: 進階除法：兩位數除以個位（雙倍商）
  Gen.missions[37] = function() {
    const divisor = randInt(2, 9);
    const quotient = randInt(10, 24);
    const dividend = divisor * quotient;
    const qText = `${dividend} &divide; ${divisor} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: quotient.toString(),
      explanation: `${dividend} &divide; ${divisor} = ${quotient}。`,
      key: `M37:div:${dividend}:${divisor}`
    };
  };

  // Mission 38: 進階除法：兩位數除以個位（需試商）
  Gen.missions[38] = function() {
    const divisor = randChoice([3, 4, 6, 7, 8, 9]);
    const quotient = randChoice([12, 13, 14, 15, 16, 17, 18, 19, 21, 23]);
    const dividend = divisor * quotient;
    const qText = `${dividend} &divide; ${divisor} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: quotient.toString(),
      explanation: `${dividend} &divide; ${divisor} = ${quotient}。`,
      key: `M38:div:${dividend}:${divisor}`
    };
  };

  // Mission 39: 整十除法大解密
  Gen.missions[39] = function() {
    const divisor = randInt(2, 9);
    const quotient = randInt(1, 9) * 10;
    const dividend = divisor * quotient;
    const qText = `${dividend} &divide; ${divisor} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: quotient.toString(),
      explanation: `${dividend} &divide; ${divisor} = ${quotient}。`,
      key: `M39:div:${dividend}:${divisor}`
    };
  };

  // Mission 40: 三位數除以個位數
  Gen.missions[40] = function() {
    const divisor = randInt(3, 9);
    const quotient = randInt(25, 99);
    const dividend = divisor * quotient;
    const qText = `${dividend} &divide; ${divisor} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: quotient.toString(),
      explanation: `${dividend} &divide; ${divisor} = ${quotient}。`,
      key: `M40:div:${dividend}:${divisor}`
    };
  };
})();
