'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface EmojiReactionQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function EmojiReactionQuestion({ question, onAnswer }: EmojiReactionQuestionProps) {
  const {
    emojis = ['😍', '🙂', '😐', '🙁', '😡'],
    show_reason = true,
  } = question.config as { emojis?: string[]; show_reason?: boolean }

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const reasonRef = useRef<HTMLInputElement>(null)

  // Auto-focus reason input when it appears
  useEffect(() => {
    if (selectedEmoji && show_reason) {
      const t = setTimeout(() => reasonRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
  }, [selectedEmoji, show_reason])

  const handleEmojiSelect = useCallback((emoji: string) => {
    if (isSubmitted) return
    setSelectedEmoji(emoji)

    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    // Auto-submit if no reason field
    if (!show_reason) {
      setIsSubmitted(true)
      setTimeout(() => onAnswer(emoji), 600)
    }
  }, [isSubmitted, show_reason, onAnswer])

  const handleSend = useCallback(() => {
    if (!selectedEmoji || isSubmitted) return
    setIsSubmitted(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 40])
    }

    const answer = reasonText.trim()
      ? `${selectedEmoji}|${reasonText.trim()}`
      : selectedEmoji

    setTimeout(() => onAnswer(answer), 500)
  }, [selectedEmoji, reasonText, isSubmitted, onAnswer])

  const handleSkip = useCallback(() => {
    if (!selectedEmoji || isSubmitted) return
    setIsSubmitted(true)

    if (navigator.vibrate) {
      navigator.vibrate(20)
    }

    setTimeout(() => onAnswer(selectedEmoji), 500)
  }, [selectedEmoji, isSubmitted, onAnswer])

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
        Pick your reaction
      </p>

      {/* Emoji row */}
      <motion.div
        className="flex justify-center gap-3 flex-wrap mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {emojis.map((emoji, i) => {
          const isSelected = selectedEmoji === emoji
          const isDimmed = selectedEmoji !== null && !isSelected

          return (
            <motion.button
              key={`${emoji}-${i}`}
              onClick={() => handleEmojiSelect(emoji)}
              disabled={isSubmitted}
              className="text-4xl p-3 rounded-2xl transition-colors focus:outline-none"
              animate={{
                scale: isSelected ? 1.3 : 1,
                opacity: isDimmed ? 0.3 : 1,
              }}
              whileTap={!isSubmitted ? { scale: 0.85 } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              {emoji}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Reason input (slides in after emoji selection) */}
      <AnimatePresence>
        {selectedEmoji && show_reason && !isSubmitted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              <input
                ref={reasonRef}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value.slice(0, 140))}
                maxLength={140}
                placeholder="Tell us why... (optional)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 text-base outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <div className="flex gap-3">
                <motion.button
                  onClick={handleSkip}
                  className="flex-1 py-3 rounded-xl font-bold text-base bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  Skip
                </motion.button>
                <motion.button
                  onClick={handleSend}
                  className="flex-1 py-3 rounded-xl font-bold text-base bg-violet-500 text-white hover:bg-violet-600 transition-colors shadow-lg"
                  whileTap={{ scale: 0.97 }}
                >
                  Send
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitted confirmation */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-600 px-4 py-2 rounded-full font-medium text-sm">
              {selectedEmoji} {reasonText.trim() ? `"${reasonText.trim()}"` : 'Submitted!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
