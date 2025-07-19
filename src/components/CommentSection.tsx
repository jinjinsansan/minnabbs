import React, { useState, useEffect, useCallback } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
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
}

const CommentSection: React.FC<CommentSectionProps> = ({ diaryId, diaryUserId, isAdmin = false }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const { user, profile } = useAuth()

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('diary_id', diaryId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [diaryId])

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
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || isSubmitting) return

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

    if (!window.confirm('このコメントを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('コメントの削除に失敗しました')
    }
  }

  // コメント削除権限をチェック
  const canDeleteComment = (comment: Comment) => {
    if (!user) return false
    return (
      comment.user_id === user.id || // コメント投稿者本人
      diaryUserId === user.id || // 日記投稿者
      isAdmin // 管理者
    )
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 && (
          <div className="text-sm text-purple-600 font-medium mb-3">
            💬 {comments.length}件のコメント
          </div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3 p-3 rounded-2xl bg-gradient-to-br from-white/50 to-purple-50/30 backdrop-blur-sm border border-purple-200/30 hover:shadow-md transition-all duration-200" data-heart-color={getRandomHeartColor()}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200/50 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110">
              <ElegantHeart className={getRandomHeartColor()} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold bg-gradient-to-r from-gray-800 to-purple-800 bg-clip-text text-transparent text-xs">
                    {comment.nickname || '匿名'}
                  </span>
                  <span className="text-purple-500/70 text-xs font-medium">
                    @{comment.nickname?.toLowerCase().replace(/\s+/g, '') || 'anonymous'}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500/70 text-xs font-medium">
                    {formatDistanceToNow(new Date(comment.created_at), { 
                      addSuffix: true, 
                      locale: ja 
                    })}
                  </span>
                </div>
                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-gray-400 hover:shadow-sm"
                    title="コメントを削除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-gray-800 text-xs mt-1 leading-relaxed font-medium">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="border-t border-purple-200/50 pt-4 bg-gradient-to-br from-purple-50/50 to-white/50 backdrop-blur-sm rounded-2xl p-4 mt-4 shadow-sm">
          <div className="flex space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200/50 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110">
              <ElegantHeart className={getRandomHeartColor()} size="sm" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを書く..."
                className="w-full p-3 bg-white/80 backdrop-blur-sm border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 resize-none text-sm placeholder-purple-400 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                rows={2}
                maxLength={280}
              />
              
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-purple-600 font-medium">匿名でコメント</span>
                </label>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-purple-500 font-medium">
                    {280 - newComment.length}
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-105"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        返信
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="border-t border-purple-200/50 pt-4 bg-gradient-to-br from-purple-50/50 to-white/50 backdrop-blur-sm rounded-2xl p-4 mt-4 shadow-sm">
          <div className="text-center py-4">
            <p className="text-purple-600 font-medium mb-2">コメントするにはログインが必要です</p>
            <p className="text-gray-600 text-sm">Googleアカウントでログインして、他のユーザーと交流しましょう</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentSection