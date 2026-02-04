'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface StarsQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

const STAR_COUNT = 5

export function StarsQuestion({ question, onAnswer }: StarsQuestionProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const calculateRating = (clientX: number) => {
    if (!containerRef.current) return 0

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    // Round to nearest 0.5
    return Math.round(percentage * STAR_COUNT * 2) / 2
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSubmitting) return
    setIsDragging(true)
    setHasInteracted(true)
    const newRating = calculateRating(e.clientX)
    setRating(newRating)
    setHoverRating(newRating)

    if (navigator.vibrate) {
      navigator.vibrate(15)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isSubmitting) return

    const newRating = calculateRating(e.clientX)
    if (newRating !== rating) {
      setRating(newRating)
      setHoverRating(newRating)

      if (navigator.vibrate) {
        navigator.vibrate(10)
      }
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  const handleStarClick = (starIndex: number) => {
    if (isSubmitting) return
    setHasInteracted(true)
    setRating(starIndex + 1)

    if (navigator.vibrate) {
      navigator.vibrate(20)
    }
  }

  const handleSubmit = () => {
    if (rating === 0 || isSubmitting) return

    setIsSubmitting(true)

    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 100])
    }

    setTimeout(() => {
      // Convert 1-5 to 0-100 for consistency with other scale types
      onAnswer(Math.round((rating / STAR_COUNT) * 100))
    }, 500)
  }

  const displayRating = isDragging ? hoverRating : rating

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

      <p className="text-gray-500 text-center mb-8">
        Drag across the stars or tap to rate
      </p>

      {/* Stars container */}
      <div
        ref={containerRef}
        className="flex justify-center gap-2 mb-4 touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {Array.from({ length: STAR_COUNT }).map((_, index) => {
          const fillPercentage = Math.max(0, Math.min(1, displayRating - index))
          const isFullyFilled = fillPercentage >= 1
          const isPartiallyFilled = fillPercentage > 0 && fillPercentage < 1

          return (
            <motion.button
              key={index}
              onClick={() => handleStarClick(index)}
              className="relative w-14 h-14 focus:outline-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={isFullyFilled ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {/* Empty star (background) */}
              <span className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
                ★
              </span>

              {/* Filled star (foreground with clip) */}
              <span
                className="absolute inset-0 flex items-center justify-center text-4xl overflow-hidden"
                style={{
                  clipPath: `inset(0 ${100 - fillPercentage * 100}% 0 0)`,
                }}
              >
                <motion.span
                  className="text-amber-400"
                  animate={isFullyFilled ? {
                    textShadow: ['0 0 0px #fbbf24', '0 0 20px #fbbf24', '0 0 0px #fbbf24']
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  ★
                </motion.span>
              </span>

              {/* Sparkle effect on fill */}
              {isFullyFilled && hasInteracted && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-amber-300 rounded-full"
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(i * 90 * Math.PI / 180) * 20,
                        y: Math.sin(i * 90 * Math.PI / 180) * 20,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Rating display */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {displayRating > 0 ? (
          <motion.div
            key={displayRating}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-amber-500"
          >
            {displayRating} / {STAR_COUNT}
          </motion.div>
        ) : (
          <div className="text-gray-400 text-lg">Select a rating</div>
        )}
      </motion.div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all
          ${rating > 0
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        whileHover={rating > 0 ? { scale: 1.02 } : {}}
        whileTap={rating > 0 ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Submitting...
          </motion.span>
        ) : (
          `Submit ${rating > 0 ? `${rating} Star${rating !== 1 ? 's' : ''}` : 'Rating'}`
        )}
      </motion.button>
    </div>
  )
}
