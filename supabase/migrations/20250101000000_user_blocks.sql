/*
  # ユーザー間ブロック機能の実装

  1. 新しいテーブル
    - `user_blocks`
      - `id` (uuid, primary key)
      - `blocker_id` (uuid) - ブロックしたユーザーのID
      - `blocked_id` (uuid) - ブロックされたユーザーのID
      - `created_at` (timestamp) - ブロック日時
      - ユニーク制約: (blocker_id, blocked_id)

  2. セキュリティ
    - RLSを有効化
    - ブロック情報は本人のみ読み取り可能
    - ブロックは本人のみ作成・削除可能
*/

CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES auth.users ON DELETE CASCADE,
  blocked_id uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- ブロック情報は本人のみ読み取り可能
CREATE POLICY "ブロック情報は本人のみ読み取り可能"
  ON user_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

-- ブロックは本人のみ作成可能
CREATE POLICY "ブロックは本人のみ作成可能"
  ON user_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- ブロックは本人のみ削除可能
CREATE POLICY "ブロックは本人のみ削除可能"
  ON user_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id); 