import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Trash2, 
  Ban, 
  UnlockKeyhole, 
  Plus,
  Search,
  X,
  Shield,
  AlertTriangle,
  Users,
  Settings,
  BarChart3,
  Activity,
  Database as DatabaseIcon,
  Download,
  Upload,
  Mail,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  Zap,
  Lock,
  Bell,
  Palette
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
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

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  is_blocked?: boolean
}
type DiaryEntry = Database['public']['Tables']['diary']['Row']

interface AdminPanelProps {
  onClose: () => void
}

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  activeUsers: number
  blockedUsers: number
  todayPosts: number
  thisWeekPosts: number
  thisMonthPosts: number
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts' | 'settings' | 'logs' | 'backup'>('dashboard')
  const [users, setUsers] = useState<Profile[]>([])
  const [posts, setPosts] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    activeUsers: 0,
    blockedUsers: 0,
    todayPosts: 0,
    thisWeekPosts: 0,
    thisMonthPosts: 0
  })
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.is_admin) {
      fetchUsers()
      fetchPosts()
      calculateStats()
    }
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('diary')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate())

    const todayPosts = posts.filter(post => 
      post.created_at && new Date(post.created_at) >= today
    ).length

    const thisWeekPosts = posts.filter(post => 
      post.created_at && new Date(post.created_at) >= weekAgo
    ).length

    const thisMonthPosts = posts.filter(post => 
      post.created_at && new Date(post.created_at) >= monthAgo
    ).length

    const activeUsers = users.filter(user => !user.is_blocked).length
    const blockedUsers = users.filter(user => user.is_blocked).length

    setStats({
      totalUsers: users.length,
      totalPosts: posts.length,
      activeUsers,
      blockedUsers,
      todayPosts,
      thisWeekPosts,
      thisMonthPosts
    })
  }

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !isBlocked })
        .eq('id', userId)

      if (error) throw error
      await fetchUsers()
      calculateStats()
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('この投稿を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('diary')
        .delete()
        .eq('id', postId)

      if (error) throw error
      await fetchPosts()
      calculateStats()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newThreadContent.trim() || !newThreadTitle.trim()) return

    try {
      const { error } = await supabase
        .from('diary')
        .insert([{
          user_id: profile?.id,
          nickname: '管理者',
          content: `【${newThreadTitle}】\n\n${newThreadContent}`,
          emotion: null,
          is_public: true
        }])

      if (error) throw error

      setNewThreadContent('')
      setNewThreadTitle('')
      await fetchPosts()
      calculateStats()
      setActiveTab('posts')
    } catch (error) {
      console.error('Error creating thread:', error)
    }
  }

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPosts = posts.filter(post =>
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!profile?.is_admin) {
    return (
      <div className="modal-overlay">
        <div className="bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-md rounded-3xl border-2 border-purple-200/50 max-w-md w-full shadow-2xl">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3">
              アクセス拒否
            </h2>
            <p className="text-gray-600 mb-6 font-medium">
              管理者権限が必要です
            </p>
            <button 
              onClick={onClose} 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
      <div className="bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-md rounded-3xl border-2 border-purple-200/50 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">管理画面</h2>
                <p className="text-purple-100 text-sm font-medium">
                  システム管理とユーザー管理
                </p>
              </div>
          </div>
          <button
            onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 backdrop-blur-sm"
          >
              <X className="w-6 h-6 text-white" />
          </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-purple-200/50">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>ダッシュボード</span>
            </button>
          <button
            onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'users'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>ユーザー管理</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'posts'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>投稿管理</span>
          </button>
          <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>システム設定</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>ログ・監査</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'backup'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
              }`}
            >
              <DatabaseIcon className="w-5 h-5" />
              <span>バックアップ</span>
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-semibold text-sm">総ユーザー数</p>
                      <p className="text-3xl font-bold text-blue-800">{stats.totalUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-semibold text-sm">総投稿数</p>
                      <p className="text-3xl font-bold text-green-800">{stats.totalPosts}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-semibold text-sm">アクティブユーザー</p>
                      <p className="text-3xl font-bold text-purple-800">{stats.activeUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 font-semibold text-sm">ブロック済み</p>
                      <p className="text-3xl font-bold text-red-800">{stats.blockedUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                      <UserX className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>投稿活動</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-green-700 font-medium">今日</span>
                      <span className="text-2xl font-bold text-green-800">{stats.todayPosts}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-blue-700 font-medium">今週</span>
                      <span className="text-2xl font-bold text-blue-800">{stats.thisWeekPosts}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                      <span className="text-purple-700 font-medium">今月</span>
                      <span className="text-2xl font-bold text-purple-800">{stats.thisMonthPosts}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span>システム状況</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-green-700 font-medium">データベース</span>
                      <span className="text-green-600 font-semibold">正常</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-green-700 font-medium">認証システム</span>
                      <span className="text-green-600 font-semibold">正常</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-green-700 font-medium">ストレージ</span>
                      <span className="text-green-600 font-semibold">正常</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
          {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ユーザーを検索..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-200 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-purple-400"
                />
              </div>

              {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 flex items-center justify-center shadow-sm">
                      <ElegantHeart className={getRandomHeartColor()} size="md" />
                    </div>
                    <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-gray-800">
                          {user.display_name || '匿名'}
                        </span>
                        {user.is_admin && (
                              <div className="px-2 py-1 bg-yellow-100 rounded-full">
                                <Shield className="w-3 h-3 text-yellow-600" />
                              </div>
                        )}
                        {user.is_blocked && (
                              <div className="px-2 py-1 bg-red-100 rounded-full">
                                <Ban className="w-3 h-3 text-red-600" />
                              </div>
                        )}
                      </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>登録: {formatDistanceToNow(new Date(user.created_at), { 
                          addSuffix: true, 
                          locale: ja 
                              })}</span>
                            </div>
                          </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBlockUser(user.id, user.is_blocked || false)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        user.is_blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-md hover:shadow-lg'
                              : 'bg-red-100 text-red-700 hover:bg-red-200 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {user.is_blocked ? (
                        <>
                          <UnlockKeyhole className="w-4 h-4" />
                          <span>ブロック解除</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4" />
                          <span>ブロック</span>
                        </>
                      )}
                    </button>
                      </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="投稿を検索..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-200 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-purple-400"
                />
              </div>

              {/* Create Thread Button */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200/50">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span>管理者投稿作成</span>
                </h3>
                <form onSubmit={handleCreateThread} className="space-y-4">
                  <input
                    type="text"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="タイトルを入力"
                    className="w-full px-4 py-3 border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    required
                  />
                  <textarea
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="投稿内容を入力"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    投稿作成
                  </button>
                </form>
              </div>

              {/* Posts List */}
            <div className="space-y-4">
              {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : (
                filteredPosts.map((post) => (
                    <div key={post.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="font-bold text-gray-800">
                            {post.nickname || '匿名'}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {post.created_at && formatDistanceToNow(new Date(post.created_at), { 
                              addSuffix: true, 
                              locale: ja 
                            })}
                          </span>
                            {post.nickname === '管理者' && (
                              <div className="px-2 py-1 bg-yellow-100 rounded-full">
                                <Shield className="w-3 h-3 text-yellow-600" />
                              </div>
                            )}
                        </div>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                        </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                          className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium">削除</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <span>一般設定</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">メンテナンスモード</span>
                      <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">新規ユーザー登録</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">匿名投稿</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                    <span>セキュリティ設定</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">2段階認証</span>
                      <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">IP制限</span>
                      <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">セッション管理</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <span>通知設定</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">新規ユーザー通知</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">不適切投稿通知</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">システム通知</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    <span>外観設定</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">ダークモード</span>
                      <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">アニメーション</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">レスポンシブ</span>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-all duration-200"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span>アクティビティログ</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-green-800 font-medium">新規ユーザー登録</p>
                      <p className="text-green-600 text-sm">心の仕組みチャンネル解放カウンセラー仁 が登録しました</p>
                    </div>
                    <span className="text-green-600 text-sm">8分前</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-blue-800 font-medium">管理者ログイン</p>
                      <p className="text-blue-600 text-sm">管理者 がログインしました</p>
                    </div>
                    <span className="text-blue-600 text-sm">2分前</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-yellow-800 font-medium">投稿作成</p>
                      <p className="text-yellow-600 text-sm">管理者 が新しい投稿を作成しました</p>
                    </div>
                    <span className="text-yellow-600 text-sm">1分前</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Download className="w-5 h-5 text-purple-600" />
                    <span>データエクスポート</span>
                  </h3>
                  <div className="space-y-4">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                      ユーザーデータをエクスポート
                    </button>
                    <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                      投稿データをエクスポート
                    </button>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                      全データをエクスポート
                    </button>
                  </div>
              </div>
              
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-purple-600" />
                    <span>データインポート</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center">
                      <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">ファイルをドラッグ&ドロップ</p>
                      <p className="text-gray-500 text-sm">またはクリックしてファイルを選択</p>
                    </div>
                    <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                      データを復元
              </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel