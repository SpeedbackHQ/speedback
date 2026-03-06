'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface PinataQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const TAPS_TO_BREAK = 10

const pinataColors = [
  { body: 'from-pink-400 to-rose-500', stripe: 'bg-yellow-300', candy: ['bg-pink-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'] },
  { body: 'from-blue-400 to-violet-500', stripe: 'bg-green-300', candy: ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'] },
  { body: 'from-green-400 to-emerald-500', stripe: 'bg-orange-300', candy: ['bg-green-400', 'bg-orange-400', 'bg-red-400', 'bg-yellow-400'] },
  { body: 'from-purple-400 to-violet-500', stripe: 'bg-pink-300', candy: ['bg-purple-400', 'bg-pink-400', 'bg-cyan-400', 'bg-amber-400'] },
  { body: 'from-orange-400 to-amber-500', stripe: 'bg-red-300', candy: ['bg-orange-400', 'bg-red-400', 'bg-yellow-400', 'bg-pink-400'] },
]

type Phase = 'select' | 'hitting' | 'broken'

export function PinataQuestion({ question, onAnswer }: PinataQuestionProps) {
  const { options: rawOptions = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }
  const options = rawOptions.slice(0, 4)  // Cap at 4 options max

  const [phase, setPhase] = useState<Phase>('select')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [tapCount, setTapCount] = useState(0)
  const [candyParticles, setCandyParticles] = useState<{ id: number; angle: number; color: string; distance: number; rotation: number }[]>([])

  const progress = Math.min(100, (tapCount / TAPS_TO_BREAK) * 100)
  const colors = pinataColors[selectedIndex % pinataColors.length]

  const handleSelectPinata = (option: string, index: number) => {
    setSelectedOption(option)
    setSelectedIndex(index)
    setPhase('hitting')
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const handleTap = useCallback(() => {
    if (phase !== 'hitting') return
    if (navigator.vibrate) navigator.vibrate(15)

    const newCount = tapCount + 1
    setTapCount(newCount)

    if (newCount >= TAPS_TO_BREAK) {
      setPhase('broken')
      // Spawn candy particles (pre-compute random values to avoid Math.random during render)
      const c = pinataColors[selectedIndex % pinataColors.length]
      setCandyParticles(
        Array.from({ length: 24 }, (_, i) => ({
          id: Date.now() + i,
          angle: (i / 24) * 360 + (Math.random() - 0.5) * 30,
          color: c.candy[i % c.candy.length],
          distance: 50 + Math.random() * 40,
          rotation: Math.random() * 360,
        }))
      )
      if (navigator.vibrate) navigator.vibrate([50, 30, 100])
    }
  }, [phase, tapCount, selectedIndex])

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
    setCandyParticles([])
  }, [])

  // Swing amplitude increases with progress
  const swingAmplitude = 5 + (progress / 100) * 10

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

      <p className="text-gray-500 text-center mb-6 text-sm">
        {phase === 'select'
          ? 'Pick a pinata to smash!'
          : phase === 'hitting'
          ? 'Tap to smash it open!'
          : 'Smashed!'}
      </p>

      {/* Phase: Select */}
      {phase === 'select' && (
        <div className="grid grid-cols-2 gap-4">
          {options.map((option, index) => {
            const c = pinataColors[index % pinataColors.length]
            return (
              <motion.button
                key={option}
                onClick={() => handleSelectPinata(option, index)}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Pinata visual */}
                <div className="relative w-16 h-20">
                  {/* String */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-400" />
                  {/* Body */}
                  <div className={`absolute top-4 left-1 right-1 h-14 rounded-2xl bg-gradient-to-b ${c.body} shadow-lg`}>
                    {/* Stripes */}
                    <div className={`absolute top-3 left-1 right-1 h-1.5 ${c.stripe} rounded opacity-70`} />
                    <div className={`absolute top-7 left-1 right-1 h-1.5 ${c.stripe} rounded opacity-70`} />
                    {/* Fringe bottom */}
                    <div className="absolute -bottom-1 left-1 right-1 flex justify-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-2 h-3 ${c.stripe} rounded-b-full opacity-80`} />
                      ))}
                    </div>
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

      {/* Phase: Hitting */}
      {phase === 'hitting' && selectedOption && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Selected option badge */}
          <div className="mb-4">
            <span className="bg-pink-100 text-pink-800 px-4 py-1.5 rounded-full font-medium text-sm">
              {selectedOption}
            </span>
          </div>

          {/* Large pinata to hit */}
          <div className="relative h-56 flex items-start justify-center pt-2">
            {/* String from top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-gray-400" />

            {/* Swinging pinata */}
            <motion.div
              onClick={handleTap}
              className="relative w-28 h-36 mt-8 cursor-pointer select-none"
              animate={{
                rotate: phase === 'hitting' ? [-swingAmplitude, swingAmplitude] : 0,
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: 'top center' }}
              whileTap={{ scale: 0.92 }}
            >
              {/* Pinata body */}
              <div className={`w-full h-full rounded-3xl bg-gradient-to-b ${colors.body} shadow-xl relative overflow-hidden`}>
                {/* Stripes */}
                <div className={`absolute top-6 left-2 right-2 h-2 ${colors.stripe} rounded opacity-70`} />
                <div className={`absolute top-12 left-2 right-2 h-2 ${colors.stripe} rounded opacity-70`} />
                <div className={`absolute top-18 left-2 right-2 h-2 ${colors.stripe} rounded opacity-70`} />

                {/* Crack lines */}
                {progress > 33 && (
                  <motion.svg
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                  >
                    <line x1="20%" y1="30%" x2="45%" y2="50%" stroke="white" strokeWidth="2" />
                    <line x1="45%" y1="50%" x2="35%" y2="65%" stroke="white" strokeWidth="2" />
                  </motion.svg>
                )}
                {progress > 66 && (
                  <motion.svg
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                  >
                    <line x1="70%" y1="25%" x2="55%" y2="45%" stroke="white" strokeWidth="2" />
                    <line x1="55%" y1="45%" x2="75%" y2="70%" stroke="white" strokeWidth="2" />
                  </motion.svg>
                )}
              </div>

              {/* Fringe at bottom */}
              <div className="absolute -bottom-2 left-2 right-2 flex justify-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-3 h-5 ${colors.stripe} rounded-b-full opacity-80`}
                    animate={progress > 50 ? { y: [0, 2, 0] } : {}}
                    transition={{ duration: 0.3, delay: i * 0.05, repeat: Infinity }}
                  />
                ))}
              </div>

              {/* Falling pieces at 50%+ */}
              {progress > 50 && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`piece-${i}`}
                      className={`absolute w-2 h-2 rounded ${colors.candy[i % colors.candy.length]}`}
                      style={{ left: `${20 + i * 30}%`, top: '80%' }}
                      animate={{ y: [0, 40, 80], opacity: [1, 0.5, 0], rotate: [0, 180, 360] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          </div>

          {/* Back button */}
          <button
            onClick={handleRetry}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            ← Pick a different pinata
          </button>
        </motion.div>
      )}

      {/* Phase: Broken */}
      {phase === 'broken' && selectedOption && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Candy particle explosion */}
          <div className="relative w-40 h-40 mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-5xl"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                🎊
              </motion.div>
            </div>

            {/* Candy particles */}
            {candyParticles.map(p => (
              <motion.div
                key={p.id}
                className={`absolute left-1/2 top-1/2 w-3 h-3 rounded-full ${p.color}`}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.distance + 20,
                  opacity: 0,
                  scale: 0,
                  rotate: p.rotation,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
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
            <p className="text-xl font-bold text-gray-800 mb-1">{selectedOption}</p>
            <p className="text-sm text-gray-500 mb-4">Smashed open!</p>

            <div className="flex gap-3 w-64">
              <motion.button
                onClick={handleRetry}
                className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50"
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 rounded-lg bg-pink-600 text-white font-medium text-sm hover:bg-pink-700"
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
