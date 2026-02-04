'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { Question } from '@/lib/types'

interface SlotMachineQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const slotColors = [
  'from-red-400 to-red-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
]

export function SlotMachineQuestion({ question, onAnswer }: SlotMachineQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const spinSpeedRef = useRef(50)

  // Extend options for smoother visual loop
  const extendedOptions = [...options, ...options, ...options]

  const startSpin = useCallback(() => {
    if (isSpinning || selectedOption) return

    setIsSpinning(true)
    spinSpeedRef.current = 50 // Fast initial speed

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    // Spin loop
    const spin = () => {
      setCurrentIndex(prev => (prev + 1) % extendedOptions.length)

      // Small vibration during spin
      if (navigator.vibrate && spinSpeedRef.current < 100) {
        navigator.vibrate(5)
      }

      spinIntervalRef.current = setTimeout(spin, spinSpeedRef.current)
    }

    spin()
  }, [isSpinning, selectedOption, extendedOptions.length])

  const stopSpin = useCallback(() => {
    if (!isSpinning || selectedOption) return

    // Gradually slow down
    const slowDown = () => {
      spinSpeedRef.current += 30

      if (spinSpeedRef.current >= 400) {
        // Stop completely
        if (spinIntervalRef.current) {
          clearTimeout(spinIntervalRef.current)
        }
        setIsSpinning(false)

        // Get final selection (use modulo to get actual option)
        const finalIndex = currentIndex % options.length
        const selected = options[finalIndex]
        setSelectedOption(selected)
        setShowResult(true)

        // Strong haptic for selection
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

        // Submit after celebration
        setTimeout(() => {
          onAnswer(selected)
        }, 1500)
      } else {
        setTimeout(slowDown, 100)
      }
    }

    slowDown()
  }, [isSpinning, selectedOption, currentIndex, options, onAnswer])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearTimeout(spinIntervalRef.current)
      }
    }
  }, [])

  // Calculate visible options (show 3 in window)
  const getVisibleOptions = () => {
    const prevIndex = (currentIndex - 1 + extendedOptions.length) % extendedOptions.length
    const nextIndex = (currentIndex + 1) % extendedOptions.length

    return [
      { text: extendedOptions[prevIndex], position: 'top' },
      { text: extendedOptions[currentIndex], position: 'center' },
      { text: extendedOptions[nextIndex], position: 'bottom' },
    ]
  }

  const visibleOptions = getVisibleOptions()

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

      <p className="text-gray-500 text-center mb-6 text-sm">
        {!isSpinning && !selectedOption
          ? 'Pull the lever to spin!'
          : isSpinning
          ? 'Tap to stop!'
          : 'Result!'}
      </p>

      {/* Slot machine body */}
      <motion.div
        className="relative bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 rounded-3xl p-6 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Top decoration */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 px-6 py-2 rounded-full shadow-lg">
          <span className="text-white font-bold text-sm tracking-wider">LUCKY PICK</span>
        </div>

        {/* Light bulbs */}
        <div className="absolute top-2 left-4 right-4 flex justify-between">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-red-400"
              animate={{
                backgroundColor: isSpinning
                  ? ['#f87171', '#fef08a', '#f87171']
                  : '#f87171',
                boxShadow: isSpinning
                  ? ['0 0 10px #f87171', '0 0 20px #fef08a', '0 0 10px #f87171']
                  : '0 0 5px #f87171',
              }}
              transition={{
                duration: 0.3,
                repeat: isSpinning ? Infinity : 0,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>

        {/* Reel window */}
        <div className="mt-6 bg-white rounded-xl overflow-hidden shadow-inner border-4 border-yellow-700">
          <div className="relative h-48">
            {/* Options display */}
            <AnimatePresence mode="popLayout">
              {visibleOptions.map((opt, i) => {
                const colorIndex = extendedOptions.indexOf(opt.text) % slotColors.length
                const isCenter = opt.position === 'center'

                return (
                  <motion.div
                    key={`${opt.text}-${opt.position}-${currentIndex}`}
                    className={`absolute left-0 right-0 h-16 flex items-center justify-center px-4 ${
                      isCenter ? 'z-10' : 'z-0'
                    }`}
                    style={{
                      top: i === 0 ? '0%' : i === 1 ? '33.3%' : '66.6%',
                    }}
                    initial={{ y: -64, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: isCenter ? 1 : 0.3,
                      scale: isCenter ? 1.1 : 0.9,
                    }}
                    exit={{ y: 64, opacity: 0 }}
                    transition={{ duration: isSpinning ? 0.05 : 0.2 }}
                  >
                    <div
                      className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r ${slotColors[colorIndex]} text-white font-bold text-center shadow-md ${
                        isCenter ? 'text-xl' : 'text-sm'
                      }`}
                    >
                      {opt.text}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Selection indicator (center line) */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none z-20">
              <div className="flex items-center">
                <div className="w-3 h-8 bg-yellow-600 rounded-r" />
                <div className="flex-1" />
                <div className="w-3 h-8 bg-yellow-600 rounded-l" />
              </div>
            </div>
          </div>
        </div>

        {/* Control area */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {/* Spin/Stop button */}
          <motion.button
            onClick={isSpinning ? stopSpin : startSpin}
            disabled={selectedOption !== null}
            className={`
              relative px-8 py-4 rounded-full font-bold text-lg shadow-lg
              ${selectedOption
                ? 'bg-gray-400 cursor-not-allowed'
                : isSpinning
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
              }
              text-white transition-colors
            `}
            whileHover={!selectedOption ? { scale: 1.05 } : {}}
            whileTap={!selectedOption ? { scale: 0.95 } : {}}
          >
            {selectedOption ? 'Done!' : isSpinning ? 'STOP!' : 'SPIN!'}

            {/* Glow effect while spinning */}
            {isSpinning && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-400 -z-10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </motion.button>

          {/* Lever (decorative) */}
          <motion.div
            className="relative"
            animate={isSpinning ? { rotate: [0, -30, 0] } : { rotate: 0 }}
            transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
          >
            <div className="w-4 h-20 bg-gray-600 rounded-full shadow-inner" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full shadow-lg border-4 border-red-600" />
          </motion.div>
        </div>

        {/* Result celebration */}
        <AnimatePresence>
          {showResult && selectedOption && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="bg-white rounded-xl px-8 py-6 shadow-2xl text-center"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  🎰
                </motion.div>
                <p className="text-xl font-bold text-gray-800">{selectedOption}</p>
                <motion.div
                  className="flex justify-center gap-1 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {['✨', '⭐', '✨'].map((emoji, i) => (
                    <motion.span
                      key={i}
                      className="text-2xl"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.2 }}
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Options preview */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {options.map((option, index) => (
          <motion.span
            key={option}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedOption === option
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            {option}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
