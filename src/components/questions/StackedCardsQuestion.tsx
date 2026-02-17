'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface StackedCardsQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function StackedCardsQuestion({ question, onAnswer }: StackedCardsQuestionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Motion value for smooth dragging
  const y = useMotionValue(0)

  const { options = [] } = question.config
  const optionsArray = (options as string[]).slice(0, 4)  // Cap at 4 options max
  const totalOptions = optionsArray.length

  // Card colors
  const cardColors = [
    'from-violet-500 to-purple-600',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-cyan-500 to-blue-500',
  ]

  // Helper to get wrapped index for infinite looping
  const getWrappedIndex = (index: number) => {
    return ((index % totalOptions) + totalOptions) % totalOptions
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isSubmitting) return

    const threshold = 50
    const velocityThreshold = 200  // Lower threshold for snappier response

    // Swipe up to go forward, down to go back (use velocity OR position)
    if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      goToNext()
    } else if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
      goToPrevious()
    } else {
      // Snap back with snappy spring
      animate(y, 0, { type: 'spring', stiffness: 250, damping: 40 })
    }
  }

  const goToNext = () => {
    setCurrentIndex(prev => getWrappedIndex(prev + 1))
    animate(y, 0, { type: 'spring', stiffness: 250, damping: 40 })
    if (navigator.vibrate) navigator.vibrate(15)
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => getWrappedIndex(prev - 1))
    animate(y, 0, { type: 'spring', stiffness: 250, damping: 40 })
    if (navigator.vibrate) navigator.vibrate(15)
  }

  const handleSubmit = () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 100])
    }

    setTimeout(() => {
      onAnswer(optionsArray[currentIndex])
    }, 300)
  }

  // Transform drag position to visual feedback
  const mainCardRotateX = useTransform(y, [-150, 0, 150], [15, 0, -15])
  const mainCardScale = useTransform(y, [-150, 0, 150], [0.92, 1, 0.92])

  // Get indices for visible cards
  const prevIndex = getWrappedIndex(currentIndex - 1)
  const nextIndex1 = getWrappedIndex(currentIndex + 1)
  const nextIndex2 = getWrappedIndex(currentIndex + 2)

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
        Swipe to browse options
      </p>

      {/* Stacked cards container */}
      <div
        ref={containerRef}
        className="relative h-72 flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        {/* Previous card peeking from bottom */}
        <motion.div
          className={`
            absolute w-64 h-48 rounded-2xl shadow-lg
            flex items-center justify-center cursor-pointer
            bg-gradient-to-br ${cardColors[prevIndex % cardColors.length]}
          `}
          style={{ zIndex: 0 }}
          animate={{ y: 85, opacity: 0.4, scale: 0.85 }}
          whileHover={{ opacity: 0.6, y: 80 }}
          whileTap={{ scale: 0.82 }}
          onClick={() => !isSubmitting && goToPrevious()}
          transition={{ type: 'spring', stiffness: 250, damping: 40 }}
        >
          <span className="text-xl font-bold text-white text-center px-6 opacity-60">
            {optionsArray[prevIndex]}
          </span>
        </motion.div>

        {/* Second card in stack (behind next) */}
        <motion.div
          className={`
            absolute w-64 h-48 rounded-2xl shadow-lg
            flex items-center justify-center
            bg-gradient-to-br ${cardColors[nextIndex2 % cardColors.length]}
          `}
          style={{ zIndex: 1 }}
          animate={{ y: -20, opacity: 0.5, scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 250, damping: 40 }}
        >
          <span className="text-lg font-bold text-white text-center px-6 opacity-50">
            {optionsArray[nextIndex2]}
          </span>
        </motion.div>

        {/* Next card in stack (behind main) */}
        <motion.div
          className={`
            absolute w-64 h-48 rounded-2xl shadow-xl
            flex items-center justify-center
            bg-gradient-to-br ${cardColors[nextIndex1 % cardColors.length]}
          `}
          style={{ zIndex: 2 }}
          animate={{ y: -10, opacity: 0.7, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 250, damping: 40 }}
        >
          <span className="text-xl font-bold text-white text-center px-6 opacity-70">
            {optionsArray[nextIndex1]}
          </span>
        </motion.div>

        {/* Main card (front, draggable) */}
        <motion.div
          className={`
            absolute w-64 h-48 rounded-2xl shadow-2xl
            flex items-center justify-center z-10
            cursor-grab active:cursor-grabbing select-none
            bg-gradient-to-br ${cardColors[currentIndex % cardColors.length]}
          `}
          style={{ y, rotateX: mainCardRotateX, scale: mainCardScale }}
          drag={!isSubmitting ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          whileTap={{ cursor: 'grabbing' }}
        >
          <motion.span
            key={optionsArray[currentIndex]}
            className="text-2xl font-bold text-white text-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {optionsArray[currentIndex]}
          </motion.span>

          {/* Swipe hint */}
          <motion.div
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-white/50 text-sm"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↑ swipe ↓
          </motion.div>
        </motion.div>

        {/* Navigation buttons */}
        {!isSubmitting && (
          <>
            <motion.button
              onClick={goToPrevious}
              className="absolute bottom-0 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-500 hover:text-violet-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ↓
            </motion.button>
            <motion.button
              onClick={goToNext}
              className="absolute top-0 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-500 hover:text-violet-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ↑
            </motion.button>
          </>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {optionsArray.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => {
              if (isSubmitting) return
              setCurrentIndex(i)
              if (navigator.vibrate) navigator.vibrate(10)
            }}
            className={`w-3 h-3 rounded-full transition-colors ${
              i === currentIndex
                ? 'bg-violet-500'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            animate={{ scale: i === currentIndex ? 1.25 : 1 }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Current position */}
      <motion.p
        className="text-center text-gray-600 font-medium mt-4"
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="font-bold text-violet-500">{currentIndex + 1}</span> of {totalOptions}
      </motion.p>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`
          w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg
          transition-all duration-200
          ${isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-violet-500 text-white hover:bg-violet-600'
          }
        `}
        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Selecting...
          </motion.span>
        ) : (
          `Select "${optionsArray[currentIndex]}"`
        )}
      </motion.button>
    </div>
  )
}
