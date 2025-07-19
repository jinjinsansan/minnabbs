import React, { useState, useEffect } from 'react'
import { Save, X, User, Mail, Calendar, Shield, Settings, Upload, Trash2, Send, Sparkles, Heart, Star } from 'lucide-react'
import { formatDate } from '../utils/dateUtils'
import ElegantHeart from './ElegantHeart'
import { Database } from '../lib/supabase'

type DiaryEntry = Database['public']['Tables']['diary']['Row']

interface ProfilePageProps {
  onClose: () => void
  onNewPost?: (post: Omit<DiaryEntry, 'id' | 'created_at'>) => void
  user: { id: string; email?: string } | null
  profile: { display_name?: string; avatar_url?: string; email?: string; created_at?: string; is_admin?: boolean } | null
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose, onNewPost, user, profile }) => {

  console.log('ProfilePage - user:', user)
  console.log('ProfilePage - profile:', profile)

  // useStateを最上位で宣言
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  // const [_isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'diary' | 'profile' | 'privacy' | 'notifications'>('diary')
  
  // 日記投稿用の状態
  const [diaryContent, setDiaryContent] = useState('')
  const [insights, setInsights] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [diaryNickname, setDiaryNickname] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // ログインしていない場合はログインを促す
  if (!user) {
    return (
      <div className="modal-overlay">
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl max-w-md w-full shadow-2xl border border-purple-200">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              ログインが必要です
            </h2>
            <p className="text-gray-600 mb-6 font-medium">
              プロフィール設定や日記投稿を行うには、Googleアカウントでログインしてください。
            </p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setAvatarUrl(profile.avatar_url || '')
      setDiaryNickname(profile.display_name || '')
      // 追加のプロフィール情報があれば設定
    }
  }, [profile])

  const handleDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diaryContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const postData = {
        user_id: user?.id || 'anonymous-user',
        nickname: isAnonymous ? null : (diaryNickname.trim() || profile?.display_name || null),
        content: diaryContent.trim() + (insights.trim() ? '\n\n【今日の小さな気づき】\n' + insights.trim() : ''),
        emotion: selectedEmotion || null,
        is_public: true,
        created_at: selectedDate.toISOString()
      }

      if (onNewPost) {
        onNewPost(postData)
      }
      
      // フォームをリセット
      setDiaryContent('')
      setInsights('')
      setSelectedEmotion('')
      setIsAnonymous(false)
      setSelectedDate(new Date())
      
      alert('日記を投稿しました！')
    } catch (error) {
      console.error('Error posting diary:', error)
      alert('投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const updates = {
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl || null,
        // 他のフィールドも保存（実際のSupabase実装時に追加）
      }

      // テスト環境では実際の保存は行わない
      console.log('Profile updates:', updates)
      
      // 成功メッセージ
      alert('プロフィールを更新しました！')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('プロフィールの更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 実際の実装では画像をSupabase Storageにアップロード
      // テスト環境では仮のURLを設定
      const fakeUrl = `https://via.placeholder.com/150/4F46E5/FFFFFF?text=${displayName.charAt(0) || 'U'}`
      setAvatarUrl(fakeUrl)
    }
  }

  const handleDeleteAvatar = () => {
    setAvatarUrl('')
  }

  return (
    <div className="modal-overlay">
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">プロフィール設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-all duration-200 hover:shadow-md"
          >
            <X className="w-5 h-5 text-purple-600" />
          </button>
        </div>

        {/* Tabs - モバイルでスクロール可能 */}
        <div className="flex overflow-x-auto border-b border-purple-200 bg-white/70 backdrop-blur-sm scrollbar-hide">
          <div className="flex min-w-full sm:min-w-0">
            <button
              onClick={() => setActiveTab('diary')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-medium transition-colors whitespace-nowrap min-w-[120px] sm:min-w-0 ${
                activeTab === 'diary'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>日記投稿</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-medium transition-colors whitespace-nowrap min-w-[120px] sm:min-w-0 ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>基本情報</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-medium transition-colors whitespace-nowrap min-w-[120px] sm:min-w-0 ${
                activeTab === 'privacy'
                  ? 'text-green-600 border-b-2 border-green-500 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>プライバシー</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-medium transition-colors whitespace-nowrap min-w-[120px] sm:min-w-0 ${
                activeTab === 'notifications'
                  ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>通知設定</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] bg-white/30 backdrop-blur-sm">
          {/* Diary Tab */}
          {activeTab === 'diary' && (
            <div className="space-y-4 sm:space-y-6">
              {/* 今日の出来事セクション */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">今日の出来事</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                      className="bg-white/70 px-3 py-2 rounded-lg text-sm text-pink-700 border border-pink-200 focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all duration-200 shadow-sm min-h-[44px]"
                    />
                    <div className="bg-white/70 px-3 py-2 rounded-lg text-sm text-pink-700 border border-pink-200 shadow-sm min-h-[44px] flex items-center">
                      {selectedDate.toLocaleDateString('ja-JP', { 
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-pink-600 mb-4 font-medium">今日の出来事を書いてみましょう ✨</p>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full shadow-sm"></div>
                  <textarea
                    value={diaryContent}
                    onChange={(e) => setDiaryContent(e.target.value)}
                    className="w-full pl-6 pr-4 py-4 border-none outline-none resize-none text-base placeholder-pink-400 bg-white/50 rounded-lg min-h-[200px] focus:bg-white/80 transition-all duration-200"
                    placeholder=""
                    maxLength={280}
                  />
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-4 border border-blue-200 shadow-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <span className="text-white text-xs">💡</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">思い出すのがつらい場合は、無理をしないでください。</p>
                      <p className="font-medium">書ける範囲で、あなたのペースで大丈夫です。</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 今日の気持ちセクション */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">今日の気持ち</h3>
                </div>
                <p className="text-sm text-purple-600 mb-6 font-medium">どの気持ちに近いですか？ 🌈</p>
                
                {/* ネガティブな感情 */}
                <div className="mb-6">
                  <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <span className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></span>
                    <span>ネガティブな感情</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'fear', label: '恐怖', color: 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300 text-purple-800 shadow-sm hover:shadow-md' },
                      { id: 'sadness', label: '悲しみ', color: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-800 shadow-sm hover:shadow-md' },
                      { id: 'anger', label: '怒り', color: 'bg-gradient-to-br from-red-100 to-red-200 border-red-300 text-red-800 shadow-sm hover:shadow-md' },
                      { id: 'disgust', label: '悔しい', color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 text-green-800 shadow-sm hover:shadow-md' },
                      { id: 'indifference', label: '無価値感', color: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 text-gray-800 shadow-sm hover:shadow-md' },
                      { id: 'guilt', label: '罪悪感', color: 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 text-orange-800 shadow-sm hover:shadow-md' },
                      { id: 'loneliness', label: '寂しさ', color: 'bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300 text-indigo-800 shadow-sm hover:shadow-md' },
                      { id: 'shame', label: '恥ずかしさ', color: 'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300 text-pink-800 shadow-sm hover:shadow-md' }
                    ].map((emotion) => (
                      <label
                        key={emotion.id}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 min-h-[60px] ${
                          selectedEmotion === emotion.id 
                            ? `${emotion.color} ring-2 ring-offset-2 ring-purple-400 shadow-lg` 
                            : `${emotion.color}`
                        }`}
                      >
                        <input
                          type="radio"
                          name="emotion"
                          value={emotion.id}
                          checked={selectedEmotion === emotion.id}
                          onChange={(e) => setSelectedEmotion(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedEmotion === emotion.id 
                            ? 'border-purple-500 bg-gradient-to-br from-purple-400 to-purple-500 shadow-sm' 
                            : 'border-gray-300 bg-white shadow-sm'
                        }`}>
                          {selectedEmotion === emotion.id && (
                            <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                          )}
                        </div>
                        <span className="font-medium">{emotion.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ポジティブな感情 */}
                <div className="mb-6">
                  <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <span className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></span>
                    <span>ポジティブな感情</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'joy', label: '嬉しい', color: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-800 shadow-sm hover:shadow-md' },
                      { id: 'gratitude', label: '感謝', color: 'bg-gradient-to-br from-teal-100 to-teal-200 border-teal-300 text-teal-800 shadow-sm hover:shadow-md' },
                      { id: 'achievement', label: '達成感', color: 'bg-gradient-to-br from-lime-100 to-lime-200 border-lime-300 text-lime-800 shadow-sm hover:shadow-md' },
                      { id: 'happiness', label: '幸せ', color: 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 text-amber-800 shadow-sm hover:shadow-md' }
                    ].map((emotion) => (
                      <label
                        key={emotion.id}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 min-h-[60px] ${
                          selectedEmotion === emotion.id 
                            ? `${emotion.color} ring-2 ring-offset-2 ring-purple-400 shadow-lg` 
                            : `${emotion.color}`
                        }`}
                      >
                        <input
                          type="radio"
                          name="emotion"
                          value={emotion.id}
                          checked={selectedEmotion === emotion.id}
                          onChange={(e) => setSelectedEmotion(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedEmotion === emotion.id 
                            ? 'border-purple-500 bg-gradient-to-br from-purple-400 to-purple-500 shadow-sm' 
                            : 'border-gray-300 bg-white shadow-sm'
                        }`}>
                          {selectedEmotion === emotion.id && (
                            <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                          )}
                        </div>
                        <span className="font-medium">{emotion.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 今日の小さな気づきセクション */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border-2 border-green-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">今日の小さな気づき</h3>
                </div>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-teal-400 rounded-full shadow-sm"></div>
                  <textarea
                    value={insights}
                    onChange={(e) => setInsights(e.target.value)}
                    className="w-full pl-6 pr-4 py-4 border-none outline-none resize-none text-base placeholder-green-400 bg-white/50 rounded-lg min-h-[120px] focus:bg-white/80 transition-all duration-200"
                    placeholder=""
                    maxLength={280}
                  />
                </div>
              </div>

              {/* 表示名設定と投稿ボタン */}
              <form onSubmit={handleDiarySubmit} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <label className="text-sm font-semibold text-blue-800">
                        表示名
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 shadow-sm w-5 h-5"
                        />
                        <span className="text-sm text-blue-600 font-medium">匿名で投稿</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={diaryNickname}
                      onChange={(e) => setDiaryNickname(e.target.value)}
                      disabled={isAnonymous}
                      className="w-full px-3 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-50/50 disabled:text-blue-400 bg-white/70 shadow-sm min-h-[44px]"
                      placeholder={profile?.display_name || "表示名を入力..."}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-blue-200 space-y-3 sm:space-y-0">
                    <div className="text-sm text-blue-600 font-medium flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>投稿後、掲示板に表示されます</span>
                    </div>
                    <button
                      type="submit"
                      disabled={!diaryContent.trim() || isSubmitting}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 min-h-[48px] w-full sm:w-auto"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      日記を投稿
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-4 sm:p-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-white/70 rounded-2xl p-4 sm:p-6 border border-blue-200 shadow-lg">
                <div className="relative self-center sm:self-start">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="プロフィール画像"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                      <ElegantHeart className="text-white" size="lg" />
                    </div>
                  )}
                  
                  {avatarUrl && (
                    <button
                      onClick={handleDeleteAvatar}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-400 to-red-500 text-white rounded-full flex items-center justify-center hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">プロフィール画像</h3>
                  <p className="text-sm text-blue-600 mb-4 font-medium">
                    JPEGまたはPNG形式、最大5MBまで
                  </p>
                  <label className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-3 rounded-xl font-semibold hover:from-blue-200 hover:to-purple-200 transition-all duration-200 cursor-pointer inline-flex items-center shadow-md hover:shadow-lg transform hover:scale-105 min-h-[48px]">
                    <Upload className="w-4 h-4 mr-2" />
                    画像をアップロード
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4 bg-white/70 rounded-2xl p-4 sm:p-6 border border-blue-200 shadow-lg">
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    表示名 *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 shadow-sm min-h-[44px]"
                    placeholder="表示名を入力してください"
                    maxLength={50}
                    required
                  />
                  <p className="text-xs text-blue-500 mt-1 font-medium">
                    {50 - displayName.length} 文字残り
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px] bg-white/70 shadow-sm"
                    placeholder="自己紹介を書いてください..."
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-blue-500 mt-1 font-medium">
                    {160 - bio.length} 文字残り
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    ウェブサイト
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 shadow-sm min-h-[44px]"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    場所
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 shadow-sm min-h-[44px]"
                    placeholder="東京, 日本"
                    maxLength={30}
                  />
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-200 shadow-lg">
                <h3 className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">アカウント情報</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <span className="text-indigo-600 font-medium">メール:</span>
                    <span className="text-indigo-800 font-semibold break-all">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-indigo-600 font-medium">登録日:</span>
                    <span className="text-indigo-800 font-semibold">
                      {profile?.created_at && formatDate(new Date(profile.created_at))}
                    </span>
                  </div>
                  {profile?.is_admin && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-600 font-bold">管理者アカウント</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-2xl p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 pr-6 sm:pr-8 border-2 border-green-200 rounded-xl bg-white/70 shadow-lg space-y-3 sm:space-y-0">
                  <div>
                    <h3 className="font-semibold text-green-800">プロフィールを公開</h3>
                    <p className="text-sm text-green-600 font-medium">
                      他のユーザーがあなたのプロフィールを見ることができます
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-emerald-400 shadow-sm"></div>
                  </label>
                </div>

                <div className="p-4 sm:p-6 border-2 border-green-200 rounded-xl bg-white/70 shadow-lg">
                  <h3 className="font-semibold text-green-800 mb-2">データのダウンロード</h3>
                  <p className="text-sm text-green-600 mb-4 font-medium">
                    あなたの投稿データをダウンロードできます
                  </p>
                  <button className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-6 py-3 rounded-xl font-semibold hover:from-green-200 hover:to-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 min-h-[48px] w-full sm:w-auto">
                    データをダウンロード
                  </button>
                </div>

                <div className="p-4 sm:p-6 border-2 border-red-200 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 shadow-lg">
                  <h3 className="font-semibold text-red-800 mb-2">アカウントの削除</h3>
                  <p className="text-sm text-red-600 mb-4 font-medium">
                    アカウントを削除すると、すべてのデータが永久に失われます
                  </p>
                  <button className="bg-gradient-to-r from-red-400 to-pink-400 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-500 hover:to-pink-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[48px] w-full sm:w-auto">
                    アカウントを削除
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-orange-50/50 to-amber-50/50 rounded-2xl p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 pr-6 sm:pr-8 border-2 border-orange-200 rounded-xl bg-white/70 shadow-lg space-y-3 sm:space-y-0">
                  <div>
                    <h3 className="font-semibold text-orange-800">メール通知</h3>
                    <p className="text-sm text-orange-600 font-medium">
                      新しいコメントや返信をメールで受け取る
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-400 peer-checked:to-amber-400 shadow-sm"></div>
                  </label>
                </div>

                <div className="p-4 sm:p-6 border-2 border-orange-200 rounded-xl bg-white/70 shadow-lg">
                  <h3 className="font-semibold text-orange-800 mb-4">通知の頻度</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 min-h-[44px]">
                      <input
                        type="radio"
                        name="frequency"
                        value="immediate"
                        className="text-orange-600 focus:ring-orange-500 w-5 h-5"
                        defaultChecked
                      />
                      <span className="text-sm text-orange-700 font-medium">即座に通知</span>
                    </label>
                    <label className="flex items-center space-x-3 min-h-[44px]">
                      <input
                        type="radio"
                        name="frequency"
                        value="daily"
                        className="text-orange-600 focus:ring-orange-500 w-5 h-5"
                      />
                      <span className="text-sm text-orange-700 font-medium">1日1回まとめて</span>
                    </label>
                    <label className="flex items-center space-x-3 min-h-[44px]">
                      <input
                        type="radio"
                        name="frequency"
                        value="weekly"
                        className="text-orange-600 focus:ring-orange-500 w-5 h-5"
                      />
                      <span className="text-sm text-orange-700 font-medium">週1回まとめて</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-t border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 space-y-3 sm:space-y-0">
          <button
            onClick={onClose}
            className="bg-white/70 text-purple-700 px-6 py-3 rounded-xl font-semibold hover:bg-white transition-all duration-200 border border-purple-200 shadow-md hover:shadow-lg min-h-[48px] w-full sm:w-auto"
          >
            キャンセル
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving || !displayName.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 min-h-[48px] w-full sm:w-auto"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存する
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage