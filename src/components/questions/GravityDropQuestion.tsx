'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { Question } from '@/lib/types'

interface GravityDropQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const bucketColors = [
  { bg: 'bg-red-500', border: 'border-red-600', glow: 'shadow-red-500/50' },
  { bg: 'bg-blue-500', border: 'border-blue-600', glow: 'shadow-blue-500/50' },
  { bg: 'bg-green-500', border: 'border-green-600', glow: 'shadow-green-500/50' },
  { bg: 'bg-purple-500', border: 'border-purple-600', glow: 'shadow-purple-500/50' },
  { bg: 'bg-orange-500', border: 'border-orange-600', glow: 'shadow-orange-500/50' },
]

export function GravityDropQuestion({ question, onAnswer }: GravityDropQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [ballPosition, setBallPosition] = useState({ x: 50, y: 5 })
  const [isDropping, setIsDropping] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [swayDirection, setSwayDirection] = useState(1)
  const swayRef = useRef<NodeJS.Timeout | null>(null)

  const ballY = useMotionValue(5)
  const ballX = useMotionValue(50)

  // Calculate bucket positions
  const bucketWidth = 100 / options.length
  const bucketPositions = options.map((_, i) => ({
    left: i * bucketWidth,
    center: i * bucketWidth + bucketWidth / 2,
    right: (i + 1) * bucketWidth,
  }))

  // Gentle swaying motion when not dropping
  useEffect(() => {
    if (isDropping || selectedBucket) return

    const sway = () => {
      setBallPosition(prev => {
        let newX = prev.x + swayDirection * 0.5
        let newDirection = swayDirection

        // Reverse direction at edges
        if (newX >= 90) {
          newX = 90
          newDirection = -1
        } else if (newX <= 10) {
          newX = 10
          newDirection = 1
        }

        setSwayDirection(newDirection)
        ballX.set(newX)
        return { ...prev, x: newX }
      })
    }

    swayRef.current = setInterval(sway, 50)
    return () => {
      if (swayRef.current) clearInterval(swayRef.current)
    }
  }, [isDropping, selectedBucket, swayDirection, ballX])

  const handleDrop = useCallback(() => {
    if (isDropping || selectedBucket) return

    // Stop swaying
    if (swayRef.current) clearInterval(swayRef.current)

    setIsDropping(true)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    // Animate ball falling
    const currentX = ballPosition.x

    // Determine which bucket the ball lands in
    const bucketIndex = bucketPositions.findIndex(
      pos => currentX >= pos.left && currentX < pos.right
    )
    const landedBucket = bucketIndex >= 0 ? options[bucketIndex] : options[0]
    const targetX = bucketPositions[bucketIndex >= 0 ? bucketIndex : 0].center

    // Animate falling with slight curve toward bucket center
    animate(ballY, 85, {
      type: 'spring',
      stiffness: 50,
      damping: 8,
      onComplete: () => {
        setSelectedBucket(landedBucket)
        setShowResult(true)

        // Strong haptic for landing
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

        // Submit after celebration
        setTimeout(() => {
          onAnswer(landedBucket)
        }, 1200)
      },
    })

    // Slight curve toward bucket center
    animate(ballX, targetX, {
      duration: 1,
      ease: 'easeOut',
    })
  }, [isDropping, selectedBucket, ballPosition.x, bucketPositions, options, ballX, ballY, onAnswer])

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

      <p className="text-gray-500 text-center mb-4 text-sm">
        {!isDropping && !selectedBucket
          ? 'Tap to drop the ball!'
          : isDropping
          ? 'Falling...'
          : 'Landed!'}
      </p>

      {/* Game area */}
      <motion.div
        className="relative w-full aspect-[3/4] bg-gradient-to-b from-sky-200 to-sky-100 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
        onClick={handleDrop}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Clouds (decorative) */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-30"
            style={{ top: `${10 + i * 15}%`, left: `${20 + i * 30}%` }}
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
          >
            ☁️
          </motion.div>
        ))}

        {/* Ball */}
        <motion.div
          className="absolute w-10 h-10 -ml-5 -mt-5 z-20"
          style={{ left: `${ballPosition.x}%`, top: ballY }}
        >
          <motion.div
            className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-lg"
            animate={isDropping ? {} : { scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {/* Ball highlight */}
            <div className="absolute top-1 left-2 w-3 h-2 rounded-full bg-white opacity-70" />
          </motion.div>
        </motion.div>

        {/* Drop hint */}
        {!isDropping && !selectedBucket && (
          <motion.div
            className="absolute top-1/3 left-0 right-0 text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="bg-white/80 px-4 py-2 rounded-full text-gray-600 font-medium text-sm shadow">
              👆 Tap to drop!
            </span>
          </motion.div>
        )}

        {/* Buckets at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex h-24">
          {options.map((option, index) => {
            const colors = bucketColors[index % bucketColors.length]
            const isSelected = selectedBucket === option

            return (
              <motion.div
                key={option}
                className="flex-1 flex flex-col items-center justify-end pb-2"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Bucket */}
                <motion.div
                  className={`
                    w-[90%] h-16 rounded-b-xl border-4 ${colors.border} ${colors.bg}
                    flex items-center justify-center
                    ${isSelected ? `shadow-lg ${colors.glow}` : ''}
                  `}
                  animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  style={{
                    clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                  }}
                >
                  <span className="text-white font-bold text-xs text-center px-1 leading-tight">
                    {option}
                  </span>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Result overlay */}
        <AnimatePresence>
          {showResult && selectedBucket && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="bg-white rounded-xl px-6 py-4 shadow-2xl text-center"
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  🪂
                </motion.div>
                <p className="text-lg font-bold text-gray-800">{selectedBucket}</p>
                <p className="text-sm text-gray-500">Landed!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Options legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {options.map((option, index) => {
          const colors = bucketColors[index % bucketColors.length]
          return (
            <motion.span
              key={option}
              className={`px-3 py-1 rounded-full text-sm text-white ${colors.bg} ${
                selectedBucket === option ? 'ring-2 ring-offset-2 ring-gray-400' : ''
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {option}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}
