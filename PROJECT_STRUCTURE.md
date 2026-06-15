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
│   ├── styles.css              # 主控入口檔（透過 @import 載入子元件）
│   ├── variables.css           # 全域 CSS 變數與多主題配色覆寫
│   ├── animations.css          # 流光掃描線、CRT微光、抖動等動畫效果
│   ├── components.css          # 按鈕、面板、時間條、排行榜等 UI 元件樣式（含櫻花風格去霓虹覆寫）
│   └── layouts.css             # 行動裝置適配排版與自適應高度樣式
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
│   ├── game-result.js          # 遊戲結算、降級提示與待發金幣獎勵彈窗
│   ├── game-review.js          # 錯題本管理與錯題消除練習模式
│   ├── game-scaffold.js        # 比大小關卡中 SVG 輔助圖形動態繪製
│   ├── game-store.js           # 主題配色商店預覽、金幣購買與裝備邏輯
│   ├── game-core.js            # 核心遊戲生命週期管理
│   ├── game-helper.js          # SPA 頁面切換、背景霓虹流光控制與 Session 驗證等輔助功能
│   ├── game-play.js            # 遊戲中題目答題、計時與暫停等具體遊玩邏輯
│   ├── generator.js            # 數學題目生成與運算步驟解析器
│   ├── leaderboard-renders.js  # 排行榜各種表格與個人排名的 DOM 動態渲染
│   ├── leaderboard.js          # 雲端排行榜分組聚合與載入控制
│   ├── loader.js               # SPA 頁面視圖 (Views) 動態載入器
│   ├── onboarding-sync.js      # 玩家首玩合流與雲端進度同步模組
│   ├── onboarding.js           # 玩家註冊、暱稱過濾與身份綁定
│   ├── placement-modal.js      # 新用戶大腦段位定級測驗引導邏輯與通過結算
│   ├── storage-milestones.js   # 關卡集滿獎勵、連續上線與答對累計等成就判定
│   ├── storage.js              # 本地 LocalStorage 存檔與資料夾讀寫
│   ├── supabase-service.js     # Supabase API 串接與前端防改 Integrity 雜湊
│   ├── theme-manager.js        # 主題管理器（控制 CSS 變數覆寫與櫻花 Canvas 動畫）
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
│   ├── placement-modal.html    # 大腦段位定級測驗引導與分流選擇 Modal
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
  * **說明**：以 Cyberpunk 風格排版，向玩家說明積分機制、四維金幣獎勵規則、暫停次數限制、防作弊機制等。
* **[README.md](README.md)**
  * **職責**：專案說明書。
  * **說明**：包含專案的核心特色、金幣獎金機制、防作弊與防刷分演算法、技術棧以及部署方式。
* **[supabase_init.sql](supabase_init.sql)**
  * **職責**：資料庫結構初始化 SQL。
  * **說明**：定義了 `users_profile` 資料表的 schema、索引、複合唯一約束 `(grade_class, seat_number, mission_id)`、以及安全防護的 RLS (Row Level Security) 規則。

---

### 2. 樣式與視覺配置 (css/)

* **[css/styles.css](css/styles.css)**
  * **職責**：樣式主入口檔。
  * **說明**：以 `@import` 整合導入子元件樣式。
* **[css/variables.css](css/variables.css)**
  * **職責**：視覺變數與主題管理器配合樣式。
  * **說明**：配置「赤門櫻花」預設變數與其他四款購買主題（特務霓虹、熔岩深淵、極地極光、黃金帝國）的配色覆寫。
* **[css/animations.css](css/animations.css)**
  * **職責**：動態視覺特效與轉場動畫。
  * **說明**：包含雙軌流光掃描 (`scan-double`)、CRT 螢幕微光閃爍、錯題震動反饋及 Modal 漸變淡入。
* **[css/components.css](css/components.css)**
  * **職責**：UI 按鈕、面板與文字組件。
  * **說明**：包含按鈕（含赤門櫻花無霓虹覆寫）、倒數時間條、HUD 面板、關卡徽章按鈕與排行榜列。
* **[css/layouts.css](css/layouts.css)**
  * **職責**：響應式適配排版。
  * **說明**：包含觸控螢幕隱藏虛擬鍵盤，以及防滾動滿版高度適配（Media Queries）。

---

### 3. HTML 視圖片段 (views/)

此目錄的 HTML 檔案皆非獨立網頁，而是被 `loader.js` 動態讀取並注入到 `index.html` 中的 `#app` 容器中。

* **[views/home.html](views/home.html)**：首頁歡迎畫面，包含「進入遊戲」與「規則介紹」按鈕。
* **[views/lobby.html](views/lobby.html)**：遊戲大廳，呈現 Mission 1-50 的滿版列表卡片、玩家目前的累積與今日獎金、以及各關卡點陣圖。
* **[views/game.html](views/game.html)**：答題進行時的主畫面，包含題目卡片、答案輸入框、生命值、倒數計時器及輔助圖形容器。
* **[views/result.html](views/result.html)**：遊戲結算介面，顯示答對題數、秒數、Combo 數、獲得金幣以及動態 Confetti 灑花特效。
* **[views/review.html](views/review.html)**：錯題消除練習介面，無時間限制，提示玩家需連續答對 3 次方可消除錯題。
* **[views/dashboard.html](views/dashboard.html)**：個人學習戰報儀表板，展示四維能力雷達圖與 7 日反應速度趨勢線。
* **[views/achievements.html](views/achievements.html)**：徽章成就牆，展示並渲染解鎖與未解鎖的 10+ 種特工徽章。
* **[views/placement-modal.html](views/placement-modal.html)**：大腦段位定級測驗引導與分流選擇 Modal。
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
  * **說明**：負責 SPA 視圖切換器 (`showView`)、雙軌流光相同霓虹顏色切換 (`changeScannerColor`)、雲端 Session 身分校驗 (`verifySession`) 與金幣獎勵彈窗 (`showBonusStarAlert`)。
* **[js/game-play.js](js/game-play.js)**
  * **職責**：管理遊戲答題中的細部遊玩邏輯。
  * **說明**：負責下一題產生 (`nextQuestion`)、定時器倒數 (`startTimer`)、答案提交與自動判斷 (`checkAutoSubmit`)、答對與錯誤回饋處理 (`handleSuccess` 與 `handleFailure`)，以及暫停控制。
* **[js/game-config.js](js/game-config.js)**
  * **職責**：儲存 50 大 Mission 的設定資料。
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
  * **職責**：動態音效產生器。
  * **說明**：不使用外部音檔，而是直接利用瀏覽器內建的 Web Audio API 於答對或答錯時，以正弦波及雜訊即時運算產生 8-bit 科幻音效，杜絕資源載入卡頓。
* **[js/game-store.js](js/game-store.js)**
  * **職責**：處理補給商店之裝備與扣款。
  * **說明**：動態陳列並渲染主題商品卡片、比對金幣餘額進行購買解鎖、或是直接裝備已擁有主題，點擊時能即時抽換 `:root` 變數而無需重刷頁面。
* **[js/game-review.js](js/game-review.js)**
  * **職責**：錯題複習核心邏輯。
  * **說明**：載入並操作本地 `wrong_questions_db` 本，針對每道錯題引導玩家連續答對三次以達到「完全消除」，消滅心算學習盲區。
* **[js/game-lobby.js](js/game-lobby.js)**
  * **職責**：大廳卡片與子關卡點陣圖渲染。
  * **說明**：依據關卡設定值動態產出 Mission 1-50 卡片，檢查本地 `level_records` 鎖定狀態；並在點擊卡片時橫向展開 20 個精細的關卡點陣徽章按鈕，依答題正確率顯示 S/A/B/C/D 等級評分。
* **[js/placement-modal.js](js/placement-modal.js)**
  * **職責**：新用戶大腦段位定級測驗引導邏輯與通過結算。
  * **說明**：檢查玩家是否已做過定級測驗。若為新用戶，引導其選擇「🌱基礎鍛鍊」或「🚀極速菁英」；測驗成功時解鎖 Mission 21 並發放 120,000 💰 金幣補貼；失敗時提供 Growth Mindset 引導分流。

#### 排行榜與數據分析

* **[js/leaderboard.js](js/leaderboard.js)**
  * **職責**：排行榜雲端拉取與篩選管理。
  * **說明**：非同步連接 Supabase 拉取 users_profile 表所有紀錄，並進行「個人總榜」、「團隊對抗榜（班級）」及「答題速度榜（按 Mission）」的篩選過濾與升降序排序。
* **[js/leaderboard-renders.js](js/leaderboard-renders.js)**
  * **職責**：排行榜數據 HTML 動態渲染。
  * **說明**：以 Cyberpunk 的科幻霓虹色盤渲染前 50 名之表格，包含特別針對前三名金銀銅徽章繪製，以及定位並固定顯示當前特工排名行（My Rank Row）之卡片。
* **[js/dashboard.js](js/dashboard.js)**
  * **職責**：學習反應數據儀表板繪製。
  * **說明**：調用 Chart.js 庫在網頁繪製「五維算力弱點雷達圖」（記錄在加減乘除與比大小任務之反應時間），以及「近 7 日心算思考均速趨勢折線圖」，協助家長精準掌握學童學習弱點。
* **[js/achievements.js](js/achievements.js)**
  * **職責**：徽章成就牆判定與渲染。
  * **說明**：讀取 LocalStorage 進度並判定是否解鎖如「新晉特工」、「算力破百」、「無傷通關」等 10 個核心成就徽章。

#### 本地與雲端資料同步

* **[js/storage.js](js/storage.js)**
  * **職責**：本地資料存檔與進度寫入器。
  * **說明**：維護 `DEFAULT_PROFILE` 的完整存檔 JSON 結構，提供 `isMissionUnlocked` 關卡鎖定檢驗、重新計算總金幣數（recalculateTotalStars）、寫入 Stage 得分紀錄（saveLevelRecord）及今日獎金清零機制。
* **[js/supabase-service.js](js/supabase-service.js)**
  * **職責**：Supabase API 的低階封裝服務。
  * **說明**：包含 `saveRecord`（覆寫上傳單關星數與秒數）、`getLeaderboard`（獲取資料）及 `saveGlobalProfile`（上傳全域商店與金幣餘額）。在此模組中實作了 Web Crypto API 計算防改雜湊簽章，保障比賽之公平性。
* **[js/onboarding.js](js/onboarding.js)**
  * **職責**：玩家註冊、暱稱過濾與身份綁定。
  * **說明**：檢查玩家是否為首次綁定；驗證班級格式是否符合聯賽規格（2位英文+3位數字）；過濾不雅暱稱，並與 Supabase 互比，防範同班同座號惡意冒用。
* **[js/onboarding-sync.js](js/onboarding-sync.js)**
  * **職責**：特工身份與成績補錄合流。
  * **說明**：當訪客匿名遊玩賺取金幣後，在註冊那一刻將本地的歷史關卡成績及 200 Combo 累積的獎金一併上傳，確保離線資料與雲端無縫合流。
* **[js/storage-milestones.js](js/storage-milestones.js)**
  * **職責**：高內聚成就里程碑的額外金幣判定。
  * **說明**：在結算那一刻比對此 Stage 的答題數據，判定是否加發 2,000~10,000 💰 金幣，並呼叫 recalculateTotalStars 更新餘額。
* **[js/loader.js](js/loader.js)**
  * **職責**：SPA 單頁面元件非同步載入器。
  * **說明**：異步 fetch `views/` 目錄下的 HTML 視圖片段，將其注入 `index.html`，並向外廣播 `limit180ComponentsLoaded` 自訂事件，解決 index 檔案過於臃腫的問題。
* **[js/ui-controller.js](js/ui-controller.js)**
  * **職責**：全域快速關閉控制器。
  * **說明**：使用全域事件代理監聽 `.close-btn` 與離開按鈕，確保退出時不會牽涉任何雲端非同步請求，防止 UI 死鎖與卡頓。
