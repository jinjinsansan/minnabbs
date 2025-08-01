import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, MoreHorizontal, Edit, Trash2, Share } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Database } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import CommentSection from './CommentSection'
import EditDiaryModal from './EditDiaryModal'
import ElegantHeart from './ElegantHeart'
import { useAuth } from '../hooks/useAuth'

type DiaryEntry = Database['public']['Tables']['diary']['Row']

interface DiaryCardProps {
  diary: DiaryEntry
  currentUserId?: string
  isAdmin?: boolean
  showFullContent?: boolean
  onDelete?: (id: string) => void
  onUpdate?: (id: string, updates: Partial<DiaryEntry>) => void
  onUserClick?: (userId: string) => void
}

// 感情に応じた色を取得
const getEmotionColorClasses = (emotion: string | null) => {
  const emotionColors: Record<string, { bg: string; border: string; heart: string }> = {
    // ネガティブな感情
    'fear': { bg: 'bg-purple-50', border: 'border-purple-200', heart: 'text-purple-500' },
    'sadness': { bg: 'bg-blue-50', border: 'border-blue-200', heart: 'text-blue-500' },
    'anger': { bg: 'bg-red-50', border: 'border-red-200', heart: 'text-red-500' },
    'disgust': { bg: 'bg-green-50', border: 'border-green-200', heart: 'text-green-500' },
    'indifference': { bg: 'bg-gray-50', border: 'border-gray-200', heart: 'text-gray-500' },
    'guilt': { bg: 'bg-orange-50', border: 'border-orange-200', heart: 'text-orange-500' },
    'loneliness': { bg: 'bg-indigo-50', border: 'border-indigo-200', heart: 'text-indigo-500' },
    'shame': { bg: 'bg-pink-50', border: 'border-pink-200', heart: 'text-pink-500' },
    // ポジティブな感情
    'joy': { bg: 'bg-yellow-50', border: 'border-yellow-200', heart: 'text-yellow-500' },
    'gratitude': { bg: 'bg-teal-50', border: 'border-teal-200', heart: 'text-teal-500' },
    'achievement': { bg: 'bg-lime-50', border: 'border-lime-200', heart: 'text-lime-500' },
    'happiness': { bg: 'bg-amber-50', border: 'border-amber-200', heart: 'text-amber-500' }
  }
  
  // 感情が指定されていない場合はデフォルトの色
  return emotionColors[emotion || ''] || { 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    heart: 'text-gray-500' 
  }
}

const DiaryCard: React.FC<DiaryCardProps> = ({ 
  diary, 
  currentUserId, 
  isAdmin = false,
  showFullContent = false,
  onDelete,
  onUpdate,
  onUserClick
}) => {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [userProfile, setUserProfile] = useState<{ display_name: string | null } | null>(null)
  const { user, profile, isAdminMode, originalUserId } = useAuth()
  const colors = getEmotionColorClasses(diary.emotion) // 感情に応じた色を取得

  // 簡素化された権限チェックロジック
  const isOwner = (originalUserId && diary.user_id && originalUserId === diary.user_id) ||
                  (user?.id && diary.user_id && user.id === diary.user_id && user.id !== 'admin-user') ||
                  (currentUserId && diary.user_id && currentUserId === diary.user_id)
  const canEdit = isOwner || isAdmin || isAdminMode || profile?.is_admin
  const canDelete = isOwner || isAdmin || isAdminMode || profile?.is_admin

  // ユーザープロフィールを取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!diary.user_id) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', diary.user_id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error)
          return
        }

        if (data) {
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error)
      }
    }

    fetchUserProfile()
  }, [diary.user_id])

  // いいねの状態と数を取得
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        // いいね数を取得
        const { count: likeCountResult } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('diary_id', diary.id)

        setLikeCount(likeCountResult || 0)

        // 管理者モードの場合はいいね状態をチェックしない
        if (user && !isAdminMode && user.id !== 'admin-user') {
          const { data: userLike } = await supabase
            .from('likes')
            .select('*')
            .eq('diary_id', diary.id)
            .eq('user_id', user.id)
            .single()

          setLiked(!!userLike)
        } else {
          // 管理者モードの場合はいいね状態をfalseに設定
          setLiked(false)
        }
      } catch (error) {
        console.error('Error fetching like status:', error)
        // エラー時はいいね状態をfalseに設定
        setLiked(false)
      }
    }

    fetchLikeStatus()
  }, [diary.id, user])

  // コメント数を取得
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('diary_id', diary.id)

        setCommentCount(count || 0)
        
        // コメントがある場合は自動的にコメント欄を開く
        if (count && count > 0) {
          setShowComments(true)
        }
      } catch (error) {
        console.error('Error fetching comment count:', error)
      }
    }

    fetchCommentCount()
  }, [diary.id])

  const getEmotionDisplay = (emotion: string | null) => {
    const emotions: Record<string, { label: string; color: string }> = {
      // ネガティブな感情
      'fear': { label: '恐怖', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      'sadness': { label: '悲しみ', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      'anger': { label: '怒り', color: 'bg-red-100 text-red-700 border-red-200' },
      'disgust': { label: '悔しい', color: 'bg-green-100 text-green-700 border-green-200' },
      'indifference': { label: '無価値感', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      'guilt': { label: '罪悪感', color: 'bg-orange-100 text-orange-700 border-orange-200' },
      'loneliness': { label: '寂しさ', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      'shame': { label: '恥ずかしさ', color: 'bg-pink-100 text-pink-700 border-pink-200' },
      // ポジティブな感情
      'joy': { label: '嬉しい', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      'gratitude': { label: '感謝', color: 'bg-teal-100 text-teal-700 border-teal-200' },
      'achievement': { label: '達成感', color: 'bg-lime-100 text-lime-700 border-lime-200' },
      'happiness': { label: '幸せ', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    }
    return emotions[emotion || ''] || null
  }

  // 表示名を決定する関数（匿名投稿の場合はプロフィール情報を無視）
  const getDisplayName = () => {
    // 匿名投稿の場合（nicknameがnullまたは空文字）
    if (!diary.nickname) {
      return '匿名'
    }
    
    // 実名投稿の場合
    return diary.nickname
  }

  const handleDelete = () => {
    // 削除権限の再確認
    if (!canDelete) {
      alert('削除権限がありません')
      return
    }
    
    if (onDelete && window.confirm('この投稿を削除しますか？')) {
      onDelete(diary.id)
    }
  }

  const handleUpdate = (updates: Partial<DiaryEntry>) => {
    if (onUpdate) {
      onUpdate(diary.id, updates)
    }
    setShowEditModal(false)
  }

  const handleLike = async () => {
    if (!user) {
      alert('いいね！するにはログインが必要です。')
      return
    }

    // 管理者モードの場合はいいね機能を無効化
    if (user.id === 'admin-user' || isAdminMode) {
      alert('管理者モードではいいね機能は使用できません。')
      return
    }
    
    try {
      if (liked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('diary_id', diary.id)
          .eq('user_id', user.id)

        if (error) throw error
        
        setLiked(false)
        setLikeCount(prev => prev - 1)
      } else {
        // いいねを追加
        const { error } = await supabase
          .from('likes')
          .insert([{
            diary_id: diary.id,
            user_id: user.id
          }])

        if (error) throw error
        
        setLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error handling like:', error)
      alert('いいねの処理に失敗しました')
    }
  }

  const handleShare = () => {
    if (!user) {
      alert('シェアするにはログインが必要です。')
      return
    }
    
    // const _diaryUrl = `${window.location.origin}/diary/${diary.id}`
    const shareText = `${getDisplayName()}さんの日記\n\n${diary.content?.substring(0, 50)}${diary.content && diary.content.length > 50 ? '...' : ''}\n\n#かんじょうにっき仲間で繋がりたい\n#かんじょうにっき #感情日記 #自己肯定感 #みんなのにっき`
    const shareUrl = 'https://dairynamisapo.vercel.app/'
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  const handleCommentClick = () => {
    // ログインしていなくてもコメントを見れるようにする
    setShowComments(!showComments)
  }

  return (
    <article className={`rounded-3xl border-2 p-4 sm:p-6 mb-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-md ${colors.bg} ${colors.border} bg-gradient-to-br from-white/90 to-white/70 w-full`}>
      {/* Header */}
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-white/50 flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
          <ElegantHeart className={colors.heart} size="sm" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              onClick={() => onUserClick && diary.user_id && onUserClick(diary.user_id)}
              className="font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent text-sm hover:from-purple-600 hover:to-pink-600 transition-all duration-200 cursor-pointer"
            >
              {getDisplayName()}
            </button>
            <span className="text-gray-400 hidden sm:inline">·</span>
            <span className="text-gray-600 text-xs bg-gradient-to-r from-white/80 to-gray-50/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200/50 shadow-sm font-medium">
              {diary.created_at && new Date(diary.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span className="text-gray-400 hidden sm:inline">·</span>
            <span className="text-gray-500/70 text-xs font-medium">
              {diary.created_at && (() => {
                const createdAt = new Date(diary.created_at)
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

          {/* Content */}
          <div className="mt-3">
            {/* 感情バッジ */}
            {diary.emotion && getEmotionDisplay(diary.emotion) && (
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEmotionDisplay(diary.emotion)?.color}`}>
                  {getEmotionDisplay(diary.emotion)?.label}
                </span>
              </div>
            )}
            
            {showFullContent ? (
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm font-medium">
                {diary.content}
              </p>
            ) : (
              <Link to={`/diary/${diary.id}`} className="block hover:opacity-80 transition-opacity">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm font-medium hover:text-gray-900 transition-colors">
                  {diary.content}
                </p>
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={handleCommentClick}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 group text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">コメント</span>
                {commentCount > 0 && (
                  <span className="text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-blue-100 text-blue-700">
                    {commentCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 group text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 ${
                  liked 
                    ? 'text-red-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100' 
                    : 'text-gray-600 hover:text-red-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100'
                }`}
              >
                <ElegantHeart 
                  className={liked ? 'text-red-500' : 'text-gray-500'} 
                  size="sm" 
                />
                <span className="hidden sm:inline">いいね</span>
                {likeCount > 0 && (
                  <span className={`text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                    liked 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {likeCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={handleShare}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 group text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Share className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Xでシェア</span>
              </button>
            </div>

            {canEdit && (
              <div className="relative">

                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2.5 rounded-xl hover:bg-white/70 transition-all duration-200 text-gray-600 hover:text-gray-700 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border-2 border-gray-200/50 py-3 z-50 backdrop-blur-md">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setShowEditModal(true)
                          setShowMenu(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 text-green-600 text-sm font-medium transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                        <span>編集</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          handleDelete()
                          setShowMenu(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 text-red-600 text-sm font-medium transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>削除</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-6 border-t border-gray-200/50 pt-6 bg-gradient-to-br from-gray-50/30 to-white/30 rounded-2xl p-2 sm:p-4 backdrop-blur-sm w-full">
              <CommentSection 
                diaryId={diary.id} 
                diaryUserId={diary.user_id || undefined}
                isAdmin={isAdmin || profile?.is_admin || false}
                onUserClick={onUserClick}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditDiaryModal
          diary={diary}
          onSave={handleUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </article>
  )
}

export default DiaryCard