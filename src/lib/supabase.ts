import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      diary: {
        Row: {
          id: string
          user_id: string | null
          nickname: string | null
          content: string | null
          emotion: string | null
          created_at: string | null
          is_public: boolean | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          nickname?: string | null
          content?: string | null
          emotion?: string | null
          created_at?: string | null
          is_public?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string | null
          nickname?: string | null
          content?: string | null
          emotion?: string | null
          created_at?: string | null
          is_public?: boolean | null
        }
      }
      comments: {
        Row: {
          id: string
          diary_id: string
          user_id: string | null
          nickname: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          diary_id: string
          user_id?: string | null
          nickname?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          diary_id?: string
          user_id?: string | null
          nickname?: string | null
          content?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          is_admin: boolean | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean | null
          created_at?: string
        }
      }
    }
  }
}