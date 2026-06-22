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
│   ├── game-store-assets.js    # 特工頭像、頭貼框與成就徽章之資產定義檔 [NEW]
│   ├── game-store.js           # 主題配色商店預覽、金幣購買與交易流程
│   ├── game-store-redeem.js    # 兌換代碼與作弊測試代碼實現 [NEW]
│   ├── game-customization.js   # 特工外觀與個人裝備配戴管理 [NEW]
│   ├── game-core.js            # 核心遊戲狀態宣告與事件註冊
│   ├── game-lifecycle.js       # 挑戰開始、結束與定級測試等主生命週期控制 [NEW]
│   ├── game-helper.js          # SPA 頁面切換、背景霓虹流光控制與 Session 驗證等輔助功能
│   ├── game-play.js            # 遊戲中題目答題、計時與暫停等具體遊玩邏輯
│   ├── generator.js            # 數學題目生成與運算步驟解析器
│   ├── leaderboard-renders.js  # 排行榜各種表格與個人排名的 DOM 動態渲染
│   ├── leaderboard.js          # 雲端排行榜分組聚合與載入控制
│   ├── loader.js               # SPA 頁面視圖 (Views) 動態載入器
│   ├── onboarding-validator.js # 註冊表單格式校驗與敏感詞過濾器 [NEW]
│   ├── onboarding-sync.js      # 玩家首玩合流與雲端進度同步模組
│   ├── onboarding.js           # 玩家註冊 UI 互動與身份綁定
│   ├── placement-modal.js      # 新用戶大腦段位定級測驗引導邏輯與通過結算
│   ├── storage-locks.js        # 關卡解鎖與 Mission 開放判定 [NEW]
│   ├── storage-wrong.js        # 本地錯題本寫入與消除計數 [NEW]
│   ├── storage-milestones.js   # 關卡集滿獎勵、連續上線與答對累計等成就判定
│   ├── storage.js              # 本地 LocalStorage 存檔主邏輯與資料夾讀寫
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
  * **說明**：載入所有拆解後的 Javascript 業務邏輯模組，進行全域初始化。
* **[README.md](README.md)**
  * **職責**：專案說明書。
  * **說明**：專案核心特色、金幣獎勵規則、安全防作弊機制與部署方式。

---

### 2. JavaScript 核心邏輯 (js/)

#### 核心遊玩模組

* **[js/game-core.js](js/game-core.js)**
  * **說明**：定義 gameState 執行期變數，執行基本 initialization。
* **[js/game-lifecycle.js](js/game-lifecycle.js) [NEW]**
  * **說明**：主控遊戲開始 (`startGame`)、定級測試啟動 (`startPlacementTest`)、停止 (`stopGame`) 與結算紀錄 (`endGame`)。
* **[js/game-play.js](js/game-play.js)**
  * **說明**：管理答題計時、暫停回饋、自動送出等具體遊戲中邏輯。
* **[js/game-store.js](js/game-store.js)**
  * **說明**：負責補給商店的主題、頭像與外框陳列、餘額判定與扣款購買交易。
* **[js/game-store-assets.js](js/game-store-assets.js) [NEW]**
  * **說明**：集中定義商店所有頭像、外框與徽章的靜態設定值。
* **[js/game-store-redeem.js](js/game-store-redeem.js) [NEW]**
  * **說明**：實作 7 位數字混和兌換代碼與測試用解鎖作弊碼。
* **[js/game-customization.js](js/game-customization.js) [NEW]**
  * **說明**：控制裝備切換、主題預覽、配戴徽章，並在首頁與名牌處更新特工框線。
* **[js/game-admin.js](js/game-admin.js)**
  * **說明**：教師後台管理邏輯，負責查詢班級名冊、修改學生座號與班級、派發金幣。

#### 註冊與存檔控制

* **[js/storage.js](js/storage.js)**
  * **說明**：LocalStorage 本地存檔寫入主逻辑。
* **[js/storage-locks.js](js/storage-locks.js) [NEW]**
  * **說明**：Mission 與 Sub-level 之解鎖狀態把關。
* **[js/storage-wrong.js](js/storage-wrong.js) [NEW]**
  * **說明**：錯題本的本地寫入、連續答對 3 次消除計數與滿 10 題獎勵金幣。
* **[js/storage-milestones.js](js/storage-milestones.js)**
  * **說明**：成就里程碑判定（如 Mission 20 關全通過加發獎勵）。
* **[js/onboarding-validator.js](js/onboarding-validator.js) [NEW]**
  * **說明**：獨立的註冊輸入格式檢驗器與敏感詞清單過濾。
* **[js/onboarding.js](js/onboarding.js)**
  * **說明**：引導註冊特工身份彈窗 UI。
