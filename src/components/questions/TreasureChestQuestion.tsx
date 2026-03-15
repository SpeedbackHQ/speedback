'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface TreasureChestQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const TAPS_TO_OPEN = 10

const chestColors = [
  { base: 'from-amber-600 to-amber-800', accent: 'bg-amber-700' },
  { base: 'from-red-600 to-red-800', accent: 'bg-red-700' },
  { base: 'from-blue-600 to-blue-800', accent: 'bg-blue-700' },
  { base: 'from-purple-600 to-purple-800', accent: 'bg-purple-700' },
  { base: 'from-emerald-600 to-emerald-800', accent: 'bg-emerald-700' },
]

type Phase = 'select' | 'tapping' | 'opened'

export function TreasureChestQuestion({ question, onAnswer }: TreasureChestQuestionProps) {
  const { options: rawOptions = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }
  const options = rawOptions.slice(0, 4)  // Cap at 4 options max

  const [phase, setPhase] = useState<Phase>('select')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [tapCount, setTapCount] = useState(0)
  const [particles, setParticles] = useState<{ id: number; angle: number; distance: number }[]>([])

  const progress = Math.min(100, (tapCount / TAPS_TO_OPEN) * 100)
  const colors = chestColors[selectedIndex % chestColors.length]

  const handleSelectChest = (option: string, index: number) => {
    setSelectedOption(option)
    setSelectedIndex(index)
    setPhase('tapping')
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const handleTap = useCallback(() => {
    if (phase !== 'tapping') return
    if (navigator.vibrate) navigator.vibrate(15)

    const newCount = tapCount + 1
    setTapCount(newCount)

    if (newCount >= TAPS_TO_OPEN) {
      setPhase('opened')
      // Spawn gold particles (pre-compute random values to avoid Math.random during render)
      setParticles(
        Array.from({ length: 16 }, (_, i) => ({
          id: Date.now() + i,
          angle: (i / 16) * 360,
          distance: 60 + Math.random() * 40,
        }))
      )
      if (navigator.vibrate) navigator.vibrate([50, 30, 100])
    }
  }, [phase, tapCount])

  const handleConfirm = useCallback(() => {
    if (selectedOption) {
      if (navigator.vibrate) navigator.vibrate(50)
      onAnswer(selectedOption)
    }
  }, [selectedOption, onAnswer])

  const handleRetry = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(30)
    setPhase('select')
    setSelectedOption(null)
    setTapCount(0)
    setParticles([])
  }, [])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Question text */}
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      {phase === 'tapping' ? (
        <motion.p
          className="text-center mb-6 text-2xl font-black text-amber-600 select-none"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          TAP!
        </motion.p>
      ) : (
        <p className="text-gray-500 text-center mb-6 text-sm">
          {phase === 'select' ? 'Pick a treasure chest to open!' : 'Treasure revealed!'}
        </p>
      )}

      {/* Phase: Select */}
      {phase === 'select' && (
        <div className="grid grid-cols-2 gap-4">
          {options.map((option, index) => {
            const c = chestColors[index % chestColors.length]
            return (
              <motion.button
                key={option}
                onClick={() => handleSelectChest(option, index)}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Chest visual */}
                <div className="relative w-20 h-16">
                  {/* Chest lid */}
                  <div className={`absolute top-0 w-full h-8 rounded-t-lg bg-gradient-to-b ${c.base} shadow-md`}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow" />
                  </div>
                  {/* Chest body */}
                  <div className={`absolute bottom-0 w-full h-10 rounded-b-lg bg-gradient-to-b ${c.base} shadow-lg border-t-2 border-yellow-600/30`}>
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded bg-yellow-600/40" />
                  </div>
                </div>
                {/* Label */}
                <span className="text-sm font-medium text-gray-700 text-center leading-tight max-w-24">
                  {option}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Phase: Tapping */}
      {phase === 'tapping' && selectedOption && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Selected option badge */}
          <div className="mb-4">
            <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-medium text-sm">
              {selectedOption}
            </span>
          </div>

          {/* Large chest to tap */}
          <motion.div
            onClick={handleTap}
            className="relative w-40 h-32 cursor-pointer select-none"
            animate={{
              rotate: tapCount > 0 ? [0, -2, 2, -1, 0] : 0,
            }}
            transition={{ duration: 0.15 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Chest lid */}
            <div className={`absolute top-0 w-full h-14 rounded-t-xl bg-gradient-to-b ${colors.base} shadow-md`}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow flex items-center justify-center">
                <span className="text-xs">{progress < 100 ? '🔒' : '🔓'}</span>
              </div>
              {/* Keyhole */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-3 rounded-full bg-amber-900/50" />
            </div>
            {/* Chest body */}
            <div className={`absolute bottom-0 w-full h-20 rounded-b-xl bg-gradient-to-b ${colors.base} shadow-xl border-t-2 border-yellow-600/30`}>
              {/* Metal bands */}
              <div className="absolute top-2 left-0 right-0 h-1 bg-yellow-600/40" />
              <div className="absolute bottom-4 left-0 right-0 h-1 bg-yellow-600/40" />
            </div>

            {/* Cracks */}
            {progress > 33 && (
              <motion.div
                className="absolute top-6 right-4 text-yellow-300 text-lg"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                ✧
              </motion.div>
            )}
            {progress > 66 && (
              <motion.div
                className="absolute bottom-6 left-5 text-yellow-300 text-lg"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                ✧
              </motion.div>
            )}
            {progress > 50 && (
              <motion.div
                className="absolute top-10 left-3 text-yellow-300 text-sm"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                ✧
              </motion.div>
            )}

            {/* Golden glow when close */}
            {progress > 50 && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ boxShadow: `0 0 ${progress / 2}px rgba(255, 215, 0, ${progress / 150})` }}
              />
            )}
          </motion.div>

          {/* Back button */}
          <button
            onClick={handleRetry}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            ← Pick a different chest
          </button>
        </motion.div>
      )}

      {/* Phase: Opened */}
      {phase === 'opened' && selectedOption && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Opened chest */}
          <div className="relative w-40 h-36 mb-4 mt-8 overflow-visible" style={{ perspective: '600px' }}>
            {/* Chest lid - flipped open */}
            <motion.div
              className={`absolute top-0 w-full h-14 rounded-t-xl bg-gradient-to-b ${colors.base} shadow-md`}
              initial={{ rotateX: 0 }}
              animate={{ rotateX: -110 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
            />
            {/* Chest body */}
            <div className={`absolute bottom-0 w-full h-20 rounded-b-xl bg-gradient-to-b ${colors.base} shadow-xl`}>
              {/* Gold inside */}
              <div className="absolute top-0 left-2 right-2 h-8 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg" />
            </div>

            {/* Gold particles */}
            {particles.map(p => (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/3 w-3 h-3 rounded-full bg-yellow-400"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 6px rgba(255, 215, 0, 0.8)' }}
              />
            ))}
          </div>

          {/* Revealed answer */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="text-4xl mb-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              💰
            </motion.div>
            <p className="text-xl font-bold text-gray-800 mb-1">{selectedOption}</p>
            <p className="text-sm text-gray-500 mb-4">Treasure found!</p>

            <div className="flex gap-3 w-64">
              <motion.button
                onClick={handleRetry}
                className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50"
                whileTap={{ scale: 0.95 }}
              >
                Pick Again
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700"
                whileTap={{ scale: 0.95 }}
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
