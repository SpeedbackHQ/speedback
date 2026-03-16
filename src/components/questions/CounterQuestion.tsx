'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface CounterQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

export function CounterQuestion({ question, onAnswer }: CounterQuestionProps) {
  const [count, setCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const increment = useCallback(() => {
    if (isSubmitting) return
    setCount(prev => prev + 1)
    if (navigator.vibrate) navigator.vibrate(10)
  }, [isSubmitting])

  const decrement = useCallback(() => {
    if (isSubmitting || count === 0) return
    setCount(prev => Math.max(0, prev - 1))
    if (navigator.vibrate) navigator.vibrate(10)
  }, [isSubmitting, count])

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    setTimeout(() => {
      onAnswer(count)
    }, 300)
  }, [count, onAnswer, isSubmitting])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-8 text-sm">
        Tap to count
      </p>

      {/* Counter display */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Minus button */}
        <motion.button
          onClick={decrement}
          disabled={count === 0 || isSubmitting}
          className={`w-14 h-14 rounded-full text-2xl font-bold flex items-center justify-center shadow-md ${
            count === 0
              ? 'bg-gray-200 text-gray-400'
              : 'bg-rose-500 text-white hover:bg-rose-600'
          }`}
          whileTap={count > 0 ? { scale: 0.9 } : {}}
        >
          −
        </motion.button>

        {/* Count display */}
        <motion.div
          className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl"
          key={count}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <span className="text-white text-5xl font-black">{count}</span>
        </motion.div>

        {/* Plus button */}
        <motion.button
          onClick={increment}
          disabled={isSubmitting}
          className="w-14 h-14 rounded-full bg-emerald-500 text-white text-2xl font-bold flex items-center justify-center shadow-md hover:bg-emerald-600"
          whileTap={!isSubmitting ? { scale: 0.9 } : {}}
        >
          +
        </motion.button>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
          isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-violet-500 text-white hover:bg-violet-600'
        }`}
        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? 'Submitting...' : `Submit (${count})`}
      </motion.button>
    </div>
  )
}
