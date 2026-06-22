// Limit 180 Storage Locks Module
// Manages locking and unlocking validation logic for missions and levels.

(function() {
  const StorageLocks = {
    // 檢查 Mission 是否已解鎖 (M1-M50)
    isMissionUnlocked(missionNum, _profile) {
      if (missionNum === 1) return true;
      const profile = _profile || this.getProfile();

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
