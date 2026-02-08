'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface ToggleSwitchQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function ToggleSwitchQuestion({ question, onAnswer }: ToggleSwitchQuestionProps) {
  const {
    left_label = 'No',
    right_label = 'Yes',
  } = question.config as { left_label?: string; right_label?: string }

  const [position, setPosition] = useState<'left' | 'right' | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback((side: 'left' | 'right') => {
    if (isSubmitted) return

    setPosition(side)
    setIsSubmitted(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 30])
    }

    setTimeout(() => {
      onAnswer(side)
    }, 500)
  }, [isSubmitted, onAnswer])

  const isRight = position === 'right'

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-10 text-sm">
        Tap a side to choose
      </p>

      {/* Labels */}
      <div className="flex justify-between items-center mb-4 px-2">
        <motion.span
          className={`text-lg font-bold transition-colors ${
            position === 'left' ? 'text-rose-600' : 'text-gray-400'
          }`}
          animate={{ scale: position === 'left' ? 1.1 : 1 }}
        >
          {left_label}
        </motion.span>
        <motion.span
          className={`text-lg font-bold transition-colors ${
            position === 'right' ? 'text-emerald-600' : 'text-gray-400'
          }`}
          animate={{ scale: position === 'right' ? 1.1 : 1 }}
        >
          {right_label}
        </motion.span>
      </div>

      {/* Toggle track */}
      <motion.div
        ref={trackRef}
        className="relative w-full h-20 rounded-full cursor-pointer overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            backgroundColor: position === null
              ? '#e2e8f0'
              : isRight
              ? '#d1fae5'
              : '#fce7f3',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Left tap zone */}
        <div
          className="absolute left-0 top-0 w-1/2 h-full z-10"
          onClick={() => handleToggle('left')}
        />

        {/* Right tap zone */}
        <div
          className="absolute right-0 top-0 w-1/2 h-full z-10"
          onClick={() => handleToggle('right')}
        />

        {/* Center divider */}
        <div className="absolute left-1/2 top-3 bottom-3 w-px bg-gray-300/50 -translate-x-1/2" />

        {/* Thumb - uses percentage-based left positioning */}
        <motion.div
          className={`absolute top-2 h-16 rounded-full shadow-lg flex items-center justify-center ${
            position === null
              ? 'bg-white'
              : isRight
              ? 'bg-emerald-500'
              : 'bg-rose-500'
          }`}
          style={{ width: '46%' }}
          animate={{
            left: position === null
              ? '2%'
              : isRight
              ? '52%'
              : '2%',
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          {position !== null && (
            <motion.span
              className="text-white font-bold text-sm"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {isRight ? right_label : left_label}
            </motion.span>
          )}
          {position === null && (
            <span className="text-gray-400 text-xs font-medium">Tap</span>
          )}
        </motion.div>
      </motion.div>

      {/* Confirmation */}
      <motion.div
        className="text-center mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSubmitted ? 1 : 0 }}
      >
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${
          isRight ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {isRight ? right_label : left_label}
        </span>
      </motion.div>
    </div>
  )
}
