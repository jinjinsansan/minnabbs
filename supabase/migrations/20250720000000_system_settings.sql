-- システム設定テーブルの作成
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 管理者のみが読み書き可能
CREATE POLICY "管理者のみがシステム設定を読み書き可能"
  ON system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 初期設定を挿入
INSERT INTO system_settings (key, value, description) VALUES
  ('allow_new_registration', 'true', '新規ユーザー登録を許可'),
  ('allow_anonymous_posts', 'true', '匿名投稿を許可')
ON CONFLICT (key) DO NOTHING; 