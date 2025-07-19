import React, { useState, useEffect } from 'react'
import { X, User, Mail, Calendar, Globe, MapPin, Heart, MessageCircle, Ban, UnlockKeyhole } from 'lucide-react'
import { supabase, Database } from '../lib/supabase'
import { formatDate } from '../utils/dateUtils'
import ElegantHeart from './ElegantHeart'
import { useBlock } from '../hooks/useBlock'
import { useAuth } from '../hooks/useAuth'

type DiaryEntry = Database['public']['Tables']['diary']['Row']

interface UserProfile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  bio?: string | null
  website?: string | null
  location?: string | null
  is_admin: boolean | null
  created_at: string
}

interface UserProfilePageProps {
  userId: string
  onClose: () => void
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'diaries'>('profile')
  const { isBlocked, toggleBlock, loading: blockLoading } = useBlock()
  const { user } = useAuth()

  // ブロックされたユーザーのプロフィールページにアクセスできないようにする
  useEffect(() => {
    if (user && isBlocked(userId)) {
      onClose()
    }
  }, [user, userId, isBlocked, onClose])

  useEffect(() => {
    fetchUserProfile()
    fetchUserDiaries()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchUserDiaries = async () => {
    try {
      const { data, error } = await supabase
        .from('diary')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiaries(data || [])
    } catch (error) {
      console.error('Error fetching user diaries:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">プロフィールを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="modal-overlay">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">ユーザーが見つかりません</h2>
            <p className="text-gray-600 mb-6">指定されたユーザーは存在しないか、削除された可能性があります。</p>
            <button
              onClick={onClose}
              className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-600 transition-all duration-200"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {profile.display_name || '匿名'}さんのプロフィール
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-all duration-200 hover:shadow-md"
          >
            <X className="w-5 h-5 text-purple-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-purple-200 bg-white/70 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>基本情報</span>
          </button>
          <button
            onClick={() => setActiveTab('diaries')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-medium transition-colors ${
              activeTab === 'diaries'
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>投稿一覧 ({diaries.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] bg-white/30 backdrop-blur-sm">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-white/80 to-purple-50/80 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.display_name || 'ユーザー'} 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {(profile.display_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {profile.display_name || '匿名'}
                    </h3>
                    <p className="text-gray-600 font-medium">
                      @{(profile.display_name || 'anonymous').toLowerCase().replace(/\s+/g, '')}
                    </p>
                    {profile.is_admin && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        管理者
                      </span>
                    )}
                  </div>
                  
                  {/* Block Button */}
                  {user && user.id !== userId && (
                    <button
                      onClick={async () => {
                        const success = await toggleBlock(userId)
                        if (success) {
                          // ブロックした場合はプロフィールページを閉じる
                          if (isBlocked(userId)) {
                            onClose()
                          }
                        }
                      }}
                      disabled={blockLoading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                        isBlocked(userId)
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {blockLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isBlocked(userId) ? (
                        <UnlockKeyhole className="w-4 h-4" />
                      ) : (
                        <Ban className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {isBlocked(userId) ? 'ブロック解除' : 'ブロック'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="mb-6">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Profile Info */}
                <div className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">メール:</span>
                      <span className="text-gray-800 font-medium">{profile.email}</span>
                    </div>
                  )}
                  
                  {profile.website && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Globe className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">ウェブサイト:</span>
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="flex items-center space-x-3 text-sm">
                      <MapPin className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">場所:</span>
                      <span className="text-gray-800 font-medium">{profile.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-600">登録日:</span>
                    <span className="text-gray-800 font-medium">
                      {formatDate(new Date(profile.created_at))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diaries' && (
            <div className="space-y-4">
              {diaries.length > 0 ? (
                diaries.map((diary) => (
                  <div key={diary.id} className="bg-white/80 rounded-2xl p-4 border border-purple-200/50 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <ElegantHeart className="text-white" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500">
                            {diary.created_at && new Date(diary.created_at).toLocaleDateString('ja-JP')}
                          </span>
                          {diary.emotion && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {diary.emotion}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed line-clamp-3">
                          {diary.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white/80 rounded-2xl border border-purple-200/50">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    まだ投稿がありません
                  </h3>
                  <p className="text-gray-500">
                    このユーザーはまだ日記を投稿していません。
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfilePage 