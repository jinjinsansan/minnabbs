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

-- プロフィールテーブルに新しいカラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 更新時のタイムスタンプを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Supabase Storageのバケットを作成（手動で実行する必要があります）
-- 以下のコマンドをSupabase DashboardのSQL Editorで実行してください：
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- アバター画像のRLSポリシー
CREATE POLICY "アバター画像は誰でも閲覧可能" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "認証済みユーザーのみアバターアップロード可能" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "自分のアバターのみ削除可能" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);