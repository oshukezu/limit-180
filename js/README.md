# Limit 180 — 前端腳本模組概要說明 (js/)

本目錄採「主流程 + 擴充模組」拆分，並遵守單檔不超過 400 行。

## 核心遊戲

- `game-core.js`：核心遊戲狀態與初始化
- `game-play.js`：答題、計時、暫停流程
- `game-lifecycle.js`：開始/中斷/結算生命週期
- `game-result.js`：結算畫面與激勵內容
- `game-review.js`：錯題消除模式
- `game-lobby.js`：大廳關卡渲染
- `generator.js`、`missions/*.js`：題庫與題目生成

## 商店與客製化（拆分後）

- `game-store.js`：商店渲染、分頁、篩選
- `game-store-ops.js`：購買/賣出交易操作
- `game-store-assets.js`：頭像/外框/徽章資產定義
- `game-store-redeem.js`：兌換碼輸入與發獎
- `game-customization.js`：客製化主流程
- `game-customization-home.js`：首頁身份卡與頭像資訊互動

## Onboarding 與同步（拆分後）

- `onboarding.js`：Onboarding 核心 UI 與狀態
- `onboarding-actions.js`：註冊提交、跨裝置登入、每日登入獎勵、單關同步
- `onboarding-sync.js`：雲端資料合流與同步策略
- `onboarding-validator.js`：班級/座號/暱稱驗證與敏感詞檢查

## Supabase 服務（拆分後）

- `supabase-service.js`：核心資料服務（紀錄、全域資產、交易）
- `supabase-service-promo.js`：兌換碼 CRUD 與兌換流程
- `supabase-service-team.js`：團隊分享碼、加入班群、團隊資訊

## 其他基礎模組

- `leaderboard.js` / `leaderboard-renders.js`：排行榜控制與渲染
- `dashboard.js`：圖表儀表板
- `ui-controller.js`：全域導航控制
- `loader.js`：SPA 視圖載入
- `theme-manager.js`：主題管理與特效
- `storage*.js`：本地存檔、里程碑、解鎖與錯題
