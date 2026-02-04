'use client'

import { motion } from 'framer-motion'

export type BunnyState = 'idle' | 'ready' | 'running' | 'celebrating'

interface BunnyMascotProps {
  state?: BunnyState
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function BunnyMascot({ state = 'idle', size = 'md', className = '' }: BunnyMascotProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  }

  const sizeMap = {
    sm: 64,
    md: 96,
    lg: 128,
    xl: 192,
  }

  const svgSize = sizeMap[size]

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={state === 'idle' ? {
        y: [0, -5, 0],
      } : state === 'ready' ? {
        scale: [1, 1.05, 1],
      } : state === 'running' ? {
        x: [0, 5, 0, -5, 0],
      } : state === 'celebrating' ? {
        y: [0, -15, 0],
        rotate: [0, -5, 5, 0],
      } : {}}
      transition={{
        duration: state === 'running' ? 0.2 : state === 'celebrating' ? 0.5 : 1,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      <svg viewBox="0 0 100 100" width={svgSize} height={svgSize}>
        {/* Body - rounded oval */}
        <motion.ellipse
          cx="50"
          cy="60"
          rx="25"
          ry="28"
          fill="#F5F5F5"
          stroke="#E0E0E0"
          strokeWidth="2"
          animate={state === 'ready' ? { ry: 24 } : { ry: 28 }}
        />

        {/* Belly */}
        <ellipse
          cx="50"
          cy="65"
          rx="15"
          ry="18"
          fill="#FFFFFF"
        />

        {/* Athletic vest - red with white stripe */}
        <path
          d="M 30 50 Q 50 45 70 50 L 65 75 Q 50 80 35 75 Z"
          fill="#EF4444"
        />
        <path
          d="M 45 50 Q 50 48 55 50 L 55 75 Q 50 77 45 75 Z"
          fill="#FFFFFF"
        />

        {/* Left ear */}
        <motion.ellipse
          cx="35"
          cy="20"
          rx="8"
          ry="20"
          fill="#F5F5F5"
          stroke="#E0E0E0"
          strokeWidth="2"
          animate={state === 'running' ? { rotate: -20, originX: 35, originY: 40 } : { rotate: 0 }}
          style={{ transformOrigin: '35px 40px' }}
        />
        <ellipse cx="35" cy="20" rx="4" ry="12" fill="#FFB6C1" />

        {/* Right ear */}
        <motion.ellipse
          cx="65"
          cy="20"
          rx="8"
          ry="20"
          fill="#F5F5F5"
          stroke="#E0E0E0"
          strokeWidth="2"
          animate={state === 'running' ? { rotate: 20, originX: 65, originY: 40 } : { rotate: 0 }}
          style={{ transformOrigin: '65px 40px' }}
        />
        <ellipse cx="65" cy="20" rx="4" ry="12" fill="#FFB6C1" />

        {/* Headband - orange/red */}
        <rect x="28" y="35" width="44" height="6" rx="3" fill="#F97316" />
        <circle cx="72" cy="32" r="4" fill="#F97316" /> {/* Headband knot */}
        <path d="M 72 32 Q 78 28 80 35 Q 82 42 76 38" fill="#F97316" /> {/* Headband tail */}

        {/* Face */}
        {/* Eyes */}
        <motion.ellipse
          cx="42"
          cy="48"
          rx="4"
          ry={state === 'celebrating' ? 2 : 5}
          fill="#333"
        />
        <motion.ellipse
          cx="58"
          cy="48"
          rx="4"
          ry={state === 'celebrating' ? 2 : 5}
          fill="#333"
        />
        {/* Eye shine */}
        <circle cx="40" cy="46" r="1.5" fill="white" />
        <circle cx="56" cy="46" r="1.5" fill="white" />

        {/* Nose */}
        <ellipse cx="50" cy="55" rx="3" ry="2" fill="#FFB6C1" />

        {/* Mouth */}
        <motion.path
          d={state === 'celebrating'
            ? "M 44 58 Q 50 66 56 58"
            : state === 'ready'
            ? "M 46 58 Q 50 60 54 58"
            : "M 45 58 Q 50 62 55 58"}
          stroke="#333"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Whiskers */}
        <line x1="30" y1="52" x2="38" y2="54" stroke="#CCC" strokeWidth="1" />
        <line x1="30" y1="56" x2="38" y2="56" stroke="#CCC" strokeWidth="1" />
        <line x1="62" y1="54" x2="70" y2="52" stroke="#CCC" strokeWidth="1" />
        <line x1="62" y1="56" x2="70" y2="56" stroke="#CCC" strokeWidth="1" />

        {/* Left leg + running shoe */}
        <motion.g
          animate={state === 'running' ? {
            rotate: [0, 30, 0, -30, 0],
          } : {}}
          transition={{ duration: 0.2, repeat: Infinity }}
          style={{ transformOrigin: '40px 85px' }}
        >
          <ellipse cx="40" cy="88" rx="5" ry="8" fill="#F5F5F5" />
          {/* Shoe */}
          <ellipse cx="40" cy="95" rx="8" ry="4" fill="#3B82F6" />
          <ellipse cx="38" cy="95" rx="3" ry="2" fill="#FFFFFF" />
          {/* Shoe stripe */}
          <path d="M 35 93 Q 40 91 45 93" stroke="#EF4444" strokeWidth="2" fill="none" />
        </motion.g>

        {/* Right leg + running shoe */}
        <motion.g
          animate={state === 'running' ? {
            rotate: [0, -30, 0, 30, 0],
          } : {}}
          transition={{ duration: 0.2, repeat: Infinity }}
          style={{ transformOrigin: '60px 85px' }}
        >
          <ellipse cx="60" cy="88" rx="5" ry="8" fill="#F5F5F5" />
          {/* Shoe */}
          <ellipse cx="60" cy="95" rx="8" ry="4" fill="#3B82F6" />
          <ellipse cx="58" cy="95" rx="3" ry="2" fill="#FFFFFF" />
          {/* Shoe stripe */}
          <path d="M 55 93 Q 60 91 65 93" stroke="#EF4444" strokeWidth="2" fill="none" />
        </motion.g>

        {/* Arms */}
        <motion.ellipse
          cx="25"
          cy="60"
          rx="5"
          ry="10"
          fill="#F5F5F5"
          stroke="#E0E0E0"
          strokeWidth="1"
          animate={state === 'running' ? { rotate: [0, 20, 0, -20, 0] } :
                   state === 'celebrating' ? { rotate: [0, -30, 0] } : {}}
          transition={{ duration: state === 'celebrating' ? 0.5 : 0.2, repeat: Infinity }}
          style={{ transformOrigin: '25px 55px' }}
        />
        <motion.ellipse
          cx="75"
          cy="60"
          rx="5"
          ry="10"
          fill="#F5F5F5"
          stroke="#E0E0E0"
          strokeWidth="1"
          animate={state === 'running' ? { rotate: [0, -20, 0, 20, 0] } :
                   state === 'celebrating' ? { rotate: [0, 30, 0] } : {}}
          transition={{ duration: state === 'celebrating' ? 0.5 : 0.2, repeat: Infinity }}
          style={{ transformOrigin: '75px 55px' }}
        />

        {/* Speed lines when running */}
        {state === 'running' && (
          <>
            <motion.line
              x1="5" y1="50" x2="15" y2="50"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: [0, 1, 0], x: [10, 0, -10] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.line
              x1="5" y1="60" x2="20" y2="60"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: [0, 1, 0], x: [10, 0, -10] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
            />
            <motion.line
              x1="5" y1="70" x2="15" y2="70"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: [0, 1, 0], x: [10, 0, -10] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}

        {/* Sparkles when celebrating */}
        {state === 'celebrating' && (
          <>
            <motion.circle
              cx="20" cy="25" r="3"
              fill="#FFD700"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.circle
              cx="80" cy="30" r="2"
              fill="#FF69B4"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
            />
            <motion.circle
              cx="85" cy="50" r="2.5"
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
