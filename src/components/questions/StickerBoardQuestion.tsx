'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface StickerBoardQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const stickerStyles = [
  { bg: 'bg-purple-400', emoji: '💜' },
  { bg: 'bg-pink-400', emoji: '💗' },
  { bg: 'bg-cyan-400', emoji: '💎' },
  { bg: 'bg-amber-400', emoji: '⭐' },
]

export function StickerBoardQuestion({ question, onAnswer }: StickerBoardQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4)

  const [placed, setPlaced] = useState<string[]>([])

  // Stable random rotations per option
  const rotations = useMemo(
    () => options.map((_, i) => (i * 7 + 3) % 15 - 7),
    [options]
  )

  const handlePeel = useCallback((option: string) => {
    if (navigator.vibrate) navigator.vibrate(30)

    setPlaced(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    )
  }, [])

  const handleSubmit = useCallback(() => {
    if (placed.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(placed)
  }, [placed, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        Peel &amp; place your picks!
      </p>

      {/* Board area where placed stickers appear */}
      <motion.div
        className="relative bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl min-h-[100px] mb-4 p-3 flex flex-wrap gap-2 items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {placed.length === 0 ? (
          <span className="text-amber-400 text-sm">Stickers go here</span>
        ) : (
          <AnimatePresence>
            {placed.map((option) => {
              const idx = options.indexOf(option)
              const style = stickerStyles[idx % stickerStyles.length]
              const rotation = rotations[idx]

              return (
                <motion.div
                  key={option}
                  className={`${style.bg} text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-md`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                  initial={{ scale: 0, y: 40, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {style.emoji} {option}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Sticker sheet */}
      <div className="space-y-2.5">
        {options.map((option, index) => {
          const isPlaced = placed.includes(option)
          const style = stickerStyles[index % stickerStyles.length]

          return (
            <motion.button
              key={option}
              onClick={() => handlePeel(option)}
              className={`w-full rounded-xl p-3.5 font-semibold text-left transition-all border-2 ${
                isPlaced
                  ? 'bg-gray-100 border-gray-200 text-gray-400'
                  : `bg-white border-gray-200 text-gray-700 hover:border-gray-400`
              }`}
              initial={{ opacity: 0, x: -15 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: isPlaced ? 0.97 : 1,
              }}
              transition={{ delay: index * 0.06 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.emoji}</span>
                  <span className={isPlaced ? 'line-through' : ''}>{option}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {isPlaced ? 'placed ✓' : 'peel →'}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={placed.length === 0}
        className={`w-full mt-5 py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          placed.length > 0
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={placed.length > 0 ? { scale: 0.98 } : {}}
      >
        {placed.length > 0 ? `🏷️ Done! (${placed.length})` : 'Peel stickers to select'}
      </motion.button>
    </div>
  )
}
