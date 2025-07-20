import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface SystemSettings {
  allow_new_registration: boolean
  allow_anonymous_posts: boolean
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    allow_new_registration: true,
    allow_anonymous_posts: true
  })
  const [loading, setLoading] = useState(true)

  // システム設定を取得
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')

      if (error) throw error

      const newSettings: SystemSettings = {
        allow_new_registration: true,
        allow_anonymous_posts: true
      }

      data?.forEach(item => {
        if (item.key === 'allow_new_registration') {
          newSettings.allow_new_registration = item.value === 'true'
        }
        if (item.key === 'allow_anonymous_posts') {
          newSettings.allow_anonymous_posts = item.value === 'true'
        }
      })

      setSettings(newSettings)
    } catch (error) {
      console.error('Error fetching system settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 設定を更新
  const updateSetting = async (key: keyof SystemSettings, value: boolean) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key,
          value: value.toString()
        })

      if (error) throw error

      setSettings(prev => ({
        ...prev,
        [key]: value
      }))

      return true
    } catch (error) {
      console.error('Error updating system setting:', error)
      return false
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    updateSetting,
    refetch: fetchSettings
  }
} 