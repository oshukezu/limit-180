(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  const randInt = Gen.randInt;
  const randChoice = Gen.randChoice;
  const adjustReverseOrder = Gen.adjustReverseOrder;

  // Mission 1: 個位數直覺加法：1+1 至 9+9（無進位）
  Gen.missions[1] = function() {
    const a = randInt(1, 8);
    const b = randInt(1, 9 - a);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    const ans = (x + y).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${x} + ${y} = ${ans}。`,
      key: `M1:add:${x}:${y}`
    };
  };

  // Mission 2: 個位數直覺減法：2-1 至 9-8（無借位）
  Gen.missions[2] = function() {
    const a = randInt(2, 9);
    const b = randInt(1, a - 1);
    const qText = `${a} - ${b} = ?`;
    const ans = (a - b).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${a} - ${b} = ${ans}。`,
      key: `M2:sub:${a}:${b}`
    };
  };

  // Mission 3: 湊十基礎對決：精準尋找 10 的互補數
  Gen.missions[3] = function() {
    const isAdd = Math.random() < 0.5;
    const a = randInt(1, 9);
    const b = 10 - a;
    let qText, ans, key;
    if (isAdd) {
      qText = `${a} + ${b} = ?`;
      ans = "10";
      key = `M3:add:${a}`;
    } else {
      qText = `10 - ${a} = ?`;
      ans = b.toString();
      key = `M3:sub:${a}`;
    }
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: isAdd ? `${a} 加 ${b} 剛好等於 10。` : `10 減 ${a} 等於其互補數 ${b}。`,
      key: key
    };
  };

  // Mission 4: 整十數歡樂加法：單純整十加法
  Gen.missions[4] = function() {
    const a = randChoice([10, 20, 30, 40, 50, 60, 70, 80]);
    const b = randChoice([10, 20, 30, 40, 50, 60, 70, 80]);
    const limit = 100;
    let x = a, y = b;
    if (x + y > limit) {
      x = 30; y = 40;
    }
    const [fx, fy] = adjustReverseOrder(x, y);
    const qText = `${fx} + ${fy} = ?`;
    const ans = (fx + fy).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${fx} + ${fy} = ${ans}。`,
      key: `M4:add:${fx}:${fy}`
    };
  };

  // Mission 5: 整十數歡樂減法：單純整十減法
  Gen.missions[5] = function() {
    const a = randChoice([20, 30, 40, 50, 60, 70, 80, 90]);
    const b = randChoice([10, 20, 30, 40, 50, 60, 70, 80]);
    let x = a, y = b;
    if (x <= y) {
      x = 70; y = 30;
    }
    const qText = `${x} - ${y} = ?`;
    const ans = (x - y).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${x} - ${y} = ${ans}。`,
      key: `M5:sub:${x}:${y}`
    };
  };

  // Mission 6: 九九乘法：入門 2、5、10 家族
  Gen.missions[6] = function() {
    const a = randChoice([2, 5, 10]);
    const b = randInt(1, 9);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} &times; ${y} = ?`;
    const ans = (x * y).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${x} &times; ${y} = ${ans}。`,
      key: `M6:mul:${x}:${y}`
    };
  };

  // Mission 7: 個位數進位加法（心算基礎）
  Gen.missions[7] = function() {
    const a = randInt(2, 9);
    const b = randInt(11 - a, 9);
    const [x, y] = adjustReverseOrder(a, b);
    const qText = `${x} + ${y} = ?`;
    const ans = (x + y).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${x} + ${y} = ${ans} (進位加法)。`,
      key: `M7:add:${x}:${y}`
    };
  };

  // Mission 8: 兩位數與個位數加法（無進位）
  Gen.missions[8] = function() {
    const tens = randInt(1, 9);
    const units = randInt(0, 8);
    const b = randInt(1, 9 - units);
    const a = tens * 10 + units;
    const qText = `${a} + ${b} = ?`;
    const ans = (a + b).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${a} + ${b} = ${ans}。`,
      key: `M8:add:${a}:${b}`
    };
  };

  // Mission 9: 兩位數減個位數（無借位）
  Gen.missions[9] = function() {
    const tens = randInt(1, 9);
    const units = randInt(1, 9);
    const b = randInt(1, units);
    const a = tens * 10 + units;
    const qText = `${a} - ${b} = ?`;
    const ans = (a - b).toString();
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: ans,
      explanation: `${a} - ${b} = ${ans}。`,
      key: `M9:sub:${a}:${b}`
    };
  };

  // Mission 10: 基礎整除均分：九九乘法反向整除
  Gen.missions[10] = function() {
    const divisor = randChoice([2, 5, 10]);
    const quotient = randInt(1, 9);
    const dividend = divisor * quotient;
    const qText = `${dividend} &divide; ${divisor} = ?`;
    return {
      type: 'calc',
      questionText: qText,
      correctAnswer: quotient.toString(),
      explanation: `${dividend} &divide; ${divisor} = ${quotient}。`,
      key: `M10:div:${dividend}:${divisor}`
    };
  };
})();
