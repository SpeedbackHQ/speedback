'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface TiltQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

export function TiltQuestion({ question, onAnswer }: TiltQuestionProps) {
  const {
    min_label = 'Low',
    max_label = 'High',
  } = question.config as { min_label?: string; max_label?: string }

  const [value, setValue] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isSubmitted) return
    e.preventDefault()
    setIsDragging(true)
    updateValue(e)
  }, [isSubmitted])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isSubmitted) return
    updateValue(e)
  }, [isDragging, isSubmitted])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const updateValue = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setValue(Math.max(0, Math.min(100, Math.round(x))))
  }

  const handleSubmit = useCallback(() => {
    if (isSubmitted) return
    setIsSubmitted(true)

    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 50])
    }

    setTimeout(() => {
      onAnswer(value)
    }, 600)
  }, [isSubmitted, value, onAnswer])

  // Tilt angle: value 0 = -12deg, value 50 = 0deg, value 100 = +12deg
  const tiltAngle = (value - 50) * 0.24

  // Color based on value
  const getColor = () => {
    if (value >= 70) return 'text-emerald-600'
    if (value >= 40) return 'text-amber-600'
    return 'text-rose-500'
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        Drag the ball to set your rating
      </p>

      {/* Value display */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className={`text-4xl font-bold ${getColor()}`}>{value}%</span>
      </motion.div>

      {/* Tilt beam area */}
      <motion.div
        className="relative h-40 mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Fulcrum triangle */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <div
            className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[24px] border-l-transparent border-r-transparent border-b-gray-300"
          />
        </div>

        {/* Beam */}
        <motion.div
          ref={containerRef}
          className="absolute bottom-6 left-4 right-4 h-5 rounded-full bg-gray-200 cursor-pointer touch-none"
          style={{ transformOrigin: 'center' }}
          animate={{ rotate: tiltAngle }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Track fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-300 via-amber-300 to-emerald-300"
            style={{ width: `${value}%` }}
          />

          {/* Ball */}
          <motion.div
            className={`absolute -top-4 w-12 h-12 -ml-6 rounded-full shadow-lg flex items-center justify-center ${
              isSubmitted
                ? 'bg-green-500 shadow-green-500/30'
                : 'bg-violet-500 shadow-violet-500/30'
            } cursor-grab active:cursor-grabbing`}
            style={{ left: `${value}%` }}
            animate={{
              scale: isDragging ? 1.15 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="text-white font-bold text-xs">{value}</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scale legend */}
      <div className="flex justify-between text-xs text-gray-500 mb-4 px-4">
        <span>{min_label}</span>
        <span>{max_label}</span>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitted}
        className={`
          w-full py-4 rounded-xl font-bold text-lg shadow-lg
          ${isSubmitted
            ? 'bg-green-500 text-white'
            : 'bg-violet-500 text-white hover:bg-violet-600'
          }
          transition-colors
        `}
        whileHover={!isSubmitted ? { scale: 1.02 } : {}}
        whileTap={!isSubmitted ? { scale: 0.98 } : {}}
      >
        {isSubmitted ? 'Locked in!' : 'Confirm'}
      </motion.button>
    </div>
  )
}
