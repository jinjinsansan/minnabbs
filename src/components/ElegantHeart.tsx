import React from 'react'

interface ElegantHeartProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const ElegantHeart: React.FC<ElegantHeartProps> = ({ 
  className = '', 
  size = 'md',
  color = 'currentColor'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  }

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* メインのハート形状 */}
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={color}
        stroke="none"
      />
      
      {/* 上部のハイライト */}
      <path
        d="M8.5 4.5c-1.5 0-2.8.6-3.8 1.6-.4.4-.7.9-.9 1.4-.1.3-.1.6-.1.9 0 .8.3 1.5.8 2.1l.3.3L12 18l7.2-7.2.3-.3c.5-.6.8-1.3.8-2.1 0-.3 0-.6-.1-.9-.2-.5-.5-1-.9-1.4-1-1-2.3-1.6-3.8-1.6-1.2 0-2.3.4-3.2 1.1L12 6.8l-.3-.2c-.9-.7-2-1.1-3.2-1.1z"
        fill="rgba(255,255,255,0.4)"
        stroke="none"
      />
      
      {/* 左上のスパークル効果 */}
      <circle
        cx="8"
        cy="7"
        r="1"
        fill="rgba(255,255,255,0.6)"
      />
      
      {/* 右上のスパークル効果 */}
      <circle
        cx="16"
        cy="7"
        r="0.8"
        fill="rgba(255,255,255,0.5)"
      />
      
      {/* 中央のハイライト */}
      <ellipse
        cx="12"
        cy="10"
        rx="2"
        ry="1.5"
        fill="rgba(255,255,255,0.2)"
      />
    </svg>
  )
}

export default ElegantHeart