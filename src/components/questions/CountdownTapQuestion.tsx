'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface CountdownTapQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

const TAP_DURATION = 5000
const MAX_TAPS = 40

export function CountdownTapQuestion({ question, onAnswer }: CountdownTapQuestionProps) {
  const {
    min_label = 'Low',
    max_label = 'High',
  } = question.config as { min_label?: string; max_label?: string }

  const [phase, setPhase] = useState<'ready' | 'countdown' | 'tapping' | 'done'>('ready')
  const [countdownValue, setCountdownValue] = useState(3)
  const [tapCount, setTapCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TAP_DURATION)
  const tapCountRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return

    if (countdownValue > 0) {
      timerRef.current = setTimeout(() => {
        setCountdownValue(prev => prev - 1)
      }, 800)
    } else {
      // GO! -> switch to tapping
      timerRef.current = setTimeout(() => {
        setPhase('tapping')
        startTimeRef.current = Date.now()
      }, 600)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [phase, countdownValue])

  // Tapping timer
  useEffect(() => {
    if (phase !== 'tapping') return

    const updateTimer = () => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, TAP_DURATION - elapsed)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        const finalScore = Math.min(100, Math.round((tapCountRef.current / MAX_TAPS) * 100))
        setPhase('done')

        if (navigator.vibrate) {
          navigator.vibrate([30, 20, 50])
        }

        setTimeout(() => {
          onAnswer(finalScore)
        }, 1200)
        return
      }

      rafRef.current = requestAnimationFrame(updateTimer)
    }

    rafRef.current = requestAnimationFrame(updateTimer)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, onAnswer])

  const handleTap = useCallback(() => {
    if (phase !== 'tapping') return
    tapCountRef.current += 1
    setTapCount(tapCountRef.current)

    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }, [phase])

  const finalScore = Math.min(100, Math.round((tapCount / MAX_TAPS) * 100))
  const timerProgress = timeLeft / TAP_DURATION

  // Color based on intensity
  const getIntensityColor = () => {
    if (tapCount >= 30) return 'bg-red-500'
    if (tapCount >= 20) return 'bg-orange-500'
    if (tapCount >= 10) return 'bg-yellow-500'
    return 'bg-blue-500'
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

      {(phase === 'ready' || phase === 'countdown') && (
        <p className="text-gray-500 text-center mb-2 text-sm">
          Tap as fast as you can — more taps = higher score!
        </p>
      )}

      {/* Ready phase - wait for user to start */}
      {phase === 'ready' && (
        <motion.div
          className="flex flex-col items-center justify-center h-64 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.button
            onClick={() => setPhase('countdown')}
            className="w-48 h-48 rounded-full bg-violet-500 hover:bg-violet-500 shadow-xl flex flex-col items-center justify-center transition-colors"
            whileTap={{ scale: 0.95 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-4xl mb-1">⏱️</span>
            <span className="text-white font-bold text-lg">Start!</span>
          </motion.button>
        </motion.div>
      )}

      {/* Countdown phase */}
      <AnimatePresence mode="wait">
        {phase === 'countdown' && (
          <motion.div
            key={`countdown-${countdownValue}`}
            className="flex items-center justify-center h-64"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className={`font-black ${
              countdownValue === 0 ? 'text-7xl text-emerald-500' : 'text-8xl text-gray-800'
            }`}>
              {countdownValue === 0 ? 'GO!' : countdownValue}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tapping phase */}
      {phase === 'tapping' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Timer bar */}
          <div className="h-3 bg-gray-200 rounded-full mb-3 overflow-hidden">
            <motion.div
              className="h-full bg-violet-500 rounded-full"
              style={{ width: `${timerProgress * 100}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>

          <p className="text-center text-sm text-gray-500 mb-3">
            {(timeLeft / 1000).toFixed(1)}s — Tap fast for a higher score!
          </p>

          {/* Big tap button */}
          <motion.button
            className={`w-full h-48 rounded-3xl ${getIntensityColor()} shadow-xl flex flex-col items-center justify-center touch-none select-none active:brightness-90 transition-colors`}
            onPointerDown={(e) => { e.preventDefault(); handleTap() }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span
              key={tapCount}
              className="text-6xl font-black text-white"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              {tapCount}
            </motion.span>
            <span className="text-white/80 text-sm font-medium mt-1">TAP TAP TAP!</span>
          </motion.button>

          {/* Live score indicator */}
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="text-xs text-gray-400">{min_label}</span>
            <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-violet-400 rounded-full"
                animate={{ width: `${Math.min(100, (tapCount / MAX_TAPS) * 100)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="text-xs text-gray-400">{max_label}</span>
          </div>
        </motion.div>
      )}

      {/* Done phase */}
      {phase === 'done' && (
        <motion.div
          className="flex flex-col items-center justify-center h-64"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.span
            className="text-6xl font-black text-violet-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {finalScore}%
          </motion.span>
          <p className="text-gray-500 mt-2 text-sm">{tapCount} taps in {TAP_DURATION / 1000} seconds</p>

          {/* Scale legend */}
          <div className="flex justify-between text-xs text-gray-400 mt-6 w-full px-4">
            <span>{min_label}</span>
            <span>{max_label}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
