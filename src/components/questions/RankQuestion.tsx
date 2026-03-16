'use client'

import { useState, useCallback, useMemo } from 'react'
import { Reorder, motion } from 'framer-motion'
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
  'from-cyan-500 to-blue-500',
  'from-red-500 to-rose-600',
]

export function RankQuestion({ question, onAnswer }: RankQuestionProps) {
  const { items: rawItems = [] } = question.config as { items?: string[] }
  const initialItems = useMemo(() => (rawItems as string[]).slice(0, 6), [rawItems])

  const [ranked, setRanked] = useState<string[]>(initialItems)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        Drag to reorder
      </p>

      {/* Draggable ranked list */}
      <Reorder.Group
        axis="y"
        values={ranked}
        onReorder={(newOrder) => {
          if (!isSubmitting) {
            setRanked(newOrder)
            if (navigator.vibrate) navigator.vibrate(10)
          }
        }}
        className="space-y-2"
      >
        {ranked.map((item, index) => (
          <Reorder.Item
            key={item}
            value={item}
            dragListener={!isSubmitting}
            className={`flex items-center gap-3 bg-gradient-to-r ${rankColors[index % rankColors.length]} rounded-xl px-4 py-3.5 shadow-md cursor-grab active:cursor-grabbing active:shadow-xl active:z-10`}
            whileDrag={{ scale: 1.03 }}
          >
            {/* Drag handle */}
            <div className="text-white/50 text-lg select-none flex-shrink-0" style={{ lineHeight: 1 }}>
              ⠿
            </div>

            {/* Rank number */}
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">{index + 1}</span>
            </div>

            {/* Item name */}
            <span className="flex-1 text-white font-semibold text-base select-none">
              {item}
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>

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
