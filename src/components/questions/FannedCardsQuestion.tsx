'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface FannedCardsQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function FannedCardsQuestion({ question, onAnswer }: FannedCardsQuestionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { options = [] } = question.config
  const optionsArray = (options as string[]).slice(0, 4)  // Cap at 4 options max

  // Card colors
  const cardColors = [
    { bg: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-200' },
    { bg: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-200' },
    { bg: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200' },
    { bg: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-200' },
    { bg: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-200' },
  ]

  const handleCardTap = (index: number) => {
    if (isSubmitting) return

    setSelectedIndex(index)
    if (navigator.vibrate) {
      navigator.vibrate(20)
    }
  }

  const handleSubmit = () => {
    if (selectedIndex === null || isSubmitting) return

    setIsSubmitting(true)
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 100])
    }

    setTimeout(() => {
      onAnswer(optionsArray[selectedIndex])
    }, 300)
  }

  // Calculate fan layout
  const totalCards = optionsArray.length
  const fanSpread = Math.min(15, 60 / totalCards) // Degrees between each card
  const startAngle = -((totalCards - 1) * fanSpread) / 2

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
        Tap a card to select it
      </p>

      {/* Fanned cards container */}
      <div className="relative h-72 flex items-end justify-center" style={{ perspective: '1000px' }}>
        {optionsArray.map((option, index) => {
          const isSelected = selectedIndex === index
          const angle = startAngle + index * fanSpread
          const colors = cardColors[index % cardColors.length]

          // Calculate z-index - selected card on top, otherwise higher index = more in front
          const zIndex = isSelected ? 100 : index + 1

          // Fan offset from center
          const xOffset = (index - (totalCards - 1) / 2) * 25

          return (
            <motion.button
              key={option}
              onClick={() => handleCardTap(index)}
              disabled={isSubmitting}
              className={`
                absolute w-28 h-40 rounded-xl shadow-lg
                flex flex-col items-center justify-center
                cursor-pointer select-none
                bg-gradient-to-br ${colors.bg}
                ${isSelected ? 'ring-4 ring-white ring-offset-2' : ''}
              `}
              style={{
                transformOrigin: 'center bottom',
                zIndex,
              }}
              initial={{
                rotate: angle,
                x: xOffset,
                y: 20,
                scale: 0.9,
                opacity: 0,
              }}
              animate={{
                rotate: isSelected ? 0 : angle,
                x: isSelected ? 0 : xOffset,
                y: isSelected ? -30 : 0,
                scale: isSelected ? 1.15 : 1,
                opacity: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: index * 0.05,
              }}
              whileHover={!isSelected && !isSubmitting ? { y: -10, scale: 1.05 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95 } : {}}
            >
              {/* Card content */}
              <span className="text-white font-bold text-center px-2 text-sm leading-tight">
                {option}
              </span>

              {/* Selection checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-green-500 text-lg">✓</span>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Selected option display */}
      {selectedIndex !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-4"
        >
          <p className="text-sm text-gray-500">Selected:</p>
          <p className="text-xl font-bold text-indigo-600">{optionsArray[selectedIndex]}</p>
        </motion.div>
      )}

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={selectedIndex === null || isSubmitting}
        className={`
          w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg
          transition-all duration-200
          ${selectedIndex !== null && !isSubmitting
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        whileHover={selectedIndex !== null && !isSubmitting ? { scale: 1.02 } : {}}
        whileTap={selectedIndex !== null && !isSubmitting ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Selecting...
          </motion.span>
        ) : selectedIndex !== null ? (
          `Select "${optionsArray[selectedIndex]}"`
        ) : (
          'Tap a card to select'
        )}
      </motion.button>
    </div>
  )
}
