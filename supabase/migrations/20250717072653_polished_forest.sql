/*
  # コメントテーブルの作成

  1. 新しいテーブル
    - `comments`
      - `id` (uuid, primary key)
      - `diary_id` (uuid) - 日記への外部キー
      - `user_id` (uuid) - ユーザーへの外部キー
      - `nickname` (text) - 表示名（匿名可能）
      - `content` (text) - コメント内容
      - `created_at` (timestamp) - 作成日時

  2. セキュリティ
    - RLSを有効化
    - コメントは誰でも読める
    - 認証済みユーザーがコメント作成可能
    - 本人のみコメント更新・削除可能
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id uuid REFERENCES diary ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  nickname text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- コメントは誰でも読める
CREATE POLICY "コメントは誰でも読める"
  ON comments
  FOR SELECT
  USING (true);

-- コメントは認証済みユーザーが作成可能
CREATE POLICY "コメントは認証済みユーザーが作成可能"
  ON comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- コメントは本人のみ更新可能
CREATE POLICY "コメントは本人のみ更新可能"
  ON comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- コメントは本人のみ削除可能
CREATE POLICY "コメントは本人のみ削除可能"
  ON comments
  FOR DELETE
  USING (auth.uid() = user_id);