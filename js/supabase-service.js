(function() {
  let supabaseClient = null;

  function getSupabaseClient() {
    if (!supabaseClient) {
      const url = 'https://kzlvuyxsijsffigmcnti.supabase.co';
      const key = 'sb_publishable_U1YrJqNz18LedymnrjcoTg_2SxZQhd_';
      if (!url || !key || key.includes('YOUR_') || !window.supabase) return null;
      supabaseClient = window.supabase.createClient(url, key);
    }
    return supabaseClient;
  }

  async function generateHash(gradeClass, seatNumber, nickname, missionId, stars, avgTime, minTime) {
    const salt = "Limit180_School_League_Salt_2026_V2";
    const message = `${gradeClass}:${seatNumber}:${nickname}:${missionId}:${stars}:${avgTime}:${minTime}:${salt}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function saveRecord(gradeClass, seatNumber, nickname, missionId, stars, avgTime, minTime) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const integrityHash = await generateHash(gradeClass, seatNumber, nickname, missionId, stars, avgTime, minTime);
    const { data, error } = await db.from('users_profile').upsert({
      grade_class: gradeClass, seat_number: seatNumber, nickname: nickname, mission_id: missionId,
      stars: stars, best_avg_time: avgTime, min_time: minTime, integrity_hash: integrityHash, updated_at: new Date().toISOString()
    }, { onConflict: 'grade_class,seat_number,mission_id' }).select();
    if (error) throw error;
    return data;
  }

  async function getLeaderboard(limitNum = 50) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const { data, error } = await db.from('users_profile').select('*').limit(limitNum);
    if (error) throw error;
    const validatedData = [];
    for (const row of data) {
      const calculatedHash = await generateHash(row.grade_class, row.seat_number, row.nickname, row.mission_id, row.stars, row.best_avg_time, row.min_time);
      if (row.integrity_hash === calculatedHash) validatedData.push(row);
    }
    return validatedData;
  }

  async function generateGlobalHash(gradeClass, seatNumber, nickname, coinsBalance, purchasedItems, equippedAvatar, equippedBorder, equippedBadges, unlockedAssets) {
    const salt = "Limit180_School_League_Salt_2026_V2";
    const itemsStr = Array.isArray(purchasedItems) ? purchasedItems.join(',') : '';
    const badgesStr = Array.isArray(equippedBadges) ? equippedBadges.join(',') : '';
    const assetsStr = Array.isArray(unlockedAssets) ? unlockedAssets.join(',') : '';
    const message = `${gradeClass}:${seatNumber}:${nickname}:${coinsBalance}:${itemsStr}:${equippedAvatar}:${equippedBorder}:${badgesStr}:${assetsStr}:${salt}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function saveGlobalProfile(gradeClass, seatNumber, nickname, coinsBalance, purchasedItems, equippedAvatar = 'avatar-default', equippedBorder = 'border-none', equippedBadges = [], unlockedAssets = ['avatar-default', 'border-none']) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const itemsArray = Array.isArray(purchasedItems) ? purchasedItems : [];
    const badgesArray = Array.isArray(equippedBadges) ? equippedBadges : [];
    const assetsArray = Array.isArray(unlockedAssets) ? unlockedAssets : [];
    const { data: existingRow } = await db.from('users_global').select('coins_balance,purchased_items,equipped_badges,unlocked_assets').eq('grade_class', gradeClass).eq('seat_number', seatNumber).maybeSingle();
    const safeCoinsBalance = Math.max(Number(coinsBalance || 0), Number(existingRow?.coins_balance || 0));
    const mergedItems = Array.from(new Set([...(existingRow?.purchased_items || []), ...itemsArray]));
    const mergedBadges = Array.from(new Set([...(existingRow?.equipped_badges || []), ...badgesArray]));
    const mergedAssets = Array.from(new Set([...(existingRow?.unlocked_assets || []), ...assetsArray]));
    const integrityHash = await generateGlobalHash(gradeClass, seatNumber, nickname, safeCoinsBalance, mergedItems, equippedAvatar, equippedBorder, mergedBadges, mergedAssets);
    let data = null, error = null;
    try {
      const rpcRes = await db.rpc('merge_user_global_state', {
        p_grade_class: gradeClass, p_seat_number: seatNumber, p_nickname: nickname, p_coins_balance: safeCoinsBalance,
        p_purchased_items: mergedItems, p_equipped_avatar: equippedAvatar, p_equipped_border: equippedBorder,
        p_equipped_badges: mergedBadges, p_unlocked_assets: mergedAssets, p_integrity_hash: integrityHash
      });
      data = rpcRes.data; error = rpcRes.error;
    } catch (_) {}
    if (!data && !error) {
      const upsertRes = await db.from('users_global').upsert({
        grade_class: gradeClass, seat_number: seatNumber, nickname: nickname, coins_balance: safeCoinsBalance,
        purchased_items: mergedItems, equipped_avatar: equippedAvatar, equipped_border: equippedBorder,
        equipped_badges: mergedBadges, unlocked_assets: mergedAssets, integrity_hash: integrityHash, updated_at: new Date().toISOString()
      }, { onConflict: 'grade_class,seat_number' }).select();
      data = upsertRes.data; error = upsertRes.error;
    }
    if (error) throw error;
    return data;
  }

  async function applyCoinTransaction(gradeClass, seatNumber, nickname, deltaCoins, reason = 'manual_adjust', metadata = {}, eventKey = null) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const delta = Number(deltaCoins || 0);
    if (!Number.isFinite(delta) || delta === 0) throw new Error("交易金額無效");
    const { data, error } = await db.rpc('apply_coin_transaction', {
      p_grade_class: gradeClass, p_seat_number: seatNumber, p_nickname: nickname, p_delta_coins: Math.trunc(delta),
      p_reason: reason, p_metadata: metadata || {}, p_event_key: eventKey
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return { newBalance: Number(row?.new_balance || 0), ledgerId: row?.ledger_id || null };
  }

  async function getGlobalProfile(gradeClass, seatNumber, nickname) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    let query = db.from('users_global').select('coins_balance,purchased_items,equipped_avatar,equipped_border,equipped_badges,unlocked_assets,purchased_missions,skip_exam_tickets,updated_at').eq('grade_class', gradeClass).eq('seat_number', seatNumber);
    if (nickname) query = query.eq('nickname', nickname);
    let { data, error } = await query.maybeSingle();
    if (error && /purchased_missions|skip_exam_tickets/.test(error.message || '')) {
      query = db.from('users_global').select('coins_balance,purchased_items,equipped_avatar,equipped_border,equipped_badges,unlocked_assets,updated_at').eq('grade_class', gradeClass).eq('seat_number', seatNumber);
      if (nickname) query = query.eq('nickname', nickname);
      const fallback = await query.maybeSingle();
      data = fallback.data; error = fallback.error;
    }
    if (error) throw error;
    return data;
  }

  async function purchaseSkipExamTicket(gradeClass, seatNumber, nickname, quantity = 1) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const { data, error } = await db.rpc('purchase_skip_exam_ticket', {
      p_grade_class: gradeClass, p_seat_number: seatNumber, p_nickname: nickname, p_quantity: Math.max(1, Math.trunc(Number(quantity || 1)))
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async function consumeSkipExamTicket(gradeClass, seatNumber, nickname) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const { data, error } = await db.rpc('consume_skip_exam_ticket', {
      p_grade_class: gradeClass, p_seat_number: seatNumber, p_nickname: nickname
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async function updatePurchasedMissions(gradeClass, seatNumber, nickname, purchasedMissions) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const missions = Array.isArray(purchasedMissions) ? purchasedMissions.map(Number).filter(Boolean) : [];
    const { data, error } = await db.from('users_global').update({ nickname, purchased_missions: missions, updated_at: new Date().toISOString() }).eq('grade_class', gradeClass).eq('seat_number', seatNumber).select('purchased_missions').maybeSingle();
    if (error) throw error;
    return data;
  }

  async function getLatestCoinLedger(gradeClass, seatNumber) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    const { data, error } = await db.from('coin_ledger').select('delta_coins,balance_after,reason,metadata,created_at,ledger_event_key').eq('grade_class', gradeClass).eq('seat_number', seatNumber).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) return null;
    return data;
  }

  async function listGlobalProfiles(limitNum = 1000) {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase 未初始化");
    let { data, error } = await db.from('users_global').select('grade_class,seat_number,nickname,purchased_missions').limit(limitNum);
    if (error && /purchased_missions/.test(error.message || '')) {
      const fallback = await db.from('users_global').select('grade_class,seat_number,nickname').limit(limitNum);
      data = fallback.data; error = fallback.error;
    }
    if (error) throw error;
    return data || [];
  }

  async function listSensitiveWords() {
    const db = getSupabaseClient();
    if (!db) return [];
    try {
      const { data, error } = await db.from('sensitive_words').select('*').order('word', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (_) {
      try {
        return JSON.parse(localStorage.getItem('limit180_sensitive_words') || '[]');
      } catch (_) { return []; }
    }
  }

  async function addSensitiveWord(word) {
    const db = getSupabaseClient();
    const w = String(word || '').trim();
    if (!w) return false;
    let cloudSuccess = false;
    try {
      if (db) {
        const { error } = await db.from('sensitive_words').insert({ word: w });
        if (error) throw error;
        cloudSuccess = true;
      }
    } catch (_) {}
    try {
      const list = JSON.parse(localStorage.getItem('limit180_sensitive_words') || '[]');
      const wordsOnly = list.map(item => typeof item === 'object' ? item.word : item);
      if (!wordsOnly.includes(w)) {
        list.push({ word: w });
        localStorage.setItem('limit180_sensitive_words', JSON.stringify(list));
      }
    } catch (_) {}
    return cloudSuccess;
  }

  async function deleteSensitiveWord(word) {
    const db = getSupabaseClient();
    const w = String(word || '').trim();
    if (!w) return false;
    let cloudSuccess = false;
    try {
      if (db) {
        const { error } = await db.from('sensitive_words').delete().eq('word', w);
        if (error) throw error;
        cloudSuccess = true;
      }
    } catch (_) {}
    try {
      let list = JSON.parse(localStorage.getItem('limit180_sensitive_words') || '[]');
      list = list.filter(item => (typeof item === 'object' ? item.word : item) !== w);
      localStorage.setItem('limit180_sensitive_words', JSON.stringify(list));
    } catch (_) {}
    return cloudSuccess;
  }

  function normalizeText(str) {
    let s = String(str || '').toLowerCase().replace(/\s+/g, '');
    // 全形轉半形
    s = s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, '');
    // 常用敏感詞簡轉繁對照表
    const simToTra = {
      '机': '機', '垃': '垃', '圾': '圾', '鸡': '雞', '爸': '爸', '妈': '媽', '国': '國',
      '骂': '罵', '傻': '傻', '逼': '逼', '杀': '殺', '死': '死', '滚': '滾', '猪': '豬',
      '贱': '賤', '货': '貨', '脑': '腦', '残': '殘', '骗': '騙', '强': '強', '奸': '姦'
    };
    return s.split('').map(ch => simToTra[ch] || ch).join('');
  }

  async function checkSensitiveWords(content) {
    const words = await listSensitiveWords();
    const cleanContent = normalizeText(content);
    for (const item of words) {
      const wordStr = typeof item === 'object' ? item.word : item;
      const cleanWord = normalizeText(wordStr);
      if (cleanWord && cleanContent.includes(cleanWord)) return true;
    }
    return false;
  }


  window.MathSprintSupabaseService = {
    initSupabase: getSupabaseClient,
    saveRecord, getLeaderboard, saveGlobalProfile, applyCoinTransaction, getGlobalProfile,
    purchaseSkipExamTicket, consumeSkipExamTicket, updatePurchasedMissions, getLatestCoinLedger,
    listGlobalProfiles, listSensitiveWords, addSensitiveWord, deleteSensitiveWord, checkSensitiveWords
  };
})();
