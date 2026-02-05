'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface RolodexQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function RolodexQuestion({ question, onAnswer }: RolodexQuestionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Motion value for smooth dragging
  const x = useMotionValue(0)

  const { options = [] } = question.config
  const optionsArray = (options as string[]).slice(0, 4)  // Cap at 4 options max
  const totalOptions = optionsArray.length

  // Helper to get wrapped index for infinite looping
  const getWrappedIndex = (index: number) => {
    return ((index % totalOptions) + totalOptions) % totalOptions
  }

  // Card colors that cycle
  const cardColors = [
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-cyan-500 to-blue-500',
  ]

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isSubmitting) return

    const threshold = 50
    const velocity = 500

    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swipe left - next card
      goToNext()
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swipe right - previous card
      goToPrevious()
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  const goToNext = () => {
    setCurrentIndex(prev => getWrappedIndex(prev + 1))
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    if (navigator.vibrate) navigator.vibrate(15)
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => getWrappedIndex(prev - 1))
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
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
  const mainCardRotate = useTransform(x, [-200, 0, 200], [-8, 0, 8])
  const mainCardScale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95])

  // Get the three visible card indices
  const prevIndex = getWrappedIndex(currentIndex - 1)
  const nextIndex = getWrappedIndex(currentIndex + 1)

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

      {/* Carousel container */}
      <div
        ref={containerRef}
        className="relative h-56 flex items-center justify-center"
      >
        {/* Previous card (left) */}
        <motion.div
          className={`
            absolute w-48 h-36 rounded-2xl shadow-lg flex items-center justify-center cursor-pointer
            bg-gradient-to-br ${cardColors[prevIndex % cardColors.length]}
          `}
          style={{ x: -120 }}
          animate={{ scale: 0.8, opacity: 0.6 }}
          whileHover={{ scale: 0.85, opacity: 0.8 }}
          whileTap={{ scale: 0.78 }}
          onClick={() => !isSubmitting && goToPrevious()}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <span className="text-lg font-bold text-white text-center px-4">
            {optionsArray[prevIndex]}
          </span>
        </motion.div>

        {/* Next card (right) */}
        <motion.div
          className={`
            absolute w-48 h-36 rounded-2xl shadow-lg flex items-center justify-center cursor-pointer
            bg-gradient-to-br ${cardColors[nextIndex % cardColors.length]}
          `}
          style={{ x: 120 }}
          animate={{ scale: 0.8, opacity: 0.6 }}
          whileHover={{ scale: 0.85, opacity: 0.8 }}
          whileTap={{ scale: 0.78 }}
          onClick={() => !isSubmitting && goToNext()}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <span className="text-lg font-bold text-white text-center px-4">
            {optionsArray[nextIndex]}
          </span>
        </motion.div>

        {/* Main card (center, draggable) */}
        <motion.div
          className={`
            absolute w-64 h-48 rounded-2xl shadow-xl flex items-center justify-center z-10
            cursor-grab active:cursor-grabbing select-none
            bg-gradient-to-br ${cardColors[currentIndex % cardColors.length]}
          `}
          style={{ x, rotate: mainCardRotate, scale: mainCardScale }}
          drag={!isSubmitting ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
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
        </motion.div>

        {/* Navigation arrows */}
        {!isSubmitting && (
          <>
            <motion.button
              onClick={goToPrevious}
              className="absolute left-0 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-500 hover:text-indigo-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ‹
            </motion.button>
            <motion.button
              onClick={goToNext}
              className="absolute right-0 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-500 hover:text-indigo-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ›
            </motion.button>
          </>
        )}
      </div>

      {/* Dot indicators */}
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
                ? 'bg-indigo-500'
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
        <span className="font-bold text-indigo-600">{currentIndex + 1}</span> of {totalOptions}
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
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
