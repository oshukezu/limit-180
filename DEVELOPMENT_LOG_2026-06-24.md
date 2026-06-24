# Limit 180 開發日誌（2026-06-24）

## 本次對話執行結果（家長安心規格 MVP）

### A0. 追加修正（同日）
- 修正「頭像無法正常修改」：`js/game-customization.js` 改為同時兼容 `unlocked_assets` 與舊資料 `purchased_items`，避免持有資料不同步導致不能裝備。
- 客製化保存時增加防呆：若目標頭像/外框不存在，會回退到預設值，避免壞資料卡死。
- 新增開團分享碼後台管理：
  - `views/admin.html` 新增「開團分享碼管理」區塊。
  - `js/game-admin-team-code.js` 新增管理邏輯（建立、修正碼、停用、刪除）。
  - `js/supabase-service.js` 新增 `create/list/update/deleteClassShareCode` API。
- `supabase_parent_safe_mvp.sql` 已補上細粒度 RLS policy 與 `class_share_codes`（5 位英數字分享碼）資料表。
- 新增前台開團入口（首頁）：
  - `views/home.html` 新增開團分享碼區塊（建立 + 一鍵複製）。
  - `js/class-share.js` 新增前台流程：讀取本人既有碼、建立新碼、複製到剪貼簿。
  - 已加上「輸入分享碼直接加入團」UI：輸入 5 位碼後，驗證成功會自動開啟登入表單並預填班級。
  - `js/supabase-service.js` 新增 `getClassShareCodeByCode` 供前台快速查碼。
  - `js/supabase-service.js` 新增 `joinClassByShareCode`，可在加入成功後自動寫入 `class_members`（含班主補齊）。
  - `js/onboarding.js` 的 `showProfileModal` 支援預填資料（班級/座號/姓名）。
  - `js/class-share.js` 會暫存待加入分享碼；`js/onboarding.js` 在註冊/跨裝置登入成功後，自動完成 `class_members` 寫入並提示結果。
  - 新增首頁「我的團隊資訊」小卡：
    - 顯示團名、我的身份（團主/成員）、成員數。
    - `js/supabase-service.js` 新增 `getMyTeamInfo`，由 `js/class-share.js` 載入與渲染。
  - Bug 修正：`js/game-store-assets.js` 的 `border-sakura.id` 由錯誤的 `border-sand` 修正為 `border-sakura`，避免外框識別與裝備狀態錯亂。
  - 修正首頁折頁內容渲染：在 `js/ui-controller.js` 的 accordion toggle 事件中，開啟「成就牆/商店/反應數據」時即時觸發對應 render，確保與「遊戲規則」一致可展開即顯示內容。
  - 新增 `MODULE_DEPENDENCY.md` 之 Mermaid 圖像化依賴圖。
  - `index.html` 掛載 `js/class-share.js`。

### A. 夜間無獎勵（22:00-08:00）
- 已在 `js/storage.js` 新增 `isNightRewardBlocked()`，統一夜間時段判定。
- `saveLevelRecord()` 已接入夜間判定：夜間可保留練習紀錄，但不發放金幣獎勵與每日首勝加成。
- 夜間結算會透過既有 `UIFeedback` 流程顯示提示（不發放獎勵）。
- `js/game-result.js` 已同步調整：夜間通關時顯示 `+0`，並顯示「僅保留練習紀錄」說明。

### B. 25+5 強制休息
- 已在 `js/game-lifecycle.js` 加入休息鎖機制：
  - 連續遊玩累計達 25 分鐘後，觸發 5 分鐘休息鎖。
  - 鎖定期間阻止進入挑戰並顯示剩餘秒數提示。
- 遊玩時間累計與鎖定狀態已寫入 localStorage：
  - `limit180_play_acc_seconds`
  - `limit180_rest_lock_until`
- `js/game-review.js` 已接入同一休息鎖，避免在鎖定期間透過錯題模式繞過限制。

### C. 班群/聊天室/敏感詞/稽核/每日統計 DB 基礎
- 新增 `supabase_parent_safe_mvp.sql`，包含 MVP 所需核心 schema：
  - `classes`, `class_members`
  - `game_sessions`, `user_rest_locks`
  - `daily_learning_stats`, `daily_wrong_type_stats`
  - `chat_messages`
  - `sensitive_words`, `moderation_logs`
- 內含實用函式：
  - `is_night_reward_blocked(p_ts)`
  - `purge_expired_chat_messages()`
- 所有核心業務表已啟用 RLS（先採預設鎖住策略，後續再補細粒度 policy）。

## 本次新增/修改檔案

- 新增：`supabase_parent_safe_mvp.sql`
- 新增：`js/game-admin-team-code.js`
- 新增：`js/class-share.js`
- 新增：`DEVELOPMENT_LOG_HISTORY.md`
- 修改：`js/storage.js`
- 修改：`js/game-lifecycle.js`
- 修改：`js/game-review.js`
- 修改：`js/game-result.js`
- 修改：`js/game-customization.js`
- 修改：`js/supabase-service.js`
- 修改：`views/admin.html`
- 修改：`index.html`

## 既有檔案原始建立時間（依檔案 metadata）

> 以下為本對話開始前已存在檔案，建立時間直接讀取檔案系統 metadata。

- `js/storage.js`：2026-06-05 18:30:48
- `js/game-lifecycle.js`：2026-06-22 18:31:24
- `js/game-review.js`：2026-06-12 01:07:20
- `js/game-result.js`：2026-06-12 01:14:22
- `agents/家長安心遊戲規格_7b533cac.plan.md`：2026-06-24 17:24:49

## 備註（下一步建議）

- 將 `supabase_parent_safe_mvp.sql` 套用到 Supabase staging，先驗證 JWT claim（`auth.uid()` / `auth.jwt()->>'nickname'`）對應是否與你的帳號映射一致。
- 若要達成規格中的「伺服器時間強制判定」，建議下一步把前端夜間判定遷移到 RPC（前端只接收結果）。
- 25+5 目前為前端可運作版本；若需防繞過，建議改為 `user_rest_locks` 後端真實來源。
