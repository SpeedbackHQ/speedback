'use client'
/* eslint-disable react-hooks/preserve-manual-memoization -- Complex animation callbacks with valid dependencies */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const { options: rawOptions = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }
  const options = rawOptions.slice(0, 4)  // Cap at 4 options max

  const [ballX, setBallX] = useState(50) // percentage
  const [ballY, setBallY] = useState(8) // percentage
  const [isDropping, setIsDropping] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [swayDirection, setSwayDirection] = useState(1)
  const swayRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
      setBallX(prev => {
        let newX = prev + swayDirection * 0.8
        let newDirection = swayDirection

        // Reverse direction at edges
        if (newX >= 85) {
          newX = 85
          newDirection = -1
          setSwayDirection(-1)
        } else if (newX <= 15) {
          newX = 15
          newDirection = 1
          setSwayDirection(1)
        }

        if (newDirection !== swayDirection) {
          setSwayDirection(newDirection)
        }

        return newX
      })
    }

    swayRef.current = setInterval(sway, 50)
    return () => {
      if (swayRef.current) clearInterval(swayRef.current)
    }
  }, [isDropping, selectedBucket, swayDirection])

  const handleDrop = useCallback(() => {
    if (isDropping || selectedBucket) return

    // Stop swaying
    if (swayRef.current) clearInterval(swayRef.current)

    setIsDropping(true)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    // Determine which bucket the ball lands in
    const currentX = ballX
    const bucketIndex = bucketPositions.findIndex(
      pos => currentX >= pos.left && currentX < pos.right
    )
    const landedBucket = bucketIndex >= 0 ? options[bucketIndex] : options[0]
    const targetX = bucketPositions[bucketIndex >= 0 ? bucketIndex : 0].center

    // Animate falling - use state updates with requestAnimationFrame for smooth animation
    const startY = ballY
    const targetY = 72 // percentage - lands in bucket area
    const startX = currentX
    const duration = 800 // ms
    const startTime = Date.now()

    const animateFall = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out curve for natural gravity feel
      const easeProgress = 1 - Math.pow(1 - progress, 2)

      // Update Y position (falling)
      const newY = startY + (targetY - startY) * easeProgress
      setBallY(newY)

      // Update X position (slight curve toward bucket center)
      const newX = startX + (targetX - startX) * easeProgress
      setBallX(newX)

      if (progress < 1) {
        requestAnimationFrame(animateFall)
      } else {
        // Landing complete
        setSelectedBucket(landedBucket)
        setShowResult(true)

        // Strong haptic for landing
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

      }
    }

    requestAnimationFrame(animateFall)
  }, [isDropping, selectedBucket, ballX, ballY, bucketPositions, options])

  const handleConfirm = useCallback(() => {
    if (selectedBucket) {
      if (navigator.vibrate) navigator.vibrate(50)
      onAnswer(selectedBucket)
    }
  }, [selectedBucket, onAnswer])

  const handleRetry = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(30)
    setSelectedBucket(null)
    setShowResult(false)
    setIsDropping(false)
    setBallY(8)
    setBallX(50)
    setSwayDirection(1)
  }, [])

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
          : isDropping && !selectedBucket
          ? 'Falling...'
          : selectedBucket
          ? `Landed on: ${selectedBucket}`
          : 'Landed!'}
      </p>

      {/* Game area */}
      <motion.div
        ref={containerRef}
        className="relative w-full aspect-[3/4] bg-gradient-to-b from-sky-200 to-sky-100 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
        onClick={!showResult ? handleDrop : undefined}
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
          className="absolute w-12 h-12 z-20 pointer-events-none"
          style={{
            left: `${ballX}%`,
            top: `${ballY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={!isDropping && !selectedBucket ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <div
            className="w-full h-full rounded-full shadow-lg"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #606060)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
            }}
          >
            {/* Ball highlight */}
            <div className="absolute top-1.5 left-2.5 w-4 h-2.5 rounded-full bg-white opacity-60" />
          </div>
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
        <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: '25%' }}>
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
                    w-[90%] h-20 rounded-b-xl border-4 ${colors.border} ${colors.bg}
                    flex items-center justify-center
                    ${isSelected ? `shadow-lg ${colors.glow}` : ''}
                  `}
                  animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  style={{
                    clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                  }}
                >
                  <span className="text-white font-bold text-sm text-center px-2 leading-tight">
                    {option}
                  </span>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Result overlay with confirm/retry */}
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
                <p className="text-sm text-gray-500 mb-4">Landed!</p>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleRetry}
                    className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Try Again
                  </motion.button>
                  <motion.button
                    onClick={handleConfirm}
                    className="flex-1 py-2 px-4 rounded-lg bg-violet-500 text-white font-medium text-sm hover:bg-violet-600"
                    whileTap={{ scale: 0.95 }}
                  >
                    Confirm
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
