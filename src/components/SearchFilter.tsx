import React, { useState } from 'react'
import { Search, Filter, X, Calendar, User, Hash } from 'lucide-react'

export interface FilterOptions {
  keyword: string
  username: string
  emotion: string
  dateFrom: string
  dateTo: string
}

interface SearchFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  totalCount: number
  filteredCount: number
}

const SearchFilter: React.FC<SearchFilterProps> = ({ 
  onFilterChange, 
  totalCount, 
  filteredCount 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    keyword: '',
    username: '',
    emotion: '',
    dateFrom: '',
    dateTo: ''
  })

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {
      keyword: '',
      username: '',
      emotion: '',
      dateFrom: '',
      dateTo: ''
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value.trim() !== '')

  return (
    <div className="bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-md rounded-3xl border-2 border-purple-200/50 p-6 mb-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Search className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">検索・フィルター</h3>
          {hasActiveFilters && (
            <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
              {filteredCount}/{totalCount}件
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
            >
              <X className="w-4 h-4" />
              <span>クリア</span>
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
              isExpanded 
                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-2 border-blue-300' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300 hover:from-gray-200 hover:to-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{isExpanded ? '閉じる' : '詳細検索'}</span>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            placeholder="キーワードで検索..."
            className="w-full pl-12 pr-4 py-3 border-2 border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-200 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium placeholder-purple-400"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-purple-200/50 animate-fade-in bg-gradient-to-br from-purple-50/30 to-white/30 rounded-2xl p-4 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username Filter */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-purple-700 mb-2">
                <User className="w-4 h-4 text-purple-500" />
                <span>ユーザー名</span>
              </label>
              <input
                type="text"
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
                placeholder="ユーザー名で絞り込み..."
                className="w-full px-3 py-2 border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              />
            </div>

            {/* Emotion Filter */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-purple-700 mb-2">
                <Hash className="w-4 h-4 text-purple-500" />
                <span>感情</span>
              </label>
              <select
                value={filters.emotion}
                onChange={(e) => handleFilterChange('emotion', e.target.value)}
                className="w-full px-3 py-2 border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                <option value="">すべての感情</option>
                <optgroup label="ネガティブな感情">
                  <option value="fear">恐怖</option>
                  <option value="sadness">悲しみ</option>
                  <option value="anger">怒り</option>
                  <option value="disgust">悔しい</option>
                  <option value="indifference">無価値感</option>
                  <option value="guilt">罪悪感</option>
                  <option value="loneliness">寂しさ</option>
                  <option value="shame">恥ずかしさ</option>
                </optgroup>
                <optgroup label="ポジティブな感情">
                  <option value="joy">嬉しい</option>
                  <option value="gratitude">感謝</option>
                  <option value="achievement">達成感</option>
                  <option value="happiness">幸せ</option>
                </optgroup>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-purple-700 mb-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>開始日</span>
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-purple-700 mb-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>終了日</span>
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border-2 border-purple-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              />
            </div>
          </div>

          {/* Search Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mt-4 border border-blue-200/50 shadow-sm">
            <h4 className="text-sm font-semibold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">検索のヒント</h4>
            <ul className="text-xs text-blue-700 space-y-1 font-medium">
              <li>• キーワード検索では日記の内容を検索できます</li>
              <li>• ユーザー名は部分一致で検索されます</li>
              <li>• 日付範囲を指定して期間を絞り込めます</li>
              <li>• 複数の条件を組み合わせて検索できます</li>
            </ul>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-purple-200/50 bg-gradient-to-r from-purple-50/30 to-pink-50/30 rounded-2xl p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700 font-medium">
              {totalCount}件中 <span className="font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent">{filteredCount}件</span> を表示
            </span>
            {filteredCount === 0 && (
              <span className="text-orange-600 font-semibold">
                条件に一致する日記が見つかりませんでした
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchFilter