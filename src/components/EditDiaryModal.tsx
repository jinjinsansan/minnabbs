import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Database } from '../lib/supabase'

type DiaryEntry = Database['public']['Tables']['diary']['Row']

interface EditDiaryModalProps {
  diary: DiaryEntry
  onSave: (updates: Partial<DiaryEntry>) => void
  onClose: () => void
}

const EditDiaryModal: React.FC<EditDiaryModalProps> = ({ diary, onSave, onClose }) => {
  const [content, setContent] = useState(diary.content || '')
  const [nickname, setNickname] = useState(diary.nickname || '')
  const [isAnonymous, setIsAnonymous] = useState(!diary.nickname)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      content: content.trim(),
      nickname: isAnonymous ? null : nickname.trim() || null,
      emotion: null
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black">ツイートを編集</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input text-xl placeholder-gray-500"
                rows={4}
                placeholder="いまどうしてる？"
                maxLength={280}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {280 - content.length} 文字残り
                </span>
              </div>
            </div>

            {/* Nickname */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-black">
                  表示名
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">匿名</span>
                </label>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isAnonymous}
                className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="表示名を入力..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditDiaryModal