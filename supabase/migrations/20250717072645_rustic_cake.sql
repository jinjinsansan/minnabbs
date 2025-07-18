/*
  # プロフィールテーブルの作成

  1. 新しいテーブル
    - `profiles`
      - `id` (uuid, primary key) - auth.usersと連携
      - `email` (text) - メールアドレス
      - `display_name` (text) - 表示名
      - `avatar_url` (text) - アバターURL
      - `is_admin` (boolean) - 管理者フラグ
      - `is_blocked` (boolean) - ブロック状態
      - `created_at` (timestamp) - 作成日時

  2. セキュリティ
    - RLSを有効化
    - 認証済みユーザーが自分のプロフィールを読み書き可能
    - 全ユーザーが他のプロフィールを読み取り可能
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  display_name text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールは誰でも読める
CREATE POLICY "プロフィールは誰でも読める"
  ON profiles
  FOR SELECT
  USING (true);

-- プロフィールは本人のみ更新可能
CREATE POLICY "プロフィールは本人のみ更新可能"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- プロフィールは本人のみ挿入可能
CREATE POLICY "プロフィールは本人のみ挿入可能"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);