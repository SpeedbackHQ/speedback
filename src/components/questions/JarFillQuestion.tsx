'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface JarFillQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const itemColors = [
  { bg: 'bg-purple-400', color: '#a855f7', emoji: '🟣' },
  { bg: 'bg-pink-400', color: '#ec4899', emoji: '🩷' },
  { bg: 'bg-cyan-400', color: '#06b6d4', emoji: '🔵' },
  { bg: 'bg-amber-400', color: '#f59e0b', emoji: '🟡' },
]

export function JarFillQuestion({ question, onAnswer }: JarFillQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4)

  const [inJar, setInJar] = useState<string[]>([])
  const [dropping, setDropping] = useState<string | null>(null)

  // Stable positions for items in jar
  const jarPositions = useMemo(
    () => options.map((_, i) => ({
      x: (i % 2 === 0 ? 30 : 70) + ((i * 7) % 10 - 5),
      yBase: 75 - i * 18,
    })),
    [options]
  )

  const handleToggle = useCallback((option: string) => {
    const isInJar = inJar.includes(option)
    if (navigator.vibrate) navigator.vibrate(isInJar ? 20 : 40)

    if (isInJar) {
      setInJar(prev => prev.filter(o => o !== option))
    } else {
      setDropping(option)
      setTimeout(() => {
        setDropping(null)
        setInJar(prev => [...prev, option])
      }, 400)
    }
  }, [inJar])

  const handleSubmit = useCallback(() => {
    if (inJar.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(inJar)
  }, [inJar, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        Fill the jar with your picks!
      </p>

      {/* Jar visualization */}
      <motion.div
        className="relative mx-auto w-48 h-56 mb-5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Jar body */}
        <div className="absolute bottom-0 left-4 right-4 h-44 rounded-b-3xl rounded-t-lg border-4 border-gray-300 bg-white/60 backdrop-blur-sm overflow-hidden">
          {/* Fill level */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-100 to-indigo-50"
            animate={{ height: `${(inJar.length / options.length) * 80 + 10}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />

          {/* Items in jar */}
          <AnimatePresence>
            {inJar.map((option) => {
              const idx = options.indexOf(option)
              const orderInJar = inJar.indexOf(option)
              const color = itemColors[idx % itemColors.length]
              const pos = jarPositions[idx]

              return (
                <motion.div
                  key={option}
                  className={`absolute ${color.bg} rounded-full w-12 h-12 flex items-center justify-center shadow-md`}
                  style={{ left: `${pos.x - 15}%` }}
                  initial={{ y: -100, opacity: 0 }}
                  animate={{
                    y: pos.yBase + (orderInJar * 2),
                    opacity: 1,
                  }}
                  exit={{ y: -60, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 18,
                    bounce: 0.4,
                  }}
                >
                  <span className="text-white text-[9px] font-bold text-center leading-tight px-0.5">
                    {option.slice(0, 8)}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Jar lid */}
        <div className="absolute top-0 left-2 right-2 h-6 bg-gray-400 rounded-t-xl border-2 border-gray-500" />

        {/* Jar neck */}
        <div className="absolute top-5 left-6 right-6 h-4 bg-white/60 border-x-4 border-gray-300" />

        {/* Dropping animation */}
        <AnimatePresence>
          {dropping && (
            <motion.div
              className={`absolute left-1/2 -translate-x-1/2 ${itemColors[options.indexOf(dropping) % itemColors.length].bg} rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-10`}
              initial={{ y: -30, scale: 1.2 }}
              animate={{ y: 60, scale: 0.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeIn' }}
            >
              <span className="text-white text-[8px] font-bold">{dropping.slice(0, 6)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Option buttons */}
      <div className="space-y-2.5">
        {options.map((option, index) => {
          const isInJar = inJar.includes(option)
          const color = itemColors[index % itemColors.length]

          return (
            <motion.button
              key={option}
              onClick={() => handleToggle(option)}
              className={`w-full rounded-xl p-3.5 font-semibold text-left transition-all border-2 ${
                isInJar
                  ? `bg-gray-100 border-gray-200 text-gray-400`
                  : `bg-white border-gray-200 text-gray-700 hover:border-gray-400`
              }`}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{color.emoji}</span>
                  <span className={isInJar ? 'line-through' : ''}>{option}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {isInJar ? 'in jar ✓' : 'drop in →'}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={inJar.length === 0}
        className={`w-full mt-5 py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          inJar.length > 0
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={inJar.length > 0 ? { scale: 0.98 } : {}}
      >
        {inJar.length > 0 ? `🫙 Seal jar (${inJar.length})` : 'Fill the jar'}
      </motion.button>
    </div>
  )
}
