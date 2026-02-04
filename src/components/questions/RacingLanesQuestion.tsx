'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { Question } from '@/lib/types'

interface RacingLanesQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

interface Lane {
  label: string
  progress: number
  color: string
  emoji: string
}

const laneColors = [
  { bg: 'bg-red-500', glow: 'shadow-red-500/50', emoji: '🚗' },
  { bg: 'bg-blue-500', glow: 'shadow-blue-500/50', emoji: '🚙' },
  { bg: 'bg-green-500', glow: 'shadow-green-500/50', emoji: '🚕' },
  { bg: 'bg-purple-500', glow: 'shadow-purple-500/50', emoji: '🏎️' },
  { bg: 'bg-orange-500', glow: 'shadow-orange-500/50', emoji: '🚐' },
  { bg: 'bg-pink-500', glow: 'shadow-pink-500/50', emoji: '🛻' },
]

export function RacingLanesQuestion({ question, onAnswer }: RacingLanesQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [lanes, setLanes] = useState<Lane[]>(() =>
    options.map((label, i) => ({
      label,
      progress: 0,
      color: laneColors[i % laneColors.length].bg,
      emoji: laneColors[i % laneColors.length].emoji,
    }))
  )
  const [winner, setWinner] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [raceStarted, setRaceStarted] = useState(false)
  const [tapCounts, setTapCounts] = useState<number[]>(() => options.map(() => 0))

  const containerRef = useRef<HTMLDivElement>(null)
  const finishLine = 100
  const progressPerTap = 3
  const decayRate = 0.3

  // Countdown before race starts
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 800)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !raceStarted) {
      setRaceStarted(true)
    }
  }, [countdown, raceStarted])

  // Natural decay - lanes slowly move back if not tapped
  useEffect(() => {
    if (!raceStarted || isFinished) return

    const decayInterval = setInterval(() => {
      setLanes(prev => prev.map(lane => ({
        ...lane,
        progress: Math.max(0, lane.progress - decayRate),
      })))
    }, 100)

    return () => clearInterval(decayInterval)
  }, [raceStarted, isFinished])

  const handleTap = useCallback((index: number) => {
    if (!raceStarted || isFinished) return

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15)
    }

    // Update tap count
    setTapCounts(prev => {
      const newCounts = [...prev]
      newCounts[index]++
      return newCounts
    })

    // Update progress
    setLanes(prev => {
      const newLanes = [...prev]
      const newProgress = newLanes[index].progress + progressPerTap

      // Check for winner
      if (newProgress >= finishLine) {
        setWinner(newLanes[index].label)
        setIsFinished(true)

        // Strong haptic for win
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

        // Submit answer after celebration
        setTimeout(() => {
          onAnswer(newLanes[index].label)
        }, 1200)

        newLanes[index].progress = finishLine
        return newLanes
      }

      newLanes[index].progress = newProgress
      return newLanes
    })
  }, [raceStarted, isFinished, onAnswer])

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
        Tap rapidly to race your choice to the finish!
      </p>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={countdown}
              className="text-8xl font-black text-white"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GO! message */}
      <AnimatePresence>
        {raceStarted && countdown === 0 && !isFinished && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <motion.span
              className="text-4xl font-black text-green-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              GO!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Race track */}
      <div ref={containerRef} className="relative bg-gray-800 rounded-2xl p-4 shadow-xl overflow-hidden">
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
            className="absolute top-0 bottom-0 w-2 bg-gradient-to-b from-white via-transparent to-white"
            style={{ left: '100%', marginLeft: '-4px' }}
          >
            <div className="h-full w-full bg-[repeating-linear-gradient(0deg,black,black_8px,white_8px,white_16px)]" />
          </div>
        </div>

        {/* Lanes */}
        <div className="space-y-3">
          {lanes.map((lane, index) => {
            const colorInfo = laneColors[index % laneColors.length]
            const isWinningLane = winner === lane.label

            return (
              <motion.button
                key={lane.label}
                onClick={() => handleTap(index)}
                disabled={!raceStarted || isFinished}
                className={`
                  relative w-full h-16 rounded-lg overflow-hidden
                  ${raceStarted && !isFinished ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
                  transition-transform
                `}
                style={{
                  background: 'linear-gradient(to right, #374151, #4B5563)',
                }}
                whileTap={raceStarted && !isFinished ? { scale: 0.98 } : {}}
              >
                {/* Lane background */}
                <div className="absolute inset-0 bg-gray-700 rounded-lg" />

                {/* Progress track */}
                <motion.div
                  className={`absolute inset-y-1 left-1 rounded-md ${colorInfo.bg}`}
                  style={{
                    width: `${Math.max(lane.progress, 5)}%`,
                    boxShadow: isWinningLane ? `0 0 20px ${colorInfo.glow}` : undefined,
                  }}
                  animate={{
                    width: `${Math.max(lane.progress, 5)}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />

                {/* Car emoji */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 text-2xl z-10"
                  style={{
                    left: `${Math.max(lane.progress - 2, 2)}%`,
                  }}
                  animate={{
                    left: `${Math.max(lane.progress - 2, 2)}%`,
                    rotate: isWinningLane ? [0, 10, -10, 0] : 0,
                  }}
                  transition={{
                    left: { type: 'spring', stiffness: 300, damping: 30 },
                    rotate: { duration: 0.3, repeat: isWinningLane ? 3 : 0 },
                  }}
                >
                  {lane.emoji}
                </motion.div>

                {/* Label */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white font-medium text-sm z-10 bg-black/30 px-2 py-0.5 rounded">
                  {lane.label}
                </div>

                {/* Tap indicator */}
                {raceStarted && !isFinished && (
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 text-xs"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    TAP!
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Winner celebration */}
        <AnimatePresence>
          {winner && (
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
                  className="text-4xl mb-2"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  🏆
                </motion.div>
                <p className="text-xl font-bold text-gray-800">{winner}</p>
                <p className="text-sm text-gray-500">Winner!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tap counts */}
      <div className="mt-4 flex justify-center gap-4">
        {lanes.map((lane, index) => (
          <motion.div
            key={lane.label}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <motion.span
              className={`text-2xl font-bold ${laneColors[index % laneColors.length].bg.replace('bg-', 'text-')}`}
              key={tapCounts[index]}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.15 }}
            >
              {tapCounts[index]}
            </motion.span>
            <p className="text-xs text-gray-500">taps</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
