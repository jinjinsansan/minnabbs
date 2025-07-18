import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Trash2, 
  Ban, 
  UnlockKeyhole, 
  Plus,
  Search,
  Filter,
  X,
  Shield,
  AlertTriangle,
  Users
} from 'lucide-react'
import { supabase, Database } from '../lib/supabase'
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

type Profile = Database['public']['Tables']['profiles']['Row']
type DiaryEntry = Database['public']['Tables']['diary']['Row']

interface AdminPanelProps {
  onClose: () => void
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'create'>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [posts, setPosts] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.is_admin) {
      fetchUsers()
      fetchPosts()
    }
  }, [profile])

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

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !isBlocked })
        .eq('id', userId)

      if (error) throw error
      await fetchUsers()
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
        <div className="modal-content">
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-black mb-2">アクセス拒否</h2>
            <p className="text-gray-600 mb-4">管理者権限が必要です</p>
            <button onClick={onClose} className="btn-primary">
              閉じる
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-black">管理画面</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>ユーザー管理</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>投稿管理</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'create'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>スレッド作成</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Search */}
          {activeTab !== 'create' && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={activeTab === 'users' ? 'ユーザーを検索...' : '投稿を検索...'}
                  className="form-input pl-10"
                />
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-50 border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200">
                      <ElegantHeart className={getRandomHeartColor()} size="md" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-black">
                          {user.display_name || '匿名'}
                        </span>
                        {user.is_admin && (
                          <Shield className="w-4 h-4 text-yellow-500" />
                        )}
                        {user.is_blocked && (
                          <Ban className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        登録: {formatDistanceToNow(new Date(user.created_at), { 
                          addSuffix: true, 
                          locale: ja 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBlockUser(user.id, user.is_blocked || false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        user.is_blocked
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
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
              ))}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-black">
                            {post.nickname || '匿名'}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {post.created_at && formatDistanceToNow(new Date(post.created_at), { 
                              addSuffix: true, 
                              locale: ja 
                            })}
                          </span>
                        </div>
                        <p className="text-black leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>公開: {post.is_public ? 'はい' : 'いいえ'}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>削除</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Create Thread Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateThread} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  スレッドタイトル
                </label>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  className="form-input"
                  placeholder="お知らせのタイトルを入力..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  内容
                </label>
                <textarea
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  className="form-input"
                  rows={6}
                  placeholder="お知らせの内容を入力..."
                  required
                />
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={!newThreadContent.trim() || !newThreadTitle.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                スレッドを作成
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel