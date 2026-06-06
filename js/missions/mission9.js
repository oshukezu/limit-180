(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 9: 國中正負數與代數 + 高難度比大小 (原 L8-9 融合)
  Gen.missions[9] = function() {
    const isCompare = Math.random() < 0.5;

    if (isCompare) {
      // High difficulty comparison (originally L9, tight margins)
      const types = ['fraction', 'decimal', 'percent'];
      let leftObj, rightObj, leftType, rightType;

      let attempts = 0;
      while (attempts < 100) {
        leftType = Gen.randChoice(types);
        rightType = Gen.randChoice(types);

        if (leftType === 'fraction') leftObj = Gen.generateFractionObj();
        else if (leftType === 'decimal') leftObj = Gen.generateDecimalObj();
        else leftObj = Gen.generatePercentObj();

        if (rightType === 'fraction') rightObj = Gen.generateFractionObj();
        else if (rightType === 'decimal') rightObj = Gen.generateDecimalObj();
        else rightObj = Gen.generatePercentObj();

        const diff = Math.abs(leftObj.value - rightObj.value);
        // Tight margins: between 0.005 and 0.08
        if (diff > 0.005 && diff <= 0.08) break;
        attempts++;
      }

      const leftText = leftObj.text;
      const rightText = rightObj.text;
      const leftVal = leftObj.value;
      const rightVal = rightObj.value;
      const ans = leftVal > rightVal ? ">" : "<";
      const key = `L9:comp:${leftObj.raw}:${rightObj.raw}`;

      return {
        type: 'compare',
        questionText: `比較大小 (高難度)`,
        leftText: leftText,
        rightText: rightText,
        correctAnswer: ans,
        explanation: `${leftObj.text} 的值為 ${leftObj.value.toFixed(3).replace(/\.?0+$/, "")}，而 ${rightObj.text} 的值為 ${rightObj.value.toFixed(3).replace(/\.?0+$/, "")}。所以為 ${ans}。`,
        key: key,
        scaffoldData: {
          leftType: leftType,
          rightType: rightType,
          leftVal: leftVal,
          rightVal: rightVal,
          fracDetails: leftType === 'fraction' ? leftObj : (rightType === 'fraction' ? rightObj : null)
        }
      };
    } else {
      // Algebra / Negative numbers (originally L8)
      const isAlgebra = Math.random() < 0.5;
      let qText, ans, key, exp;

      if (isAlgebra) {
        const type = Gen.randInt(1, 3);
        let a, x, b;

        if (type === 1) {
          a = Gen.randInt(2, 9);
          x = Gen.randInt(-9, 9);
          while (x === 0 || x === 1) x = Gen.randInt(-9, 9);
          b = a * x;
          qText = `${a}x = ${b}，求 x = ?`;
          ans = x.toString();
          exp = `同除以 ${a}，得 x = ${b} / ${a} = ${ans}。`;
        } else if (type === 2) {
          a = Gen.randInt(-15, 15);
          while (a === 0) a = Gen.randInt(-15, 15);
          x = Gen.randInt(-15, 15);
          b = x + a;
          const aStr = a < 0 ? `(${a})` : `${a}`;
          qText = `x + ${aStr} = ${b}，求 x = ?`;
          ans = x.toString();
          exp = `移項得 x = ${b} - (${aStr}) = ${ans}。`;
        } else {
          a = Gen.randInt(-15, 15);
          while (a === 0) a = Gen.randInt(-15, 15);
          x = Gen.randInt(-15, 15);
          b = x - a;
          const aStr = a < 0 ? `(${a})` : `${a}`;
          qText = `x - ${aStr} = ${b}，求 x = ?`;
          ans = x.toString();
          exp = `移項得 x = ${b} + (${aStr}) = ${ans}。`;
        }
        key = `L9:alg:${type}:${a}:${x}`;
      } else {
        const type = Gen.randInt(1, 3);
        let a = Gen.randInt(5, 25);
        let b = Gen.randInt(5, 25);
        
        if (type === 1) {
          qText = `(-${a}) + ${b} = ?`;
          ans = (-a + b).toString();
        } else if (type === 2) {
          qText = `${a} + (-${b}) = ?`;
          ans = (a - b).toString();
        } else {
          qText = `(-${a}) - ${b} = ?`;
          ans = (-a - b).toString();
        }
        key = `L9:neg:${type}:${a}:${b}`;
        exp = `${qText.replace(' = ?', '')} = ${ans}。`;
      }

      return {
        type: 'calc',
        questionText: qText,
        correctAnswer: ans,
        explanation: exp,
        key: key
      };
    }
  };
})();
