import React, { useState } from 'react'
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface AdminLoginProps {
  onLogin: (isAdmin: boolean) => void
  onClose: () => void
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { loginAsAdmin } = useAuth()

  // 管理者アカウント情報
  const ADMIN_CREDENTIALS = {
    email: 'jin@namisapo.com',
    password: 'counselor123'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('Admin login attempt:', { email, password })

    try {
      // 認証チェック
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        console.log('Admin credentials valid, calling loginAsAdmin')
        // ログイン成功
        loginAsAdmin()
        console.log('loginAsAdmin called, calling onLogin(true)')
        onLogin(true)
      } else {
        console.log('Admin credentials invalid')
        setError('メールアドレスまたはパスワードが正しくありません')
      }
    } catch (error) {
      console.error('Admin login error:', error)
      setError('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl max-w-md w-full shadow-2xl border-2 border-purple-200/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">管理者ログイン</h2>
          </div>
          <p className="text-purple-100 text-center text-sm font-medium">
            管理画面にアクセスするにはログインが必要です
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-purple-800 mb-3">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-200 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-purple-400"
                  placeholder="jin@namisapo.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-purple-800 mb-3">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border-2 border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-200 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-purple-400"
                  placeholder="パスワードを入力"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/70 text-purple-700 px-6 py-4 rounded-2xl font-semibold hover:bg-white transition-all duration-200 border-2 border-purple-200/50 shadow-md hover:shadow-lg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'ログイン'
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-800 font-semibold mb-1">管理者権限について</p>
                <p className="text-blue-700 font-medium">
                  管理画面では投稿の管理、ユーザーの管理、システム設定などが行えます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin