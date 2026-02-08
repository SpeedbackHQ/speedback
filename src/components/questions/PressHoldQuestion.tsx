'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface PressHoldQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

export function PressHoldQuestion({ question, onAnswer }: PressHoldQuestionProps) {
  const {
    min_label = 'Low',
    max_label = 'High',
  } = question.config as { min_label?: string; max_label?: string }

  const [value, setValue] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startFilling = useCallback(() => {
    if (isLocked || isSubmitted) return
    setIsHolding(true)

    intervalRef.current = setInterval(() => {
      setValue(prev => {
        const next = Math.min(100, prev + 1)
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
        return next
      })
    }, 50) // ~5 seconds to fill (slower than before)
  }, [isLocked, isSubmitted])

  const stopFilling = useCallback(() => {
    if (!isHolding || isLocked) return
    setIsHolding(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsLocked(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 40])
    }
  }, [isHolding, isLocked])

  const handleRetry = useCallback(() => {
    setValue(0)
    setIsLocked(false)
    setIsHolding(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleSubmit = useCallback(() => {
    if (isSubmitted || !isLocked) return
    setIsSubmitted(true)

    setTimeout(() => {
      onAnswer(value)
    }, 500)
  }, [isSubmitted, isLocked, value, onAnswer])

  // SVG ring calculations
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  // Color based on value
  const getColor = () => {
    if (value >= 70) return { text: 'text-emerald-600', ring: '#10b981', bg: 'bg-emerald-500' }
    if (value >= 40) return { text: 'text-amber-600', ring: '#f59e0b', bg: 'bg-amber-500' }
    return { text: 'text-blue-600', ring: '#3b82f6', bg: 'bg-blue-500' }
  }
  const color = getColor()

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-8 text-sm">
        {isLocked ? 'Happy with this? Confirm or retry' : 'Press and hold to fill the meter'}
      </p>

      {/* Circular button with ring */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* SVG progress ring */}
          <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={color.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transition={{ duration: 0.05 }}
            />
          </svg>

          {/* Center button */}
          <motion.button
            className={`absolute inset-4 rounded-full ${
              isLocked
                ? color.bg
                : 'bg-indigo-500'
            } shadow-lg flex flex-col items-center justify-center touch-none select-none`}
            onPointerDown={(e) => { e.preventDefault(); startFilling() }}
            onPointerUp={stopFilling}
            onPointerLeave={stopFilling}
            onPointerCancel={stopFilling}
            animate={{
              scale: isHolding ? 0.93 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            disabled={isLocked}
          >
            {isLocked ? (
              <motion.div
                className="text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span className="text-4xl font-bold text-white">{value}%</span>
              </motion.div>
            ) : (
              <>
                <motion.span
                  className="text-3xl font-bold text-white"
                  animate={isHolding ? {} : { scale: [1, 1.05, 1] }}
                  transition={isHolding ? {} : { repeat: Infinity, duration: 1.5 }}
                >
                  {isHolding ? `${value}%` : '👇'}
                </motion.span>
                {!isHolding && (
                  <span className="text-white/80 text-xs mt-1 font-medium">Hold</span>
                )}
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Scale legend */}
      <div className="flex justify-between text-xs text-gray-500 mb-4 px-4">
        <span>{min_label}</span>
        <span>{max_label}</span>
      </div>

      {/* Confirm + Retry buttons */}
      <AnimatePresence>
        {isLocked && !isSubmitted && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={handleRetry}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              Retry
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              className="flex-1 py-4 rounded-xl font-bold text-lg shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              Confirm
            </motion.button>
          </motion.div>
        )}
        {isSubmitted && (
          <motion.div
            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg bg-green-500 text-white text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Locked in!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
