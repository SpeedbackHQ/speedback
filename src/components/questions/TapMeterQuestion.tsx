'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface TapMeterQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const FILL_PER_TAP = 8 // % added per tap
const DECAY_RATE = 1.5 // % lost per 100ms
const DECAY_INTERVAL = 100 // ms

export function TapMeterQuestion({ question, onAnswer }: TapMeterQuestionProps) {
  const [meters, setMeters] = useState<Record<string, number>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isLocking, setIsLocking] = useState<string | null>(null)
  const decayTimer = useRef<NodeJS.Timeout | null>(null)

  const { options: rawOptions = [] } = question.config
  const options = (rawOptions as string[]).slice(0, 4)  // Cap at 4 options max

  // Decay effect - meters slowly drain when not tapping
  useEffect(() => {
    if (selectedOption) return // Stop decay after selection

    decayTimer.current = setInterval(() => {
      setMeters(prev => {
        const updated: Record<string, number> = {}
        let hasValues = false

        Object.entries(prev).forEach(([key, value]) => {
          const newValue = Math.max(0, value - DECAY_RATE)
          if (newValue > 0) {
            updated[key] = newValue
            hasValues = true
          }
        })

        return hasValues ? updated : {}
      })
    }, DECAY_INTERVAL)

    return () => {
      if (decayTimer.current) {
        clearInterval(decayTimer.current)
      }
    }
  }, [selectedOption])

  const handleTap = (option: string) => {
    if (selectedOption) return

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15)
    }

    // Fill meter
    const currentValue = meters[option] || 0
    const newValue = Math.min(100, currentValue + FILL_PER_TAP)

    setMeters(prev => ({ ...prev, [option]: newValue }))

    // Check for lock
    if (newValue >= 100) {
      lockSelection(option)
    }
  }

  const lockSelection = (option: string) => {
    setIsLocking(option)

    // Strong haptic for lock
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30, 50, 100])
    }

    // Clear decay
    if (decayTimer.current) {
      clearInterval(decayTimer.current)
    }

    setTimeout(() => {
      setSelectedOption(option)
      setIsLocking(null)

      setTimeout(() => {
        onAnswer(option)
      }, 500)
    }, 400)
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Question text */}
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      {!selectedOption ? (
        <motion.p
          className="text-center mb-8 text-2xl font-black text-violet-600 select-none"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          TAP!
        </motion.p>
      ) : (
        <p className="text-gray-500 text-center mb-8">Locked in!</p>
      )}

      {/* Options with meters */}
      <div className="space-y-4">
        <AnimatePresence>
          {(options as string[]).map((option, index) => {
            const meterValue = meters[option] || 0
            const isSelected = selectedOption === option
            const isCurrentlyLocking = isLocking === option

            return (
              <motion.button
                key={option}
                onClick={() => handleTap(option)}
                disabled={!!selectedOption}
                className={`
                  relative w-full p-5 rounded-2xl text-left font-semibold text-lg
                  transition-all duration-100 overflow-hidden
                  ${isSelected
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg'
                    : selectedOption
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-white border-2 border-gray-200 text-gray-800 active:scale-[0.98]'
                  }
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: isCurrentlyLocking ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  delay: index * 0.1,
                  scale: { duration: 0.3 }
                }}
                whileTap={!selectedOption ? { scale: 0.97 } : {}}
              >
                {/* Meter fill background */}
                {!isSelected && meterValue > 0 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-violet-200 via-purple-200 to-pink-200"
                    style={{
                      width: `${meterValue}%`,
                      transformOrigin: 'left'
                    }}
                    transition={{ duration: 0.05 }}
                  />
                )}

                {/* Glow effect when close to 100 */}
                {meterValue > 80 && !isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-200/50 to-orange-200/50"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  />
                )}

                {/* Content */}
                <div className="relative flex items-center justify-between">
                  <span className="flex-1">{option}</span>

                  {/* Meter percentage or checkmark */}
                  {!isSelected && meterValue > 0 && (
                    <motion.span
                      className={`
                        text-sm font-bold min-w-[3rem] text-right
                        ${meterValue > 80 ? 'text-orange-600' : meterValue > 50 ? 'text-purple-600' : 'text-violet-500'}
                      `}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {Math.round(meterValue)}%
                    </motion.span>
                  )}

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                    >
                      <span className="text-green-500 text-xl">✓</span>
                    </motion.div>
                  )}
                </div>

                {/* Lock burst effect */}
                {isCurrentlyLocking && (
                  <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos(i * 30 * Math.PI / 180) * 80,
                          y: Math.sin(i * 30 * Math.PI / 180) * 80,
                          opacity: 0,
                          scale: 0,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Encouragement based on state */}
      {!selectedOption && (
        <motion.p
          className="text-center text-gray-400 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Object.values(meters).some(v => v > 50)
            ? "Keep going! Almost there!"
            : Object.values(meters).some(v => v > 0)
            ? "Don't stop tapping!"
            : "Tap an option to start filling its meter"
          }
        </motion.p>
      )}
    </div>
  )
}
