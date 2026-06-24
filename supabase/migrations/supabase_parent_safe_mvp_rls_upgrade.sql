-- 家長安心 MVP RLS 增量修正
-- 用途：如果已執行過舊版 supabase_parent_safe_mvp.sql，只需再執行本檔解除分享碼/入團流程被 RLS 擋住的問題。

drop policy if exists class_share_codes_select_owner on class_share_codes;
create policy class_share_codes_select_owner on class_share_codes
for select using (true);

drop policy if exists class_share_codes_insert_owner on class_share_codes;
create policy class_share_codes_insert_owner on class_share_codes
for insert with check (true);

drop policy if exists class_share_codes_update_owner on class_share_codes;
create policy class_share_codes_update_owner on class_share_codes
for update using (true)
with check (true);

drop policy if exists class_share_codes_delete_owner on class_share_codes;
create policy class_share_codes_delete_owner on class_share_codes
for delete using (true);

drop policy if exists classes_public_select_mvp on classes;
create policy classes_public_select_mvp on classes
for select using (true);

drop policy if exists classes_public_insert_mvp on classes;
create policy classes_public_insert_mvp on classes
for insert with check (true);

drop policy if exists class_members_public_select_mvp on class_members;
create policy class_members_public_select_mvp on class_members
for select using (true);

drop policy if exists class_members_public_insert_mvp on class_members;
create policy class_members_public_insert_mvp on class_members
for insert with check (true);

drop policy if exists class_members_public_update_mvp on class_members;
create policy class_members_public_update_mvp on class_members
for update using (true)
with check (true);
