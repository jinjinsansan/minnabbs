import React, { useState, useEffect } from 'react'
import { Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, TrendingUp } from 'lucide-react'
import Header from './components/Header'
import DiaryCard from './components/DiaryCard'
import SearchFilter, { FilterOptions } from './components/SearchFilter'
import AdminPanel from './components/AdminPanel'
import ProfilePage from './components/ProfilePage'
import { useAuth } from './hooks/useAuth'
import { supabase, Database } from './lib/supabase'

type DiaryEntry = Database['public']['Tables']['diary']['Row']

// テスト用のモックデータ
const mockDiaries: DiaryEntry[] = [
  {
    id: 'test-1',
    user_id: 'test-user-1',
    nickname: '太郎',
    content: '今日は久しぶりに友達と会えて本当に楽しかった！カフェで3時間も話し込んでしまった。やっぱり直接会って話すのは全然違うなあ。明日からまた頑張ろう！',
    emotion: 'joy',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分前
    is_public: true
  },
  {
    id: 'test-2',
    user_id: 'test-user-2',
    nickname: null, // 匿名
    content: '最近仕事が忙しすぎて疲れが取れない...。でも新しいプロジェクトが始まるから頑張らないと。早く慣れるといいな。',
    emotion: 'sadness',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2時間前
    is_public: true
  },
  {
    id: 'test-3',
    user_id: 'test-user-3',
    nickname: 'みかん',
    content: '映画館で見た新作アニメが最高だった！！！\n\n作画も音楽も声優さんの演技も全部完璧で、途中で泣いちゃった😭\n\n原作ファンとしても大満足です。みんなにもおすすめしたい！',
    emotion: 'happiness',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5時間前
    is_public: true
  },
  {
    id: 'test-4',
    user_id: 'test-user-4',
    nickname: 'ゆうき',
    content: '電車で席を譲ろうとしたら断られてしまった。善意のつもりだったけど、相手の気持ちも考えないといけないなと反省。難しい...',
    emotion: 'guilt',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8時間前
    is_public: true
  },
  {
    id: 'test-5',
    user_id: 'test-user-5',
    nickname: null, // 匿名
    content: '今日は雨だったけど、家でゆっくり読書できて良い一日だった。久しぶりに小説を最後まで読み切れた。次は何を読もうかな？',
    emotion: 'gratitude',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12時間前
    is_public: true
  }
]
// 個別日記ページコンポーネント
const DiaryDetailPage: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>()
  const navigate = useNavigate()
  const [diary, setDiary] = useState<DiaryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()

  useEffect(() => {
    if (diaryId) {
      // テストデータから該当の日記を検索
      const foundDiary = mockDiaries.find(d => d.id === diaryId)
      if (foundDiary) {
        setDiary(foundDiary)
      }
      setLoading(false)
    }
  }, [diaryId])

  const handleDeleteDiary = async (diaryId: string) => {
    // 削除後はホームに戻る
    navigate('/')
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
          currentUserId={user?.id}
          isAdmin={profile?.is_admin || false}
          onDelete={handleDeleteDiary}
          onUpdate={handleUpdateDiary}
          showFullContent={true}
        />
      </main>
    </div>
  )
}

// メインの掲示板ページコンポーネント
const BoardPage: React.FC = () => {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showProfilePage, setShowProfilePage] = useState(false)
  const [filteredDiaries, setFilteredDiaries] = useState<DiaryEntry[]>([])
  const [searchFilters, setSearchFilters] = useState<FilterOptions>({
    keyword: '',
    username: '',
    emotion: '',
    dateFrom: '',
    dateTo: ''
  })
  const [useTestData, setUseTestData] = useState(true) // テストデータを使用
  const { user, profile, loading: authLoading } = useAuth()

  console.log('BoardPage render - authLoading:', authLoading, 'loading:', loading, 'user:', user, 'profile:', profile)

  useEffect(() => {
    console.log('BoardPage useEffect - authLoading:', authLoading, 'useTestData:', useTestData)
    if (!authLoading) {
      console.log('Auth loading finished, proceeding with data fetch')
      if (useTestData) {
        console.log('Using test data, setting diaries:', mockDiaries.length)
        // テストデータを使用
        setDiaries(mockDiaries)
        setFilteredDiaries(mockDiaries)
        setLoading(false)
      } else {
        console.log('Fetching diaries from Supabase')
        fetchDiaries()
      }
    } else {
      console.log('Still loading auth...')
    }
  }, [authLoading]) // useTestDataを依存関係から削除

  const fetchDiaries = async () => {
    try {
      console.log('fetchDiaries started')
      setRefreshing(true)
      const { data, error } = await supabase
        .from('diary')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      console.log('fetchDiaries result:', { data, error })

      if (error) throw error
      setDiaries(data || [])
      setFilteredDiaries(data || [])
      console.log('Diaries set successfully')
    } catch (error) {
      console.error('Error fetching diaries:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      console.log('Loading states reset')
    }
  }

  const handleDeleteDiary = async (diaryId: string) => {
    if (useTestData) {
      // テストデータの場合はローカルで削除
      setDiaries(prev => prev.filter(diary => diary.id !== diaryId))
      setFilteredDiaries(prev => prev.filter(diary => diary.id !== diaryId))
      return
    }

    try {
      const { error } = await supabase
        .from('diary')
        .delete()
        .eq('id', diaryId)

      if (error) throw error
      
      setDiaries(prev => prev.filter(diary => diary.id !== diaryId))
      setFilteredDiaries(prev => prev.filter(diary => diary.id !== diaryId))
    } catch (error) {
      console.error('Error deleting diary:', error)
      alert('削除に失敗しました')
    }
  }

  const handleUpdateDiary = async (diaryId: string, updates: Partial<DiaryEntry>) => {
    if (useTestData) {
      // テストデータの場合はローカルで更新
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
      return
    }

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
    } catch (error) {
      console.error('Error updating diary:', error)
      alert('更新に失敗しました')
    }
  }

  const handleNewPost = (postData: Omit<DiaryEntry, 'id' | 'created_at'>) => {
    if (!user) {
      alert('日記を投稿するにはログインが必要です')
      return
    }

    // 新しい投稿を作成
    const newPost: DiaryEntry = {
      id: `post-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...postData
    }

    if (useTestData) {
      // テストデータの場合はローカルで追加
      setDiaries(prev => [newPost, ...prev])
      setFilteredDiaries(prev => [newPost, ...prev])
    } else {
      // 本番の場合はSupabaseに保存（実装時）
      // TODO: Supabase実装時にここを更新
      setDiaries(prev => [newPost, ...prev])
      setFilteredDiaries(prev => [newPost, ...prev])
    }
  }

  const handleRefresh = () => {
    if (useTestData) {
      // テストデータをリフレッシュ
      setRefreshing(true)
      setTimeout(() => {
        setDiaries([...mockDiaries])
        setFilteredDiaries([...mockDiaries])
        setRefreshing(false)
      }, 500)
    } else {
      fetchDiaries()
    }
  }

  const handleFilterChange = (filters: FilterOptions) => {
    setSearchFilters(filters)
    
    let filtered = [...diaries]
    
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
  }

  console.log('App render - authLoading:', authLoading, 'loading:', loading, 'user:', user, 'profile:', profile)

  if (authLoading || loading) {
    console.log('Showing loading spinner')
    return (
      <div className="app-container">
        <div className="app-content">
          <Header />
          <div className="main-content">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
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
            console.log('Admin button clicked')
            setShowAdminPanel(true)
          }}
          onProfileClick={() => {
            console.log('Profile button clicked, showProfilePage:', showProfilePage)
            setShowProfilePage(true)
          }}
        />
        
        <main className="main-content">
          <div className="w-full max-w-4xl px-4 sm:px-6">
            {/* メインコンテンツ */}
            <div className="space-y-6 sm:space-y-8">
              {/* 日記一覧 */}
              <div className="bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-md rounded-3xl border-2 border-purple-200/50 p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm sm:text-lg">📖</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">みんなにっき</h2>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* テストデータ切り替えボタン */}
                    <button
                      onClick={() => {
                        console.log('Toggle test data, current:', useTestData)
                        const newUseTestData = !useTestData
                        setUseTestData(newUseTestData)
                        if (newUseTestData) {
                          console.log('Switching to test data')
                          setDiaries(mockDiaries)
                          setFilteredDiaries(mockDiaries)
                        } else {
                          console.log('Switching to production data')
                          fetchDiaries()
                        }
                      }}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                        useTestData 
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-2 border-blue-300' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300'
                      }`}
                    >
                      {useTestData ? 'テストモード' : '本番モード'}
                    </button>
                    
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
                  {filteredDiaries.length > 0 ? (
                    filteredDiaries.map((diary) => (
                      <DiaryCard
                        key={diary.id}
                        diary={diary}
                        currentUserId={user?.id}
                        isAdmin={profile?.is_admin || false}
                        onDelete={handleDeleteDiary}
                        onUpdate={handleUpdateDiary}
                      />
                    ))
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

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {/* Profile Page */}
      {showProfilePage && (
        <ProfilePage 
          onClose={() => {
            console.log('Profile page closing')
            setShowProfilePage(false)
          }}
          onNewPost={handleNewPost}
          user={user}
          profile={profile}
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