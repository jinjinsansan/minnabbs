/*
  # 日記テーブルの作成

  1. 新しいテーブル
    - `diary`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - auth.usersへの外部キー
      - `nickname` (text) - 表示名（匿名可能）
      - `content` (text) - 日記内容
      - `emotion` (text) - 感情
      - `created_at` (timestamp) - 作成日時
      - `is_public` (boolean) - 公開フラグ

  2. セキュリティ
    - RLSを有効化
    - 基本的なポリシーを設定（詳細は後続のマイグレーションで更新）
*/

CREATE TABLE IF NOT EXISTS diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  nickname text,
  content text,
  emotion text,
  created_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false
);

ALTER TABLE diary ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシー（後続のマイグレーションで詳細化される）
CREATE POLICY "公開日記は誰でも読める"
  ON diary
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "日記は本人のみ作成可能"
  ON diary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);