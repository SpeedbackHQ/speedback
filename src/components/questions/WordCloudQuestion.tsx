'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface WordCloudQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const chipColors = [
  { selected: 'bg-violet-500 text-white border-violet-500', unselected: 'bg-white text-gray-700 border-gray-200' },
  { selected: 'bg-violet-500 text-white border-violet-500', unselected: 'bg-white text-gray-700 border-gray-200' },
  { selected: 'bg-sky-500 text-white border-sky-500', unselected: 'bg-white text-gray-700 border-gray-200' },
  { selected: 'bg-emerald-500 text-white border-emerald-500', unselected: 'bg-white text-gray-700 border-gray-200' },
  { selected: 'bg-amber-500 text-white border-amber-500', unselected: 'bg-white text-gray-700 border-gray-200' },
  { selected: 'bg-rose-500 text-white border-rose-500', unselected: 'bg-white text-gray-700 border-gray-200' },
]

export function WordCloudQuestion({ question, onAnswer }: WordCloudQuestionProps) {
  const {
    words = ['Creative', 'Fun', 'Boring', 'Innovative', 'Slow', 'Exciting', 'Confusing', 'Clear', 'Inspiring', 'Tedious'],
    max_selections = 5,
  } = question.config as { words?: string[]; max_selections?: number }

  const [selected, setSelected] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)

  const atMax = selected.length >= max_selections

  const handleToggle = useCallback((word: string) => {
    if (isSubmitted) return

    setSelected(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word)
      }
      if (prev.length >= max_selections) return prev
      return [...prev, word]
    })

    if (navigator.vibrate) {
      navigator.vibrate(15)
    }
  }, [isSubmitted, max_selections])

  const handleSubmit = useCallback(() => {
    if (selected.length === 0 || isSubmitted) return
    setIsSubmitted(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 40])
    }

    setTimeout(() => {
      onAnswer(selected)
    }, 500)
  }, [selected, isSubmitted, onAnswer])

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
        Pick up to {max_selections} words
      </p>

      {/* Word cloud */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {words.map((word, i) => {
          const isSelected = selected.includes(word)
          const isDisabled = !isSelected && atMax
          const colorSet = chipColors[i % chipColors.length]

          return (
            <motion.button
              key={word}
              onClick={() => handleToggle(word)}
              disabled={isSubmitted || isDisabled}
              className={`
                px-4 py-2 rounded-full border-2 font-medium transition-all
                ${isSelected ? colorSet.selected + ' shadow-md' : colorSet.unselected}
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${word.length > 8 ? 'text-sm' : 'text-base'}
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: isSelected ? 1.05 : 1,
              }}
              transition={{
                opacity: { delay: i * 0.03 },
                scale: { type: 'spring', stiffness: 400, damping: 15 },
              }}
              whileTap={!isSubmitted && !isDisabled ? { scale: 0.92 } : {}}
            >
              {word}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Counter */}
      <div className="text-center mb-4">
        <motion.span
          key={selected.length}
          className={`text-sm font-medium ${selected.length > 0 ? 'text-violet-500' : 'text-gray-400'}`}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
        >
          {selected.length}/{max_selections} selected
        </motion.span>
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={selected.length === 0 || isSubmitted}
        className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
          selected.length > 0 && !isSubmitted
            ? 'bg-violet-500 text-white hover:bg-violet-600'
            : isSubmitted
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={selected.length > 0 && !isSubmitted ? { scale: 0.97 } : {}}
      >
        {isSubmitted ? 'Sent!' : `Done (${selected.length})`}
      </motion.button>

      {/* Confirmation */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap justify-center gap-1.5">
              {selected.map((word) => (
                <span key={word} className="inline-block bg-violet-100 text-violet-600 px-3 py-1 rounded-full text-sm font-medium">
                  {word}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
