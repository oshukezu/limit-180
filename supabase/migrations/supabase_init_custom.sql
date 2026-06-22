-- 擴充 users_global 表的 SQL 結構，以支援特工客製化外觀 (頭像、外框與徽章)
-- 請複製以下 SQL 語句並在您的 Supabase SQL Editor 中運行：

-- 1. 新增當前配戴的頭像 ID
ALTER TABLE users_global ADD COLUMN IF NOT EXISTS equipped_avatar TEXT DEFAULT 'avatar-default';

-- 2. 新增當前配戴的頭貼外框 ID
ALTER TABLE users_global ADD COLUMN IF NOT EXISTS equipped_border TEXT DEFAULT 'border-none';

-- 3. 新增當前配戴的徽章 ID 陣列 (上限為 2)
ALTER TABLE users_global ADD COLUMN IF NOT EXISTS equipped_badges TEXT[] DEFAULT '{}';

-- 4. 新增已解鎖擁有的外觀資產清單 (頭像與頭貼框，包含購買或代碼兌換獲得的)
ALTER TABLE users_global ADD COLUMN IF NOT EXISTS unlocked_assets TEXT[] DEFAULT '{"avatar-default", "border-none"}';
