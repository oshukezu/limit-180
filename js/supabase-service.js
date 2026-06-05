// Limit 180 Supabase 連線服務封裝
(function() {
  let supabase = null;

  // 1. 初始化 Supabase Client
  function initSupabase() {
    if (window.supabase) {
      if (!window.CFG || !window.CFG.SUPABASE_URL || !window.CFG.SUPABASE_ANON_KEY) {
        console.error("[SupabaseService] 環境變數未設定，無法初始化！");
        return;
      }
      supabase = window.supabase.createClient(window.CFG.SUPABASE_URL, window.CFG.SUPABASE_ANON_KEY);
      console.log("[SupabaseService] 成功初始化 Supabase。");
    } else {
      console.error("[SupabaseService] 未檢測到 Supabase SDK，請確保 index.html 已載入 UMD CDN！");
    }
  }

  // 2. 內部 SHA-256 雜湊產生器 (防改雜湊，由前端邏輯防護)
  async function generateHash(gradeClass, seatNumber, nickname, stars, avgTime) {
    // 固定的校園聯賽混淆鹽值 (Salt)
    const salt = "Limit180_School_League_Salt_2026";
    // 組合要防竄改的關鍵欄位資訊
    const message = `${gradeClass}:${seatNumber}:${nickname}:${stars}:${avgTime}:${salt}`;
    
    // 使用 Web Crypto API 進行 SHA-256 計算
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // 轉為十六進位字串 (Hex String)
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 3. 儲存或更新用戶紀錄 (UPSERT)
  async function saveRecord(gradeClass, seatNumber, nickname, stars, avgTime) {
    if (!supabase) initSupabase();
    if (!supabase) throw new Error("Supabase 未初始化");

    // 計算前端防改雜湊
    const integrityHash = await generateHash(gradeClass, seatNumber, nickname, stars, avgTime);

    // 呼叫 upsert 語法，依據唯一約束的衝突鍵 grade_class 與 seat_number 覆蓋更新
    const { data, error } = await supabase
      .from('users_profile')
      .upsert({
        grade_class: gradeClass,
        seat_number: seatNumber,
        nickname: nickname,
        total_stars: stars,
        best_avg_time: avgTime,
        integrity_hash: integrityHash,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'grade_class,seat_number'
      })
      .select();

    if (error) {
      console.error("[SupabaseService] saveRecord 發生錯誤：", error.message);
      throw error;
    }

    console.log("[SupabaseService] saveRecord 成功：", data);
    return data;
  }

  // 4. 取得排行榜前 50 名資料 (總星數降序，平均答題時間升序)
  async function getLeaderboard() {
    if (!supabase) initSupabase();
    if (!supabase) throw new Error("Supabase 未初始化");

    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .order('total_stars', { ascending: false })
      .order('best_avg_time', { ascending: true })
      .limit(50);

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
        row.total_stars,
        row.best_avg_time
      );

      if (row.integrity_hash === calculatedHash) {
        validatedData.push(row);
      } else {
        console.warn(
          `[SupabaseService] 偵測到可能遭竄改的非法紀錄！已排除：${row.grade_class} 班 ${row.seat_number} 號 ${row.nickname}`
        );
      }
    }

    return validatedData;
  }

  // 掛載到 window 全域命名空間中
  window.MathSprintSupabaseService = {
    initSupabase,
    saveRecord,
    getLeaderboard
  };
})();
