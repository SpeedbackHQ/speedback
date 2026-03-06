'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface MagnetBoardQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const magnetColors = [
  { bg: 'bg-purple-500', light: 'bg-purple-200' },
  { bg: 'bg-pink-500', light: 'bg-pink-200' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-200' },
  { bg: 'bg-amber-500', light: 'bg-amber-200' },
]

export function MagnetBoardQuestion({ question, onAnswer }: MagnetBoardQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = useMemo(() => (rawOptions as string[]).slice(0, 4), [rawOptions])

  const [magnetized, setMagnetized] = useState<string[]>([])
  // Floating item positions (percentage-based)
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([])
  const rafRef = useRef<number>(0)
  const velocitiesRef = useRef<{ vx: number; vy: number }[]>([])

  // Initialize positions
  useEffect(() => {
    const initialPositions = options.map((_, i) => ({
      x: 15 + (i % 2) * 50 + ((i * 13) % 20),
      y: 30 + Math.floor(i / 2) * 35 + ((i * 17) % 15),
    }))
    setPositions(initialPositions)

    velocitiesRef.current = options.map((_, i) => ({
      vx: (((i * 7 + 3) % 5) - 2) * 0.15,
      vy: (((i * 11 + 1) % 5) - 2) * 0.12,
    }))
  }, [options])

  // Gentle floating animation
  useEffect(() => {
    const animate = () => {
      setPositions(prev => prev.map((pos, i) => {
        if (magnetized.includes(options[i])) return pos

        const v = velocitiesRef.current[i]
        let { x, y } = pos
        x += v.vx
        y += v.vy

        // Bounce off edges
        if (x < 5 || x > 75) { v.vx *= -1; x = Math.max(5, Math.min(75, x)) }
        if (y < 15 || y > 70) { v.vy *= -1; y = Math.max(15, Math.min(70, y)) }

        return { x, y }
      }))

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [magnetized, options])

  const handleMagnetize = useCallback((option: string) => {
    if (navigator.vibrate) navigator.vibrate(40)
    setMagnetized(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    )
  }, [])

  const handleSubmit = useCallback(() => {
    if (magnetized.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(magnetized)
  }, [magnetized, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-3 text-sm">
        Tap to magnetize your picks!
      </p>

      {/* Magnet bar (collection area) */}
      <motion.div
        className="relative bg-gray-700 rounded-xl p-2.5 mb-3 min-h-[48px] flex flex-wrap gap-2 items-center justify-center"
        animate={magnetized.length > 0 ? {} : { boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)' }}
      >
        <span className="absolute -top-2 left-3 text-lg">🧲</span>
        {magnetized.length === 0 ? (
          <span className="text-gray-400 text-xs">Tap items below to attract them</span>
        ) : (
          <AnimatePresence>
            {magnetized.map((option) => {
              const idx = options.indexOf(option)
              const color = magnetColors[idx % magnetColors.length]
              return (
                <motion.button
                  key={option}
                  onClick={() => handleMagnetize(option)}
                  className={`${color.bg} text-white px-3 py-1.5 rounded-full text-xs font-bold shadow`}
                  initial={{ scale: 0, y: 40 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, y: 40 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  {option} ✕
                </motion.button>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Floating area */}
      <div className="relative h-64 bg-slate-50 rounded-2xl border border-gray-200 overflow-hidden mb-3">
        {options.map((option, index) => {
          const isMagnetized = magnetized.includes(option)
          const color = magnetColors[index % magnetColors.length]
          const pos = positions[index]
          if (!pos) return null

          if (isMagnetized) return null

          return (
            <motion.button
              key={option}
              className={`absolute ${color.bg} text-white rounded-xl px-4 py-2.5 font-bold text-sm shadow-lg whitespace-nowrap`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
              onClick={() => handleMagnetize(option)}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
            >
              {option}
            </motion.button>
          )
        })}

        {/* Magnetic field lines (decorative) */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 left-1/4 w-px h-8 bg-violet-400" />
          <div className="absolute top-0 left-1/2 w-px h-12 bg-violet-400" />
          <div className="absolute top-0 left-3/4 w-px h-6 bg-violet-400" />
        </div>
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={magnetized.length === 0}
        className={`w-full py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          magnetized.length > 0
            ? 'bg-violet-500 text-white hover:bg-violet-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={magnetized.length > 0 ? { scale: 0.98 } : {}}
      >
        {magnetized.length > 0 ? `🧲 Done! (${magnetized.length})` : 'Magnetize your picks'}
      </motion.button>
    </div>
  )
}
