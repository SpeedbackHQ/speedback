'use client'

import { motion } from 'framer-motion'

type MascotMood = 'neutral' | 'happy' | 'excited' | 'thinking' | 'celebrating'

interface MascotProps {
  mood?: MascotMood
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Mascot({ mood = 'neutral', size = 'md', className = '' }: MascotProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const moodConfig = {
    neutral: {
      bodyColor: 'from-purple-400 to-purple-600',
      eyeScale: 1,
      mouthPath: 'M 30 55 Q 40 55 50 55',
      bounce: false,
    },
    happy: {
      bodyColor: 'from-green-400 to-green-600',
      eyeScale: 1.1,
      mouthPath: 'M 30 52 Q 40 62 50 52',
      bounce: false,
    },
    excited: {
      bodyColor: 'from-pink-400 to-pink-600',
      eyeScale: 1.2,
      mouthPath: 'M 28 50 Q 40 70 52 50',
      bounce: true,
    },
    thinking: {
      bodyColor: 'from-blue-400 to-blue-600',
      eyeScale: 0.9,
      mouthPath: 'M 35 55 Q 40 52 45 55',
      bounce: false,
    },
    celebrating: {
      bodyColor: 'from-yellow-400 to-orange-500',
      eyeScale: 1.3,
      mouthPath: 'M 25 48 Q 40 75 55 48',
      bounce: true,
    },
  }

  const config = moodConfig[mood]

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={config.bounce ? {
        y: [0, -20, 0],
        rotate: [0, -5, 5, 0],
      } : {}}
      transition={config.bounce ? {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'loop',
      } : {}}
    >
      <svg viewBox="0 0 80 80" className="w-full h-full">
        {/* Body - blob shape */}
        <motion.ellipse
          cx="40"
          cy="45"
          rx="30"
          ry="28"
          className={`fill-current`}
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        />
        <defs>
          <linearGradient id={`mascot-gradient-${mood}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className={config.bodyColor.includes('purple') ? 'text-purple-400' :
              config.bodyColor.includes('green') ? 'text-green-400' :
              config.bodyColor.includes('pink') ? 'text-pink-400' :
              config.bodyColor.includes('blue') ? 'text-blue-400' :
              'text-yellow-400'} stopColor="currentColor" />
            <stop offset="100%" className={config.bodyColor.includes('purple') ? 'text-purple-600' :
              config.bodyColor.includes('green') ? 'text-green-600' :
              config.bodyColor.includes('pink') ? 'text-pink-600' :
              config.bodyColor.includes('blue') ? 'text-blue-600' :
              'text-orange-500'} stopColor="currentColor" />
          </linearGradient>
        </defs>
        <motion.ellipse
          cx="40"
          cy="45"
          rx="30"
          ry="28"
          fill={`url(#mascot-gradient-${mood})`}
        />

        {/* Eyes */}
        <motion.ellipse
          cx="30"
          cy="40"
          rx="5"
          ry="6"
          fill="white"
          animate={{ scaleY: config.eyeScale }}
        />
        <motion.ellipse
          cx="50"
          cy="40"
          rx="5"
          ry="6"
          fill="white"
          animate={{ scaleY: config.eyeScale }}
        />

        {/* Pupils */}
        <motion.circle cx="31" cy="41" r="2.5" fill="#333" />
        <motion.circle cx="51" cy="41" r="2.5" fill="#333" />

        {/* Eye shine */}
        <circle cx="29" cy="39" r="1" fill="white" />
        <circle cx="49" cy="39" r="1" fill="white" />

        {/* Mouth */}
        <motion.path
          d={config.mouthPath}
          stroke="#333"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Blush marks for happy/excited moods */}
        {(mood === 'happy' || mood === 'excited' || mood === 'celebrating') && (
          <>
            <ellipse cx="20" cy="50" rx="4" ry="2" fill="rgba(255,182,193,0.6)" />
            <ellipse cx="60" cy="50" rx="4" ry="2" fill="rgba(255,182,193,0.6)" />
          </>
        )}

        {/* Celebration sparkles */}
        {mood === 'celebrating' && (
          <>
            <motion.circle
              cx="15"
              cy="20"
              r="3"
              fill="#FFD700"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="65"
              cy="25"
              r="2"
              fill="#FF69B4"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
            />
            <motion.circle
              cx="70"
              cy="15"
              r="2.5"
              fill="#00CED1"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  )
}
