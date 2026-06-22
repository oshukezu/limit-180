-- Limit 180: Coin ledger + atomic merge RPC
-- 請在 Supabase SQL Editor 執行本檔案

CREATE TABLE IF NOT EXISTS coin_ledger (
  id BIGSERIAL PRIMARY KEY,
  grade_class TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  nickname TEXT NOT NULL,
  ledger_event_key TEXT NULL,
  delta_coins INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_ledger_identity_time
  ON coin_ledger (grade_class, seat_number, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_ledger_event_key
  ON coin_ledger (ledger_event_key)
  WHERE ledger_event_key IS NOT NULL;

ALTER TABLE coin_ledger ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coin_ledger' AND policyname = 'Allow public read coin_ledger'
  ) THEN
    CREATE POLICY "Allow public read coin_ledger"
      ON coin_ledger
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coin_ledger' AND policyname = 'Allow public write coin_ledger'
  ) THEN
    CREATE POLICY "Allow public write coin_ledger"
      ON coin_ledger
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

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
    nickname = EXCLUDED.nickname,
    coins_balance = GREATEST(0, users_global.coins_balance + p_delta_coins),
    updated_at = NOW()
  RETURNING users_global.coins_balance INTO v_balance;

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

CREATE OR REPLACE FUNCTION merge_user_global_state(
  p_grade_class TEXT,
  p_seat_number TEXT,
  p_nickname TEXT,
  p_coins_balance INTEGER,
  p_purchased_items TEXT[],
  p_equipped_avatar TEXT,
  p_equipped_border TEXT,
  p_equipped_badges TEXT[],
  p_unlocked_assets TEXT[],
  p_integrity_hash TEXT
)
RETURNS users_global
LANGUAGE plpgsql
AS $$
DECLARE
  v_row users_global%ROWTYPE;
BEGIN
  INSERT INTO users_global (
    grade_class, seat_number, nickname, coins_balance, purchased_items,
    equipped_avatar, equipped_border, equipped_badges, unlocked_assets,
    integrity_hash, updated_at
  )
  VALUES (
    p_grade_class, p_seat_number, p_nickname, GREATEST(p_coins_balance, 0), COALESCE(p_purchased_items, '{}'::text[]),
    COALESCE(p_equipped_avatar, 'avatar-default'), COALESCE(p_equipped_border, 'border-none'),
    COALESCE(p_equipped_badges, '{}'::text[]), COALESCE(p_unlocked_assets, ARRAY['avatar-default','border-none']),
    p_integrity_hash, NOW()
  )
  ON CONFLICT (grade_class, seat_number)
  DO UPDATE SET
    nickname = EXCLUDED.nickname,
    coins_balance = GREATEST(users_global.coins_balance, EXCLUDED.coins_balance),
    purchased_items = ARRAY(SELECT DISTINCT unnest(COALESCE(users_global.purchased_items, '{}'::text[]) || COALESCE(EXCLUDED.purchased_items, '{}'::text[]))),
    equipped_avatar = EXCLUDED.equipped_avatar,
    equipped_border = EXCLUDED.equipped_border,
    equipped_badges = ARRAY(SELECT DISTINCT unnest(COALESCE(users_global.equipped_badges, '{}'::text[]) || COALESCE(EXCLUDED.equipped_badges, '{}'::text[]))),
    unlocked_assets = ARRAY(SELECT DISTINCT unnest(COALESCE(users_global.unlocked_assets, '{}'::text[]) || COALESCE(EXCLUDED.unlocked_assets, '{}'::text[]))),
    integrity_hash = EXCLUDED.integrity_hash,
    updated_at = NOW()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
