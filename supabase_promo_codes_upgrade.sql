-- Limit 180: 兌換代碼系統升級腳本（給已經建立過 promo table 的環境）
-- 目的：
-- 1) 強制 code 為 7 位英數字
-- 2) 補齊 max_total_redemptions / redeemed_count 欄位
-- 3) 確保每人每碼只能兌換一次

ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS max_total_redemptions INTEGER NULL,
  ADD COLUMN IF NOT EXISTS redeemed_count INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'promo_codes_max_total_redemptions_positive'
  ) THEN
    ALTER TABLE promo_codes
      ADD CONSTRAINT promo_codes_max_total_redemptions_positive
      CHECK (max_total_redemptions IS NULL OR max_total_redemptions > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'promo_codes_code_format_7_alnum'
  ) THEN
    ALTER TABLE promo_codes
      ADD CONSTRAINT promo_codes_code_format_7_alnum
      CHECK (code ~ '^[A-Z0-9]{7}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_user_per_code'
  ) THEN
    ALTER TABLE promo_redemptions
      ADD CONSTRAINT unique_user_per_code UNIQUE (code, grade_class, seat_number);
  END IF;
END $$;
