// MathSprint 2.0 — 防作弊驗證 Edge Function
// 部署指令：supabase functions deploy verify-completion
// 
// 輸入：{ mission_num, level_num, question_times: number[], correct_count, total_questions }
// 輸出：{ success: true } 或 { error: string, verdict: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HUMAN_MIN_TIME = 0.35;       // 人類答題最低極限（秒）
const BOT_STDDEV_THRESHOLD = 0.05; // 機器人恆定節奏判定閾值（標準差）
const MIN_QUESTIONS = 10;           // 需要至少 N 題才執行統計判定

// 計算標準差
function stddev(arr: number[]): number {
  if (arr.length < 2) return 999;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

Deno.serve(async (req: Request) => {
  // 處理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  // 僅允許 POST
  if (req.method !== 'POST') {
    return Response.json({ error: '僅接受 POST 請求' }, { status: 405 });
  }

  // 取得 Authorization header（JWT）
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: '未提供認證 Token' }, { status: 401 });
  }

  // 初始化 Supabase（使用 service_role key 才能寫入受 RLS 保護的 leaderboard）
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // 用 user JWT 驗證身份
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return Response.json({ error: '身份驗證失敗' }, { status: 401 });
  }

  // 解析 payload
  let payload: {
    mission_num: number;
    level_num: number;
    question_times: number[];
    correct_count: number;
    total_questions: number;
  };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Payload 格式錯誤' }, { status: 400 });
  }

  // 基本格式驗證
  const { mission_num, level_num, question_times, correct_count, total_questions } = payload;
  if (
    typeof mission_num !== 'number' || mission_num < 1 || mission_num > 10 ||
    typeof level_num !== 'number' || level_num < 1 || level_num > 20 ||
    !Array.isArray(question_times) || question_times.length === 0 ||
    typeof correct_count !== 'number' ||
    typeof total_questions !== 'number'
  ) {
    return Response.json({ error: '輸入資料格式不正確' }, { status: 400 });
  }

  // ========== 防作弊判定 ==========
  let verdict = 'PASS';

  // 判定 1：答題速度是否低於人類極限
  const tooFast = question_times.some(t => typeof t === 'number' && t < HUMAN_MIN_TIME);
  if (tooFast) {
    verdict = 'BOT_SPEED';
  }

  // 判定 2：答題節奏是否恆定（機器人特徵）
  if (verdict === 'PASS' && question_times.length >= MIN_QUESTIONS) {
    const sd = stddev(question_times.filter(t => typeof t === 'number'));
    if (sd < BOT_STDDEV_THRESHOLD) {
      verdict = 'BOT_PATTERN';
    }
  }

  // 使用 service_role client 寫入稽核日誌（不受 RLS 限制）
  const adminClient = createClient(supabaseUrl, serviceKey);

  await adminClient.from('anticheat_logs').insert({
    user_id: user.id,
    mission_num,
    level_num,
    verdict,
    payload: { question_times, correct_count, total_questions }
  });

  // 判定失敗 → 拒絕
  if (verdict !== 'PASS') {
    console.log(`[AntiCheat] 拒絕用戶 ${user.id.slice(0, 8)}... 原因: ${verdict}`);
    return Response.json(
      { error: `驗證失敗（${verdict}）：答題數據異常，無法授予榮譽`, verdict },
      {
        status: 403,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  // ========== 驗證通過 → 計算均速並寫入排行榜 ==========
  const validTimes = question_times.filter(t => typeof t === 'number' && t > 0);
  const avgTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;

  // 取得用戶暱稱
  const { data: profileData } = await adminClient
    .from('user_profiles')
    .select('nickname')
    .eq('id', user.id)
    .single();

  const nickname = profileData?.nickname || 'PIXEL-????';

  // Upsert 排行榜（只保留最佳成績）
  await adminClient.from('leaderboard').upsert({
    user_id: user.id,
    nickname,
    mission_num,
    best_avg_time: parseFloat(avgTime.toFixed(3)),
    recorded_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,mission_num',
    ignoreDuplicates: false
  });

  // 若新成績比舊成績差，不更新（用 DB-level check 或前端再查詢）
  // 此處簡單實作：永遠 upsert，可在 DB 側加 trigger 確保只保留最佳

  console.log(`[AntiCheat] ✅ 通過 — 用戶 ${user.id.slice(0, 8)}... M${mission_num}-L${level_num} avgTime=${avgTime.toFixed(2)}s`);

  return Response.json(
    { success: true, avg_time: parseFloat(avgTime.toFixed(3)), verdict: 'PASS' },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
});
