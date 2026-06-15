// 雲端同步模組 (Cloud Sync)
// 負責 localStorage ↔ Supabase 雙向同步與合併策略

(function () {
  const CFG = window.MATH_SPRINT_CONFIG;
  if (!CFG || !CFG.CLOUD_ENABLED) {
    window.MathSprintCloudSync = {
      syncToCloud: async () => { },
      syncOnLogin: async () => { },
      isOnline: () => navigator.onLine
    };
    return;
  }

  const supabase = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  const CloudSync = {
    _isSyncing: false,

    isOnline() {
      return navigator.onLine;
    },

    // 取得目前登入的 user_id
    _getUserId() {
      return window.MathSprintAuth?.currentUser?.id || null;
    },

    // 合併本地與雲端 profile（取各子關卡最優成績）
    mergeProfiles(local, remote) {
      const merged = JSON.parse(JSON.stringify(local));

      if (!remote) return merged;

      // 合併 level_records：取 stars / combo 較高、avg_time 較低者
      for (const key in remote.level_records) {
        const r = remote.level_records[key];
        const l = merged.level_records[key];
        if (!l) {
          merged.level_records[key] = r;
        } else {
          merged.level_records[key] = {
            stars: Math.max(l.stars, r.stars),
            best_avg_time: Math.min(l.best_avg_time, r.best_avg_time),
            max_combo: Math.max(l.max_combo, r.max_combo)
          };
        }
      }

      // 重算 total_stars
      let totalStars = 0;
      for (const key in merged.level_records) {
        totalStars += merged.level_records[key].stars || 0;
      }
      merged.total_stars = totalStars;

      // 合併 wrong_questions_db（以 questionText 為 key 去重）
      const wrongMap = {};
      const allWrong = [...(local.wrong_questions_db || []), ...(remote.wrong_questions_db || [])];
      allWrong.forEach(q => {
        if (!wrongMap[q.questionText] || q.failCount > wrongMap[q.questionText].failCount) {
          wrongMap[q.questionText] = q;
        }
      });
      merged.wrong_questions_db = Object.values(wrongMap);

      // 合併 unlocked_achievements（聯集）
      const achSet = new Set([
        ...(local.unlocked_achievements || []),
        ...(remote.unlocked_achievements || [])
      ]);
      merged.unlocked_achievements = Array.from(achSet);

      // 合併 shields（取較大值）
      merged.shields_count = Math.max(local.shields_count || 0, remote.shields_count || 0);

      return merged;
    },

    // 從 Supabase 拉取雲端存檔，轉換為本地 profile 格式
    async _fetchRemoteProfile(userId) {
      try {
        // 取得 user_profiles 基礎資料
        const { data: profileData, error: pErr } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (pErr && pErr.code !== 'PGRST116') throw pErr;

        // 取得所有 level_records
        const { data: records, error: rErr } = await supabase
          .from('level_records')
          .select('*')
          .eq('user_id', userId);
        if (rErr) throw rErr;

        // 轉換為本地 profile 格式
        const remoteProfile = {
          total_stars: profileData?.total_stars || 0,
          shields_count: profileData?.shields_count || 0,
          level_records: {},
          wrong_questions_db: profileData?.wrong_questions_db || [],
          unlocked_achievements: profileData?.unlocked_achievements || [],
        };

        (records || []).forEach(r => {
          remoteProfile.level_records[`mission-${r.mission_num}-level-${r.level_num}`] = {
            stars: r.stars,
            best_avg_time: r.best_avg_time,
            max_combo: r.max_combo
          };
        });

        return remoteProfile;
      } catch (e) {
        console.warn('[CloudSync] 拉取雲端存檔失敗:', e.message);
        return null;
      }
    },

    // 將本地 profile 上傳至 Supabase（非阻塞）
    async syncToCloud(profile) {
      if (!this.isOnline() || this._isSyncing) return;
      const userId = this._getUserId();
      if (!userId) return;

      this._isSyncing = true;

      try {
        // 更新 user_profiles
        await supabase.from('user_profiles').upsert({
          id: userId,
          nickname: window.MathSprintAuth?.getNickname() || 'PIXEL-????',
          total_stars: profile.total_stars || 0,
          shields_count: profile.shields_count || 0,
          wrong_questions_db: profile.wrong_questions_db || [],
          unlocked_achievements: profile.unlocked_achievements || [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        // 批次 Upsert level_records
        const records = [];
        for (const key in profile.level_records) {
          const match = key.match(/^mission-(\d+)-level-(\d+)$/);
          if (!match) continue;
          const rec = profile.level_records[key];
          records.push({
            user_id: userId,
            mission_num: parseInt(match[1]),
            level_num: parseInt(match[2]),
            stars: rec.stars || 0,
            best_avg_time: rec.best_avg_time || 999,
            max_combo: rec.max_combo || 0,
            updated_at: new Date().toISOString()
          });
        }

        if (records.length > 0) {
          // 分批上傳避免 payload 過大（每批 50 筆）
          for (let i = 0; i < records.length; i += 50) {
            const batch = records.slice(i, i + 50);
            const { error } = await supabase
              .from('level_records')
              .upsert(batch, { onConflict: 'user_id,mission_num,level_num' });
            if (error) console.warn('[CloudSync] batch upsert 失敗:', error.message);
          }
        }

        console.log('[CloudSync] ✅ 同步至雲端完成');
      } catch (e) {
        console.warn('[CloudSync] syncToCloud 失敗:', e.message);
      } finally {
        this._isSyncing = false;
      }
    },

    // 登入時執行：雙向合併同步（本地 + 雲端取最優）
    async syncOnLogin() {
      if (!this.isOnline()) return;
      const userId = this._getUserId();
      if (!userId) return;

      console.log('[CloudSync] 開始登入同步...');

      const localProfile = window.MathSprintStorage.getProfile();
      const remoteProfile = await this._fetchRemoteProfile(userId);

      if (remoteProfile) {
        const merged = this.mergeProfiles(localProfile, remoteProfile);
        // 寫回 localStorage
        window.MathSprintStorage.saveProfile(merged);
        // 上傳合併後的結果至雲端
        await this.syncToCloud(merged);
        console.log('[CloudSync] ✅ 雙向合併完成，total_stars:', merged.total_stars);
      } else {
        // 雲端無存檔 → 將本地存檔上傳
        await this.syncToCloud(localProfile);
        console.log('[CloudSync] ✅ 本地存檔已上傳至雲端');
      }
    }
  };

  window.MathSprintCloudSync = CloudSync;
})();
