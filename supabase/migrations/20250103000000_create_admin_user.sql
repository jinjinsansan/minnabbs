/*
  # 管理者ユーザーの作成

  1. 管理者用のSupabase認証ユーザーを作成
  2. 管理者プロフィールをprofilesテーブルに挿入
  3. 管理者権限を設定

  注意: このマイグレーションは一度だけ実行してください
*/

-- 管理者用のSupabase認証ユーザーを作成
-- 注意: 実際の運用では、より安全なパスワードを使用してください
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'jin@namisapo.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "管理者"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 管理者のプロフィールを作成
INSERT INTO profiles (
  id,
  email,
  display_name,
  avatar_url,
  is_admin,
  created_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'jin@namisapo.com'),
  'jin@namisapo.com',
  '管理者',
  null,
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  display_name = '管理者';

-- コメント削除に管理者権限を追加
DROP POLICY IF EXISTS "コメントは本人のみ削除可能" ON comments;

CREATE POLICY "コメントは本人または管理者のみ削除可能"
  ON comments
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  ); 