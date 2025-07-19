import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = 'https://icujegetejdnibgoytyn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdWplZ2V0ZWpkbmliZ295dHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkyOTQsImV4cCI6MjA2ODM0NTI5NH0.tdUjObZX1a-gvqmpUvXwVnESDmbwvG_aXTqvCXj7h5U'

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