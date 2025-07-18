/*
  # 日記テーブルのRLSポリシー更新

  1. セキュリティポリシー
    - 公開日記は誰でも読める
    - 日記は本人のみ作成可能
    - 日記は本人のみ更新可能
    - 日記は本人のみ削除可能
    - 管理者は全ての日記を管理可能

  2. 注意事項
    - 既存のdiaryテーブルにRLSが設定されていない場合は有効化
    - 管理者権限の確認にはprofilesテーブルを参照
*/

-- RLSを有効化（既に有効な場合はエラーにならない）
ALTER TABLE diary ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在しない場合はエラーにならない）
DROP POLICY IF EXISTS "公開日記は誰でも読める" ON diary;
DROP POLICY IF EXISTS "日記は本人のみ作成可能" ON diary;
DROP POLICY IF EXISTS "日記は本人のみ更新可能" ON diary;
DROP POLICY IF EXISTS "日記は本人のみ削除可能" ON diary;

-- 新しいポリシーを作成
CREATE POLICY "公開日記は誰でも読める"
  ON diary
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "日記は本人のみ作成可能"
  ON diary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "日記は本人または管理者のみ更新可能"
  ON diary
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "日記は本人または管理者のみ削除可能"
  ON diary
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );