// Limit 180 Supabase 連線服務封裝
(function() {
  let supabaseClient = null;

  // 1. 取得或初始化 Supabase Client (防呆機制)
  function getSupabaseClient() {
    if (!supabaseClient) {
      const url = 'https://kzlvuyxsijsffigmcnti.supabase.co';
      const key = 'sb_publishable_U1YrJqNz18LedymnrjcoTg_2SxZQhd_';
      
      if (!url || !key || key.includes('YOUR_') || !window.supabase) {
        console.error("[SupabaseService] Supabase credentials or SDK missing!");
        return null;
      }
      supabaseClient = window.supabase.createClient(url, key);
      console.log("[SupabaseService] Supabase client successfully initialized.");
    }
    return supabaseClient;
  }

  // 2. 內部 SHA-256 雜湊產生器 (防改雜湊，由前端邏輯防護)
  async function generateHash(gradeClass, seatNumber, nickname, missionId, stars, avgTime, minTime) {
    // 固定的校園聯賽混淆鹽值 (Salt)
    const salt = "Limit180_School_League_Salt_2026_V2";
    // 組合要防竄改的關鍵欄位資訊
    const message = `${gradeClass}:${seatNumber}:${nickname}:${missionId}:${stars}:${avgTime}:${minTime}:${salt}`;
    
    // 使用 Web Crypto API 進行 SHA-256 計算
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // 轉為十六進位字串 (Hex String)
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 3. 儲存或更新用戶紀錄 (UPSERT)
  async function saveRecord(gradeClass, seatNumber, nickname, missionId, stars, avgTime, minTime) {
    const db = getSupabaseClient();
    if (!db) {
      throw new Error("Supabase 未初始化");
    }

    // 計算前端防改雜湊
    const integrityHash = await generateHash(gradeClass, seatNumber, nickname, missionId, stars, avgTime, minTime);

    // 呼叫 upsert 語法，依據唯一約束的衝突鍵 grade_class, seat_number 與 mission_id 覆蓋更新
    const { data, error } = await db
      .from('users_profile')
      .upsert({
        grade_class: gradeClass,
        seat_number: seatNumber,
        nickname: nickname,
        mission_id: missionId,
        stars: stars,
        best_avg_time: avgTime,
        min_time: minTime,
        integrity_hash: integrityHash,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'grade_class,seat_number,mission_id'
      })
      .select();

    if (error) {
      console.error("[SupabaseService] saveRecord 發生錯誤：", error.message);
      throw error;
    }

    console.log("[SupabaseService] saveRecord 成功：", data);
    return data;
  }

  // 4. 取得全校排行榜資料 (可用於前端分組與定位)
  async function getLeaderboard(limitNum = 50) {
    const db = getSupabaseClient();
    if (!db) {
      throw new Error("Supabase 未初始化");
    }

    const { data, error } = await db
      .from('users_profile')
      .select('*')
      .limit(limitNum);

    if (error) {
      console.error("[SupabaseService] getLeaderboard 發生錯誤：", error.message);
      throw error;
    }

    // 進行前端防改雜湊校驗
    const validatedData = [];
    for (const row of data) {
      const calculatedHash = await generateHash(
        row.grade_class,
        row.seat_number,
        row.nickname,
        row.mission_id,
        row.stars,
        row.best_avg_time,
        row.min_time
      );

      if (row.integrity_hash === calculatedHash) {
        validatedData.push(row);
      } else {
        console.warn(
          `[SupabaseService] 偵測到可能遭竄改的非法紀錄！已排除：${row.grade_class} 班 ${row.seat_number} 號 ${row.nickname} Mission ${row.mission_id}`
        );
      }
    }

    return validatedData;
  }

  // 5. 內部全域 SHA-256 雜湊產生器 (防改全域雜湊，加入了外觀客製化欄位防改防護)
  async function generateGlobalHash(gradeClass, seatNumber, nickname, coinsBalance, purchasedItems, equippedAvatar, equippedBorder, equippedBadges, unlockedAssets) {
    const salt = "Limit180_School_League_Salt_2026_V2";
    const itemsStr = Array.isArray(purchasedItems) ? purchasedItems.join(',') : '';
    const badgesStr = Array.isArray(equippedBadges) ? equippedBadges.join(',') : '';
    const assetsStr = Array.isArray(unlockedAssets) ? unlockedAssets.join(',') : '';
    
    const message = `${gradeClass}:${seatNumber}:${nickname}:${coinsBalance}:${itemsStr}:${equippedAvatar}:${equippedBorder}:${badgesStr}:${assetsStr}:${salt}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 6. 儲存或更新用戶全域資產狀態與外觀設定 (UPSERT)
  async function saveGlobalProfile(gradeClass, seatNumber, nickname, coinsBalance, purchasedItems, equippedAvatar = 'avatar-default', equippedBorder = 'border-none', equippedBadges = [], unlockedAssets = ['avatar-default', 'border-none']) {
    const db = getSupabaseClient();
    if (!db) {
      throw new Error("Supabase 未初始化");
    }

    const itemsArray = Array.isArray(purchasedItems) ? purchasedItems : [];
    const badgesArray = Array.isArray(equippedBadges) ? equippedBadges : [];
    const assetsArray = Array.isArray(unlockedAssets) ? unlockedAssets : [];

    // 防倒退合併：避免舊資料覆蓋較新的金幣/解鎖項目
    const { data: existingRow, error: existingErr } = await db
      .from('users_global')
      .select('coins_balance,purchased_items,equipped_badges,unlocked_assets')
      .eq('grade_class', gradeClass)
      .eq('seat_number', seatNumber)
      .maybeSingle();
    if (existingErr) {
      console.warn("[SupabaseService] 讀取既有全域資料失敗，改採直接寫入：", existingErr.message);
    }

    const existingCoins = Number(existingRow?.coins_balance || 0);
    const safeCoinsBalance = Math.max(Number(coinsBalance || 0), existingCoins);
    const mergedItems = Array.from(new Set([...(existingRow?.purchased_items || []), ...itemsArray]));
    const mergedBadges = Array.from(new Set([...(existingRow?.equipped_badges || []), ...badgesArray]));
    const mergedAssets = Array.from(new Set([...(existingRow?.unlocked_assets || []), ...assetsArray]));

    const integrityHash = await generateGlobalHash(
      gradeClass, 
      seatNumber, 
      nickname, 
      safeCoinsBalance, 
      mergedItems,
      equippedAvatar,
      equippedBorder,
      mergedBadges,
      mergedAssets
    );

    // 優先使用原子 RPC 合併，避免競態條件
    let data = null;
    let error = null;
    try {
      const rpcRes = await db.rpc('merge_user_global_state', {
        p_grade_class: gradeClass,
        p_seat_number: seatNumber,
        p_nickname: nickname,
        p_coins_balance: safeCoinsBalance,
        p_purchased_items: mergedItems,
        p_equipped_avatar: equippedAvatar,
        p_equipped_border: equippedBorder,
        p_equipped_badges: mergedBadges,
        p_unlocked_assets: mergedAssets,
        p_integrity_hash: integrityHash
      });
      data = rpcRes.data;
      error = rpcRes.error;
    } catch (rpcErr) {
      console.warn("[SupabaseService] merge_user_global_state RPC 不可用，回退 upsert：", rpcErr.message);
    }

    // 回退模式：舊版資料庫沒有 RPC 時仍可運作
    if (!data && !error) {
      const upsertRes = await db
        .from('users_global')
        .upsert({
          grade_class: gradeClass,
          seat_number: seatNumber,
          nickname: nickname,
          coins_balance: safeCoinsBalance,
          purchased_items: mergedItems,
          equipped_avatar: equippedAvatar,
          equipped_border: equippedBorder,
          equipped_badges: mergedBadges,
          unlocked_assets: mergedAssets,
          integrity_hash: integrityHash,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'grade_class,seat_number'
        })
        .select();
      data = upsertRes.data;
      error = upsertRes.error;
    }

    if (error) {
      console.error("[SupabaseService] saveGlobalProfile 發生錯誤：", error.message);
      throw error;
    }

    console.log("[SupabaseService] saveGlobalProfile 成功：", data);
    return data;
  }

  // 12. 原子加幣/扣幣（ledger + balance 同步）
  async function applyCoinTransaction(gradeClass, seatNumber, nickname, deltaCoins, reason = 'manual_adjust', metadata = {}, eventKey = null) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const delta = Number(deltaCoins || 0);
    if (!Number.isFinite(delta) || delta === 0) {
      throw new Error("交易金額無效");
    }

    const { data, error } = await db.rpc('apply_coin_transaction', {
      p_grade_class: gradeClass,
      p_seat_number: seatNumber,
      p_nickname: nickname,
      p_delta_coins: Math.trunc(delta),
      p_reason: reason,
      p_metadata: metadata || {},
      p_event_key: eventKey
    });

    if (error) {
      console.error("[SupabaseService] applyCoinTransaction 錯誤：", error.message);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      newBalance: Number(row?.new_balance || 0),
      ledgerId: row?.ledger_id || null
    };
  }

  async function getGlobalProfile(gradeClass, seatNumber, nickname) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    let query = db
      .from('users_global')
      .select('coins_balance,purchased_items,equipped_avatar,equipped_border,equipped_badges,unlocked_assets,purchased_missions,skip_exam_tickets,updated_at')
      .eq('grade_class', gradeClass)
      .eq('seat_number', seatNumber);
    if (nickname) query = query.eq('nickname', nickname);
    let { data, error } = await query.maybeSingle();
    if (error && /purchased_missions|skip_exam_tickets/.test(error.message || '')) {
      query = db
        .from('users_global')
        .select('coins_balance,purchased_items,equipped_avatar,equipped_border,equipped_badges,unlocked_assets,updated_at')
        .eq('grade_class', gradeClass)
        .eq('seat_number', seatNumber);
      if (nickname) query = query.eq('nickname', nickname);
      const fallback = await query.maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) {
      console.error("[SupabaseService] getGlobalProfile 錯誤：", error.message);
      throw error;
    }
    return data;
  }

  async function purchaseSkipExamTicket(gradeClass, seatNumber, nickname, quantity = 1) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const { data, error } = await db.rpc('purchase_skip_exam_ticket', {
      p_grade_class: gradeClass,
      p_seat_number: seatNumber,
      p_nickname: nickname,
      p_quantity: Math.max(1, Math.trunc(Number(quantity || 1)))
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async function consumeSkipExamTicket(gradeClass, seatNumber, nickname) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const { data, error } = await db.rpc('consume_skip_exam_ticket', {
      p_grade_class: gradeClass,
      p_seat_number: seatNumber,
      p_nickname: nickname
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async function updatePurchasedMissions(gradeClass, seatNumber, nickname, purchasedMissions) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const missions = Array.isArray(purchasedMissions) ? purchasedMissions.map(Number).filter(Boolean) : [];
    const { data, error } = await db
      .from('users_global')
      .update({
        nickname,
        purchased_missions: missions,
        updated_at: new Date().toISOString()
      })
      .eq('grade_class', gradeClass)
      .eq('seat_number', seatNumber)
      .select('purchased_missions')
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  // 掛載到 window 全域命名空間中
  window.MathSprintSupabaseService = {
    initSupabase: getSupabaseClient,
    saveRecord,
    getLeaderboard,
    saveGlobalProfile,
    applyCoinTransaction,
    getGlobalProfile,
    purchaseSkipExamTicket,
    consumeSkipExamTicket,
    updatePurchasedMissions
  };
})();
