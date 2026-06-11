# Limit 180 — 前端腳本模組概要說明 (js/)

本文件列出了《Limit 180》心算極速挑戰的所有前端邏輯、核心遊戲循環與雲端單表操作服務。

| 模組分類 | 檔案名稱 | 職責概要說明 |
| :--- | :--- | :--- |
| **遊戲核心控制** | [game.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game.js) | **核心遊戲循環**：管理主要遊戲生命週期（包含 `startGame`、`stopGame`、`interruptGame`），主計時器計時與 Combo 連擊演算，以及答對或答錯的邏輯處理，並調用其它 Mixin 元件。 |
| **遊戲核心控制** | [game-config.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game-config.js) | **關卡配置常數**：定義了 1 至 10 大 Mission 的題目總數、中文描述、初玩限時與目標答題速度插值參數。 |
| **遊戲核心控制** | [game-audio.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game-audio.js) | **音效產生器**：使用 HTML5 Web Audio API 動態合成「答對」、「答錯」等 8-bit 電子風音效，不依賴外部音訊檔案加載。 |
| **遊戲核心控制** | [game-scaffold.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game-scaffold.js) | **視覺心算輔助繪圖**：在 Mission 1-9 的比大小關卡中，負責將分數（圓餅分割圖）、小數與百分比（10x10 格點圖）以及整數比大小（高度條與刻度）以 SVG 動態生成輔助圖形。 |
| **遊戲核心控制** | [game-lobby.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game-lobby.js) | **遊戲大廳渲染**：負責遊戲大廳 Mission 網格卡片與 20 關點陣子關卡 UI 的渲染與 DOM 操作，處理玩家選關交互。 |
| **遊戲核心控制** | [game-events.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game-events.js) | **鍵盤與輸入事件代理**：負責全域物理鍵盤/虛擬鍵盤的方向鍵事件綁定、回答欄位的非數字輸入過濾、以及大廳導航按鈕的事件委派。 |
| **遊戲核心控制** | [game-result.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game-result.js) | **結算與獎勵彈窗**：負責遊戲結束後的結算畫面渲染，包含計算 Stars 顆數、激勵詞判定、降級警告彈窗，以及將獲得星星等暫存獎勵（`_pendingRewards`）延遲至返回大廳後彈出的機制。 |
| **遊戲核心控制** | [game-review.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/game-review.js) | **錯題消除模式**：控制錯題消除（Review Mode）的答題進度、渲染錯題隊列，並將答錯或答對的消除進度序列化保存至本地快取中。 |
| **遊戲核心控制** | [generator.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/generator.js) | **題目生成器**：依據關卡指定的數學主題（加減乘除、分數小數百分比、正負數等），動態隨機生成題幹文字、標準答案以及計算步驟解析。 |
| **身分與同步** | [onboarding.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/onboarding.js) | **身分攔截與綁定**：負責玩家暱稱的防霸凌過濾（敏感詞清單）、班級座號正則校驗，並在首玩結束時將暫存的成績與玩家身分合流寫入，完成雲端單表 Upsert 綁定。 |
| **身分與同步** | [storage.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/storage.js) | **本地 LocalStorage 控制**：負責讀寫本機存檔 `math_sprint_profile` 結構（包含累計星星數、各關最優成績紀錄、錯題資料庫、成就解鎖清單等），並提供成就與星星里程碑的發放判定。 |
| **身分與同步** | [supabase-service.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/supabase-service.js) | **Supabase 數據操作層**：封裝 Supabase JS Client 初始化，提供向 `users_profile` 資料表進行 Upsert 寫入與排行榜查詢，並在前端實作 SHA-256 雜湊防篡改校驗。 |
| **數據與展現** | [leaderboard.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/leaderboard.js) | **聯賽排行榜**：負責拉取雲端數據，並在前端依據規則進行「個人總榜」、「團隊對抗榜（班級加總）」與「答題速度榜（單關均速排序）」的即時分組聚合與 DOM 渲染。 |
| **數據與展現** | [dashboard.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/dashboard.js) | **學習數據儀表板**：使用 Chart.js 動態繪製個人反應速度折線圖與四維雷達圖，展示心算能力維度。 |
| **數據與展現** | [achievements.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/achievements.js) | **成就牆**：提供 20+ 個特工里程碑成就（如速算特工、完美連斬等）的解鎖狀態查詢與成就卡片 DOM 渲染。 |
| **基礎基礎設施** | [ui-controller.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/ui-controller.js) | **全域導航與關閉控制器**：以事件代理監聽所有右上角「X」關閉按鈕，實作在 0.1 秒內立即切換 DOM 隱藏、計時器停損清理以及錯題暫存保存，確保不牽涉 Supabase 的非同步等待。 |
| **基礎基礎設施** | [loader.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/loader.js) | **視圖載入器**：將 HTML 頁面切分為多個 Views 並於初始化時動態 fetch 載入，減輕 index.html 肥大程度，並含 file:// 協定下的 CORS 安全防禦警告。 |
| **已廢除/相容占位** | [auth.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/auth.js) | **舊版認證模組**：去 Auth 化後在 `index.html` 中被移除，改由虛擬 Dummy 物件代替，以避免任何 supabase.auth 請求與死鎖問題。 |
| **已廢除/相容占位** | [cloud-sync.js](file:///Users/oshukezu/Documents/Knowledge%20Vault/Game/limit-180/js/cloud-sync.js) | **舊版雙向同步模組**：去 Auth 化後已在 `index.html` 中移除，改由虛擬 Dummy 物件代替，不發送背景同步請求。 |
