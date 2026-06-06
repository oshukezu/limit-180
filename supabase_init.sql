-- 1. 建立 users_profile 資料表 (包含複合唯一約束)
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_class TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    nickname TEXT NOT NULL,
    total_stars INTEGER DEFAULT 0,
    best_avg_time NUMERIC DEFAULT 99.9,
    integrity_hash TEXT, -- 前端防改雜湊驗證欄位
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- 唯一性約束 (Composite Unique Key)：防止同班級、同座號重複註冊
    CONSTRAINT unique_grade_class_seat UNIQUE (grade_class, seat_number)
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

-- 5. 建立 mission_records 資料表 (分關排行榜，包含唯一約束)
CREATE TABLE IF NOT EXISTS mission_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_class TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    nickname TEXT NOT NULL,
    mission_num INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    avg_time NUMERIC NOT NULL,
    min_time NUMERIC NOT NULL,
    integrity_hash TEXT, -- 前端防改雜湊驗證欄位
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- 唯一性約束 (Composite Unique Key)：防止同班級、同座號在一關重複存檔，採用覆蓋更新
    CONSTRAINT unique_grade_seat_mission UNIQUE (grade_class, seat_number, mission_num)
);

-- 6. 啟用 RLS
ALTER TABLE mission_records ENABLE ROW LEVEL SECURITY;

-- 7. 建立安全性政策
CREATE POLICY "Allow public read mission_records" 
ON mission_records 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public all mission_records" 
ON mission_records 
FOR ALL 
USING (true) 
WITH CHECK (true);
