import { useState, useEffect, useCallback } from 'react'
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
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 管理者ログイン状態をチェックする関数
  const checkAdminStatus = useCallback(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
    const adminEmail = localStorage.getItem('adminEmail')
    return adminLoggedIn && adminEmail === 'jin@namisapo.com'
  }, [])

  // プロフィール取得関数
  const fetchProfile = useCallback(async (userId: string) => {
    try {

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return null
      }

      if (data) {

        return data
      } else {

        return await createProfile(userId)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      return null
    }
  }, [])

  // プロフィール作成関数
  const createProfile = useCallback(async (userId: string) => {
    try {

      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      
      if (!user) {

        return null
      }

      const newProfile = {
        id: userId,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '匿名',
        avatar_url: user.user_metadata?.avatar_url || null,
        is_admin: user.email === 'jin@namisapo.com',
      }



      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        // フォールバックプロフィールを返す
        return {
          id: userId,
          email: user.email || null,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '匿名',
          avatar_url: user.user_metadata?.avatar_url || null,
          is_admin: user.email === 'jin@namisapo.com',
          created_at: new Date().toISOString()
        }
      }


      return data
    } catch (error) {
      console.error('Error in createProfile:', error)
      return null
    }
  }, [])

  // 初期化処理
  useEffect(() => {
    if (isInitialized) return


    
    const initializeAuth = async () => {
      try {
        // 管理者ログイン状態をチェック
        const isAdmin = checkAdminStatus()
        setIsAdminMode(isAdmin)
        
        // 現在のセッションを取得

        const { data: { session } } = await supabase.auth.getSession()

        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {

          if (isAdmin) {
            // 管理者モードの場合
            const adminProfile = {
              id: session.user.id,
              email: 'jin@namisapo.com',
              display_name: '管理者',
              avatar_url: null,
              is_admin: true,
              created_at: new Date().toISOString()
            }
            setProfile(adminProfile)
          } else {
            // 通常ユーザーの場合
            const profileData = await fetchProfile(session.user.id)
            if (profileData) {
              setProfile(profileData)
            }
          }
        } else if (isAdmin) {
          // 管理者モードだがユーザーがログインしていない場合
          const adminProfile = {
            id: 'admin-user',
            email: 'jin@namisapo.com',
            display_name: '管理者',
            avatar_url: null,
            is_admin: true,
            created_at: new Date().toISOString()
          }
          setProfile(adminProfile)
          setUser({ id: 'admin-user', email: 'jin@namisapo.com' } as User)
        }
        
        setLoading(false)
        setIsInitialized(true)

      } catch (error) {
        console.error('Error in initializeAuth:', error)
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [isInitialized, checkAdminStatus])

  // 認証状態変更の監視
  useEffect(() => {
    if (!isInitialized) return


    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        
        if (event === 'SIGNED_OUT') {

          setSession(null)
          setUser(null)
          setProfile(null)
          setIsAdminMode(false)
          localStorage.removeItem('adminLoggedIn')
          localStorage.removeItem('adminEmail')
          setLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {

          const isAdmin = checkAdminStatus()
          
          if (isAdmin) {
            // 管理者モードの場合
            const adminProfile = {
              id: session.user.id,
              email: 'jin@namisapo.com',
              display_name: '管理者',
              avatar_url: null,
              is_admin: true,
              created_at: new Date().toISOString()
            }
            setProfile(adminProfile)
          } else {
            // 通常ユーザーの場合
            const profileData = await fetchProfile(session.user.id)
            if (profileData) {
              setProfile(profileData)
            }
          }
        } else {

          const isAdmin = checkAdminStatus()
          if (isAdmin) {
            const adminProfile = {
              id: 'admin-user',
              email: 'jin@namisapo.com',
              display_name: '管理者',
              avatar_url: null,
              is_admin: true,
              created_at: new Date().toISOString()
            }
            setProfile(adminProfile)
            setUser({ id: 'admin-user', email: 'jin@namisapo.com' } as User)
          }
        }
        
        setLoading(false)

      }
    )

    return () => subscription.unsubscribe()
  }, [isInitialized, checkAdminStatus])

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates })
    }
  }

  const loginAsAdmin = () => {
    console.log('loginAsAdmin called')
    
    setIsAdminMode(true)
    localStorage.setItem('adminLoggedIn', 'true')
    localStorage.setItem('adminEmail', 'jin@namisapo.com')
    
    const currentUserId = user?.id || 'admin-user'
    const adminProfile = {
      id: currentUserId,
      email: 'jin@namisapo.com',
      display_name: '管理者',
      avatar_url: null,
      is_admin: true,
      created_at: new Date().toISOString()
    }
    
    console.log('Setting admin profile:', adminProfile)
    setProfile(adminProfile)
    
    if (user) {
      setUser({ ...user, email: 'jin@namisapo.com' })
    } else {
      setUser({ id: currentUserId, email: 'jin@namisapo.com' } as User)
    }
    
    console.log('Admin login completed')
  }

  const logout = () => {
    setIsAdminMode(false)
    localStorage.removeItem('adminLoggedIn')
    localStorage.removeItem('adminEmail')
    
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
  
      
      setIsAdminMode(false)
      localStorage.removeItem('adminLoggedIn')
      localStorage.removeItem('adminEmail')
      setProfile(null)
      setUser(null)
      setSession(null)
      setLoading(false)
      

      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      

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