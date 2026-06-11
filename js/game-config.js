// Limit 180 — 關卡設定模組 (Config Module)
(function() {
  const MISSION_CONFIGS = {
    1: { name: "Mission 1", totalQuestions: 20, desc: "20以內加減法（含進/借位）", initStart: 6.0, initEnd: 3.0, targetStart: 4.0, targetEnd: 1.5 },
    2: { name: "Mission 2", totalQuestions: 20, desc: "九九乘法表", initStart: 5.5, initEnd: 2.5, targetStart: 3.5, targetEnd: 1.5 },
    3: { name: "Mission 3", totalQuestions: 20, desc: "81以內除法（被除數81以內）", initStart: 5.0, initEnd: 2.5, targetStart: 3.0, targetEnd: 1.5 },
    4: { name: "Mission 4", totalQuestions: 25, desc: "50以內加減法（無進/借位）", initStart: 4.5, initEnd: 2.0, targetStart: 2.5, targetEnd: 1.3 },
    5: { name: "Mission 5 [魔王]", totalQuestions: 30, desc: "100以內加減法（有進/借位）", initStart: 4.0, initEnd: 2.0, targetStart: 2.2, targetEnd: 1.3 },
    6: { name: "Mission 6", totalQuestions: 35, desc: "九九乘法與基本除法", initStart: 3.5, initEnd: 1.8, targetStart: 2.0, targetEnd: 1.2 },
    7: { name: "Mission 7 [魔王]", totalQuestions: 40, desc: "兩步驟四則混合運算", initStart: 3.0, initEnd: 1.8, targetStart: 1.8, targetEnd: 1.2 },
    8: { name: "Mission 8", totalQuestions: 50, desc: "分數/小數/百分比混搭二選一", initStart: 2.5, initEnd: 1.5, targetStart: 1.8, targetEnd: 0.9 },
    9: { name: "Mission 9", totalQuestions: 60, desc: "國中正負數代數與高難度比大小", initStart: 2.0, initEnd: 1.5, targetStart: 1.8, targetEnd: 1.0 },
    10: { name: "Limit 180 終極挑戰", totalQuestions: 100, desc: "在 3 分鐘 (180秒) 內挑戰做完 100 題！", initStart: 1.8, initEnd: 1.8, targetStart: 1.8, targetEnd: 1.8 }
  };

  window.MathSprintConfigs = {
    MISSION_CONFIGS
  };
})();
