'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface RacingLanesQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

type GamePhase = 'select' | 'countdown' | 'racing' | 'finished'

const carOptions = [
  { emoji: '🚗', color: 'bg-red-500', name: 'Red Racer' },
  { emoji: '🚙', color: 'bg-blue-500', name: 'Blue Bolt' },
  { emoji: '🚕', color: 'bg-yellow-500', name: 'Yellow Flash' },
  { emoji: '🏎️', color: 'bg-purple-500', name: 'Purple Speed' },
  { emoji: '🛻', color: 'bg-green-500', name: 'Green Machine' },
  { emoji: '🚐', color: 'bg-orange-500', name: 'Orange Cruiser' },
]

export function RacingLanesQuestion({ question, onAnswer }: RacingLanesQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [gamePhase, setGamePhase] = useState<GamePhase>('select')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedCar, setSelectedCar] = useState<number>(0)
  const [countdown, setCountdown] = useState(3)
  const [progress, setProgress] = useState(0)
  const [tapCount, setTapCount] = useState(0)

  const finishLine = 100
  const progressPerTap = 4
  const decayRate = 0.5

  // Handle option selection
  const handleSelectOption = (option: string) => {
    setSelectedOption(option)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  // Handle car selection and start race
  const handleSelectCar = (carIndex: number) => {
    if (!selectedOption) return

    setSelectedCar(carIndex)
    setGamePhase('countdown')

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  // Countdown timer
  useEffect(() => {
    if (gamePhase !== 'countdown') return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 800)
      return () => clearTimeout(timer)
    } else {
      setGamePhase('racing')
    }
  }, [gamePhase, countdown])

  // Decay during racing
  useEffect(() => {
    if (gamePhase !== 'racing') return

    const decayInterval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - decayRate))
    }, 100)

    return () => clearInterval(decayInterval)
  }, [gamePhase])

  // Handle tap during race
  const handleRaceTap = useCallback(() => {
    if (gamePhase !== 'racing') return

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15)
    }

    setTapCount(prev => prev + 1)
    setProgress(prev => {
      const newProgress = prev + progressPerTap

      if (newProgress >= finishLine) {
        setGamePhase('finished')

        // Strong haptic for win
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

        // Submit answer
        setTimeout(() => {
          onAnswer(selectedOption!)
        }, 1200)

        return finishLine
      }

      return newProgress
    })
  }, [gamePhase, selectedOption, onAnswer])

  const selectedCarInfo = carOptions[selectedCar]

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Question text */}
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        {gamePhase === 'select' && !selectedOption && 'First, pick your answer'}
        {gamePhase === 'select' && selectedOption && 'Now choose your car!'}
        {gamePhase === 'countdown' && 'Get ready...'}
        {gamePhase === 'racing' && 'TAP TAP TAP to win!'}
        {gamePhase === 'finished' && 'You made it!'}
      </p>

      {/* Phase 1: Select Option */}
      <AnimatePresence mode="wait">
        {gamePhase === 'select' && !selectedOption && (
          <motion.div
            key="options"
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-center text-gray-600 font-medium mb-4">What&apos;s your answer?</p>
            {options.map((option, index) => (
              <motion.button
                key={option}
                onClick={() => handleSelectOption(option)}
                className="w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {option}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Phase 1b: Select Car */}
        {gamePhase === 'select' && selectedOption && (
          <motion.div
            key="cars"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Selected answer badge */}
            <div className="text-center mb-6">
              <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium">
                Your answer: {selectedOption}
              </span>
            </div>

            <p className="text-center text-gray-600 font-medium mb-4">Pick your car to race!</p>

            <div className="grid grid-cols-3 gap-3">
              {carOptions.slice(0, 6).map((car, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSelectCar(index)}
                  className={`py-6 px-4 rounded-xl border-2 transition-all ${
                    selectedCar === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="text-4xl mb-1">{car.emoji}</div>
                  <div className="text-xs text-gray-500">{car.name}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Countdown overlay */}
        {gamePhase === 'countdown' && (
          <motion.div
            key="countdown"
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {selectedCarInfo.emoji}
              </motion.div>
              <motion.div
                key={countdown}
                className="text-8xl font-black text-white"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Racing phase */}
        {(gamePhase === 'racing' || gamePhase === 'finished') && (
          <motion.div
            key="racing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Selected answer reminder */}
            <div className="text-center mb-4">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                Racing for: {selectedOption}
              </span>
            </div>

            {/* Race track */}
            <motion.div
              className="relative bg-gray-800 rounded-2xl p-4 shadow-xl overflow-hidden cursor-pointer"
              onClick={handleRaceTap}
              whileTap={gamePhase === 'racing' ? { scale: 0.98 } : {}}
            >
              {/* Track markings */}
              <div className="absolute inset-4 pointer-events-none">
                {[0, 25, 50, 75].map(mark => (
                  <div
                    key={mark}
                    className="absolute top-0 bottom-0 w-px bg-gray-600/50"
                    style={{ left: `${mark}%` }}
                  />
                ))}
                {/* Finish line */}
                <div
                  className="absolute top-0 bottom-0 w-2"
                  style={{ left: 'calc(100% - 8px)' }}
                >
                  <div className="h-full w-full bg-[repeating-linear-gradient(0deg,black,black_8px,white_8px,white_16px)]" />
                </div>
              </div>

              {/* Single race lane */}
              <div className="relative h-20 bg-gray-700 rounded-lg overflow-hidden">
                {/* Progress track */}
                <motion.div
                  className={`absolute inset-y-1 left-1 rounded-md ${selectedCarInfo.color}`}
                  style={{ width: `${Math.max(progress, 5)}%` }}
                  animate={{ width: `${Math.max(progress, 5)}%` }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />

                {/* Car */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 text-4xl z-10"
                  style={{ left: `${Math.max(progress - 3, 2)}%` }}
                  animate={{
                    left: `${Math.max(progress - 3, 2)}%`,
                    rotate: gamePhase === 'finished' ? [0, 15, -15, 0] : 0,
                  }}
                  transition={{
                    left: { type: 'spring', stiffness: 400, damping: 35 },
                    rotate: { duration: 0.3, repeat: gamePhase === 'finished' ? 3 : 0 },
                  }}
                >
                  {selectedCarInfo.emoji}
                </motion.div>

                {/* Tap indicator */}
                {gamePhase === 'racing' && (
                  <motion.div
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg"
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    TAP!
                  </motion.div>
                )}
              </div>

              {/* Winner celebration overlay */}
              <AnimatePresence>
                {gamePhase === 'finished' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="bg-white rounded-xl px-8 py-6 shadow-2xl text-center"
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <motion.div
                        className="text-5xl mb-2"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        🏆
                      </motion.div>
                      <p className="text-xl font-bold text-gray-800">{selectedOption}</p>
                      <p className="text-sm text-gray-500">You made it in {tapCount} taps!</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tap counter */}
            <div className="mt-4 text-center">
              <motion.span
                className="text-3xl font-bold text-indigo-600"
                key={tapCount}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.1 }}
              >
                {tapCount}
              </motion.span>
              <p className="text-sm text-gray-500">taps</p>
            </div>

            {/* Progress bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full ${selectedCarInfo.color}`}
                style={{ width: `${progress}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-1">
              {Math.round(progress)}% to finish
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
