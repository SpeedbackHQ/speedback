'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface BingoCardQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const stampColors = [
  { bg: 'bg-red-500', ring: 'ring-red-300' },
  { bg: 'bg-blue-500', ring: 'ring-blue-300' },
  { bg: 'bg-emerald-500', ring: 'ring-emerald-300' },
  { bg: 'bg-amber-500', ring: 'ring-amber-300' },
]

export function BingoCardQuestion({ question, onAnswer }: BingoCardQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4)

  const [selected, setSelected] = useState<string[]>([])
  const [stampAnimating, setStampAnimating] = useState<string | null>(null)

  const handleStamp = useCallback((option: string) => {
    if (navigator.vibrate) navigator.vibrate(40)
    setStampAnimating(option)
    setTimeout(() => setStampAnimating(null), 400)

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

  // Use 2x2 grid for 3-4 options, single column for 2
  const gridCols = options.length <= 2 ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-5 text-sm">
        Stamp your picks!
      </p>

      {/* Bingo card container */}
      <motion.div
        className="bg-white rounded-2xl border-4 border-violet-200 p-3 shadow-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">Pick your answers</span>
        </div>

        <div className={`grid ${gridCols} gap-3`}>
          {options.map((option, index) => {
            const isSelected = selected.includes(option)
            const isAnimating = stampAnimating === option
            const color = stampColors[index % stampColors.length]

            return (
              <motion.button
                key={option}
                onClick={() => handleStamp(option)}
                className={`relative aspect-square rounded-xl border-2 border-dashed flex items-center justify-center p-3 transition-colors ${
                  isSelected
                    ? `${color.bg} border-transparent`
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Stamp animation overlay */}
                <AnimatePresence>
                  {isAnimating && isSelected && (
                    <motion.div
                      className={`absolute inset-0 rounded-xl ${color.bg} ring-4 ${color.ring}`}
                      initial={{ scale: 1.8, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </AnimatePresence>

                {/* Stamp mark */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-2 rounded-lg border-4 border-white/40 flex items-center justify-center"
                    initial={{ scale: 2, rotate: -15, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <span className="text-3xl">✓</span>
                  </motion.div>
                )}

                {/* Option text */}
                <span className={`font-bold text-sm text-center leading-tight relative z-10 ${
                  isSelected ? 'text-white' : 'text-gray-700'
                }`}>
                  {option}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Selected count */}
      {selected.length > 0 && (
        <motion.p
          className="text-center text-gray-500 mt-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="font-bold text-violet-500">{selected.length}</span> stamped
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
        {selected.length > 0 ? '🎰 Bingo!' : 'Stamp to select'}
      </motion.button>
    </div>
  )
}
