(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 8: 分數/小數/百分比混搭二選一 (原 L5, L6, L7 融合)
  Gen.missions[8] = function() {
    const subType = Gen.randInt(1, 3);
    let frac, dec, pct, ans, key, leftText, rightText, leftVal, rightVal, explanation, scaffold;

    if (subType === 1) {
      // Fraction vs Decimal (originally L5)
      let attempts = 0;
      while (attempts < 50) {
        frac = Gen.generateFractionObj();
        dec = Gen.generateDecimalObj();
        if (Math.abs(frac.value - dec.value) > 0.001) break;
        attempts++;
      }
      const fracOnLeft = Math.random() < 0.5;
      leftText = fracOnLeft ? frac.text : dec.text;
      rightText = fracOnLeft ? dec.text : frac.text;
      leftVal = fracOnLeft ? frac.value : dec.value;
      rightVal = fracOnLeft ? dec.value : frac.value;
      ans = leftVal > rightVal ? ">" : "<";
      key = `L8:FvsD:${frac.raw}:${dec.raw}:${fracOnLeft}`;
      explanation = `${fracOnLeft ? frac.raw : dec.text} 等於 ${fracOnLeft ? frac.value : frac.value}，與 ${fracOnLeft ? dec.text : frac.raw} (值為 ${fracOnLeft ? dec.value : dec.value}) 相比，所以為 ${ans}。`;
      scaffold = {
        leftType: fracOnLeft ? 'fraction' : 'decimal',
        rightType: fracOnLeft ? 'decimal' : 'fraction',
        leftVal: leftVal,
        rightVal: rightVal,
        fracDetails: frac
      };
    } else if (subType === 2) {
      // Decimal vs Percent (originally L6)
      let attempts = 0;
      while (attempts < 50) {
        dec = Gen.generateDecimalObj();
        pct = Gen.generatePercentObj();
        if (Math.abs(dec.value - pct.value) > 0.001) break;
        attempts++;
      }
      const decOnLeft = Math.random() < 0.5;
      leftText = decOnLeft ? dec.text : pct.text;
      rightText = decOnLeft ? pct.text : dec.text;
      leftVal = decOnLeft ? dec.value : pct.value;
      rightVal = decOnLeft ? pct.value : dec.value;
      ans = leftVal > rightVal ? ">" : "<";
      key = `L8:DvsP:${dec.raw}:${pct.raw}:${decOnLeft}`;
      explanation = `${pct.text} 等於 ${pct.value}。對比 ${dec.text}，所以為 ${ans}。`;
      scaffold = {
        leftType: decOnLeft ? 'decimal' : 'percent',
        rightType: decOnLeft ? 'percent' : 'decimal',
        leftVal: leftVal,
        rightVal: rightVal
      };
    } else {
      // Three-way mix two elements (originally L7)
      const types = ['fraction', 'decimal', 'percent'];
      const t1 = Gen.randChoice(types);
      let t2 = Gen.randChoice(types);
      while (t1 === t2) t2 = Gen.randChoice(types);

      let obj1, obj2;
      if (t1 === 'fraction') obj1 = Gen.generateFractionObj();
      else if (t1 === 'decimal') obj1 = Gen.generateDecimalObj();
      else obj1 = Gen.generatePercentObj();

      let attempts = 0;
      while (attempts < 50) {
        if (t2 === 'fraction') obj2 = Gen.generateFractionObj();
        else if (t2 === 'decimal') obj2 = Gen.generateDecimalObj();
        else obj2 = Gen.generatePercentObj();
        if (Math.abs(obj1.value - obj2.value) > 0.001) break;
        attempts++;
      }

      leftText = obj1.text;
      rightText = obj2.text;
      leftVal = obj1.value;
      rightVal = obj2.value;
      ans = leftVal > rightVal ? ">" : "<";
      key = `L8:mix:${obj1.raw}:${obj2.raw}`;
      explanation = `${obj1.text} 的值約為 ${obj1.value.toFixed(3).replace(/\.?0+$/, "")}，${obj2.text} 的值約為 ${obj2.value.toFixed(3).replace(/\.?0+$/, "")}。所以為 ${ans}。`;
      scaffold = {
        leftType: t1,
        rightType: t2,
        leftVal: leftVal,
        rightVal: rightVal,
        fracDetails: t1 === 'fraction' ? obj1 : (t2 === 'fraction' ? obj2 : null)
      };
    }

    return {
      type: 'compare',
      questionText: `比較大小`,
      leftText: leftText,
      rightText: rightText,
      correctAnswer: ans,
      explanation: explanation,
      key: key,
      scaffoldData: scaffold
    };
  };
})();
