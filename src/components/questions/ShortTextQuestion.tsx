'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface ShortTextQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function ShortTextQuestion({ question, onAnswer }: ShortTextQuestionProps) {
  const {
    max_length = 140,
    placeholder = 'Share your thought...',
  } = question.config as { max_length?: number; placeholder?: string }

  const [text, setText] = useState('')
  const [isSent, setIsSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Auto-focus with small delay for animation
    const t = setTimeout(() => textareaRef.current?.focus(), 400)
    return () => clearTimeout(t)
  }, [])

  const charRatio = text.length / max_length
  const counterColor = charRatio >= 0.95 ? 'text-red-500' : charRatio >= 0.8 ? 'text-amber-500' : 'text-gray-400'

  const handleSend = useCallback(() => {
    if (!text.trim() || isSent) return
    setIsSent(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 40])
    }

    setTimeout(() => {
      onAnswer(text.trim())
    }, 600)
  }, [text, isSent, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-6 text-sm">
        Type your answer
      </p>

      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {!isSent ? (
            <motion.div key="input" exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.3 }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, max_length))}
                placeholder={placeholder}
                maxLength={max_length}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 text-base resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-colors placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />

              {/* Character counter */}
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs font-medium transition-colors ${counterColor}`}>
                  {text.length}/{max_length}
                </span>
              </div>

              {/* Send button */}
              <motion.button
                onClick={handleSend}
                disabled={!text.trim()}
                className={`w-full mt-4 py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
                  text.trim()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                whileTap={text.trim() ? { scale: 0.97 } : {}}
              >
                Send
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              className="flex flex-col items-center gap-3 py-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <motion.span
                className="text-4xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                💬
              </motion.span>
              <span className="text-emerald-600 font-bold text-lg">Sent!</span>
              <span className="text-gray-500 text-sm text-center max-w-xs">&quot;{text.trim()}&quot;</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
