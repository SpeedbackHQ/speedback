'use client'

import { useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface FannedSwipeQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function FannedSwipeQuestion({ question, onAnswer }: FannedSwipeQuestionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    // Use velocity OR position to trigger navigation
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      goToNext()
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      goToPrevious()
    }
  }

  const goToNext = () => {
    setDirection(1)
    setCurrentIndex(prev => getWrappedIndex(prev + 1))
    if (navigator.vibrate) navigator.vibrate(15)
  }

  const goToPrevious = () => {
    setDirection(-1)
    setCurrentIndex(prev => getWrappedIndex(prev - 1))
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

  // Get visible cards: prev, current, next (with wrapping)
  const prevIndex = getWrappedIndex(currentIndex - 1)
  const nextIndex = getWrappedIndex(currentIndex + 1)

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 15 : -15,
    }),
  }

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
        Swipe to browse, tap to select
      </p>

      {/* Cards container with 3D perspective */}
      <div
        className="relative h-80 flex items-center justify-center overflow-visible"
        style={{ perspective: '1200px' }}
      >
        {/* Previous card (left, tilted) */}
        <motion.div
          key={`prev-${prevIndex}`}
          className={`
            absolute w-36 h-56 rounded-2xl shadow-lg
            flex items-center justify-center cursor-pointer
            bg-gradient-to-br ${cardColors[prevIndex % cardColors.length]}
          `}
          style={{
            left: 0,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            x: -20,
            rotateY: 25,
            scale: 0.85,
            opacity: 0.6,
          }}
          transition={{ type: 'spring', stiffness: 250, damping: 40 }}
          onClick={() => !isSubmitting && goToPrevious()}
          whileHover={{ scale: 0.88, opacity: 0.8 }}
        >
          <span className="text-lg font-bold text-white text-center px-3 opacity-80">
            {optionsArray[prevIndex]}
          </span>
        </motion.div>

        {/* Next card (right, tilted) */}
        <motion.div
          key={`next-${nextIndex}`}
          className={`
            absolute w-36 h-56 rounded-2xl shadow-lg
            flex items-center justify-center cursor-pointer
            bg-gradient-to-br ${cardColors[nextIndex % cardColors.length]}
          `}
          style={{
            right: 0,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            x: 20,
            rotateY: -25,
            scale: 0.85,
            opacity: 0.6,
          }}
          transition={{ type: 'spring', stiffness: 250, damping: 40 }}
          onClick={() => !isSubmitting && goToNext()}
          whileHover={{ scale: 0.88, opacity: 0.8 }}
        >
          <span className="text-lg font-bold text-white text-center px-3 opacity-80">
            {optionsArray[nextIndex]}
          </span>
        </motion.div>

        {/* Main card (center, prominent) */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 250,
              damping: 40,
            }}
            drag={!isSubmitting ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`
              w-44 h-64 rounded-2xl shadow-2xl z-10
              flex items-center justify-center
              cursor-grab active:cursor-grabbing select-none
              bg-gradient-to-br ${cardColors[currentIndex % cardColors.length]}
            `}
            style={{ transformStyle: 'preserve-3d' }}
            whileHover={!isSubmitting ? { scale: 1.03 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          >
            <motion.span
              className="text-2xl font-bold text-white text-center px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {optionsArray[currentIndex]}
            </motion.span>

            {/* Swipe indicators */}
            <motion.div
              className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 text-white/40 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span animate={{ x: [-3, 0, -3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                ‹
              </motion.span>
              <span>swipe</span>
              <motion.span animate={{ x: [3, 0, 3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                ›
              </motion.span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {optionsArray.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => {
              if (isSubmitting) return
              setDirection(i > currentIndex ? 1 : -1)
              setCurrentIndex(i)
              if (navigator.vibrate) navigator.vibrate(10)
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              i === currentIndex
                ? 'bg-violet-500 scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Current position */}
      <motion.p
        className="text-center text-gray-600 font-medium mt-3"
        key={currentIndex}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.span
          key={currentIndex}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="inline-block font-bold text-violet-500"
        >
          {currentIndex + 1}
        </motion.span>
        {' '}of {totalOptions}
      </motion.p>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`
          w-full mt-5 py-4 rounded-xl font-bold text-lg shadow-lg
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
