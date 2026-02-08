'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface FlickQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const cardColors = [
  'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
  'from-emerald-400 to-emerald-600',
]

export function FlickQuestion({ question, onAnswer }: FlickQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4).filter(o => o.trim() !== '')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (isSubmitting) return
    const threshold = 50
    const velocity = 200

    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swipe left -> next
      setDirection(1)
      setCurrentIndex(prev => (prev + 1) % options.length)
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swipe right -> prev
      setDirection(-1)
      setCurrentIndex(prev => (prev - 1 + options.length) % options.length)
    }
  }, [options.length, isSubmitting])

  const handleSelect = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 30])
    }

    setTimeout(() => {
      onAnswer(options[currentIndex])
    }, 600)
  }, [isSubmitting, currentIndex, options, onAnswer])

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
      scale: 0.9,
    }),
    selected: {
      y: -300,
      opacity: 0,
      scale: 0.8,
      rotate: 10,
    },
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-8 text-sm">
        Swipe through cards, then tap Select
      </p>

      {/* Card area */}
      <div className="relative h-64 mb-6">
        {/* Stack shadow cards */}
        <div className="absolute inset-x-4 top-2 bottom-0 rounded-2xl bg-gray-200 -rotate-2" />
        <div className="absolute inset-x-2 top-1 bottom-0 rounded-2xl bg-gray-100 rotate-1" />

        {/* Current card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate={isSubmitting ? 'selected' : 'center'}
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag={isSubmitting ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardColors[currentIndex % cardColors.length]} shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none`}
          >
            <span className="text-white text-2xl font-bold px-6 text-center drop-shadow-md">
              {options[currentIndex]}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mb-6">
        {options.map((_, i) => (
          <motion.div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentIndex ? 'bg-indigo-500' : 'bg-gray-300'
            }`}
            animate={{ scale: i === currentIndex ? 1.2 : 1 }}
          />
        ))}
      </div>

      {/* Select button */}
      <motion.button
        onClick={handleSelect}
        disabled={isSubmitting}
        className={`
          w-full py-4 rounded-xl font-bold text-lg shadow-lg
          ${isSubmitting
            ? 'bg-green-500 text-white'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }
          transition-colors
        `}
        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? 'Selected!' : `Select "${options[currentIndex]}"`}
      </motion.button>
    </div>
  )
}
