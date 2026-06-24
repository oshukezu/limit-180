-- 家長安心遊戲 MVP：班群/統計/聊天/敏感詞/稽核
-- 建議在 staging 先執行驗證，再套正式環境

create extension if not exists pgcrypto;

-- 1) 班群與成員
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id text not null,
  invite_code_hash text not null unique,
  invite_code_expire_at timestamptz null,
  invite_code_max_uses int null,
  invite_code_used_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists class_members (
  id bigserial primary key,
  class_id uuid not null references classes(id) on delete cascade,
  user_id text not null,
  role text not null default 'member' check (role in ('owner','member')),
  status text not null default 'active' check (status in ('active','removed')),
  joined_at timestamptz not null default now(),
  removed_at timestamptz null,
  unique(class_id, user_id)
);

create index if not exists idx_class_members_class_role on class_members(class_id, role);
create unique index if not exists uq_class_single_owner on class_members(class_id) where role = 'owner' and status = 'active';

-- 2) 遊玩與休息鎖
create table if not exists game_sessions (
  id bigserial primary key,
  user_id text not null,
  class_id uuid null references classes(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz null,
  duration_seconds int null,
  reward_eligible boolean not null default true,
  reward_block_reason text not null default 'none' check (reward_block_reason in ('none','night_time','rest_mode')),
  created_at timestamptz not null default now()
);
create index if not exists idx_game_sessions_user_started_at on game_sessions(user_id, started_at desc);

create table if not exists user_rest_locks (
  user_id text primary key,
  lock_start_at timestamptz not null,
  lock_end_at timestamptz not null,
  source_session_id bigint null references game_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_rest_locks_lock_end_at on user_rest_locks(lock_end_at);

-- 3) 每日統計
create table if not exists daily_learning_stats (
  id bigserial primary key,
  user_id text not null,
  stat_date date not null,
  play_minutes int not null default 0,
  solved_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, stat_date)
);

create table if not exists daily_wrong_type_stats (
  id bigserial primary key,
  user_id text not null,
  stat_date date not null,
  error_type text not null,
  error_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, stat_date, error_type)
);

-- 4) 聊天與 30 天清除
create table if not exists chat_messages (
  id bigserial primary key,
  class_id uuid not null references classes(id) on delete cascade,
  user_id text not null,
  content_raw text not null,
  content_masked text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);
create index if not exists idx_chat_messages_class_created_at on chat_messages(class_id, created_at desc);
create index if not exists idx_chat_messages_created_at on chat_messages(created_at);

-- 5) 敏感詞與稽核
create table if not exists sensitive_words (
  id bigserial primary key,
  pattern text not null,
  severity text not null default 'low' check (severity in ('low','high')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sensitive_words_enabled on sensitive_words(enabled);

create table if not exists moderation_logs (
  id bigserial primary key,
  target_type text not null check (target_type in ('nickname','chat','operation')),
  target_id text null,
  user_id text not null,
  class_id uuid null references classes(id) on delete set null,
  matched_rule_id bigint null references sensitive_words(id) on delete set null,
  action text not null check (action in ('masked','blocked','delete_message','remove_member','transfer_owner','reset_invite_code')),
  metadata_json jsonb null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_moderation_logs_class_created_at on moderation_logs(class_id, created_at desc);

-- 6) 實用函式：夜間判斷（22:00~08:00）
create or replace function is_night_reward_blocked(p_ts timestamptz default now())
returns boolean
language sql
stable
as $$
  select (extract(hour from p_ts at time zone 'Asia/Taipei') >= 22)
      or (extract(hour from p_ts at time zone 'Asia/Taipei') < 8);
$$;

-- 7) 實用函式：30 天聊天刪除（排程可呼叫）
create or replace function purge_expired_chat_messages()
returns bigint
language plpgsql
as $$
declare
  v_count bigint;
begin
  delete from chat_messages
   where created_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 8) 開啟 RLS（MVP 先鎖住，後續再補精細 policy）
alter table classes enable row level security;
alter table class_members enable row level security;
alter table game_sessions enable row level security;
alter table user_rest_locks enable row level security;
alter table daily_learning_stats enable row level security;
alter table daily_wrong_type_stats enable row level security;
alter table chat_messages enable row level security;
alter table sensitive_words enable row level security;
alter table moderation_logs enable row level security;

-- 9) 開團分享碼（5 位英數）
create table if not exists class_share_codes (
  id bigserial primary key,
  owner_grade_class text not null,
  owner_seat_number text not null,
  owner_nickname text not null,
  class_name text not null,
  share_code text not null unique check (share_code ~ '^[A-Z0-9]{5}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_class_share_codes_owner on class_share_codes(owner_grade_class, owner_seat_number);
create index if not exists idx_class_share_codes_active on class_share_codes(is_active);
alter table class_share_codes enable row level security;

create or replace function gen_share_code_5()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out_code text := '';
  i int;
begin
  for i in 1..5 loop
    out_code := out_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return out_code;
end;
$$;

create or replace function fill_class_share_code()
returns trigger
language plpgsql
as $$
begin
  if new.share_code is null or length(trim(new.share_code)) = 0 then
    new.share_code := gen_share_code_5();
  end if;
  new.share_code := upper(new.share_code);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fill_class_share_code on class_share_codes;
create trigger trg_fill_class_share_code
before insert or update on class_share_codes
for each row
execute function fill_class_share_code();

-- 10) RLS 細粒度 helper
create or replace function is_class_member(p_class_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from class_members cm
    where cm.class_id = p_class_id
      and cm.user_id = auth.uid()::text
      and cm.status = 'active'
  );
$$;

create or replace function is_class_owner(p_class_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from class_members cm
    where cm.class_id = p_class_id
      and cm.user_id = auth.uid()::text
      and cm.status = 'active'
      and cm.role = 'owner'
  );
$$;

-- 11) 細粒度 Policies（先刪再建，避免重複）
drop policy if exists classes_select_member on classes;
create policy classes_select_member on classes
for select using (is_class_member(id));

drop policy if exists classes_update_owner on classes;
create policy classes_update_owner on classes
for update using (is_class_owner(id))
with check (is_class_owner(id));

drop policy if exists class_members_select_member on class_members;
create policy class_members_select_member on class_members
for select using (is_class_member(class_id));

drop policy if exists class_members_insert_owner on class_members;
create policy class_members_insert_owner on class_members
for insert with check (is_class_owner(class_id));

drop policy if exists class_members_update_owner on class_members;
create policy class_members_update_owner on class_members
for update using (is_class_owner(class_id))
with check (is_class_owner(class_id));

drop policy if exists class_members_delete_owner on class_members;
create policy class_members_delete_owner on class_members
for delete using (is_class_owner(class_id));

drop policy if exists game_sessions_select_self on game_sessions;
create policy game_sessions_select_self on game_sessions
for select using (user_id = auth.uid()::text);

drop policy if exists game_sessions_insert_self on game_sessions;
create policy game_sessions_insert_self on game_sessions
for insert with check (user_id = auth.uid()::text);

drop policy if exists game_sessions_update_self on game_sessions;
create policy game_sessions_update_self on game_sessions
for update using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists user_rest_locks_select_self on user_rest_locks;
create policy user_rest_locks_select_self on user_rest_locks
for select using (user_id = auth.uid()::text);

drop policy if exists user_rest_locks_insert_self on user_rest_locks;
create policy user_rest_locks_insert_self on user_rest_locks
for insert with check (user_id = auth.uid()::text);

drop policy if exists user_rest_locks_update_self on user_rest_locks;
create policy user_rest_locks_update_self on user_rest_locks
for update using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists daily_learning_stats_select_self on daily_learning_stats;
create policy daily_learning_stats_select_self on daily_learning_stats
for select using (user_id = auth.uid()::text);

drop policy if exists daily_wrong_type_stats_select_self on daily_wrong_type_stats;
create policy daily_wrong_type_stats_select_self on daily_wrong_type_stats
for select using (user_id = auth.uid()::text);

drop policy if exists chat_messages_select_member on chat_messages;
create policy chat_messages_select_member on chat_messages
for select using (is_class_member(class_id));

drop policy if exists chat_messages_insert_member on chat_messages;
create policy chat_messages_insert_member on chat_messages
for insert with check (is_class_member(class_id) and user_id = auth.uid()::text);

drop policy if exists chat_messages_delete_owner_or_self on chat_messages;
create policy chat_messages_delete_owner_or_self on chat_messages
for delete using (is_class_owner(class_id) or user_id = auth.uid()::text);

drop policy if exists moderation_logs_select_owner on moderation_logs;
create policy moderation_logs_select_owner on moderation_logs
for select using (class_id is not null and is_class_owner(class_id));

drop policy if exists class_share_codes_select_owner on class_share_codes;
create policy class_share_codes_select_owner on class_share_codes
for select using (owner_nickname = auth.jwt() ->> 'nickname');

drop policy if exists class_share_codes_insert_owner on class_share_codes;
create policy class_share_codes_insert_owner on class_share_codes
for insert with check (owner_nickname = auth.jwt() ->> 'nickname');

drop policy if exists class_share_codes_update_owner on class_share_codes;
create policy class_share_codes_update_owner on class_share_codes
for update using (owner_nickname = auth.jwt() ->> 'nickname')
with check (owner_nickname = auth.jwt() ->> 'nickname');

drop policy if exists class_share_codes_delete_owner on class_share_codes;
create policy class_share_codes_delete_owner on class_share_codes
for delete using (owner_nickname = auth.jwt() ->> 'nickname');
