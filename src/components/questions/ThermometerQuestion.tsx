'use client'

import { useState, useRef } from 'react'
import { motion, useSpring } from 'framer-motion'
import { Question } from '@/lib/types'

interface ThermometerQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

// Emoji thresholds
const getEmoji = (value: number) => {
  if (value < 20) return '❄️'
  if (value < 40) return '😐'
  if (value < 60) return '🙂'
  if (value < 80) return '😊'
  return '🔥'
}

const getLabel = (value: number) => {
  if (value < 20) return 'Cold'
  if (value < 40) return 'Cool'
  if (value < 60) return 'Warm'
  if (value < 80) return 'Hot'
  return 'On Fire!'
}

export function ThermometerQuestion({ question, onAnswer }: ThermometerQuestionProps) {
  const [value, setValue] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastHapticValue = useRef(value)

  const {
    min_label = 'Cold',
    max_label = 'Hot',
  } = question.config as { min_label?: string; max_label?: string }

  // Spring for smooth value animation
  const springValue = useSpring(value, { stiffness: 200, damping: 25 })

  // Color gradient: blue (cold) -> red (hot)
  const getColor = (val: number) => {
    if (val < 50) {
      // Blue to Yellow
      const ratio = val / 50
      return `rgb(${Math.round(59 + 180 * ratio)}, ${Math.round(130 + 118 * ratio)}, ${Math.round(246 - 174 * ratio)})`
    } else {
      // Yellow to Red
      const ratio = (val - 50) / 50
      return `rgb(${Math.round(239 + 0 * ratio)}, ${Math.round(248 - 180 * ratio)}, ${Math.round(72 - 4 * ratio)})`
    }
  }

  const calculateValue = (clientY: number) => {
    if (!containerRef.current) return value

    const rect = containerRef.current.getBoundingClientRect()
    const y = clientY - rect.top
    // Invert: top = 100, bottom = 0
    const percentage = 1 - Math.max(0, Math.min(1, y / rect.height))
    return Math.round(percentage * 100)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSubmitting) return
    setIsDragging(true)
    setHasInteracted(true)
    const newValue = calculateValue(e.clientY)
    setValue(newValue)
    springValue.set(newValue)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isSubmitting) return

    const newValue = calculateValue(e.clientY)
    setValue(newValue)
    springValue.set(newValue)

    // Haptic at thresholds
    const thresholds = [20, 40, 60, 80, 100]
    const crossedThreshold = thresholds.find(t =>
      (lastHapticValue.current < t && newValue >= t) ||
      (lastHapticValue.current >= t && newValue < t)
    )
    if (crossedThreshold !== undefined) {
      if (navigator.vibrate) {
        navigator.vibrate(15)
      }
      lastHapticValue.current = newValue
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  const handleSubmit = () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 100])
    }

    setTimeout(() => {
      onAnswer(value)
    }, 500)
  }

  const displayColor = getColor(value)
  const emoji = getEmoji(value)
  const label = getLabel(value)

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Question text */}
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-6">
        Drag up or down to set your level
      </p>

      {/* Thermometer container */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* Labels column */}
        <div className="flex flex-col justify-between h-64 text-right">
          <span className="text-sm text-gray-500">{max_label}</span>
          <span className="text-sm text-gray-500">{min_label}</span>
        </div>

        {/* Thermometer */}
        <div
          ref={containerRef}
          className="relative w-20 h-64 touch-none select-none cursor-ns-resize"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Outer tube */}
          <div className="absolute inset-0 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            {/* Mercury fill */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-full"
              style={{
                height: `${value}%`,
                background: `linear-gradient(to top, ${getColor(0)}, ${displayColor})`,
              }}
              animate={{
                boxShadow: isDragging
                  ? `0 0 20px ${displayColor}60`
                  : 'none',
              }}
            />

            {/* Bubble effects at top of mercury */}
            {value > 10 && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ bottom: `${value}%` }}
                animate={{
                  y: isDragging ? [0, -5, 0] : 0,
                }}
                transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
              >
                <div
                  className="w-3 h-3 rounded-full opacity-60"
                  style={{ backgroundColor: displayColor }}
                />
              </motion.div>
            )}
          </div>

          {/* Bulb at bottom */}
          <div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full shadow-lg"
            style={{ backgroundColor: displayColor }}
          />

          {/* Tick marks */}
          <div className="absolute inset-y-0 -right-3 flex flex-col justify-between py-2">
            {[100, 75, 50, 25, 0].map((tick) => (
              <div
                key={tick}
                className={`w-2 h-0.5 ${value >= tick ? 'bg-gray-400' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          {/* Drag indicator line */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-white/50 pointer-events-none"
            style={{ bottom: `${value}%` }}
            animate={{
              opacity: isDragging ? 1 : 0,
              scaleX: isDragging ? 1 : 0,
            }}
          />
        </div>

        {/* Emoji and label column */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            className="text-5xl mb-2"
            animate={{
              scale: isDragging ? 1.2 : 1,
              rotate: value > 80 ? [0, -10, 10, 0] : 0,
            }}
            transition={{
              rotate: { duration: 0.3, repeat: value > 80 && isDragging ? Infinity : 0 }
            }}
          >
            {emoji}
          </motion.div>
          <motion.div
            className="text-lg font-bold"
            style={{ color: displayColor }}
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {label}
          </motion.div>
          <div className="text-2xl font-bold text-gray-800 mt-2">
            {value}%
          </div>
        </div>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!hasInteracted || isSubmitting}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all mt-8
          ${hasInteracted
            ? 'text-white shadow-lg hover:shadow-xl'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        style={hasInteracted ? {
          background: `linear-gradient(to right, ${getColor(30)}, ${displayColor})`,
        } : {}}
        whileHover={hasInteracted ? { scale: 1.02 } : {}}
        whileTap={hasInteracted ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Submitting...
          </motion.span>
        ) : (
          `Submit ${value}%`
        )}
      </motion.button>
    </div>
  )
}
