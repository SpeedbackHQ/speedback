'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface MadLibsQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function MadLibsQuestion({ question, onAnswer }: MadLibsQuestionProps) {
  const {
    template = 'The best part was ___',
    max_length = 80,
  } = question.config as { template?: string; max_length?: number }

  const [fillText, setFillText] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse template: split on ___
  const blankIndex = template.indexOf('___')
  const before = blankIndex >= 0 ? template.slice(0, blankIndex) : template + ' '
  const after = blankIndex >= 0 ? template.slice(blankIndex + 3) : ''

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!fillText.trim() || isSubmitted) return
    setIsSubmitted(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 40])
    }

    setTimeout(() => {
      onAnswer(fillText.trim())
    }, 800)
  }, [fillText, isSubmitted, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-8 text-sm">
        Fill in the blank
      </p>

      {/* Template card */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div key="editing" exit={{ opacity: 0 }}>
              {/* Template text with inline blank */}
              <div className="text-lg text-gray-800 leading-relaxed mb-4">
                <span>{before}</span>
                <span className="inline-block relative">
                  <input
                    ref={inputRef}
                    value={fillText}
                    onChange={(e) => setFillText(e.target.value.slice(0, max_length))}
                    maxLength={max_length}
                    placeholder="your answer"
                    className="border-b-2 border-violet-400 bg-violet-50/50 px-2 py-0.5 text-violet-600 font-semibold outline-none min-w-[120px] text-lg placeholder-violet-300"
                    style={{ width: Math.max(120, fillText.length * 11) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                  />
                  {!fillText && (
                    <motion.div
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-400"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </span>
                <span>{after}</span>
              </div>

              {/* Counter */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-400">{fillText.length}/{max_length}</span>
              </div>

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                disabled={!fillText.trim()}
                className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
                  fillText.trim()
                    ? 'bg-violet-500 text-white hover:bg-violet-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                whileTap={fillText.trim() ? { scale: 0.97 } : {}}
              >
                Complete!
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.span
                className="text-3xl block mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                📝
              </motion.span>
              <p className="text-lg text-gray-800 leading-relaxed">
                {before}
                <span className="font-bold text-violet-500 bg-violet-50 px-1 rounded">{fillText.trim()}</span>
                {after}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
