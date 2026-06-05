// MathSprint 2.0 — Supabase 連線設定
// 請在部署前填入您的 Supabase 專案資訊
// 取得方式：Supabase 控制台 → Settings → API

(function() {
  window.MATH_SPRINT_CONFIG = {
    // 填入您的 Supabase Project URL
    SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',

    // 填入您的 Supabase Anon (Public) Key
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',

    // Edge Function URL（填入後才啟用防作弊）
    // 格式：https://YOUR_PROJECT_ID.supabase.co/functions/v1/verify-completion
    EDGE_FUNCTION_URL: '',

    // 是否啟用雲端功能（填入上方兩個 Key 後設為 true）
    CLOUD_ENABLED: false,

    // 人類答題最低極限（秒），低於此值視為機器人
    HUMAN_MIN_TIME: 0.35,

    // 機器人節奏判定：答題時間標準差低於此值視為機器人
    BOT_STDDEV_THRESHOLD: 0.05,
  };
})();
