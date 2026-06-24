// Limit 180 Storage Locks Module
// Manages locking and unlocking validation logic for missions and levels.

(function() {
  const StorageLocks = {
    getMissionUnlockCost(missionNum) {
      if (missionNum <= 1) return 0;
      if (missionNum >= 48) return 10000000;
      if (missionNum >= 45) return 5000000;
      if (missionNum >= 41) return 2000000;
      if (missionNum >= 36) return 800000;
      if (missionNum >= 31) return 400000;
      if (missionNum >= 26) return 200000;
      if (missionNum >= 21) return 100000;
      if (missionNum >= 16) return 40000;
      if (missionNum >= 11) return 20000;
      if (missionNum >= 6) return 6000;
      return 4000;
    },

    async purchaseMissionUnlock(missionNum) {
      const profile = this.getProfile();
      profile.purchased_missions = Array.isArray(profile.purchased_missions) ? profile.purchased_missions : [];
      if (this.isMissionUnlocked(missionNum, profile)) {
        window.UIFeedback?.toast?.(`Mission ${missionNum} 已經解鎖`, 'info');
        return false;
      }

      const cost = this.getMissionUnlockCost(missionNum);
      const agreed = window.UIFeedback
        ? await window.UIFeedback.confirm(`確定要花費 ${cost.toLocaleString('zh-TW')} 💰 解鎖 Mission ${missionNum} 嗎？`, '確認解鎖')
        : confirm(`確定要花費 ${cost.toLocaleString()} 金幣解鎖 Mission ${missionNum} 嗎？`);
      if (!agreed) return false;

      if ((profile.total_stars || 0) < cost) {
        window.UIFeedback?.toast?.('金幣不足，暫時無法解鎖這個 Mission。', 'error');
        return false;
      }

      profile.purchased_missions.push(missionNum);
      profile.coins_spent = (profile.coins_spent || 0) + cost;
      profile.total_stars = Math.max(0, (profile.total_stars || 0) - cost);
      this.saveProfile(profile);
      window.UIFeedback?.toast?.(`已解鎖 Mission ${missionNum}`, 'success');
      return true;
    },

    // 檢查 Mission 是否已解鎖 (M1-M50)
    isMissionUnlocked(missionNum, _profile) {
      if (missionNum === 1) return true;
      const profile = _profile || this.getProfile();
      const purchased = Array.isArray(profile.purchased_missions) ? profile.purchased_missions : [];
      if (purchased.includes(missionNum)) return true;

      // 彈性跳級：如果解鎖階段達到 3 (極速菁英)，直接解鎖 Mission 21 及以下關卡
      if ((profile.max_unlocked_phase || 1) >= 3 && missionNum <= 21) {
        return true;
      }

      function getRequiredAccuracy(m) {
        if (m >= 41) return 0.90;
        if (m >= 31) return 0.80;
        if (m >= 21) return 0.70;
        return 0.60;
      }
 
      // 從 Mission 1 往上依序檢查，前一個 Mission 的 20 個關卡都必須通過且正確率達到該階段門檻
      for (let m = 2; m <= missionNum; m++) {
        // 如果是菁英玩家，且我們正在檢查小於等於 21 的關卡，直接跳過基礎關卡的檢查
        if ((profile.max_unlocked_phase || 1) >= 3 && m <= 21) {
          continue;
        }
        const prevMission = m - 1;
        const reqAcc = getRequiredAccuracy(m);
        for (let l = 1; l <= 20; l++) {
          const record = profile.level_records[`mission-${prevMission}-level-${l}`];
          if (!record || !record.is_passed || (record.accuracy !== undefined && record.accuracy < reqAcc)) {
            return false;
          }
        }
      }
      return true;
    },

    // 檢查 Sub-level 是否已解鎖 (L1-L20)
    isLevelUnlocked(missionNum, levelNum, _profile) {
      const profile = _profile || this.getProfile();

      // 必須先解鎖所屬 Mission
      if (!this.isMissionUnlocked(missionNum, profile)) return false;

      // Level 1 在 Mission 解鎖時自動開放
      if (levelNum === 1) return true;

      // 其他 Level：前一關星數必須 > 0 (已通過)
      const prevKey = `mission-${missionNum}-level-${levelNum - 1}`;
      const prevRecord = profile.level_records[prevKey];
      
      return prevRecord && (prevRecord.is_passed === true || (prevRecord.stars || 0) > 0);
    }
  };

  // Mixin into MathSprintStorage
  window.MathSprintStorage = window.MathSprintStorage || {};
  Object.assign(window.MathSprintStorage, StorageLocks);
})();
