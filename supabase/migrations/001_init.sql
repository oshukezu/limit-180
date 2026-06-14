-- MathSprint 2.0 資料庫初始化腳本
-- 在 Supabase Dashboard → SQL Editor 貼入並執行
-- 建立時間：2026

-- ============================================================
-- 表一：user_profiles（玩家基本資料）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname             TEXT NOT NULL DEFAULT '',
  total_stars          INT  NOT NULL DEFAULT 0,
  shields_count        INT  NOT NULL DEFAULT 0,
  wrong_questions_db   JSONB DEFAULT '[]',
  unlocked_achievements JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- RLS：只能讀寫自己的資料
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile read" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Own profile write" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Own profile update" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);


-- ============================================================
-- 表二：level_records（子關卡成績記錄）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.level_records (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_num   SMALLINT NOT NULL CHECK (mission_num BETWEEN 1 AND 50),
  level_num     SMALLINT NOT NULL CHECK (level_num BETWEEN 1 AND 20),
  stars         SMALLINT NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  best_avg_time REAL     NOT NULL DEFAULT 999,
  max_combo     SMALLINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_num, level_num)
);

-- 索引加速查詢
CREATE INDEX IF NOT EXISTS idx_level_records_user ON public.level_records(user_id);
CREATE INDEX IF NOT EXISTS idx_level_records_mission ON public.level_records(mission_num);

-- RLS：只能讀寫自己的記錄
ALTER TABLE public.level_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own level records read" ON public.level_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Own level records write" ON public.level_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own level records update" ON public.level_records
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- 表三：leaderboard（全台速算秒殺榜）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname      TEXT NOT NULL,
  mission_num   SMALLINT NOT NULL CHECK (mission_num BETWEEN 1 AND 50),
  best_avg_time REAL     NOT NULL,
  recorded_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_num)
);

-- 索引：依 mission_num + best_avg_time 加速排行查詢
CREATE INDEX IF NOT EXISTS idx_leaderboard_mission_time 
  ON public.leaderboard(mission_num, best_avg_time ASC);

-- RLS：所有人可讀；寫入由 Edge Function 以 service_role 執行
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public leaderboard read" ON public.leaderboard
  FOR SELECT USING (true);

-- 注意：INSERT/UPDATE 由 Edge Function 以 service_role_key 執行，不受 RLS 限制


-- ============================================================
-- 表四：anticheat_logs（防作弊稽核日誌）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anticheat_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mission_num SMALLINT,
  level_num   SMALLINT,
  verdict     TEXT CHECK (verdict IN ('PASS', 'BOT_SPEED', 'BOT_PATTERN')),
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS：只有 service_role 可寫（Edge Function 負責寫入），一般用戶不可讀
ALTER TABLE public.anticheat_logs ENABLE ROW LEVEL SECURITY;
-- 不設定任何 SELECT policy → 一般用戶無法讀取日誌


-- ============================================================
-- 觸發器：leaderboard 只保留最佳成績（更新時比較）
-- ============================================================
CREATE OR REPLACE FUNCTION public.keep_best_leaderboard_score()
RETURNS TRIGGER AS $$
BEGIN
  -- 若新記錄的時間比現有的更慢，忽略此次更新
  IF TG_OP = 'UPDATE' AND NEW.best_avg_time >= OLD.best_avg_time THEN
    RETURN OLD; -- 保留舊記錄
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_leaderboard_best_score
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.keep_best_leaderboard_score();


-- ============================================================
-- 啟用 Realtime（排行榜即時推送）
-- ============================================================
-- 在 Supabase Dashboard → Database → Replication 手動啟用 leaderboard 表
-- 或執行下方指令（需要 superuser 權限）：
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;


-- ============================================================
-- 完成提示
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'MathSprint 2.0 資料庫初始化完成！';
  RAISE NOTICE '請至 Dashboard → Database → Replication 啟用 leaderboard 表的 Realtime。';
  RAISE NOTICE '請至 Dashboard → Authentication → Providers 啟用 Anonymous 與 Google 登入。';
END $$;
