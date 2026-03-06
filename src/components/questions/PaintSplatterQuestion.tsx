'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface PaintSplatterQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const splatColors = [
  { base: '#a855f7', gradient: 'from-purple-400 to-purple-600', bg: 'bg-purple-500' },
  { base: '#ec4899', gradient: 'from-pink-400 to-pink-600', bg: 'bg-pink-500' },
  { base: '#06b6d4', gradient: 'from-cyan-400 to-cyan-600', bg: 'bg-cyan-500' },
  { base: '#f59e0b', gradient: 'from-amber-400 to-amber-600', bg: 'bg-amber-500' },
]

export function PaintSplatterQuestion({ question, onAnswer }: PaintSplatterQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4)

  const [selected, setSelected] = useState<string[]>([])
  const [splatKey, setSplatKey] = useState(0)

  const handleTap = useCallback((option: string) => {
    if (navigator.vibrate) navigator.vibrate(30)
    setSplatKey(prev => prev + 1)

    setSelected(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    )
  }, [])

  const handleSubmit = useCallback(() => {
    if (selected.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(selected)
  }, [selected, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-6 text-sm">
        Tap to splash your picks!
      </p>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option, index) => {
          const isSelected = selected.includes(option)
          const color = splatColors[index % splatColors.length]

          return (
            <motion.button
              key={option}
              onClick={() => handleTap(option)}
              className="relative h-28 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Gray background */}
              <div className="absolute inset-0 bg-gray-100" />

              {/* Paint splatter fill */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    key={`splat-${option}-${splatKey}`}
                    className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`}
                    initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{ clipPath: 'circle(100% at 50% 50%)' }}
                    exit={{ clipPath: 'circle(0% at 50% 50%)' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                )}
              </AnimatePresence>

              {/* Splatter dots (decorative) */}
              {isSelected && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`dot-${i}`}
                      className="absolute rounded-full"
                      style={{
                        backgroundColor: color.base,
                        width: 8 + (i % 3) * 6,
                        height: 8 + (i % 3) * 6,
                        left: `${15 + (i * 17) % 70}%`,
                        top: `${10 + (i * 23) % 70}%`,
                        opacity: 0.4,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                    />
                  ))}
                </>
              )}

              {/* Label */}
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <span className={`font-bold text-sm text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {option}
                </span>
              </div>

              {/* Check badge */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/40 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* Selected count */}
      {selected.length > 0 && (
        <motion.p
          className="text-center text-gray-500 mt-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="font-bold text-violet-500">{selected.length}</span> splashed
        </motion.p>
      )}

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className={`w-full mt-4 py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          selected.length > 0
            ? 'bg-violet-500 text-white hover:bg-violet-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={selected.length > 0 ? { scale: 0.98 } : {}}
      >
        {selected.length > 0 ? '🎨 Done!' : 'Tap to splash'}
      </motion.button>
    </div>
  )
}
