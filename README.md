# Limit 180｜心算極速挑戰

[繁體中文](#繁體中文) | [English](#english) | [日本語](#日本語)

---

## 繁體中文

「Limit 180」是一款主打極速心算與刻意練習的網頁遊戲。玩家的終極目標是挑戰在 3 分鐘（180 秒）內做完 100 題心算。

### 🌟 核心特色
- 快速答題：當玩家鍵入的答案位數與正確答案位數一致時，系統將在輸入的瞬間立即自動送出判定，無需按下 any 確認鍵或 Enter，作答體驗極致流暢。
- 關卡解鎖：遊戲包含 10 個 Missions，各含 20 個 Level。每個 Mission 只要累計獲得大於等於 3 顆星，就能立刻解鎖下一個 Mission。
- 防作弊機制：每關僅提供 3 次免費暫停。從第 4 次暫停起，遊戲畫面雖會顯示暫停，但後台計時器將繼續扣減時間。
- 校園聯賽排行：
  - 綁定Google帳號，防止重複註冊。
  - 資料寫入時會附加雜湊簽名，讀取排行榜時若發現資料遭直接修改，將會自動過濾，確保比賽公平性。

### 🛠️ 技術架構
- Core: HTML5, Vanilla JavaScript, CSS3 (Cyberpunk 霓虹視覺風格)
- Database (Serverless): Supabase (UMD SDK) & Web Crypto API (SHA-256)
- Data Visualization: Chart.js (用於結算數據分析)

---

## English

"Limit 180" is a web-based game designed for rapid mental arithmetic and deliberate practice. The ultimate goal is to complete 100 questions within 3 minutes (180 seconds).

### 🌟 Key Features
- **Fast Answering**: The game automatically validates and submits the answer the instant the input length matches the correct answer's digit length. No need to click any confirm button or press Enter, providing an extremely smooth user experience.
- **Mission Unlock**: Consists of 10 Missions, each with 20 levels. Acquiring at least 3 stars in a Mission immediately unlocks the next Mission.
- **Anti-Cheat Mechanism**: Players are allowed up to 3 free pauses per level. Starting from the 4th pause, the timer in the background will continue to count down despite the pause screen being active.
- **Campus League Leaderboard**:
  - Bound with Google account to prevent duplicate registrations.
  - Generates a hash signature when writing data. The leaderboard automatically filters out records that were modified directly in the database, ensuring competition fairness.

### 🛠️ Tech Stack
- **Core**: HTML5, Vanilla JavaScript, CSS3 (Cyberpunk Neon Aesthetic Style)
- **Database (Serverless)**: Supabase (UMD SDK) & Web Crypto API (SHA-256)
- **Data Visualization**: Chart.js (for statistics screen and analysis)

---

## 日本語

「Limit 180」は、極限状態での暗算トレーニングと反復練習に焦点を当てたウェブゲームです。プレイヤーの最終目標は、3分間（180秒）以内に100問の暗算を解くことです。

### 🌟 主な機能
- **迅速な解答**: 入力された回答の桁数が正解の桁数と一致した瞬間、システムが自動的に検証して判定を行います。確認ボタンや Enter キーを押す手間がなく、極めてスムーズに解答を続けられます。
- **ミッション解放**: 10のミッションで構成され、それぞれ20のレベルを含んでいます。各ミッションで累計 3つ以上の星（★）を獲得すると、次のミッションが即座に解放されます。
- **不正防止機能**: 1ステージにつき3回まで無料でポーズ可能です。4回目のポーズからは、ポーズ画面が表示されてもタイマーのカウントダウンは裏で継続します。
- **校内対抗ランキング**:
  - Googleアカウントと連携し、重複登録を防止します。
  - データ書き込み時にハッシュ署名を付与します。データベースが直接書き換えられた場合、ランキング読み込み時に自動的に除外され、公平な大会運営を保証します。

### 🛠️ 技術スタック
- **コア**: HTML5, Vanilla JavaScript, CSS3 (サイバーパンク・ネオンデザイン)
- **データベース (Serverless)**: Supabase (UMD SDK) & Web Crypto API (SHA-256)
- **データ可視化**: Chart.js (リザルト画面でのデータ分析用)