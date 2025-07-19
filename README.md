# かんじょうにっき掲示板

X（旧Twitter）風のデザインで作られた、かんじょうにっきアプリ連携掲示板です。公開された日記を閲覧し、コメントでコミュニケーションを取ることができます。

## 🚀 機能

### 基本機能
- 📖 公開日記の一覧表示（X風タイムライン）
- 💬 各日記へのコメント機能
- ✏️ 本人による日記の編集・削除
- 👤 匿名/実名の選択
- 🔐 Googleログイン認証
- 📱 完全レスポンシブ対応

### 管理者機能
- 👥 ユーザー管理（ブロック/解除）
- 📝 投稿管理（削除）
- 📢 管理者スレッド作成
- 🔍 検索・フィルター機能

### デザイン特徴
- 🎨 X（旧Twitter）風のクリーンなUI
- ⚡ スムーズなアニメーション
- 🌐 Inter フォントによる読みやすいテキスト
- 📐 モダンなカードレイアウト

## 🛠️ 技術スタック

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth (Google OAuth)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite

## 📋 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成

2. マイグレーションの実行:
```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# プロジェクトを初期化
supabase init

# マイグレーションを実行
supabase db push
```

3. Google OAuth認証を設定:
   - Supabase Dashboard → Authentication → Providers
   - Google を有効化
   - Google Cloud Console でOAuth 2.0 クライアントIDを作成
   - リダイレクトURIを設定: `https://your-project.supabase.co/auth/v1/callback`

4. 管理者権限の設定:
```sql
-- 管理者として設定したいユーザーのメールアドレスを指定
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```

### 3. 環境変数の設定

```bash
# .envファイルを作成
cp .env.example .env
```

`.env`ファイルを編集:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

## 📊 データベーススキーマ

### profiles テーブル
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,              -- auth.users.id と連携
  email text,                       -- メールアドレス
  display_name text,                -- 表示名
  avatar_url text,                  -- アバターURL
  is_admin boolean DEFAULT false,   -- 管理者フラグ
  is_blocked boolean DEFAULT false, -- ブロック状態
  created_at timestamptz DEFAULT now()
);
```

### diary テーブル（既存）
```sql
CREATE TABLE diary (
  id uuid PRIMARY KEY,
  user_id uuid,                     -- auth.users.id
  nickname text,                    -- 表示名
  content text,                     -- 日記内容
  emotion text,                     -- 感情（絵文字）
  created_at timestamptz,           -- 作成日時
  is_public boolean                 -- 公開フラグ
);
```

### comments テーブル
```sql
CREATE TABLE comments (
  id uuid PRIMARY KEY,
  diary_id uuid,                    -- diary.id への外部キー
  user_id uuid,                     -- auth.users.id
  nickname text,                    -- 表示名（匿名可能）
  content text NOT NULL,            -- コメント内容
  created_at timestamptz DEFAULT now()
);
```

## 🎨 デザインシステム

### カラーパレット
- **Primary**: Black (#000000)
- **Secondary**: Gray (#6B7280)
- **Background**: White (#FFFFFF)
- **Border**: Light Gray (#E5E7EB)
- **Accent**: Blue (#3B82F6)
- **Error**: Red (#EF4444)

### タイポグラフィ
- **Font Family**: Inter, system fonts
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### コンポーネント
- **Cards**: 角丸、ソフトシャドウ、ホバーエフェクト
- **Buttons**: 角丸、グラデーション、アニメーション
- **Forms**: クリーンなボーダー、フォーカス状態

## 👨‍💼 管理者機能

### 管理者権限の付与
Supabaseの`profiles`テーブルで`is_admin`を`true`に設定:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

### 利用可能な機能
- **ユーザー管理**: ブロック/解除
- **投稿管理**: 不適切な投稿の削除
- **スレッド作成**: 管理者からのお知らせ投稿
- **検索機能**: ユーザー・投稿の検索

## 🔒 セキュリティ

### Row Level Security (RLS)
- 適切なアクセス制御を実装
- ユーザーは自分のデータのみ編集可能
- 管理者は必要な権限のみ付与

### 認証
- Google OAuth による安全な認証
- JWTトークンによるセッション管理

### データ保護
- XSS対策済みのコンテンツ表示
- SQLインジェクション対策
- CSRF対策

### 本番環境セキュリティチェックリスト
- [ ] 環境変数を使用して認証情報を管理
- [ ] Supabase RLSポリシーが適切に設定されている
- [ ] HTTPS通信を強制
- [ ] 適切なCORS設定
- [ ] レート制限の実装
- [ ] ログ監視の設定
- [ ] バックアップ戦略の確立

## 🚀 デプロイ

### Netlify
```bash
npm run build
# distフォルダをNetlifyにデプロイ
```

### Vercel
```bash
npm run build
# distフォルダをVercelにデプロイ
```

### 環境変数の設定
デプロイ先で以下の環境変数を設定:
- `VITE_SUPABASE_URL` - SupabaseプロジェクトのURL
- `VITE_SUPABASE_ANON_KEY` - Supabaseの匿名キー

**重要**: 本番環境では必ず環境変数を使用し、ハードコードされた認証情報は使用しないでください。

## 🔄 かんじょうにっきアプリとの連携

### 自動同期
- 同じSupabaseプロジェクトを使用
- `is_public: true`の日記が自動で表示
- リアルタイム更新対応

### データ整合性
- 同じユーザーIDでの認証
- 一貫したデータスキーマ
- 適切な外部キー制約

## 🤝 開発に参加

1. リポジトリをフォーク
2. 機能ブランチを作成: `git checkout -b feature/new-feature`
3. 変更をコミット: `git commit -am 'Add new feature'`
4. ブランチにプッシュ: `git push origin feature/new-feature`
5. プルリクエストを作成

## 📞 サポート

### よくある問題

**Q: ログインできない**
A: Google OAuth設定とリダイレクトURIを確認してください

**Q: 投稿が表示されない**
A: `is_public: true`に設定されているか確認してください

**Q: 管理者機能が使えない**
A: `profiles.is_admin`が`true`に設定されているか確認してください

### トラブルシューティング
1. ブラウザのコンソールエラーを確認
2. Supabaseの接続状態を確認
3. 環境変数の設定を確認
4. ネットワーク接続を確認

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔄 更新履歴

### v1.0.0 (2024-01-XX)
- 初回リリース
- X風デザインの実装
- 基本的な掲示板機能
- コメント機能
- 管理者機能
- Google認証

---

**Note**: このアプリは「かんじょうにっき」アプリとの連携を前提として設計されています。同じSupabaseプロジェクトを使用することで、シームレスなデータ連携が可能です。