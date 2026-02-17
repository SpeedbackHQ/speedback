'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface StreakCounterProps {
  streak: number
  isSpeedBonus: boolean
}

export function StreakCounter({ streak, isSpeedBonus }: StreakCounterProps) {
  if (streak < 2) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 right-4 z-50"
        initial={{ scale: 0, x: 50, opacity: 0 }}
        animate={{ scale: 1, x: 0, opacity: 1 }}
        exit={{ scale: 0, x: 50, opacity: 0 }}
      >
        <motion.div
          className={`
            px-4 py-2 rounded-full font-bold text-white shadow-lg
            ${isSpeedBonus
              ? 'bg-gradient-to-r from-orange-500 to-red-500'
              : 'bg-gradient-to-r from-violet-500 to-purple-500'}
          `}
          animate={isSpeedBonus ? {
            scale: [1, 1.15, 1],
            boxShadow: [
              '0 4px 15px rgba(249, 115, 22, 0.4)',
              '0 8px 25px rgba(249, 115, 22, 0.6)',
              '0 4px 15px rgba(249, 115, 22, 0.4)',
            ]
          } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <motion.span
              key={streak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black"
            >
              {streak}x
            </motion.span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs opacity-90">
                {isSpeedBonus ? 'SPEED' : 'streak'}
              </span>
              {isSpeedBonus && (
                <motion.span
                  className="text-[10px] opacity-80"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  BONUS!
                </motion.span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Glow effect for speed bonus */}
        {isSpeedBonus && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
