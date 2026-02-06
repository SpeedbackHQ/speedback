'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BunnyMascot } from './BunnyMascot'

interface CelebrationProps {
  message?: string
  elapsedTime?: number // in milliseconds
  onComplete?: () => void
}

// Format time: decimal for <60s, whole numbers for 60s+
const formatTime = (ms: number) => {
  const seconds = ms / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`  // "32.7 seconds"
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSecs = Math.floor(seconds % 60)  // No decimal for 60s+
  return `${minutes}m ${remainingSecs}s`  // "2m 15s"
}

// Pre-generate confetti data (seeded by index for stability)
const generateConfetti = () => Array.from({ length: 50 }, (_, i) => {
  // Use index-based pseudo-random for stable values
  const r1 = ((i * 9301 + 49297) % 233280) / 233280
  const r2 = ((i * 7919 + 12345) % 233280) / 233280
  const r3 = ((i * 3571 + 67890) % 233280) / 233280
  const r4 = ((i * 5387 + 11111) % 233280) / 233280
  const r5 = ((i * 2749 + 22222) % 233280) / 233280
  const r6 = ((i * 8191 + 33333) % 233280) / 233280

  return {
    id: i,
    x: r1 * 100,
    delay: r2 * 0.5,
    duration: 2 + r3 * 2,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][
      Math.floor(r4 * 7)
    ],
    size: 8 + r5 * 8,
    rotation: r6 * 360,
    isRound: r4 > 0.5,
  }
})

const CONFETTI_DATA = generateConfetti()

export function Celebration({ message = 'Thanks for your feedback!', elapsedTime, onComplete }: CelebrationProps) {
  const confetti = useMemo(() => CONFETTI_DATA, [])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-400 overflow-hidden">
      {/* Confetti */}
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: -20,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.isRound ? '50%' : '2px',
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: '100vh',
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'linear',
          }}
        />
      ))}

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-8"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
      >
        {/* Bunny Mascot */}
        <BunnyMascot state="celebrating" size="lg" className="mb-6" />

        {/* Message */}
        <motion.h1
          className="text-4xl font-bold text-white mb-4 drop-shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {message}
        </motion.h1>

        {/* Elapsed time display */}
        {elapsedTime !== undefined && elapsedTime > 0 && (
          <>
            <motion.div
              className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-white/70 text-sm mb-1">Completed in</p>
              <p className="text-3xl font-bold text-white">
                {formatTime(elapsedTime)}
              </p>
            </motion.div>

            <motion.p
              className="text-white/90 text-lg font-medium mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Wow, that was fast! ⚡
            </motion.p>
          </>
        )}

        {!elapsedTime && (
          <motion.p
            className="text-white/80 text-lg mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Your feedback helps us improve!
          </motion.p>
        )}

        {/* Optional action button */}
        {onComplete && (
          <motion.button
            onClick={onComplete}
            className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-full shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Done
          </motion.button>
        )}
      </motion.div>

      {/* Background circles */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-white/10"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1.2] }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-white/10"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.8, 1.5] }}
        transition={{ duration: 1, delay: 0.4 }}
      />
    </div>
  )
}
