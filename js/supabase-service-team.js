// Limit 180 Supabase Service - Team Share Extensions
(function() {
  function getDb() {
    const db = window.MathSprintSupabaseService?.initSupabase?.();
    if (!db) throw new Error("Supabase 未初始化");
    return db;
  }

  function normalizeShareCode(code) {
    return String(code || '').trim().toUpperCase();
  }

  function isValidShareCode(code) {
    return /^[A-Z0-9]{5}$/.test(code);
  }

  function generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  async function createClassShareCode(ownerGradeClass, ownerSeatNumber, ownerNickname, className = '') {
    const db = getDb();
    const gc = String(ownerGradeClass || '').trim().toUpperCase();
    const sn = String(ownerSeatNumber || '').trim();
    const nn = String(ownerNickname || '').trim();
    if (!gc || !sn || !nn) throw new Error("建立分享碼需要班級、座號、姓名");

    let code = generateShareCode();
    for (let i = 0; i < 20; i++) {
      const { data: exists } = await db.from('class_share_codes').select('id').eq('share_code', code).maybeSingle();
      if (!exists) break;
      code = generateShareCode();
    }

    const { data, error } = await db.from('class_share_codes').insert({
      owner_grade_class: gc,
      owner_seat_number: sn,
      owner_nickname: nn,
      class_name: String(className || '').trim() || gc,
      share_code: code,
      is_active: true
    }).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  async function listClassShareCodes() {
    const db = getDb();
    const { data, error } = await db.from('class_share_codes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function getClassShareCodeByCode(code) {
    const db = getDb();
    const normalized = normalizeShareCode(code);
    if (!isValidShareCode(normalized)) throw new Error("分享碼需為 5 位英數字");
    const { data, error } = await db.from('class_share_codes').select('*').eq('share_code', normalized).eq('is_active', true).maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function updateClassShareCode(id, patch = {}) {
    const db = getDb();
    const payload = {};
    if (patch.share_code !== undefined) {
      const code = normalizeShareCode(patch.share_code);
      if (!isValidShareCode(code)) throw new Error("分享碼需為 5 位英數字");
      payload.share_code = code;
    }
    if (patch.class_name !== undefined) payload.class_name = String(patch.class_name || '').trim();
    if (patch.is_active !== undefined) payload.is_active = !!patch.is_active;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await db.from('class_share_codes').update(payload).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  async function deleteClassShareCode(id) {
    const db = getDb();
    const { error } = await db.from('class_share_codes').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async function joinClassByShareCode(shareCode, memberGradeClass, memberSeatNumber, memberNickname) {
    const db = getDb();
    const normalized = normalizeShareCode(shareCode);
    if (!isValidShareCode(normalized)) throw new Error("分享碼需為 5 位英數字");
    const mGrade = String(memberGradeClass || '').trim().toUpperCase();
    const mSeat = String(memberSeatNumber || '').trim();
    const mNick = String(memberNickname || '').trim();
    if (!mGrade || !mSeat || !mNick) throw new Error("加入團隊需要完整身份資料");

    const shareRow = await getClassShareCodeByCode(normalized);
    if (!shareRow) throw new Error("此分享碼不存在或已停用");

    const ownerKey = `${shareRow.owner_grade_class}:${shareRow.owner_seat_number}:${shareRow.owner_nickname}`;
    const memberKey = `${mGrade}:${mSeat}:${mNick}`;

    let classId = null;
    const { data: existedClass, error: classReadErr } = await db
      .from('classes').select('id').eq('owner_user_id', ownerKey).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (classReadErr) throw classReadErr;
    if (existedClass?.id) classId = existedClass.id;
    else {
      const { data: createdClass, error: classCreateErr } = await db.from('classes').insert({
        name: String(shareRow.class_name || shareRow.owner_grade_class || '班群'),
        owner_user_id: ownerKey,
        invite_code_hash: `share:${normalized}`,
        invite_code_expire_at: null,
        invite_code_max_uses: null,
        invite_code_used_count: 0
      }).select('id').maybeSingle();
      if (classCreateErr) throw classCreateErr;
      classId = createdClass?.id || null;
    }
    if (!classId) throw new Error("建立班群失敗");

    await db.from('class_members').upsert({
      class_id: classId, user_id: ownerKey, role: 'owner', status: 'active', joined_at: new Date().toISOString(), removed_at: null
    }, { onConflict: 'class_id,user_id' });

    const { error: joinErr } = await db.from('class_members').upsert({
      class_id: classId,
      user_id: memberKey,
      role: memberKey === ownerKey ? 'owner' : 'member',
      status: 'active',
      joined_at: new Date().toISOString(),
      removed_at: null
    }, { onConflict: 'class_id,user_id' });
    if (joinErr) throw joinErr;

    return {
      classId,
      className: String(shareRow.class_name || ''),
      owner: {
        gradeClass: String(shareRow.owner_grade_class || ''),
        seatNumber: String(shareRow.owner_seat_number || ''),
        nickname: String(shareRow.owner_nickname || '')
      }
    };
  }

  async function getMyTeamInfo(gradeClass, seatNumber, nickname) {
    const db = getDb();
    const key = `${String(gradeClass || '').trim().toUpperCase()}:${String(seatNumber || '').trim()}:${String(nickname || '').trim()}`;
    if (!key || key.includes('::')) return null;

    const { data: memberRow, error: memberErr } = await db.from('class_members')
      .select('class_id,role,status').eq('user_id', key).eq('status', 'active')
      .order('joined_at', { ascending: false }).limit(1).maybeSingle();
    if (memberErr) throw memberErr;
    if (!memberRow?.class_id) return null;

    const { data: classRow, error: classErr } = await db.from('classes').select('id,name').eq('id', memberRow.class_id).maybeSingle();
    if (classErr) throw classErr;
    if (!classRow?.id) return null;

    const { count: memberCount, error: countErr } = await db.from('class_members')
      .select('id', { count: 'exact', head: true }).eq('class_id', classRow.id).eq('status', 'active');
    if (countErr) throw countErr;

    return {
      classId: classRow.id,
      className: classRow.name || '未命名團隊',
      myRole: memberRow.role || 'member',
      memberCount: Number(memberCount || 0)
    };
  }

  Object.assign(window.MathSprintSupabaseService || {}, {
    createClassShareCode,
    listClassShareCodes,
    getClassShareCodeByCode,
    updateClassShareCode,
    deleteClassShareCode,
    joinClassByShareCode,
    getMyTeamInfo
  });
})();
