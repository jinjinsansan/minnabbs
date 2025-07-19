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
    // 現在のセッションを取得
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
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

  const loginAsAdmin = () => {
    // 管理者ログイン状態をローカルストレージに保存
    localStorage.setItem('adminLoggedIn', 'true')
    localStorage.setItem('adminEmail', 'jin@namisapo.com')
    
    // 管理者プロフィールを設定
    if (profile) {
      setProfile({ ...profile, is_admin: true })
    }
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