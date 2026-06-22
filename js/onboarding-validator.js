// Limit 180 Onboarding Validator Module
// Manages sensitive words listing and input validation rules.

(function() {
  const SENSITIVE_WORDS = [
    '幹', '傻逼', '垃圾', '智障', '死', '白癡', '白痴', '廢物', 
    'fuck', 'shit', 'bitch', '幹你娘', '機掰', '屁股', '笨蛋', '智障'
  ];

  const Validator = {
    validateClass(inputClass) {
      // 驗證班級 (一律以英文字母 2 位 + 數字 3 位做定義，如 ST501)
      if (!/^[A-Z]{2}[0-9]{3}$/.test(inputClass)) {
        return { valid: false, error: "班級格式錯誤，須為 2 位英文字母 + 3 位數字組合（例如：ST501）" };
      }
      return { valid: true };
    },

    validateSeat(inputSeat) {
      // 驗證座號 (1-50號)
      const seatNum = parseInt(inputSeat);
      if (isNaN(seatNum) || seatNum < 1 || seatNum > 50) {
        return { valid: false, error: "座號錯誤，須為 1 至 50 號" };
      }
      return { valid: true };
    },

    validateNickname(inputNickname) {
      // 驗證暱稱長度 (2-8字元)
      if (inputNickname.length < 2 || inputNickname.length > 8) {
        return { valid: false, error: "暱稱長度須在 2 至 8 個字元之間" };
      }

      // 防霸凌敏感詞過濾
      const lowercaseNick = inputNickname.toLowerCase();
      const containsSensitive = SENSITIVE_WORDS.some(word => lowercaseNick.includes(word));
      if (containsSensitive) {
        return { valid: false, error: "暱稱包含敏感詞，請重新輸入" };
      }

      return { valid: true };
    }
  };

  window.MathSprintOnboardingValidator = Validator;
})();
