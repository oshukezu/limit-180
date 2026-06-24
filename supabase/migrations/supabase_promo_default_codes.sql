-- Limit 180: 內建兌換代碼
-- 若 promo_codes 已存在，只需執行本檔即可匯入內建碼。

INSERT INTO promo_codes (code, coins_reward, expires_at, is_active, max_total_redemptions)
VALUES
  ('UNLOCK7', 777777, NULL, TRUE, NULL),
  ('COINS88', 88888, NULL, TRUE, NULL),
  ('SECRET7', 1800000, NULL, TRUE, NULL)
ON CONFLICT (code) DO NOTHING;
