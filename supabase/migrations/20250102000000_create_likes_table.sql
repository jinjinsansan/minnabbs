/*
  # いいね機能の実装

  1. 新しいテーブル
    - `likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - いいねしたユーザーのID
      - `diary_id` (uuid) - いいねされた日記のID
      - `created_at` (timestamp) - いいね日時
      - ユニーク制約: (user_id, diary_id)

  2. セキュリティ
    - RLSを有効化
    - いいね情報は誰でも読み取り可能
    - いいねは認証済みユーザーのみ作成・削除可能
*/

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  diary_id uuid REFERENCES diary ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, diary_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- いいね情報は誰でも読み取り可能
CREATE POLICY "いいね情報は誰でも読み取り可能"
  ON likes
  FOR SELECT
  USING (true);

-- いいねは認証済みユーザーのみ作成可能
CREATE POLICY "いいねは認証済みユーザーのみ作成可能"
  ON likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- いいねは本人のみ削除可能
CREATE POLICY "いいねは本人のみ削除可能"
  ON likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_diary_id ON likes(diary_id); 