'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface RankQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const rankColors = [
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
]

export function RankQuestion({ question, onAnswer }: RankQuestionProps) {
  const { items: rawItems = [] } = question.config as { items?: string[] }
  const initialItems = useMemo(() => (rawItems as string[]).slice(0, 6), [rawItems])

  const [ranked, setRanked] = useState<string[]>(initialItems)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const moveUp = useCallback((index: number) => {
    if (index === 0 || isSubmitting) return
    if (navigator.vibrate) navigator.vibrate(15)
    setRanked(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }, [isSubmitting])

  const moveDown = useCallback((index: number) => {
    if (index === ranked.length - 1 || isSubmitting) return
    if (navigator.vibrate) navigator.vibrate(15)
    setRanked(prev => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }, [ranked.length, isSubmitting])

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    setTimeout(() => {
      onAnswer(ranked)
    }, 300)
  }, [ranked, onAnswer, isSubmitting])

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
        Use arrows to reorder from best to worst
      </p>

      {/* Ranked list */}
      <div className="space-y-2">
        <AnimatePresence>
          {ranked.map((item, index) => (
            <motion.div
              key={item}
              layout
              className={`flex items-center gap-3 bg-gradient-to-r ${rankColors[index % rankColors.length]} rounded-xl px-4 py-3 shadow-md`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Rank number */}
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">{index + 1}</span>
              </div>

              {/* Item name */}
              <span className="flex-1 text-white font-semibold text-base">
                {item}
              </span>

              {/* Move buttons */}
              {!isSubmitting && (
                <div className="flex flex-col gap-0.5">
                  <motion.button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-white/10 text-white/30'
                        : 'bg-white/25 text-white hover:bg-white/40'
                    }`}
                    whileTap={index > 0 ? { scale: 0.85 } : {}}
                  >
                    ▲
                  </motion.button>
                  <motion.button
                    onClick={() => moveDown(index)}
                    disabled={index === ranked.length - 1}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold ${
                      index === ranked.length - 1
                        ? 'bg-white/10 text-white/30'
                        : 'bg-white/25 text-white hover:bg-white/40'
                    }`}
                    whileTap={index < ranked.length - 1 ? { scale: 0.85 } : {}}
                  >
                    ▼
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
          isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-violet-500 text-white hover:bg-violet-600'
        }`}
        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? 'Submitting...' : 'Confirm Ranking'}
      </motion.button>
    </div>
  )
}
