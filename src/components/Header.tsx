import React, { useState } from 'react'
import { Shield, Settings, Menu, X, ExternalLink, LogIn, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import AdminLogin from './AdminLogin'
import ElegantHeart from './ElegantHeart'

// ランダムなハートカラーを取得
const getRandomHeartColor = () => {
  const colors = [
    'text-purple-500',
    'text-blue-500', 
    'text-red-500',
    'text-green-500',
    'text-gray-500',
    'text-orange-500',
    'text-indigo-500',
    'text-pink-500'
  ]
  
  const index = Math.floor(Math.random() * colors.length)
  return colors[index]
}

interface HeaderProps {
  onAdminClick?: () => void
  onProfileClick?: () => void
}

const Header: React.FC<HeaderProps> = ({ onAdminClick, onProfileClick }) => {
  const { user, profile, loginAsAdmin, logout, signInWithGoogle, signOut } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleAdminLogin = (isAdmin: boolean) => {
    if (isAdmin) {
      loginAsAdmin()
      setShowAdminLogin(false)
    }
  }

  const handleLogout = () => {
    signOut()
    setShowMobileMenu(false)
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in failed:', error)
      alert('Googleログインに失敗しました')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <>
      <header className="bg-gradient-to-r from-white/95 to-purple-50/95 backdrop-blur-md border-b-2 border-purple-200/50 sticky top-0 z-40 shadow-xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white/50 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 transform">
              <ElegantHeart className="text-white" size="lg" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
              みんなの日記
            </h1>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent sm:hidden">
              みんなの日記
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={onProfileClick}
                  className="flex items-center space-x-3 bg-gradient-to-r from-white/80 to-purple-50/80 rounded-2xl px-4 py-3 hover:from-white hover:to-purple-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-purple-200/50"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200/50 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="プロフィール"
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <ElegantHeart className={getRandomHeartColor()} size="md" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-semibold bg-gradient-to-r from-gray-800 to-purple-800 bg-clip-text text-transparent">
                        {profile?.display_name || '匿名'}
                      </span>
                      {profile?.is_admin && (
                        <Shield className="w-4 h-4 text-yellow-500" title="管理者" />
                      )}
                    </div>
                    <span className="text-xs text-purple-600/70 font-medium">
                      @{profile?.display_name?.toLowerCase().replace(/\s+/g, '') || 'anonymous'}
                    </span>
                  </div>
                </button>
                
                {profile?.is_admin && (
                  <button
                    onClick={onAdminClick}
                    className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">管理</span>
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">ログアウト</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {isSigningIn ? 'ログイン中...' : 'Googleでログイン'}
                </span>
              </button>
            )}
            
            {/* 管理者ログインボタン（通常ユーザーがログイン済みの場合のみ表示） */}
            {user && !profile?.is_admin && (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center space-x-2 px-4 py-2 text-orange-600 hover:text-orange-800 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">管理者</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-xl hover:bg-purple-100/50 transition-all duration-200 text-purple-600 hover:text-purple-700 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-purple-200/50 py-4 bg-gradient-to-r from-white/90 to-purple-50/90 backdrop-blur-md">
            <div className="space-y-4 px-4">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      onProfileClick?.()
                      setShowMobileMenu(false)
                    }}
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors w-full text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-50 border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="プロフィール"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <ElegantHeart className={getRandomHeartColor()} size="md" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-900">
                          {profile?.display_name || '匿名'}
                        </span>
                        {profile?.is_admin && (
                          <Shield className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        @{profile?.display_name?.toLowerCase().replace(/\s+/g, '') || 'anonymous'}
                      </span>
                    </div>
                  </button>
                  
                  {profile?.is_admin && (
                    <button
                      onClick={() => {
                        onAdminClick?.()
                        setShowMobileMenu(false)
                      }}
                      className="nav-item w-full text-left"
                    >
                      <Settings className="w-5 h-5" />
                      <span>管理画面</span>
                    </button>
                  )}
                  
                  {!profile?.is_admin && (
                    <button
                      onClick={() => {
                        setShowAdminLogin(true)
                        setShowMobileMenu(false)
                      }}
                      className="nav-item w-full text-left"
                    >
                      <Shield className="w-5 h-5" />
                      <span>管理者ログイン</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">ログアウト</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleGoogleSignIn()
                    setShowMobileMenu(false)
                  }}
                  disabled={isSigningIn}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                >
                  {isSigningIn ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {isSigningIn ? 'ログイン中...' : 'Googleでログイン'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </header>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onClose={() => setShowAdminLogin(false)}
        />
      )}
    </>
  )
}

export default Header