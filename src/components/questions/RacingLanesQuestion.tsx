'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface RacingLanesQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

// Added 'ready' phase to show track before countdown
type GamePhase = 'car' | 'answer' | 'ready' | 'countdown' | 'racing' | 'won' | 'lost'

interface AIRacer {
  option: string
  carIndex: number
  progress: number
  speed: number
  burstChance: number
}

const carOptions = [
  { emoji: '🚗', color: 'bg-red-500', name: 'Red Racer' },
  { emoji: '🚙', color: 'bg-blue-500', name: 'Blue Bolt' },
  { emoji: '🚕', color: 'bg-yellow-500', name: 'Yellow Flash' },
  { emoji: '🏎️', color: 'bg-purple-500', name: 'Purple Speed' },
  { emoji: '🛻', color: 'bg-green-500', name: 'Green Machine' },
  { emoji: '🚐', color: 'bg-orange-500', name: 'Orange Cruiser' },
]

// Shuffle array helper
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function RacingLanesQuestion({ question, onAnswer }: RacingLanesQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [gamePhase, setGamePhase] = useState<GamePhase>('car')
  const [selectedCar, setSelectedCar] = useState<number>(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [userProgress, setUserProgress] = useState(0)
  const [aiRacers, setAiRacers] = useState<AIRacer[]>([])
  const [tapCount, setTapCount] = useState(0)
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const finishLine = 100
  const progressPerTap = 4
  const userDecay = 0.15  // Slower decay

  // Handle car selection
  const handleSelectCar = (carIndex: number) => {
    setSelectedCar(carIndex)
    setGamePhase('answer')
    if (navigator.vibrate) navigator.vibrate(30)
  }

  // Handle answer/lane selection - now goes to 'ready' phase
  const handleSelectAnswer = (option: string) => {
    setSelectedOption(option)

    // Set up AI racers from other options
    const otherOptions = options.filter(o => o !== option)
    const aiOptions = shuffle(otherOptions).slice(0, Math.min(2, otherOptions.length))

    const racers: AIRacer[] = aiOptions.map((opt, i) => ({
      option: opt,
      carIndex: (selectedCar + i + 1) % carOptions.length,
      progress: 0,
      // Much slower AI speeds (0.3-0.6 per tick at 100ms intervals = ~3-6 per second)
      speed: 0.3 + Math.random() * 0.3,
      burstChance: 0.03 + Math.random() * 0.03,  // 3-6% burst chance
    }))

    setAiRacers(racers)
    setGamePhase('ready')  // Show track first, wait for user to start
    if (navigator.vibrate) navigator.vibrate(50)
  }

  // Start race from ready phase
  const handleStartRace = () => {
    setGamePhase('countdown')
    if (navigator.vibrate) navigator.vibrate(50)
  }

  // Countdown timer
  useEffect(() => {
    if (gamePhase !== 'countdown') return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 700)
      return () => clearTimeout(timer)
    } else {
      setGamePhase('racing')
    }
  }, [gamePhase, countdown])

  // Game loop for racing - using interval for more controlled timing
  useEffect(() => {
    if (gamePhase !== 'racing') return

    // Update every 100ms for smoother, more controlled racing
    gameLoopRef.current = setInterval(() => {
      // Update AI racers
      setAiRacers(prev => {
        const updated = prev.map(racer => {
          let newProgress = racer.progress + racer.speed
          if (Math.random() < racer.burstChance) {
            newProgress += 1.5  // Small speed burst
          }
          return { ...racer, progress: Math.min(finishLine, newProgress) }
        })

        // Check if any AI won
        const aiWinner = updated.find(r => r.progress >= finishLine)
        if (aiWinner) {
          setGamePhase('lost')
          if (navigator.vibrate) navigator.vibrate([100, 50, 100])
        }

        return updated
      })

      // Apply decay to user
      setUserProgress(prev => {
        const newProgress = Math.max(0, prev - userDecay)

        // Check if user won
        if (prev >= finishLine) {
          setGamePhase('won')
          if (navigator.vibrate) navigator.vibrate([50, 30, 100])
        }

        return newProgress
      })
    }, 100)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [gamePhase])

  // Handle tap during race
  const handleRaceTap = useCallback(() => {
    if (gamePhase !== 'racing') return

    if (navigator.vibrate) navigator.vibrate(15)
    setTapCount(prev => prev + 1)
    setUserProgress(prev => Math.min(finishLine, prev + progressPerTap))
  }, [gamePhase])

  // Handle winning
  useEffect(() => {
    if (gamePhase === 'won' && selectedOption) {
      setTimeout(() => {
        onAnswer(selectedOption)
      }, 1500)
    }
  }, [gamePhase, selectedOption, onAnswer])

  // Handle retry
  const handleRetry = () => {
    setUserProgress(0)
    setTapCount(0)
    setCountdown(3)

    // Reset AI racers with new random speeds
    setAiRacers(prev => prev.map(racer => ({
      ...racer,
      progress: 0,
      speed: 0.3 + Math.random() * 0.3,
      burstChance: 0.03 + Math.random() * 0.03,
    })))

    setGamePhase('countdown')
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const userCar = carOptions[selectedCar]

  // Build lanes array: user's lane + AI lanes
  const lanes = selectedOption ? [
    { option: selectedOption, progress: userProgress, car: userCar, isUser: true },
    ...aiRacers.map(r => ({
      option: r.option,
      progress: r.progress,
      car: carOptions[r.carIndex],
      isUser: false,
    }))
  ] : []

  // Render the race track (reused in 'ready' and 'racing' phases)
  const renderTrack = (isPreview: boolean = false) => (
    <motion.div
      className={`relative bg-gray-800 rounded-2xl p-4 shadow-xl overflow-hidden ${
        !isPreview ? 'cursor-pointer' : ''
      }`}
      onClick={!isPreview ? handleRaceTap : undefined}
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

      {/* Race lanes */}
      <div className="space-y-3">
        {lanes.map((lane) => (
          <div
            key={lane.option}
            className={`relative h-14 rounded-lg overflow-hidden ${
              lane.isUser ? 'bg-indigo-900/50 ring-2 ring-indigo-400' : 'bg-gray-700'
            }`}
          >
            {/* Lane label */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white/60 font-medium max-w-20 truncate z-10">
              {lane.option}
            </div>

            {/* Progress track */}
            <motion.div
              className={`absolute inset-y-1 left-1 rounded-md ${lane.car.color}`}
              initial={{ width: '5%' }}
              animate={{ width: `${Math.max(lane.progress, 5)}%` }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />

            {/* Car */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 text-2xl z-20"
              animate={{
                left: `${Math.max(lane.progress - 3, 2)}%`,
                rotate: gamePhase === 'won' && lane.isUser ? [0, 15, -15, 0] : 0,
              }}
              transition={{
                left: { type: 'spring', stiffness: 400, damping: 35 },
                rotate: { duration: 0.3, repeat: gamePhase === 'won' && lane.isUser ? 3 : 0 },
              }}
            >
              {lane.car.emoji}
            </motion.div>

            {/* User indicator */}
            {lane.isUser && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-300">
                YOU
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tap indicator during race */}
      {gamePhase === 'racing' && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <span className="text-white font-bold text-2xl">TAP HERE!</span>
        </motion.div>
      )}

      {/* Preview hint */}
      {isPreview && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/40 font-medium text-sm">Tap here during the race!</span>
        </div>
      )}

      {/* Result overlay */}
      <AnimatePresence>
        {(gamePhase === 'won' || gamePhase === 'lost') && (
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
                {gamePhase === 'won' ? '🏆' : '😅'}
              </motion.div>
              <p className="text-xl font-bold text-gray-800">
                {gamePhase === 'won' ? selectedOption : 'Not quite!'}
              </p>
              <p className="text-sm text-gray-500">
                {gamePhase === 'won'
                  ? `${tapCount} taps to victory!`
                  : 'The competition was fierce!'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

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
        {gamePhase === 'car' && 'Choose your racer!'}
        {gamePhase === 'answer' && 'Pick your answer to race for it!'}
        {gamePhase === 'ready' && 'Ready? Tap the track to race!'}
        {gamePhase === 'countdown' && 'Get ready...'}
        {gamePhase === 'racing' && 'TAP TAP TAP to win!'}
        {gamePhase === 'won' && '🏆 You won!'}
        {gamePhase === 'lost' && 'So close! Try again?'}
      </p>

      {/* Phase 1: Car Selection */}
      <AnimatePresence mode="wait">
        {gamePhase === 'car' && (
          <motion.div
            key="car-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-3 gap-3">
              {carOptions.map((car, index) => (
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

        {/* Phase 2: Answer Selection */}
        {gamePhase === 'answer' && (
          <motion.div
            key="answer-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Show selected car */}
            <div className="text-center mb-4">
              <span className="text-4xl">{userCar.emoji}</span>
              <p className="text-sm text-gray-500 mt-1">Your racer: {userCar.name}</p>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <motion.button
                  key={option}
                  onClick={() => handleSelectAnswer(option)}
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
            </div>
          </motion.div>
        )}

        {/* Phase 3: Ready - Show track with Start button */}
        {gamePhase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Racing for badge */}
            <div className="text-center mb-4">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                Racing for: {selectedOption}
              </span>
            </div>

            {/* Preview track */}
            {renderTrack(true)}

            {/* Start button */}
            <motion.button
              onClick={handleStartRace}
              className="w-full mt-6 py-5 bg-green-500 text-white rounded-xl font-bold text-xl shadow-lg hover:bg-green-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 15px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0)']
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🏁 Start Race!
            </motion.button>

            <p className="text-center text-gray-400 text-xs mt-3">
              Tap as fast as you can to beat the other racers!
            </p>
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
                {userCar.emoji}
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
              <p className="text-white/70 mt-4">Racing for: {selectedOption}</p>
            </div>
          </motion.div>
        )}

        {/* Racing phase */}
        {(gamePhase === 'racing' || gamePhase === 'won' || gamePhase === 'lost') && (
          <motion.div
            key="racing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Racing for badge */}
            <div className="text-center mb-4">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                Racing for: {selectedOption}
              </span>
            </div>

            {/* Race track */}
            {renderTrack(false)}

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

            {/* Retry button */}
            {gamePhase === 'lost' && (
              <motion.button
                onClick={handleRetry}
                className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try Again! 🔄
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
