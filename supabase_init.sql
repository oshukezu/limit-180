-- 0. 重置舊有的資料表 (為防欄位衝突，重建資料表)
DROP TABLE IF EXISTS users_profile;

-- 1. 建立 users_profile 資料表 (用於聯賽排行榜之單一資料表)
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_class TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    nickname TEXT NOT NULL,
    mission_id INTEGER NOT NULL, -- 大關卡編號 (1-10)
    stars INTEGER DEFAULT 0,     -- 該關卡累計星星數
    best_avg_time NUMERIC DEFAULT 99.9, -- 該關卡最佳平均秒數
    min_time NUMERIC DEFAULT 99.9,      -- 該關卡單題最快秒數
    integrity_hash TEXT, -- 前端防改雜湊驗證欄位
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- 唯一性約束 (Composite Unique Key)：防止同班級、同座號、同關卡重複存檔，改為覆蓋更新 (upsert)
    CONSTRAINT unique_grade_class_seat_mission UNIQUE (grade_class, seat_number, mission_id)
);

-- 2. 啟用 Row Level Security (RLS)
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- 3. 建立安全性政策：允許所有人匿名讀取 (SELECT)，用於顯示排行榜
CREATE POLICY "Allow public read" 
ON users_profile 
FOR SELECT 
USING (true);

-- 4. 建立安全性政策：允許所有人進行匿名寫入與更新 (UPSERT)
CREATE POLICY "Allow public insert and update" 
ON users_profile 
FOR ALL 
USING (true) 
WITH CHECK (true);
