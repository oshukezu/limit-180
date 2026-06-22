(function() {
  const OnboardingSync = {
    // 雲端掛號與成績合流
    async uploadAllLocalStats(inputClass, inputSeat, inputNickname) {
      if (!window.MathSprintSupabaseService) return;
      
      let hasUploaded = false;
      const count = Object.keys(window.MathSprintConfigs.MISSION_CONFIGS).length;

      for (let m = 1; m <= count; m++) {
        let missionStars = 0;
        let totalTime = 0;
        let recordCount = 0;
        let minTime = 999;

        if (window.MathSprintStorage) {
          const localProfile = window.MathSprintStorage.getProfile();
          for (let l = 1; l <= 20; l++) {
            const rec = localProfile.level_records[`mission-${m}-level-${l}`];
            if (rec) {
              missionStars += rec.stars || 0;
              if (rec.stars > 0 && rec.best_avg_time && rec.best_avg_time < 999) {
                totalTime += rec.best_avg_time;
                recordCount++;
              }
              if (rec.min_time && rec.min_time < minTime) {
                minTime = rec.min_time;
              }
            }
          }
          // 延遲註冊合流運算：若是 Mission 1，則把本地所有 bonus_stars 一併加進來同步到雲端！
          if (m === 1) {
            missionStars += (localProfile.bonus_stars || 0);
          }
        }

        const avgTime = recordCount > 0 ? parseFloat((totalTime / recordCount).toFixed(3)) : 999;
        if (missionStars > 0 && avgTime < 999) {
          await window.MathSprintSupabaseService.saveRecord(
            inputClass,
            inputSeat,
            inputNickname,
            m,
            missionStars,
            avgTime,
            minTime === 999 ? 99.9 : parseFloat(minTime.toFixed(3))
          );
          hasUploaded = true;
        }
      }
      
      // 如果本機完全無成績，我們也幫他建一筆 Mission 1 的 0 星記錄佔位
      if (!hasUploaded) {
        await window.MathSprintSupabaseService.saveRecord(
          inputClass,
          inputSeat,
          inputNickname,
          1,
          0,
          99.9,
          99.9
        );
      }

      // 同步全域狀態至 users_global
      if (window.MathSprintStorage && window.MathSprintSupabaseService && window.MathSprintSupabaseService.saveGlobalProfile) {
        const localProfile = window.MathSprintStorage.getProfile();
        const coinsBalance = localProfile.total_stars || 0;
        const purchasedItems = localProfile.purchased_items || [];
        try {
          await window.MathSprintSupabaseService.saveGlobalProfile(
            inputClass,
            inputSeat,
            inputNickname,
            coinsBalance,
            purchasedItems,
            localProfile.equipped_avatar || 'avatar-default',
            localProfile.equipped_border || 'border-none',
            localProfile.equipped_badges || [],
            localProfile.unlocked_assets || ['avatar-default', 'border-none']
          );
        } catch (globalErr) {
          console.warn("[OnboardingSync] 同步全域狀態至 users_global 失敗：", globalErr.message || globalErr);
        }
      }

      if (window.MathSprintLeaderboard && window.MathSprintLeaderboard.renderLeaderboard) {
        window.MathSprintLeaderboard.renderLeaderboard().catch(() => {});
      }
    },

    // 全域同步特定關卡成績至雲端
    async syncCurrentStatsToCloud(missionId) {
      if (!missionId) return;
      const profileStr = localStorage.getItem('limit180_user_profile');
      if (!profileStr) return;
      const u = JSON.parse(profileStr);

      if (window.MathSprintStorage) {
        const localProfile = window.MathSprintStorage.getProfile();
        let missionStars = 0;
        let totalTime = 0;
        let recordCount = 0;
        let minTime = 999;

        for (let l = 1; l <= 20; l++) {
          const rec = localProfile.level_records[`mission-${missionId}-level-${l}`];
          if (rec) {
            missionStars += rec.stars || 0;
            if (rec.stars > 0 && rec.best_avg_time && rec.best_avg_time < 999) {
              totalTime += rec.best_avg_time;
              recordCount++;
            }
            if (rec.min_time && rec.min_time < minTime) {
              minTime = rec.min_time;
            }
          }
        }

        if (Number(missionId) === 1) {
          missionStars += (localProfile.bonus_stars || 0);
        }

        const avgTime = recordCount > 0 ? parseFloat((totalTime / recordCount).toFixed(3)) : 999;
        
        if (missionStars > 0 && avgTime < 999) {
          if (window.MathSprintSupabaseService && window.MathSprintSupabaseService.saveRecord) {
            try {
              await window.MathSprintSupabaseService.saveRecord(
                u.grade_class,
                u.seat_number,
                u.nickname,
                missionId,
                missionStars,
                avgTime,
                minTime === 999 ? 99.9 : parseFloat(minTime.toFixed(3))
              );
              console.log(`[Onboarding] 雲端 Mission ${missionId} 進度同步成功。`);

              // 同步全域狀態至 users_global
              if (window.MathSprintSupabaseService.saveGlobalProfile) {
                const coinsBalance = localProfile.total_stars || 0;
                const purchasedItems = localProfile.purchased_items || [];
                await window.MathSprintSupabaseService.saveGlobalProfile(
                  u.grade_class,
                  u.seat_number,
                  u.nickname,
                  coinsBalance,
                  purchasedItems,
                  localProfile.equipped_avatar || 'avatar-default',
                  localProfile.equipped_border || 'border-none',
                  localProfile.equipped_badges || [],
                  localProfile.unlocked_assets || ['avatar-default', 'border-none']
                ).catch((err) => {
                  console.warn("[Onboarding] 雲端全域狀態自動同步失敗：", err.message || err);
                });
              }

              if (window.MathSprintLeaderboard && window.MathSprintLeaderboard.renderLeaderboard) {
                window.MathSprintLeaderboard.renderLeaderboard().catch(() => {});
              }
            } catch (e) {
              console.warn(`[Onboarding] 雲端 Mission ${missionId} 進度自動同步失敗：`, e.message);
            }
          }
        }
      }
    }
  };

  // Mixin
  window.MathSprintOnboarding = window.MathSprintOnboarding || {};
  Object.assign(window.MathSprintOnboarding, OnboardingSync);
})();
