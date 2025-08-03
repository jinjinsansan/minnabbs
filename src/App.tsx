import React, { useState, useEffect } from 'react'
import { Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, TrendingUp, Shield } from 'lucide-react'
import Header from './components/Header'
import DiaryCard from './components/DiaryCard'
import SearchFilter, { FilterOptions } from './components/SearchFilter'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import ProfilePage from './components/ProfilePage'
import UserProfilePage from './components/UserProfilePage'
import { useAuth } from './hooks/useAuth'
import { useBlock } from './hooks/useBlock'
import { supabase, Database } from './lib/supabase'

type DiaryEntry = Database['public']['Tables']['diary']['Row']


// 個別日記ページコンポーネント
const DiaryDetailPage: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>()
  const navigate = useNavigate()
  const [diary, setDiary] = useState<DiaryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserProfilePage, setShowUserProfilePage] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const { user, profile, originalUserId } = useAuth()

  useEffect(() => {
    if (diaryId) {
      fetchDiary(diaryId)
    }
  }, [diaryId])

  const fetchDiary = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('diary')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (error) throw error
      setDiary(data)
    } catch (error) {
      // 日記取得エラー時はホームに戻る
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDiary = async () => {
    try {
      if (!diary) return
      
      const { error } = await supabase
        .from('diary')
        .delete()
        .eq('id', diary.id)

      if (error) throw error
      
      // 削除成功時のみホームに戻る
      navigate('/')
    } catch (error) {
      // 削除エラー時はアラート表示
      alert('削除に失敗しました。もう一度お試しください。')
    }
  }

  const handleUpdateDiary = async (diaryId: string, updates: Partial<DiaryEntry>) => {
    if (diary) {
      setDiary({ ...diary, ...updates })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  if (!diary) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">日記が見つかりません</h1>
            <p className="text-gray-600 mb-6">指定された日記は存在しないか、削除された可能性があります。</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            ← 掲示板に戻る
          </button>
        </div>
        
        <DiaryCard
          diary={diary}
          currentUserId={originalUserId || user?.id}
          isAdmin={profile?.is_admin || false}
          onDelete={handleDeleteDiary}
          onUpdate={handleUpdateDiary}
          showFullContent={true}
          onUserClick={(userId) => {
            setSelectedUserId(userId)
            setShowUserProfilePage(true)
          }}
        />
      </main>

      {/* User Profile Page */}
      {showUserProfilePage && (
        <UserProfilePage
          userId={selectedUserId}
          onClose={() => setShowUserProfilePage(false)}
        />
      )}
    </div>
  )
}

// メインの掲示板ページコンポーネント
const BoardPage: React.FC = () => {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showProfilePage, setShowProfilePage] = useState(false)
  const [showUserProfilePage, setShowUserProfilePage] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [filteredDiaries, setFilteredDiaries] = useState<DiaryEntry[]>([])
  const [displayedDiaries, setDisplayedDiaries] = useState<DiaryEntry[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const ITEMS_PER_PAGE = 30
  const { user, profile, isAdminMode, originalUserId, loading: authLoading } = useAuth()
  const { blockedUsers } = useBlock()

  useEffect(() => {
    if (!authLoading) {
      fetchDiaries()
    }
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDiaries = async () => {
    try {
  
      setRefreshing(true)
      const { data, error } = await supabase
        .from('diary')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      

      if (error) throw error
      
      // ブロックしたユーザーの投稿を除外
      let filteredData = data || []
      if (user && blockedUsers.length > 0) {
        filteredData = filteredData.filter(diary => 
          !diary.user_id || !blockedUsers.includes(diary.user_id)
        )
      }
      
      setDiaries(filteredData)
      setFilteredDiaries(filteredData)
      
      // 最初の30件を表示
      const initialDiaries = filteredData.slice(0, ITEMS_PER_PAGE)
      setDisplayedDiaries(initialDiaries)
      setHasMore(filteredData.length > ITEMS_PER_PAGE)
      setCurrentPage(0)
      
      
    } catch (error) {
      // 日記一覧取得エラーを静かに処理
    } finally {
      setLoading(false)
      setRefreshing(false)
      
    }
  }

  // フィルター変更時の処理を更新
  const handleFilterChange = (filters: FilterOptions) => {
    let filtered = [...diaries]
    
    // ブロックしたユーザーの投稿を除外
    if (user && blockedUsers.length > 0) {
      filtered = filtered.filter(diary => 
        !diary.user_id || !blockedUsers.includes(diary.user_id)
      )
    }
    
    // キーワード検索
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase().trim()
      filtered = filtered.filter(diary => 
        diary.content?.toLowerCase().includes(keyword)
      )
    }
    
    // ユーザー名検索
    if (filters.username.trim()) {
      const username = filters.username.toLowerCase().trim()
      filtered = filtered.filter(diary => 
        diary.nickname?.toLowerCase().includes(username)
      )
    }
    
    // 感情検索
    if (filters.emotion.trim()) {
      filtered = filtered.filter(diary => 
        diary.emotion === filters.emotion
      )
    }
    
    // 日付範囲フィルター
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(diary => {
        if (!diary.created_at) return false
        const diaryDate = new Date(diary.created_at)
        return diaryDate >= fromDate
      })
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(diary => {
        if (!diary.created_at) return false
        const diaryDate = new Date(diary.created_at)
        return diaryDate <= toDate
      })
    }
    
    setFilteredDiaries(filtered)
    
    // フィルター後の最初の30件を表示
    const initialFilteredDiaries = filtered.slice(0, ITEMS_PER_PAGE)
    setDisplayedDiaries(initialFilteredDiaries)
    setHasMore(filtered.length > ITEMS_PER_PAGE)
    setCurrentPage(0)
  }

  // 追加の日記を読み込む関数
  const loadMoreDiaries = () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    
    const nextPage = currentPage + 1
    const startIndex = nextPage * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const newDiaries = filteredDiaries.slice(startIndex, endIndex)
    
    if (newDiaries.length > 0) {
      setDisplayedDiaries(prev => [...prev, ...newDiaries])
      setCurrentPage(nextPage)
      setHasMore(endIndex < filteredDiaries.length)
    } else {
      setHasMore(false)
    }
    
    setIsLoadingMore(false)
  }

  // スクロール検知のためのIntersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreDiaries()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = document.getElementById('load-more-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [hasMore, isLoadingMore, currentPage, filteredDiaries])

  const handleDeleteDiary = async (diaryId: string) => {
    try {
      const { error } = await supabase
        .from('diary')
        .delete()
        .eq('id', diaryId)

      if (error) throw error
      
      // 削除成功時のみUIを更新
      setDiaries(prev => prev.filter(diary => diary.id !== diaryId))
      setFilteredDiaries(prev => prev.filter(diary => diary.id !== diaryId))
      setDisplayedDiaries(prev => prev.filter(diary => diary.id !== diaryId))
    } catch (error) {
      // 削除エラー時はアラート表示
      alert('削除に失敗しました。もう一度お試しください。')
    }
  }

  const handleUpdateDiary = async (diaryId: string, updates: Partial<DiaryEntry>) => {
    try {
      const { error } = await supabase
        .from('diary')
        .update(updates)
        .eq('id', diaryId)

      if (error) throw error
      
      setDiaries(prev => 
        prev.map(diary => 
          diary.id === diaryId ? { ...diary, ...updates } : diary
        )
      )
      setFilteredDiaries(prev => 
        prev.map(diary => 
          diary.id === diaryId ? { ...diary, ...updates } : diary
        )
      )
      setDisplayedDiaries(prev => 
        prev.map(diary => 
          diary.id === diaryId ? { ...diary, ...updates } : diary
        )
      )
    } catch (error) {
      // 更新エラー時はアラート表示
      alert('更新に失敗しました')
    }
  }

  const handleNewPost = async (postData: Omit<DiaryEntry, 'id' | 'created_at'>) => {
    if (!user) {
      alert('日記を投稿するにはログインが必要です')
      return
    }

    try {
      const { data, error } = await supabase
        .from('diary')
        .insert([postData])
        .select()
        .single()

      if (error) throw error

      // 新しい投稿をリストの先頭に追加（一括更新でパフォーマンス向上）
      const newDiary = data
      setDiaries(prev => [newDiary, ...prev])
      setFilteredDiaries(prev => [newDiary, ...prev])
      
      // displayedDiariesの更新を最適化
      setDisplayedDiaries(prev => {
        const newDisplayed = [newDiary, ...prev.slice(0, ITEMS_PER_PAGE - 1)]
        return newDisplayed
      })
    } catch (error) {
      // 投稿エラー時はアラート表示
      alert('投稿に失敗しました')
      throw error // エラーを再スローしてProfilePageでも処理できるようにする
    }
  }

  const handleRefresh = () => {
    fetchDiaries()
  }



  // 認証がまだ初期化中の場合はローディング表示
  if (authLoading) {
    
    return (
      <div className="app-container">
        <div className="app-content">
          <Header />
          <div className="main-content">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // データ取得中の場合はローディング表示（ただし認証は完了している）
  if (loading) {
    
    return (
      <div className="app-container">
        <div className="app-content">
          <Header 
            onAdminClick={() => {
              if (profile?.is_admin) {
                setShowAdminPanel(true)
              } else {
                setShowAdminLogin(true)
              }
            }}
            onProfileClick={() => {
              setShowProfilePage(true)
            }}
          />
          <div className="main-content">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <Header 
          onAdminClick={() => {
            if (profile?.is_admin) {
              setShowAdminPanel(true)
            } else {
              setShowAdminLogin(true)
            }
          }}
          onProfileClick={() => {
            setShowProfilePage(true)
          }}
        />
        
        <main className="main-content">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* メインコンテンツ */}
            <div className="space-y-6 sm:space-y-8">
              {/* 日記一覧 */}
              <div className="bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-md rounded-3xl border-2 border-purple-200/50 p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm sm:text-lg">📖</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">みんなのにっき</h2>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* 管理者ログインボタン（管理者でない場合に表示） */}
                    {!isAdminMode && !profile?.is_admin && (
                      <button
                        onClick={() => setShowAdminLogin(true)}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-2 border-orange-300"
                      >
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>管理者</span>
                      </button>
                    )}
                    
                    {/* 管理者モード切り替えボタン（管理者の場合に表示） */}
                    {(isAdminMode || profile?.is_admin) && (
                      <button
                        onClick={() => setShowAdminPanel(true)}
                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-purple-300"
                      >
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>管理画面</span>
                      </button>
                    )}
                    

                    
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className={`p-2 rounded-xl hover:bg-white/50 transition-all duration-200 text-purple-600 hover:text-purple-700 shadow-md hover:shadow-lg transform hover:scale-105 ${
                        refreshing ? 'animate-spin' : ''
                      }`}
                    >
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                {/* 検索フィルター */}
                <SearchFilter
                  onFilterChange={handleFilterChange}
                  totalCount={diaries.length}
                  filteredCount={filteredDiaries.length}
                />
                
                <div className="space-y-6">
                  {displayedDiaries.length > 0 ? (
                    <>
                      {displayedDiaries.map((diary) => (
                        <DiaryCard
                          key={diary.id}
                          diary={diary}
                          currentUserId={originalUserId || user?.id}
                          isAdmin={isAdminMode || profile?.is_admin || false}
                          onDelete={handleDeleteDiary}
                          onUpdate={handleUpdateDiary}
                          onUserClick={(userId) => {
                            setSelectedUserId(userId)
                            setShowUserProfilePage(true)
                          }}
                        />
                      ))}
                      
                      {/* ローディングセンチネル */}
                      {hasMore && (
                        <div 
                          id="load-more-sentinel" 
                          className="flex items-center justify-center py-8"
                        >
                          {isLoadingMore ? (
                            <div className="flex items-center space-x-3 text-purple-600">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                              <span className="text-sm font-medium">古い投稿を読み込み中...</span>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500 font-medium">
                                スクロールして古い投稿を読み込む
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 全て読み込み完了 */}
                      {!hasMore && displayedDiaries.length > 0 && (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-purple-600 text-lg">✨</span>
                          </div>
                          <p className="text-sm text-gray-500 font-medium">
                            全ての投稿を表示しました
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50/50 to-white/50 rounded-2xl border border-gray-200/50">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      {diaries.length === 0 ? (
                        <>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            まだ投稿がありません
                          </h3>
                          <p className="text-gray-500 max-w-sm mx-auto">
                            プロフィールページから日記を投稿すると、ここに表示されます。
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            検索条件に一致する日記が見つかりません
                          </h3>
                          <p className="text-gray-500 max-w-sm mx-auto">
                            検索条件を変更して再度お試しください。
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Admin Login */}
      {showAdminLogin && (
        <AdminLogin 
          onLogin={(isAdmin) => {
            if (isAdmin) {
              setShowAdminLogin(false)
              // 少し遅延を入れて状態更新を確実にする
              setTimeout(() => {
                setShowAdminPanel(true)
              }, 100)
            }
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {/* Profile Page */}
      {showProfilePage && (
        <ProfilePage 
          onClose={() => {
            setShowProfilePage(false)
          }}
          onNewPost={handleNewPost}
          user={user}
          profile={profile ? {
            display_name: profile.display_name || undefined,
            avatar_url: profile.avatar_url || undefined,
            email: profile.email || undefined,
            created_at: profile.created_at,
            is_admin: profile.is_admin || undefined
          } : null}
        />
      )}

      {/* User Profile Page */}
      {showUserProfilePage && (
        <UserProfilePage
          userId={selectedUserId}
          onClose={() => setShowUserProfilePage(false)}
        />
      )}
    </div>
  )
}

// メインのAppコンポーネント
function App() {
  return (
    <Routes>
      <Route path="/" element={<BoardPage />} />
      <Route path="/diary/:diaryId" element={<DiaryDetailPage />} />
    </Routes>
  )
}

export default App