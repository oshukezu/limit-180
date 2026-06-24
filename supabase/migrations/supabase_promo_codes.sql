-- Limit 180: 兌換代碼系統
-- 功能：
-- 1) 代碼可設定到期日 expires_at
-- 2) 每位使用者（班級+座號）同一代碼只能兌換一次

CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{7}$'),
  coins_reward INTEGER NOT NULL CHECK (coins_reward > 0),
  expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_total_redemptions INTEGER NULL CHECK (max_total_redemptions IS NULL OR max_total_redemptions > 0),
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL REFERENCES promo_codes(code) ON DELETE CASCADE,
  grade_class TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  nickname TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_per_code UNIQUE (code, grade_class, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_redemptions(code);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(grade_class, seat_number);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_codes' AND policyname = 'Allow public read promo_codes'
  ) THEN
    CREATE POLICY "Allow public read promo_codes"
      ON promo_codes
      FOR SELECT
      USING (true);
  END IF;
END $$;

INSERT INTO promo_codes (code, coins_reward, expires_at, is_active, max_total_redemptions)
VALUES
  ('UNLOCK7', 777777, NULL, TRUE, NULL),
  ('COINS88', 88888, NULL, TRUE, NULL),
  ('SECRET7', 1800000, NULL, TRUE, NULL)
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_codes' AND policyname = 'Allow public write promo_codes'
  ) THEN
    CREATE POLICY "Allow public write promo_codes"
      ON promo_codes
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_redemptions' AND policyname = 'Allow public read promo_redemptions'
  ) THEN
    CREATE POLICY "Allow public read promo_redemptions"
      ON promo_redemptions
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_redemptions' AND policyname = 'Allow public write promo_redemptions'
  ) THEN
    CREATE POLICY "Allow public write promo_redemptions"
      ON promo_redemptions
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
