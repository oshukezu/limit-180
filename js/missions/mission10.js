(function() {
  const Gen = window.MathSprintGenerator = window.MathSprintGenerator || {};
  Gen.missions = Gen.missions || {};

  // Mission 10 [傳奇]: 全範疇極速衝刺
  Gen.missions[10] = function() {
    const subLevel = Gen.randInt(1, 9);
    const rawQ = Gen.generateRawQuestion(subLevel);
    if (rawQ) {
      rawQ.key = `L10:subL${subLevel}:${rawQ.key}`;
    }
    return rawQ;
  };
})();
