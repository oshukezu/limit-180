// Limit 180 Supabase Service - Promo Extensions
(function() {
  const DEFAULT_PROMO_CODES = [
    { code: 'UNLOCK7', coinsReward: 777777, maxTotalRedemptions: 'all' },
    { code: 'COINS88', coinsReward: 88888, maxTotalRedemptions: 'all' },
    { code: 'SECRET7', coinsReward: 1800000, maxTotalRedemptions: 'all' }
  ];

  function getDb() {
    const db = window.MathSprintSupabaseService?.initSupabase?.();
    if (!db) throw new Error("Supabase 未初始化");
    return db;
  }

  function normalizePromoCode(code) {
    return String(code || '').trim().toUpperCase();
  }

  function isValidPromoCode(code) {
    return /^[A-Z0-9]{7}$/.test(code);
  }

  async function upsertPromoCode(code, coinsReward, expiresAt, maxTotalRedemptionsInput) {
    const db = getDb();
    const normalized = normalizePromoCode(code);
    const coins = Number(coinsReward);
    if (!isValidPromoCode(normalized)) throw new Error("代碼需為 7 位英數字");
    if (!Number.isFinite(coins) || coins <= 0) throw new Error("金幣數量無效");

    let maxTotalRedemptions = null;
    const maxInputRaw = String(maxTotalRedemptionsInput ?? '').trim().toLowerCase();
    if (maxInputRaw && maxInputRaw !== 'all') {
      const parsed = Number(maxInputRaw);
      if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("總名額請輸入正整數或 all");
      maxTotalRedemptions = parsed;
    }

    const payload = {
      code: normalized,
      coins_reward: Math.floor(coins),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      max_total_redemptions: maxTotalRedemptions,
      is_active: true
    };

    const { data, error } = await db.from('promo_codes').upsert(payload, { onConflict: 'code' }).select();
    if (error) throw error;
    return data;
  }

  async function listPromoCodes() {
    const db = getDb();
    const { data, error } = await db.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function setPromoCodeActive(code, isActive) {
    const db = getDb();
    const normalized = normalizePromoCode(code);
    const { data, error } = await db.from('promo_codes').update({ is_active: !!isActive }).eq('code', normalized).select();
    if (error) throw error;
    return data;
  }

  async function deletePromoCode(code) {
    const db = getDb();
    const normalized = normalizePromoCode(code);
    const { error } = await db.from('promo_codes').delete().eq('code', normalized);
    if (error) throw error;
    return true;
  }

  async function redeemPromoCode(code, gradeClass, seatNumber, nickname) {
    const db = getDb();
    const normalized = normalizePromoCode(code);
    const gc = String(gradeClass || '').trim();
    const sn = String(seatNumber || '').trim();
    const nn = String(nickname || '').trim();
    if (!normalized) throw new Error("請輸入代碼");
    if (!isValidPromoCode(normalized)) throw new Error("代碼格式錯誤，需為 7 位英數字");
    if (!gc || !sn || !nn) throw new Error("請先完成身份綁定後再兌換");

    const { data: promo, error: promoErr } = await db.from('promo_codes').select('*').eq('code', normalized).maybeSingle();
    if (promoErr) throw promoErr;
    if (!promo) throw new Error("無效的兌換代碼");
    if (!promo.is_active) throw new Error("此代碼已停用");
    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) throw new Error("此代碼已過期");

    const { data: existing, error: existErr } = await db
      .from('promo_redemptions').select('code').eq('code', normalized).eq('grade_class', gc).eq('seat_number', sn).maybeSingle();
    if (existErr) throw existErr;
    if (existing) throw new Error("此代碼你已兌換過");

    const maxRedemptions = promo.max_total_redemptions;
    if (Number.isFinite(maxRedemptions) && maxRedemptions > 0 && (promo.redeemed_count || 0) >= maxRedemptions) {
      throw new Error("此代碼兌換名額已滿");
    }

    const { error: redemptionErr } = await db.from('promo_redemptions').insert({
      code: normalized, grade_class: gc, seat_number: sn, nickname: nn
    });
    if (redemptionErr) {
      if (redemptionErr.code === '23505') throw new Error("此代碼你已兌換過");
      throw redemptionErr;
    }

    const { error: countErr } = await db.from('promo_codes')
      .update({ redeemed_count: (promo.redeemed_count || 0) + 1 }).eq('code', normalized);
    if (countErr) throw countErr;

    return { code: normalized, coinsReward: promo.coins_reward || 0, expiresAt: promo.expires_at || null };
  }

  async function seedDefaultPromoCodes() {
    const db = getDb();
    const { data: existingRows, error: existingErr } = await db
      .from('promo_codes')
      .select('code');
    if (existingErr) throw existingErr;

    const existing = new Set((existingRows || []).map((row) => String(row.code || '').toUpperCase()));
    const missing = DEFAULT_PROMO_CODES.filter((item) => !existing.has(item.code));
    if (!missing.length) return [];

    const payload = missing.map((item) => ({
      code: item.code,
      coins_reward: item.coinsReward,
      expires_at: null,
      max_total_redemptions: null,
      is_active: true
    }));

    const { data, error } = await db
      .from('promo_codes')
      .insert(payload)
      .select();
    if (error) throw error;
    return data || [];
  }

  Object.assign(window.MathSprintSupabaseService || {}, {
    upsertPromoCode,
    listPromoCodes,
    setPromoCodeActive,
    deletePromoCode,
    redeemPromoCode,
    seedDefaultPromoCodes
  });
})();
