# Limit 180 專案目錄結構與檔案概要

本文件詳細說明了「Limit 180 — 心算極速挑戰」專案的目錄結構、各檔案的職責與功能，以便於後續的管理與開發維護。

---

## 📂 專案目錄結構一覽

```text
limit-180/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 自動部署工作流
├── agents/                     # AI 代理工作日誌與功能規格書 (Markdown 格式)
├── css/
│   └── styles.css              # 全域 Cyberpunk 霓虹風格與流光動畫樣式
├── js/                         # 前端主要邏輯與核心服務
│   ├── missions/               # 各關卡 (Mission 1-50) 的題目生成演算法
│   │   ├── README.md           # 關卡題目生成概要與擴充指南
│   │   ├── phase1.js           # 第一階段關卡集 (M1-M10)
│   │   ├── phase2.js           # 第二階段關卡集 (M11-M25)
│   │   ├── phase3.js           # 第三階段關卡集 (M26-M40)
│   │   └── phase4.js           # 第四階段關卡集 (M41-M50)
│   ├── achievements.js         # 成就牆解鎖邏輯與 DOM 渲染
│   ├── auth.js                 # 舊版認證模組（去 Auth 化後之虛擬佔位檔）
│   ├── cloud-sync.js           # 舊版同步模組（去 Auth 化後之虛擬佔位檔）
│   ├── config.js               # 全域設定檔（如 Supabase 金鑰）
│   ├── dashboard.js            # 學習數據儀表板（使用 Chart.js）
│   ├── game-audio.js           # Web Audio API 音效動態產生器
│   ├── game-config.js          # 各關卡設定值（題數、時間限制、描述）
│   ├── game-events.js          # 物理與虛擬鍵盤之輸入事件監聽與代理
│   ├── game-lobby.js           # 遊戲大廳關卡卡片與子關卡選擇渲染
│   ├── game-result.js          # 遊戲結算、降級提示與待發星星獎勵彈窗
│   ├── game-review.js          # 錯題本管理與錯題消除練習模式
│   ├── game-scaffold.js        # 比大小關卡中 SVG 輔助圖形動態繪製
│   ├── game-core.js            # 核心遊戲生命週期管理
│   ├── game-helper.js          # SPA 頁面切換、背景霓虹流光控制與 Session 驗證等輔助功能
│   ├── game-play.js            # 遊戲中題目答題、計時與暫停等具體遊玩邏輯
│   ├── generator.js            # 數學題目生成與運算步驟解析器
│   ├── leaderboard-renders.js  # 排行榜各種表格與個人排名的 DOM 動態渲染
│   ├── leaderboard.js          # 雲端排行榜分組聚合與載入控制
│   ├── loader.js               # SPA 頁面視圖 (Views) 動態載入器
│   ├── onboarding-sync.js      # 玩家首玩合流與雲端進度同步模組
│   ├── onboarding.js           # 玩家註冊、暱稱過濾與身份綁定
│   ├── storage-milestones.js   # 關卡集滿獎勵、連續上線與答對累計等成就判定
│   ├── storage.js              # 本地 LocalStorage 存檔與資料夾讀寫
│   ├── supabase-service.js     # Supabase API 串接與前端防改 Integrity 雜湊
│   └── ui-controller.js        # 全域 UI 切換與防死鎖快速關閉控制器
├── supabase/                   # Supabase 雲端資料庫配置與遷移
│   ├── functions/
│   │   └── verify-completion/  # Edge Function (作答 SHA-256 完整性校驗)
│   │       └── index.ts
│   └── migrations/
│       └── 001_init.sql        # 雲端資料庫 users_profile 初始化遷移檔
├── views/                      # 單頁式應用 (SPA) 動態載入的 HTML 視圖片段
│   ├── achievements.html       # 成就牆介面
│   ├── auth-modal.html         # 登入彈窗
│   ├── dashboard.html          # 統計圖表儀表板
│   ├── demote-modal.html       # 降級警告彈窗
│   ├── game.html               # 答題遊戲主畫面
│   ├── home.html               # 歡迎首頁
│   ├── lobby.html              # 關卡大廳
│   ├── profile-modal.html      # 特工個人資料設定
│   ├── result.html             # 結算評分畫面
│   └── review.html             # 錯題複習畫面
├── .gitattributes              # Git 屬性設定
├── .gitignore                  # Git 忽略設定
├── index.html                  # 遊戲主要入口（SPA 載入容器）
├── README.md                   # 專案介紹與聯賽核心特色說明書
└── supabase_init.sql           # Supabase 初始化資料庫 SQL 腳本 (供備份參考)
```

---

## 📝 檔案概要說明

### 1. 根目錄主要檔案 (Root)

* **[index.html](index.html)**
  * **職責**：專案的唯一進入點與單頁面應用 (SPA) 容器。
  * **說明**：負責初始化全域樣式、Tailwind CSS、Chart.js 與 Supabase SDK，並載入 `loader.js` 來動態抽換 `views/` 下的各個頁面片段。
* **[rules.html](rules.html)**
  * **職責**：聯賽與遊戲規則說明頁面。
  * **說明**：以 Cyberpunk 風格排版，向玩家說明積分機制、四維給星規則、暫停次數限制、防作弊機制等。
* **[README.md](README.md)**
  * **職責**：專案說明書。
  * **說明**：包含專案的核心特色、給星機制、防作弊與防刷分演算法、技術棧以及部署方式。
* **[supabase_init.sql](supabase_init.sql)**
  * **職責**：資料庫結構初始化 SQL。
  * **說明**：定義了 `users_profile` 資料表的 schema、索引、複合唯一約束 `(grade_class, seat_number, mission_id)`、以及安全防護的 RLS (Row Level Security) 規則。

---

### 2. 樣式與視覺配置 (css/)

* **[css/styles.css](css/styles.css)**
  * **職責**：客製化樣式與動畫效果。
  * **說明**：包含 Cyberpunk 霓虹流光背景動畫 (`scan-double`)、按鈕流光效果、發光文字、自適應配置微調，以及錯誤作答時的螢幕震動動畫樣式。

---

### 3. HTML 視圖片段 (views/)

此目錄的 HTML 檔案皆非獨立網頁，而是被 `loader.js` 動態讀取並注入到 `index.html` 中的 `#app` 容器中。

* **[views/home.html](views/home.html)**：首頁歡迎畫面，包含「進入遊戲」與「規則介紹」按鈕。
* **[views/lobby.html](views/lobby.html)**：遊戲大廳，呈現 Mission 1-10 的網格卡片、玩家目前的星星數、以及各關卡點陣圖。
* **[views/game.html](views/game.html)**：答題進行時的主畫面，包含題目卡片、答案輸入框、生命值、倒數計時器及輔助圖形容器。
* **[views/result.html](views/result.html)**：遊戲結算介面，顯示答對題數、秒數、Combo 數、獲得星等以及動態 Confetti 灑花特效。
* **[views/review.html](views/review.html)**：錯題消除練習介面，無時間限制，提示玩家需連續答對 3 次方可消除錯題。
* **[views/dashboard.html](views/dashboard.html)**：個人學習戰報儀表板，展示四維能力雷達圖與 7 日反應速度趨勢線。
* **[views/achievements.html](views/achievements.html)**：徽章成就牆，展示並渲染解鎖與未解鎖的 10+ 種特工徽章。
* **[views/profile-modal.html](views/profile-modal.html)**：特工個人資料設定彈窗，用於修改暱稱與班級座號。
* **[views/auth-modal.html](views/auth-modal.html)**：舊版登入彈窗片段。
* **[views/demote-modal.html](views/demote-modal.html)**：降級警告提示彈窗，用於警告玩家遊玩降級或分數異常。

---

### 4. JavaScript 核心邏輯 (js/)

#### 核心遊玩模組

* **[js/game-core.js](js/game-core.js)**
  * **職責**：管理整個遊戲的核心生命週期。
  * **說明**：負責遊戲開始 (`startGame`)、停止 (`stopGame`)、中斷 (`interruptGame`) 與結算 (`endGame`)。
* **[js/game-helper.js](js/game-helper.js)**
  * **職責**：提供遊戲輔助邏輯與效果。
  * **說明**：負責 SPA 視圖切換器 (`showView`)、雙軌流光相同霓虹顏色切換 (`changeScannerColor`)、雲端 Session 身分校驗 (`verifySession`) 與星星獎勵彈窗 (`showBonusStarAlert`)。
* **[js/game-play.js](js/game-play.js)**
  * **職責**：管理遊戲答題中的細部遊玩邏輯。
  * **說明**：負責下一題產生 (`nextQuestion`)、定時器倒數 (`startTimer`)、答案提交與自動判斷 (`checkAutoSubmit`)、答對與錯誤回饋處理 (`handleSuccess` 與 `handleFailure`)，以及暫停控制。
* **[js/game-config.js](js/game-config.js)**
  * **職責**：儲存 10 大 Mission 的設定資料。
  * **說明**：配置各關的總題數、中文名稱與描述，以及用來做動態倒數計時的初始時間與目標時間參數。
* **[js/generator.js](js/generator.js)**
  * **職責**：數學題目生成引擎。
  * **說明**：定義了題目文字、標準答案與解析步驟的封裝結構。會引入 `js/missions/` 下的各關生成器來產出實際題目。
* **[js/game-scaffold.js](js/game-scaffold.js)**
  * **職責**：生成心算輔助視覺圖形。
  * **說明**：負責在遊戲畫面中以 SVG 動態繪製分數（圓餅圖）、小數與百分比（10x10 網格圖）及大小比較（高度條），提供學童直觀的量感輔助。
* **[js/game-events.js](js/game-events.js)**
  * **職責**：事件代理與輸入過濾。
  * **說明**：管理實體鍵盤（如數字鍵、Backspace、Enter、暫停空白鍵）與虛擬鍵盤的點擊事件，實作「非數字輸入過濾」與「無須 Enter 的免確認即時送出」邏輯。
* **[js/game-audio.js](js/game-audio.js)**
  * **職責**：8-bit 遊戲音效合成。
  * **說明**：利用 HTML5 Web Audio API 的振盪器 (Oscillator) 即時合成「答對」、「答錯」、「點擊」、「成就解鎖」等電子音效，不需額外下載音訊檔。

#### 本地與雲端資料模組

* **[js/storage.js](js/storage.js)**
  * **職責**：本地存檔管理。
  * **說明**：提供 LocalStorage 底層的讀取與寫入介面（`math_sprint_profile` 存檔），負責歷史紀錄追加與讀寫控制。
* **[js/storage-milestones.js](js/storage-milestones.js)**
  * **職責**：成就與里程碑星星判定。
  * **說明**：處理集滿 Mission 中 20 個關卡徽章、連續上線 7 天且每日 5 局，以及累計答對 100 題時，自動追加 bonus_stars 的核心判定邏輯。
* **[js/supabase-service.js](js/supabase-service.js)**
  * **職責**：與雲端資料庫 Supabase 互動。
  * **說明**：封裝 Supabase JS Client。在寫入成績前，會利用前端混淆鹽值與 Web Crypto API 計算 `integrity_hash` (SHA-256) 並隨同成績寫入，以進行防刷與防修改校驗。
* **[js/cloud-sync.js](js/cloud-sync.js)**
  * **職責**：舊版同步預留檔。
  * **說明**：配合去 Auth 化，此模組改為 dummy 物件以確保相容性。
* **[js/auth.js](js/auth.js)**
  * **職責**：舊版驗證預留檔。
  * **說明**：配合去 Auth 化，改以 dummy 物件相容，防止 supabase.auth 請求阻塞。

#### 介面與功能模組

* **[js/game-lobby.js](js/game-lobby.js)**
  * **職責**：大廳介面控制器。
  * **說明**：渲染 10 個 Mission 卡片與各關卡進度。處理玩家選擇關卡、顯示星等以及差額補給防刷限制。
* **[js/game-result.js](js/game-result.js)**
  * **職責**：結果結算控制器。
  * **說明**：計算並渲染該局得分、Combo 連擊與給星，處理降級警告，並暫存成就解鎖的星星待大廳時再行彈出。
* **[js/game-review.js](js/game-review.js)**
  * **職責**：錯題消除模式控制器。
  * **說明**：渲染錯題本中的題目，並追蹤每一道錯題「連續答對 3 次」的消除進度。
* **[js/leaderboard.js](js/leaderboard.js)**
  * **職責**：聯賽排行榜控制器。
  * **說明**：拉取雲端數據，控管排行分頁 (個人、團隊、單關均速) 與關卡 Mission 篩選的切換。
* **[js/leaderboard-renders.js](js/leaderboard-renders.js)**
  * **職責**：聯賽排行榜渲染器。
  * **說明**：提供 `renderPersonal`、`renderTeam`、`renderMission` 三種核心方法，動態生成排行榜的 HTML Table 與高亮個人名次。
* **[js/dashboard.js](js/dashboard.js)**
  * **職責**：雷達圖與趨勢圖表繪製。
  * **說明**：整合 Chart.js 渲染玩家的弱點雷達圖 (包含正確率、均速、反應、耐力等維度) 以及 7 日速度趨勢折線圖。
* **[js/achievements.js](js/achievements.js)**
  * **職責**：成就牆 UI 繪製。
  * **說明**：讀取本地成就解鎖狀態，動態生成成就徽章卡片。
* **[js/onboarding.js](js/onboarding.js)**
  * **職責**：玩家暱稱校驗。
  * **說明**：負責玩家暱稱的防霸凌過濾（敏感詞清單）與註冊班級座號的正則校驗。
* **[js/onboarding-sync.js](js/onboarding-sync.js)**
  * **職責**：玩家進度同步與合流。
  * **說明**：在玩家首次首玩結束時將暫存的成績與新綁定身份同步，並提供非阻塞式的單關進度雲端同步 (`syncCurrentStatsToCloud`)。
* **[js/ui-controller.js](js/ui-controller.js)**
  * **職責**：全域 UI 導航與快速清理。
  * **說明**：監聽右上角關閉按鈕，在 100 毫秒內立即隱藏當前 DOM，並執行計時器停止與錯題本暫存寫入，杜絕 Supabase 網路請求延遲所產生的卡死。
* **[js/loader.js](js/loader.js)**
  * **職責**：視圖載入器。
  * **說明**：使用 `fetch` 動態載入 `views/` 下的 HTML 模板片段，並帶有在 `file://` 協定下的跨網域 (CORS) 限制警告。
* **[js/config.js](js/config.js)**
  * **職責**：環境變數與金鑰配置。
  * **說明**：儲存專案連線至 Supabase 的 API URL 與 Anon Key。

---

### 5. 關卡專屬題目生成器 (js/missions/)

此目錄的檔案將 50 個關卡的題目生成規則完全解耦與模組化，以供 `generator.js` 運作：

* **[js/missions/README.md](js/missions/README.md)**：關卡說明與詳細擴充指南（本目錄說明書）。
* **[js/missions/phase1.js](js/missions/phase1.js)**：第一階段 Mission 1 ~ 10 關卡題目隨機生成演算法。
* **[js/missions/phase2.js](js/missions/phase2.js)**：第二階段 Mission 11 ~ 25 關卡題目隨機生成演算法。
* **[js/missions/phase3.js](js/missions/phase3.js)**：第三階段 Mission 26 ~ 40 關卡題目隨機生成演算法。
* **[js/missions/phase4.js](js/missions/phase4.js)**：第四階段 Mission 41 ~ 50 關卡題目隨機生成演算法。

---

### 6. Supabase 資料庫與 Edge Functions (supabase/)

* **[supabase/migrations/001_init.sql](supabase/migrations/001_init.sql)**
  * **職責**：Supabase 資料庫遷移與結構初始化。
  * **說明**：與根目錄 `supabase_init.sql` 相同，用於 Supabase Local Development 或雲端遷移，建立資料表、索引、RLS 策略。
* **[supabase/functions/verify-completion/index.ts](supabase/functions/verify-completion/index.ts)**
  * **職責**：Supabase Edge Function 後端驗證。
  * **說明**：使用 TypeScript (Deno runtime) 撰寫，當玩家提交成績時，在後端使用相同的混淆鹽值與資料重新計算雜湊，比對 `integrity_hash`。若不一致則拒絕寫入或標記異常，防止前端直接透過 HTTP 請求偽造星星。

---

### 7. CI/CD 部署與自動化 (.github/)

* **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)**
  * **職責**：GitHub Pages 自動化部署。
  * **說明**：設定當變更推送至 `main` 或 `master` 分支時，自動使用 GitHub Actions 建置並將根目錄底下的所有靜態檔案部署至專案的 GitHub Pages 上。

---

### 8. AI 代理工作日誌與歷史文件 (agents/)

* **[agents/](agents/)**
  * **職責**：AI Agent 開發歷程與熱修復記錄。
  * **說明**：存放每次功能迭代或修復 Bug 時，AI 代理所留下的記錄檔（例如：自動提交邏輯、防作弊星數補給邏輯、排行榜 Bug 修復、Badge 成就牆重構規格書等）。此目錄檔案**不參與**遊戲的實際運行，僅作為專案演進與協同開發的參考文獻。

---
*本目錄結構文件由 Antigravity 整理生成，便於團隊管理與擴充。*
