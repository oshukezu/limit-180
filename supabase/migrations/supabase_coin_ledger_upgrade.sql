-- 升級既有 coin_ledger 結構：加入去重事件鍵，避免重複入帳

ALTER TABLE IF EXISTS coin_ledger
  ADD COLUMN IF NOT EXISTS ledger_event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_ledger_event_key
  ON coin_ledger (ledger_event_key)
  WHERE ledger_event_key IS NOT NULL;

-- 重新建立函式：新增 p_event_key 參數（可選）
CREATE OR REPLACE FUNCTION apply_coin_transaction(
  p_grade_class TEXT,
  p_seat_number TEXT,
  p_nickname TEXT,
  p_delta_coins INTEGER,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_event_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  new_balance INTEGER,
  ledger_id BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance INTEGER;
  v_ledger_id BIGINT;
BEGIN
  IF p_event_key IS NOT NULL THEN
    SELECT balance_after, id
      INTO v_balance, v_ledger_id
    FROM coin_ledger
    WHERE ledger_event_key = p_event_key
    LIMIT 1;

    IF v_ledger_id IS NOT NULL THEN
      RETURN QUERY SELECT v_balance, v_ledger_id;
      RETURN;
    END IF;
  END IF;

  INSERT INTO users_global (grade_class, seat_number, nickname, coins_balance, purchased_items, updated_at)
  VALUES (p_grade_class, p_seat_number, p_nickname, GREATEST(p_delta_coins, 0), '{}'::text[], NOW())
  ON CONFLICT (grade_class, seat_number)
  DO UPDATE SET
    coins_balance = GREATEST(users_global.coins_balance + p_delta_coins, 0),
    nickname = EXCLUDED.nickname,
    updated_at = NOW()
  RETURNING coins_balance INTO v_balance;

  INSERT INTO coin_ledger (
    grade_class, seat_number, nickname, ledger_event_key, delta_coins, balance_after, reason, metadata
  )
  VALUES (
    p_grade_class, p_seat_number, p_nickname, p_event_key, p_delta_coins, v_balance, p_reason, COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_ledger_id;

  RETURN QUERY SELECT v_balance, v_ledger_id;
END;
$$;
