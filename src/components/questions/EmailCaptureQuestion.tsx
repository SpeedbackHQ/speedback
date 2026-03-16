'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Question } from '@/lib/types'

interface EmailCaptureQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
  surveyId: string
  responseSessionId: string
}

export function EmailCaptureQuestion({ question, onAnswer, surveyId, responseSessionId }: EmailCaptureQuestionProps) {
  const [email, setEmail] = useState('')
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const config = question.config as {
    placeholder?: string
    show_organizer_checkbox?: boolean
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Save lead immediately (not on survey completion)
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          is_organizer: isOrganizer,
          survey_id: surveyId,
          response_session_id: responseSessionId,
        }),
      })
    } catch {
      // Non-blocking — still advance the survey even if lead save fails
      console.error('Failed to save lead')
    }

    setIsSubmitting(false)
    onAnswer(email)
  }

  const handleSkip = () => {
    onAnswer('skipped')
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 text-center mb-6 break-words">
          {question.text}
        </h2>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder={config.placeholder || 'your@email.com'}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg focus:outline-none focus:border-violet-500 transition-colors"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && isValidEmail && handleSubmit()}
          />

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          {config.show_organizer_checkbox !== false && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOrganizer}
                onChange={e => setIsOrganizer(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-slate-600 text-sm">I organize events professionally</span>
            </label>
          )}

          <motion.button
            onClick={handleSubmit}
            disabled={!isValidEmail || isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition-all ${
              isValidEmail
                ? 'bg-violet-500 text-white hover:bg-violet-600 shadow-md shadow-violet-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            whileTap={isValidEmail ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? 'Saving...' : 'Submit'}
          </motion.button>

          <button
            onClick={handleSkip}
            className="w-full py-2 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
          >
            Skip
          </button>
        </div>
      </motion.div>
    </div>
  )
}
