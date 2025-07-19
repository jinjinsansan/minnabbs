import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  is_admin: boolean | null
  created_at: string
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useAuth useEffect started')
    // 現在のセッションを取得
    const getSession = async () => {
      try {
        console.log('Getting session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session result:', session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('User found, fetching profile...')
          await fetchProfile(session.user.id)
        } else {
          console.log('No user in session')
          // ユーザーがログインしていない場合でも、管理者ログイン状態をチェック
          checkAdminLoginStatus()
        }
        
        setLoading(false)
        console.log('Loading set to false')
      } catch (error) {
        console.error('Error in getSession:', error)
        setLoading(false)
      }
    }

    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('User in auth state change, fetching profile...')
          await fetchProfile(session.user.id)
        } else {
          console.log('No user in auth state change, checking admin login status')
          // セッションがない場合でも管理者ログイン状態をチェック
          checkAdminLoginStatus()
        }
        
        setLoading(false)
        console.log('Loading set to false in auth state change')
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        console.log('Profile found:', data)
        setProfile(data)
      } else {
        console.log('Profile not found, creating new profile')
        // プロフィールが存在しない場合は作成
        await createProfile(userId)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    }
  }

  const createProfile = async (userId: string) => {
    try {
      console.log('Creating profile for user:', userId)
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      
      if (!user) {
        console.log('No user data found')
        return
      }

      const newProfile = {
        id: userId,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '匿名',
        avatar_url: user.user_metadata?.avatar_url || null,
        is_admin: user.email === 'jin@namisapo.com', // 管理者判定
      }

      console.log('Creating profile with data:', newProfile)

      // まず既存のプロフィールがあるかチェック
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        console.log('Profile already exists:', existingProfile)
        setProfile(existingProfile)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        // プロフィール作成に失敗した場合でも、ローカルでプロフィールを作成
        const fallbackProfile = {
          id: userId,
          email: user.email || null,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '匿名',
          avatar_url: user.user_metadata?.avatar_url || null,
          is_admin: user.email === 'jin@namisapo.com',
          created_at: new Date().toISOString()
        }
        console.log('Using fallback profile:', fallbackProfile)
        setProfile(fallbackProfile)
        return
      }

      console.log('Profile created successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error in createProfile:', error)
      // エラーが発生した場合でも、基本的なプロフィール情報を設定
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (user) {
        const fallbackProfile = {
          id: userId,
          email: user.email || null,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '匿名',
          avatar_url: user.user_metadata?.avatar_url || null,
          is_admin: user.email === 'jin@namisapo.com',
          created_at: new Date().toISOString()
        }
        console.log('Using fallback profile due to error:', fallbackProfile)
        setProfile(fallbackProfile)
      }
    }
  }

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates })
    }
  }

  const checkAdminLoginStatus = () => {
    console.log('Checking admin login status...')
    // ローカルストレージから管理者ログイン状態をチェック
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
    const adminEmail = localStorage.getItem('adminEmail')
    
    console.log('adminLoggedIn:', adminLoggedIn)
    console.log('adminEmail:', adminEmail)
    
    if (adminLoggedIn && adminEmail === 'jin@namisapo.com') {
      console.log('Admin login status found in localStorage, setting admin profile')
      // 管理者プロフィールを作成
      const adminProfile = {
        id: 'admin-user',
        email: adminEmail,
        display_name: '管理者',
        avatar_url: null,
        is_admin: true,
        created_at: new Date().toISOString()
      }
      setProfile(adminProfile)
      setUser({ id: 'admin-user', email: adminEmail } as any)
      console.log('Admin profile and user set successfully')
    } else {
      console.log('No admin login status found or invalid credentials')
    }
  }

  const loginAsAdmin = () => {
    console.log('loginAsAdmin called')
    // 管理者ログイン状態をローカルストレージに保存
    localStorage.setItem('adminLoggedIn', 'true')
    localStorage.setItem('adminEmail', 'jin@namisapo.com')
    
    console.log('Admin login state saved to localStorage')
    
    // 管理者プロフィールを設定
    const adminProfile = {
      id: 'admin-user',
      email: 'jin@namisapo.com',
      display_name: '管理者',
      avatar_url: null,
      is_admin: true,
      created_at: new Date().toISOString()
    }
    setProfile(adminProfile)
    setUser({ id: 'admin-user', email: 'jin@namisapo.com' } as any)
    console.log('Admin profile and user set in state')
  }

  const logout = () => {
    // 管理者ログイン状態をクリア
    localStorage.removeItem('adminLoggedIn')
    localStorage.removeItem('adminEmail')
    
    // 管理者フラグをリセット
    if (profile) {
      setProfile({ ...profile, is_admin: false })
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      
      if (error) {
        console.error('Error signing in with Google:', error)
        throw error
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      
      // ローカル状態もクリア
      logout()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    updateProfile,
    loginAsAdmin,
    logout,
    signInWithGoogle,
    signOut
  }
}