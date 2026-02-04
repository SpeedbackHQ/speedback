'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface SliderQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

const emojis = ['😢', '😕', '😐', '🙂', '😊', '🤩']

export function SliderQuestion({ question, onAnswer }: SliderQuestionProps) {
  const [value, setValue] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const { min_label = 'Not great', max_label = 'Amazing!' } = question.config

  // Get emoji based on value
  const emojiIndex = Math.min(Math.floor(value / 20), 5)
  const currentEmoji = emojis[emojiIndex]

  // Background gradient based on value
  const gradientColor = `hsl(${value * 1.2}, 70%, 60%)`

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value))
    setHasInteracted(true)
    if (navigator.vibrate && !isDragging) {
      navigator.vibrate(10)
    }
  }

  const handleSubmit = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    onAnswer(value)
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Question text */}
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      {/* Animated emoji */}
      <motion.div
        className="text-8xl text-center mb-8"
        key={currentEmoji}
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{
          scale: isDragging ? 1.2 : 1,
          rotate: 0,
          y: isDragging ? -10 : 0
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {currentEmoji}
      </motion.div>

      {/* Slider container with gradient background */}
      <motion.div
        className="relative h-16 rounded-full overflow-hidden mb-4"
        style={{
          background: `linear-gradient(to right, #ef4444, #eab308, #22c55e)`,
          boxShadow: isDragging ? `0 0 30px ${gradientColor}` : 'none'
        }}
        animate={{ scale: isDragging ? 1.02 : 1 }}
      >
        {/* Slider track overlay */}
        <div className="absolute inset-0 bg-gray-200/30" />

        {/* Custom slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Slider thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl"
          style={{ left: `calc(${value}% - 28px)` }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
        >
          {currentEmoji}
        </motion.div>
      </motion.div>

      {/* Labels */}
      <div className="flex justify-between text-gray-500 mb-8">
        <span>{min_label}</span>
        <span>{max_label}</span>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-full shadow-lg"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: hasInteracted ? 1 : 0.5 }}
      >
        {hasInteracted ? "That's my answer!" : 'Slide to rate'}
      </motion.button>
    </div>
  )
}
