import React, { useState, useEffect, useCallback } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBlock } from '../hooks/useBlock'
import { useSystemSettings } from '../hooks/useSystemSettings'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import ElegantHeart from './ElegantHeart'

type Comment = Database['public']['Tables']['comments']['Row']

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

interface CommentSectionProps {
  diaryId: string
  diaryUserId?: string // 日記投稿者のID
  isAdmin?: boolean // 管理者フラグ
  onUserClick?: (userId: string) => void // ユーザー名クリック時のコールバック
}

const CommentSection: React.FC<CommentSectionProps> = ({ diaryId, diaryUserId, isAdmin = false, onUserClick }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [userProfiles, setUserProfiles] = useState<Record<string, { display_name: string | null }>>({})
  const { user, profile, isAdminMode } = useAuth()
  const { blockedUsers } = useBlock()
  const { settings } = useSystemSettings()

  // 管理者状態のデバッグ情報
  const effectiveIsAdmin = isAdmin || isAdminMode || profile?.is_admin || false

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('diary_id', diaryId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
      
      // コメント投稿者のプロフィール情報を取得
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(comment => comment.user_id).filter(Boolean))]
        await fetchUserProfiles(userIds)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [diaryId])

  // ユーザープロフィールを取得する関数
  const fetchUserProfiles = async (userIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds)

      if (error) {
        console.error('Error fetching user profiles:', error)
        return
      }

      if (data) {
        const profilesMap: Record<string, { display_name: string | null }> = {}
        data.forEach(profile => {
          profilesMap[profile.id] = { display_name: profile.display_name }
        })
        setUserProfiles(profilesMap)
      }
    } catch (error) {
      console.error('Error in fetchUserProfiles:', error)
    }
  }

  // コメント数を取得する関数
  const getCommentCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', diaryId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching comment count:', error)
      return 0
    }
  }, [diaryId])

  useEffect(() => {
    fetchComments()
  }, [diaryId])

  // コメントの表示名を決定する関数（プロフィールページの最新情報を優先）
  const getCommentDisplayName = (comment: Comment) => {
    // 1. プロフィールページで設定された最新の表示名を優先
    if (comment.user_id && userProfiles[comment.user_id]?.display_name) {
      return userProfiles[comment.user_id].display_name
    }
    
    // 2. コメント投稿時に設定された表示名
    if (comment.nickname) {
      return comment.nickname
    }
    
    // 3. デフォルト
    return '匿名'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || isSubmitting) return

    // 管理者モードの場合はコメント投稿を無効化
    if (user.id === 'admin-user') {
      alert('管理者モードではコメント投稿は使用できません。')
      return
    }

    // システム設定をチェック
    if (!settings.allow_anonymous_posts && isAnonymous) {
      alert('現在、匿名投稿は許可されていません')
      return
    }

    // ユーザーがブロックされているかチェック
    if (profile?.is_blocked) {
      alert('アカウントがブロックされているため、コメントできません')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          diary_id: diaryId,
          user_id: user.id,
          nickname: isAnonymous ? null : (profile?.display_name || '匿名'),
          content: newComment.trim()
        }])

      if (error) throw error
      await fetchComments()

      setNewComment('')
      setIsAnonymous(false)
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('コメントの投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    const confirmMessage = effectiveIsAdmin 
      ? '管理者としてこのコメントを削除しますか？' 
      : 'このコメントを削除しますか？'
    
    if (!window.confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      
      console.log('Comment deleted successfully:', commentId)
      await fetchComments()
      
      if (effectiveIsAdmin) {
        console.log('Admin deleted comment:', commentId)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('コメントの削除に失敗しました')
    }
  }

  // コメント削除権限をチェック
  const canDeleteComment = (comment: Comment) => {
    if (!user) return false
    
    // 管理者モードの場合は削除権限を付与
    if (user.id === 'admin-user' && effectiveIsAdmin) {
      return true
    }
    
    const isCommentOwner = comment.user_id === user.id
    const isDiaryOwner = diaryUserId === user.id
    const hasAdminRights = effectiveIsAdmin
    
    return (
      isCommentOwner || // コメント投稿者本人
      isDiaryOwner || // 日記投稿者
      hasAdminRights // 管理者
    )
  }

  // ブロックしたユーザーのコメントを除外
  const filteredComments = comments.filter(comment => 
    !comment.user_id || !blockedUsers.includes(comment.user_id)
  )

  return (
    <div className="space-y-4 w-full">
      {/* Comments List */}
      <div className="space-y-4 w-full">
        {filteredComments.length > 0 && (
          <div className="text-sm text-purple-600 font-medium mb-3">
            💬 {filteredComments.length}件のコメント
          </div>
        )}
        {filteredComments.map((comment) => (
          <div key={comment.id} className={`flex space-x-3 p-2 sm:p-3 rounded-2xl backdrop-blur-sm border hover:shadow-md transition-all duration-200 w-full ${
            effectiveIsAdmin && canDeleteComment(comment) 
              ? 'bg-gradient-to-br from-red-50/50 to-pink-50/30 border-red-200/30' 
              : 'bg-gradient-to-br from-white/50 to-purple-50/30 border-purple-200/30'
          }`} data-heart-color={getRandomHeartColor()}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200/50 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110">
              <ElegantHeart className={getRandomHeartColor()} size="sm" />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                  <button
                    onClick={() => comment.user_id && onUserClick && onUserClick(comment.user_id)}
                    className="font-semibold bg-gradient-to-r from-gray-800 to-purple-800 bg-clip-text text-transparent text-xs hover:from-purple-600 hover:to-pink-600 transition-all duration-200 cursor-pointer"
                  >
                    {getCommentDisplayName(comment)}
                  </button>
                  <span className="text-gray-400 hidden sm:inline">·</span>
                  <span className="text-gray-500/70 text-xs font-medium">
                    {(() => {
                      const createdAt = new Date(comment.created_at)
                      const now = new Date()
                      const isFuture = createdAt > now
                      
                      if (isFuture) {
                        return 'たった今'
                      }
                      
                      return formatDistanceToNow(createdAt, { 
                      addSuffix: true, 
                      locale: ja 
                      })
                    })()}
                  </span>
                </div>
                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className={`p-1.5 rounded-lg transition-all duration-200 hover:shadow-sm flex-shrink-0 ${
                      effectiveIsAdmin 
                        ? 'text-red-500 hover:bg-red-50 hover:text-red-600' 
                        : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                    }`}
                    title={effectiveIsAdmin ? "管理者として削除" : "コメントを削除"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-gray-800 text-xs mt-1 leading-relaxed font-medium break-words">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="border-t border-purple-200/50 pt-4 bg-gradient-to-br from-purple-50/50 to-white/50 backdrop-blur-sm rounded-2xl p-2 sm:p-4 mt-4 shadow-sm w-full">
          <div className="flex space-x-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200/50 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110">
              <ElegantHeart className={getRandomHeartColor()} size="sm" />
            </div>
            <div className="flex-1 w-full">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを書く..."
                className="w-full p-2 sm:p-3 bg-white/80 backdrop-blur-sm border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 resize-none text-sm placeholder-purple-400 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                rows={2}
                maxLength={280}
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 space-y-2 sm:space-y-0">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 shadow-sm w-4 h-4"
                  />
                  <span className="text-xs text-purple-600 font-medium">匿名でコメント</span>
                </label>
                
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 text-xs flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>送信</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500 font-medium">
          コメントを投稿するにはログインが必要です
        </div>
      )}
    </div>
  )
}

export default CommentSection 