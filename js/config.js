// Limit 180 全域環境變數配置
window.MATH_SPRINT_CONFIG = {
  CLOUD_ENABLED: true,
  SUPABASE_URL: "https://kzlvuyxsijsffigmcnti.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_U1YrJqNz18LedymnrjcoTg_2SxZQhd_",
  EDGE_FUNCTION_URL: "" // 若有 Edge Function 驗證可於此處配置
};

// 為每個 Mission 下的各個 Stage 配置獨立的解鎖成就徽章狀態
window.MATH_SPRINT_CONFIG.STAGE_BADGES = {};
for (let m = 1; m <= 10; m++) {
  window.MATH_SPRINT_CONFIG.STAGE_BADGES[m] = {};
  for (let l = 1; l <= 20; l++) {
    window.MATH_SPRINT_CONFIG.STAGE_BADGES[m][l] = {
      badgeId: `badge-m${m}-l${l}`,
      name: `Mission ${m} Stage ${l} 探索者`,
      description: `成功通關 Mission ${m} 關卡 ${l}`
    };
  }
}

window.CFG = window.MATH_SPRINT_CONFIG;
