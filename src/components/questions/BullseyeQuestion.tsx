'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface BullseyeQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

export function BullseyeQuestion({ question, onAnswer }: BullseyeQuestionProps) {
  const {
    min_label = 'Disagree',
    max_label = 'Agree',
  } = question.config as { min_label?: string; max_label?: string }

  const [markerPosition, setMarkerPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate score based on distance from center (0-100 scale)
  // Center = 100 (strongly agree), Edge = 0 (strongly disagree)
  const calculateScore = useCallback((x: number, y: number) => {
    const dx = x - 50
    const dy = y - 50
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 50 // From center to edge
    const score = Math.max(0, Math.round(100 - (distance / maxDistance) * 100))
    return score
  }, [])

  const currentScore = calculateScore(markerPosition.x, markerPosition.y)

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isSubmitted) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Clamp to circle bounds
    const dx = x - 50
    const dy = y - 50
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 48) {
      // Clamp to edge
      const angle = Math.atan2(dy, dx)
      setMarkerPosition({
        x: 50 + Math.cos(angle) * 48,
        y: 50 + Math.sin(angle) * 48,
      })
    } else {
      setMarkerPosition({ x, y })
    }
  }, [isDragging, isSubmitted])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isSubmitted) return
    setIsDragging(true)
    handlePointerMove(e)
  }, [isSubmitted, handlePointerMove])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (isSubmitted) return

    setIsSubmitted(true)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 50])
    }

    // Submit after animation
    setTimeout(() => {
      onAnswer(currentScore)
    }, 800)
  }, [isSubmitted, currentScore, onAnswer])

  // Get ring color based on position
  const getPositionLabel = () => {
    if (currentScore >= 80) return { text: 'Bullseye!', color: 'text-red-600' }
    if (currentScore >= 60) return { text: 'Close!', color: 'text-orange-500' }
    if (currentScore >= 40) return { text: 'Getting there', color: 'text-yellow-500' }
    if (currentScore >= 20) return { text: 'Outer ring', color: 'text-blue-500' }
    return { text: 'Edge', color: 'text-gray-500' }
  }

  const positionLabel = getPositionLabel()

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
        Drag the marker - center means strongest agreement
      </p>

      {/* Score display */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className={`text-3xl font-bold ${positionLabel.color}`}>
          {currentScore}%
        </span>
        <p className={`text-xs mt-1 ${positionLabel.color}`}>{positionLabel.text}</p>
      </motion.div>

      {/* Bullseye target */}
      <motion.div
        ref={containerRef}
        className="relative w-full aspect-square max-w-xs mx-auto cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Target rings */}
        {[100, 80, 60, 40, 20].map((size, i) => (
          <div
            key={size}
            className={`absolute rounded-full border-2 ${
              i === 0
                ? 'border-gray-200 bg-gray-50'
                : i === 1
                ? 'border-blue-200 bg-blue-50'
                : i === 2
                ? 'border-yellow-200 bg-yellow-50'
                : i === 3
                ? 'border-orange-200 bg-orange-50'
                : 'border-red-300 bg-red-100'
            }`}
            style={{
              width: `${size}%`,
              height: `${size}%`,
              left: `${(100 - size) / 2}%`,
              top: `${(100 - size) / 2}%`,
            }}
          />
        ))}

        {/* Center bullseye */}
        <div
          className="absolute w-[10%] h-[10%] rounded-full bg-red-500 shadow-lg"
          style={{ left: '45%', top: '45%' }}
        >
          <div className="absolute inset-1 rounded-full bg-red-400" />
        </div>

        {/* Crosshairs */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300/50" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300/50" />

        {/* Marker */}
        <motion.div
          className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full ${
            isSubmitted
              ? 'bg-green-500 shadow-lg shadow-green-500/50'
              : 'bg-indigo-500 shadow-lg shadow-indigo-500/50'
          } flex items-center justify-center cursor-grab active:cursor-grabbing`}
          style={{
            left: `${markerPosition.x}%`,
            top: `${markerPosition.y}%`,
          }}
          animate={{
            scale: isDragging ? 1.2 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="w-3 h-3 rounded-full bg-white/80" />
        </motion.div>

        {/* Success overlay */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span className="text-5xl">🎯</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Scale legend */}
      <div className="mt-6 mb-2 flex justify-between text-xs text-gray-500">
        <span>Edge = {min_label}</span>
        <span>Center = {max_label}</span>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitted}
        className={`
          w-full py-4 rounded-xl font-bold text-lg shadow-lg
          ${isSubmitted
            ? 'bg-green-500 text-white'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
