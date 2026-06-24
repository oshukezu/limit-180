(function() {
  async function prepareMissionLedgerDelta(gradeClass, seatNumber, missionId, missionStars) {
    if (missionStars <= 0) return null;

    const db = window.MathSprintSupabaseService.initSupabase();
    if (!db) return null;

    const { data: oldRow, error: oldErr } = await db
      .from('users_profile')
      .select('stars')
      .eq('grade_class', gradeClass)
      .eq('seat_number', seatNumber)
      .eq('mission_id', missionId)
      .maybeSingle();
    if (oldErr) throw oldErr;

    const prevStars = Number(oldRow?.stars || 0);
    const delta = Math.max(0, missionStars - prevStars);
    if (delta <= 0) return null;

    return {
      delta,
      prevStars,
      eventKey: `${gradeClass}:${seatNumber}:mission:${missionId}:stars:${missionStars}`
    };
  }

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
          const missionLedger = await prepareMissionLedgerDelta(inputClass, inputSeat, m, missionStars);
          await window.MathSprintSupabaseService.saveRecord(
            inputClass,
            inputSeat,
            inputNickname,
            m,
            missionStars,
            avgTime,
            minTime === 999 ? 99.9 : parseFloat(minTime.toFixed(3))
          );
          if (missionLedger && window.MathSprintSupabaseService?.applyCoinTransaction) {
            await window.MathSprintSupabaseService.applyCoinTransaction(
              inputClass,
              inputSeat,
              inputNickname,
              missionLedger.delta,
              'mission_reward_sync',
              { missionId: m, previousStars: missionLedger.prevStars, newStars: missionStars },
              missionLedger.eventKey
            );
          }
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
              const missionLedger = await prepareMissionLedgerDelta(u.grade_class, u.seat_number, missionId, missionStars);
              await window.MathSprintSupabaseService.saveRecord(
                u.grade_class,
                u.seat_number,
                u.nickname,
                missionId,
                missionStars,
                avgTime,
                minTime === 999 ? 99.9 : parseFloat(minTime.toFixed(3))
              );
              if (missionLedger && window.MathSprintSupabaseService?.applyCoinTransaction) {
                await window.MathSprintSupabaseService.applyCoinTransaction(
                  u.grade_class,
                  u.seat_number,
                  u.nickname,
                  missionLedger.delta,
                  'mission_reward_sync',
                  { missionId, previousStars: missionLedger.prevStars, newStars: missionStars },
                  missionLedger.eventKey
                );
              }
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
    },

    // 跨裝置登入：依班級、座號、暱稱從雲端拉回資料並重建本地存檔
    async loginFromCloud(gradeClass, seatNumber, nickname) {
      if (!window.MathSprintSupabaseService) {
        throw new Error('雲端服務尚未啟用');
      }
      const db = window.MathSprintSupabaseService.initSupabase();
      if (!db) throw new Error('Supabase 未初始化');

      const gc = String(gradeClass || '').trim().toUpperCase();
      const sn = String(seatNumber || '').trim();
      const nn = String(nickname || '').trim();

      const { data: globalRow, error: gErr } = await db
        .from('users_global')
        .select('*')
        .eq('grade_class', gc)
        .eq('seat_number', sn)
        .eq('nickname', nn)
        .maybeSingle();

      if (gErr) throw gErr;
      if (!globalRow) {
        const { data: seatRow, error: seatErr } = await db
          .from('users_global')
          .select('nickname')
          .eq('grade_class', gc)
          .eq('seat_number', sn)
          .maybeSingle();
        if (seatErr) throw seatErr;
        if (seatRow) {
          throw new Error(`此班級與座號已註冊（${seatRow.nickname}）。請確認姓名是否輸入正確。`);
        }
        throw new Error('查無此班級與座號資料，請確認輸入是否正確');
      }

      const { data: profileRows, error: pErr } = await db
        .from('users_profile')
        .select('*')
        .eq('grade_class', gc)
        .eq('seat_number', sn)
        .order('mission_id', { ascending: true });

      if (pErr) throw pErr;

      const profile = window.MathSprintStorage.getProfile();
      const localLevelRecords = profile.level_records || {};
      const localCoins = Number(profile.total_stars || 0);
      const cloudCoins = Number(globalRow.coins_balance || 0);

      // 金幣防倒退：登入採較大值，避免跨裝置被舊值覆蓋
      profile.total_stars = Math.max(localCoins, cloudCoins);
      profile.today_earnings = profile.today_earnings || 0;

      const localUnlockedAssets = Array.isArray(profile.unlocked_assets) ? profile.unlocked_assets : ['avatar-default', 'border-none'];
      const cloudUnlockedAssets = Array.isArray(globalRow.unlocked_assets) ? globalRow.unlocked_assets : ['avatar-default', 'border-none'];
      profile.unlocked_assets = Array.from(new Set([...localUnlockedAssets, ...cloudUnlockedAssets]));

      const localThemes = Array.isArray(profile.purchased_themes) ? profile.purchased_themes : ['akaimon'];
      const cloudThemes = Array.isArray(globalRow.purchased_items) ? globalRow.purchased_items : [];
      profile.purchased_themes = Array.from(new Set([...localThemes, ...cloudThemes, 'akaimon']));

      const localBadges = Array.isArray(profile.equipped_badges) ? profile.equipped_badges : [];
      const cloudBadges = Array.isArray(globalRow.equipped_badges) ? globalRow.equipped_badges : [];
      profile.equipped_badges = Array.from(new Set([...cloudBadges, ...localBadges])).slice(0, 1);

      // 裝備優先規則：若本機裝備仍有效就保留，否則採雲端
      const cloudAvatar = globalRow.equipped_avatar || 'avatar-default';
      const cloudBorder = globalRow.equipped_border || 'border-none';
      const localAvatar = profile.equipped_avatar || 'avatar-default';
      const localBorder = profile.equipped_border || 'border-none';
      profile.equipped_avatar = profile.unlocked_assets.includes(localAvatar) ? localAvatar : cloudAvatar;
      profile.equipped_border = profile.unlocked_assets.includes(localBorder) ? localBorder : cloudBorder;

      let maxMission = 1;
      const mergedRecords = { ...localLevelRecords };
      (profileRows || []).forEach((row) => {
        const missionId = Number(row.mission_id || 0);
        const missionStars = Math.max(0, Number(row.stars || 0));
        if (!missionId || missionStars <= 0) return;
        if (missionId > maxMission) maxMission = missionId;

        const base = Math.floor(missionStars / 20);
        const rem = missionStars % 20;
        for (let lvl = 1; lvl <= 20; lvl++) {
          const key = `mission-${missionId}-level-${lvl}`;
          const stars = base + (lvl <= rem ? 1 : 0);
          const prev = mergedRecords[key] || {};
          mergedRecords[key] = {
            stars: Math.max(Number(prev.stars || 0), stars),
            best_avg_time: Math.min(Number(prev.best_avg_time || 99.9), Number(row.best_avg_time || 99.9)),
            max_combo: Math.max(Number(prev.max_combo || 0), 20),
            min_time: Math.min(Number(prev.min_time || 99.9), Number(row.min_time || 99.9)),
            accuracy: Math.max(Number(prev.accuracy || 0), 1.0),
            is_passed: true
          };
        }
      });
      profile.level_records = mergedRecords;

      profile.max_unlocked_phase = Math.max(profile.max_unlocked_phase || 1, maxMission >= 21 ? 3 : 1);
      window.MathSprintStorage.saveProfile(profile);

      localStorage.setItem('limit180_user_profile', JSON.stringify({
        grade_class: gc,
        seat_number: sn,
        nickname: nn
      }));
      localStorage.setItem('limit180_last_sync_at', globalRow.updated_at || new Date().toISOString());

      // 回寫一次 users_global，啟用 server/client 雙層防倒退保護
      if (window.MathSprintSupabaseService.saveGlobalProfile) {
        await window.MathSprintSupabaseService.saveGlobalProfile(
          gc,
          sn,
          nn,
          profile.total_stars || 0,
          profile.purchased_themes || ['akaimon'],
          profile.equipped_avatar || 'avatar-default',
          profile.equipped_border || 'border-none',
          profile.equipped_badges || [],
          profile.unlocked_assets || ['avatar-default', 'border-none']
        );
      }

      return {
        missions: (profileRows || []).length,
        coins: profile.total_stars
      };
    }
  };

  // Mixin
  window.MathSprintOnboarding = window.MathSprintOnboarding || {};
  Object.assign(window.MathSprintOnboarding, OnboardingSync);
})();
