# Specification: MathSprint (MVP)

## 1. Executive Summary
MathSprint 是一個針對國小學童（主攻 3-6 年級基礎紮實化）設計的高頻率心算反應力網頁遊戲。核心目標是透過「逆向指標回推」與「逐漸縮短的答題時間」，高頻率訓練 100 以內四則運算，以及分數、小數、百分比的數值直覺。本產品融入補教心理學與留存控制機制，在追求極致速度的同時，具備防挫折的教育鷹架與每日刻意練習限制，確保學習續航力。

## 2. Technical Stack & Architecture
* **Architecture:** Single Page Application (SPA), Pure Client-Side.
* **Frontend:** HTML5, CSS3 (Tailwind CSS for responsive UI), Vanilla JavaScript.
* **Storage & Cache:** `localStorage` (Key: `math_sprint_profile`) for game progress, star verification, wrong answer ledger, and achievements. Fully offline-capable, zero backend infrastructure required for MVP.
* **Deployment:** GitHub Pages (Automated via GitHub Actions, repository name: `math-sprint`).

## 3. 10-Level Difficulty & Progression Matrix
終極指標由高中生「傳奇殿堂」標準（3分鐘/100題/全對，平均每題 1.8 秒）進行逆向梯度回推。系統採「繁星累積制」與「每日挑戰限制」來拉長學習週期，確保底子紮實。

| Level | 核心考核範疇 | 總題數 | 通過正確率 | 初始限時 | 終極目標速度 | 解鎖條件 (累積星數) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 1** | 50以內加減法（不進/借位） | 20 題 | 90% | 6.0 秒 | 4.0 秒 | 初始解鎖 |
| **Level 2** | 100以內加減法（進/借位） | 25 題 | 90% | 5.5 秒 | 3.5 秒 | 3 顆星 |
| **Level 3** | 九九乘法與基本除法 | 30 題 | 90% | 5.0 秒 | 3.0 秒 | 6 顆星 |
| **Level 4 [魔王關]**| 兩步驟四則混和運算 | 35 題 | 95% | 4.5 秒 | 2.5 秒 | 9 顆星 + 通過 L3 |
| **Level 5** | 分數與小數基礎對比 (e.g., 1/2 vs 0.5) | 40 題 | 95% | 4.0 秒 | 2.2 秒 | 12 顆星 |
| **Level 6** | 小數與百分比轉換 (e.g., 0.25 vs 30%) | 45 題 | 95% | 3.5 秒 | 2.0 秒 | 15 顆星 |
| **Level 7 [魔王關]**| 三者混搭二選一 (分數/小數/百分比) | 50 題 | 95% | 3.0 秒 | 1.8 秒 | 18 顆星 + 通過 L6 |
| **Level 8** | 國中正負數與簡單代數速算 | 60 題 | 98% | 2.5 秒 | 1.8 秒 | 22 顆星 |
| **Level 9** | 三者混搭三選一（選出最大/最小值） | 70 題 | 98% | 2.0 秒 | 1.8 秒 | 26 顆星 |
| **Level 10 [傳奇]**| 高中傳奇殿堂：全範疇極速衝刺 | 100 題 | 100% | 1.8 秒 | 1.8 秒 (恆定)| 30 顆星 + 通過 L9 |

## 4. Core Features & Game Loop Mechanics

### A. Dynamic Speed & Input Mechanics (一鍵流優化)
* **Input Method:** 
  * 針對計算題（L1-L4, L8）：提供大按鈕虛擬九宮格（適合平板觸控）並支援實體鍵盤。
  * 針對比大小題（L5-L7, L9）：嚴禁複雜輸入，一律採「一鍵流」二選一（左大/右大）或三選一（選出最大值），確保不因手指移動延遲（Input Latency）破壞心算節奏。
* **Speed Controller:**
  * 關卡開始以該 Level 的 `初始限時` 運行。
  * **Combo 加速：** 每連續答對 4 題，單題倒數時間減少 0.5 秒，直至觸發該關卡的 `終極目標速度`。
  * **錯誤懲罰：** 答錯一題，時間條立刻恢復到 `初始限時`，提供大腦喘息空間。
  * **Level 10 特殊規則：** 時間條恆定為 1.8 秒，不進行動態變速。答錯任何一題立即判定 Game Over。

### B. Math Logic Generator Constraints (數值生成限制)
* 為確保心算合理性，涉及分數與小數轉換（L5-L7, L9-L10）時，分母必須限定為 `2, 4, 5, 8, 10, 20, 25, 50`，嚴禁生成如 3/7 等無法整除之無限循環小數。

### C. Educational & Retention Mechanics (補教續航模組)
* **Star Rating Formula (三星評等公式):**
  * 1 顆星：達到該關卡 `通過正確率`。
  * 2 顆星：達到正確率，且平均單題答題速度小於 `(初始限時 + 終極速度) / 2`。
  * 3 顆星：達到正確率，且平均單題答題速度達到或超越 `終極目標速度`。
* **Progression Lock & Fatigue Mechanics (鎖定與疲勞機制):**
  * **每日開拓能量：** 玩家每日擁有 3 點開拓能量（存於 `localStorage`，每日 00:00 刷新）。
  * 只有挑戰「未解鎖的新關卡」會消耗 1 點能量。能量為 0 时，新關卡挑戰按鈕反灰。
  * 能量耗盡後，玩家僅能進入「已解鎖關卡（刷星/刷速度）」與「錯題本複習模式（不消耗能量）」，強制實施短時間、高頻率的刻意練習。
  * **降級保護：** 若玩家在同一關卡連續挑戰失敗 3 次，系統自動跳出彈窗引導：「要不要先去前一個年級的關卡練練手？」，防止挫折感過重。

### D. Psychological Buffs & Remediation (防挫折與救濟)
* **Wrong Answer Ledger (錯題本)：**
  * 凡答錯或因超時（Time-out）失敗的題目，自動存入本地快取 `wrong_questions_db`。
  * 首頁常駐「錯題消除模式」，不設時間限制。孩子必須將錯題本中的題目重新做對 3 次，才能將其移出資料庫。
* **Scaffolded Visual Hints (視覺鷹架)：**
  * 當涉及分數/小數比大小且當前關卡 Combo 數低於 5 時，畫面上方微幅顯示圓餅圖、方格或數線輔助。
  * 當 Combo 達 5 以上，視覺補助自動淡出（Fade-out），強迫大腦進入純數字邏輯運算。魔王關（L4, L7）與傳奇關（L10）全程強制關閉視覺鷹架。
* **「差一點點」演算法：** 若因超時落敗（落後在 0.3 秒內），結算畫面顯示「殘念！你的速度已達標 95%！再試一次！」，以競爭與成長數據取代生硬的「失敗」。
* **免死金牌（Shield）：** 累積答對達 50 題，可獲得一個「時間凍結盾」，允許在後續遊戲中自動抵扣一次超時。

### E. Parental Dashboard (家長專用戰報)
* 提供獨立的資料視覺化分頁（讀取 `localStorage` 歷程數據）：
  * **弱點雷達：** 精準揪出瓶頸（e.g., "孩子在『分母為 8 的分數轉換』平均思考時間達 3.8 秒，高於整體平均"）。
  * **進步折線圖：** 顯示過去 7 天的「單題平均反應時間變化」，讓家長與孩子看見實質進步。

## 5. State Management & Cache Structure
```json
{
  "math_sprint_profile": {
    "current_unlocked_level": 5,
    "total_stars": 13,
    "daily_energy": 3,
    "last_energy_refresh_date": "2026-06-05",
    "shields_count": 1,
    "level_records": {
      "level-1": { "stars": 3, "best_avg_time": "3.8s", "max_combo": 20 },
      "level-5": { "stars": 1, "best_avg_time": "3.9s", "max_combo": 6 }
    },
    "wrong_questions_db": [
      { "question": "1/8 vs 0.15", "correct_answer": "<", "fail_count": 2 }
    ]
  }
}

## 6. UI/UX Requirements
* **Gamified Elements:** 具備大型、清晰的倒數計時條（Time Bar），顏色隨時間由綠變橘、再變紅，營造流暢的緊迫感。
* **Feedback:** 
  * 答對：顯示綠色圈圈與輕快音效，不中斷節奏。
  * 答錯或超時：畫面進行劇烈震動（Shake Animation），並強制暫停 1.5 秒顯示正確答案與解析，加深錯誤記憶後再切換下一題。
* **Celebration:** 成功過關、重新刷滿 3 顆星或解鎖成就時，觸發 Canvas 繽紛紙屑（Confetti）特效，給予極大虛榮感。

## 7. Achievement System (成就徽章牆)
為了提升長期留存率，系統設立獨立的「成就獎章分頁」，滿足孩子的收集欲：
* **初試身手：** 通過 Level 1。
* **神速反射：** 在單題限時小於 1.5 秒的狀態下答對。
* **連擊大師：** 在任意關卡達成 20 Combo。
* **錯題終結者：** 累計從「錯題本」中消除 50 道題目。
* **踏入傳奇：** 成功解鎖 Level 10（傳奇殿堂）。

## 8. Development Phases for Agent
* **Phase 1: 基礎架構與狀態初始化**
  * 建立 Single Page 結構與 Tailwind CSS 基礎佈局。
  * 實作 `localStorage` 核心類別，包含核心資料結構定義、每日 00:00 自動刷新 3 點能量邏輯。
* **Phase 2: 計算關卡與動態核心核心開發**
  * 開發 Level 1 - Level 4 的數學題型自動生成器。
  * 實作虛擬九宮格大按鈕與實體鍵盤監聽。
  * 完成核心 Game Loop：包含 Combo 連擊時間縮短、答錯時間重置的核心演算法。
* **Phase 3: 轉換關卡與視覺鷹架開發**
  * 開發 Level 5 - Level 9 的分數/小數/百分比轉換與比大小邏輯（加入分母限制器）。
  * 實作比大小「一鍵流」二選一/三選一介面。
  * 撰寫根據 Combo 數讓網頁圖形（圓餅圖/數線）自動淡出（Fade-out）的控制邏輯。
* **Phase 4: 續航模組與自動化部署**
  * 串接「錯題本自動存取」與「錯題消除模式」獨立選單。
  * 實作「家長戰報」圖表視覺化。
  * 撰寫 `.github/workflows/deploy.yml`，確保程式碼 Push 後自動發布至 GitHub Pages。