import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useBlock = () => {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // ブロックしたユーザー一覧を取得
  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id)

      if (error) throw error
      setBlockedUsers(data?.map(block => block.blocked_id) || [])
    } catch (error) {
      console.error('Error fetching blocked users:', error)
    }
  }, [user])

  // ブロック状態をチェック
  const isBlocked = useCallback((userId: string) => {
    return blockedUsers.includes(userId)
  }, [blockedUsers])

  // ユーザーをブロック
  const blockUser = async (userId: string) => {
    if (!user || user.id === userId) return false

    try {
      setLoading(true)
      const { error } = await supabase
        .from('user_blocks')
        .insert([{
          blocker_id: user.id,
          blocked_id: userId
        }])

      if (error) throw error
      
      setBlockedUsers(prev => [...prev, userId])
      return true
    } catch (error) {
      console.error('Error blocking user:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // ブロックを解除
  const unblockUser = async (userId: string) => {
    if (!user) return false

    try {
      setLoading(true)
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)

      if (error) throw error
      
      setBlockedUsers(prev => prev.filter(id => id !== userId))
      return true
    } catch (error) {
      console.error('Error unblocking user:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // ブロック状態を切り替え
  const toggleBlock = async (userId: string) => {
    if (isBlocked(userId)) {
      return await unblockUser(userId)
    } else {
      return await blockUser(userId)
    }
  }

  useEffect(() => {
    fetchBlockedUsers()
  }, [fetchBlockedUsers])

  return {
    blockedUsers,
    isBlocked,
    blockUser,
    unblockUser,
    toggleBlock,
    loading,
    refetch: fetchBlockedUsers
  }
} 