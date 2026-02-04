'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface BubblePopQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

interface Bubble {
  id: number
  label: string
  x: number
  y: number
  size: number
  speed: number
  color: string
}

const bubbleColors = [
  'from-pink-400 to-pink-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-cyan-400 to-cyan-600',
]

export function BubblePopQuestion({ question, onAnswer }: BubblePopQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [poppedBubble, setPoppedBubble] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [escapedCount, setEscapedCount] = useState(0)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const bubbleIdRef = useRef(0)

  // Spawn bubbles
  useEffect(() => {
    if (poppedBubble) return

    const spawnBubble = () => {
      if (poppedBubble) return

      const optionIndex = Math.floor(Math.random() * options.length)
      const label = options[optionIndex]
      const x = 10 + Math.random() * 80 // 10-90% from left
      const size = 60 + Math.random() * 30 // 60-90px
      const speed = 0.3 + Math.random() * 0.4 // 0.3-0.7 speed

      const newBubble: Bubble = {
        id: bubbleIdRef.current++,
        label,
        x,
        y: 110, // Start below container
        size,
        speed,
        color: bubbleColors[optionIndex % bubbleColors.length],
      }

      setBubbles(prev => [...prev, newBubble])
    }

    // Spawn a bubble every 1.5 seconds
    const spawnInterval = setInterval(spawnBubble, 1500)
    // Spawn first few immediately
    setTimeout(spawnBubble, 0)
    setTimeout(spawnBubble, 500)
    setTimeout(spawnBubble, 1000)

    return () => clearInterval(spawnInterval)
  }, [options, poppedBubble])

  // Animate bubbles floating up
  useEffect(() => {
    if (poppedBubble) return

    const animate = () => {
      setBubbles(prev => {
        const updated = prev
          .map(bubble => ({
            ...bubble,
            y: bubble.y - bubble.speed,
          }))
          .filter(bubble => {
            // Remove bubbles that escaped (went above top)
            if (bubble.y < -20) {
              setEscapedCount(c => c + 1)
              return false
            }
            return true
          })
        return updated
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [poppedBubble])

  const handlePop = useCallback((bubble: Bubble) => {
    if (poppedBubble) return

    setPoppedBubble(bubble.label)
    setShowResult(true)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 50])
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [poppedBubble])

  const handleConfirm = useCallback(() => {
    if (poppedBubble) {
      if (navigator.vibrate) navigator.vibrate(50)
      onAnswer(poppedBubble)
    }
  }, [poppedBubble, onAnswer])

  const handleRetry = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(30)
    setPoppedBubble(null)
    setShowResult(false)
    setBubbles([])
    setEscapedCount(0)
  }, [])

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
        Pop a bubble to select your answer!
      </p>

      {/* Escaped counter */}
      {escapedCount > 0 && !poppedBubble && (
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-sm text-orange-500">
            {escapedCount} escaped! Quick, pop one!
          </span>
        </motion.div>
      )}

      {/* Game area */}
      <motion.div
        ref={containerRef}
        className="relative w-full aspect-[3/4] bg-gradient-to-b from-blue-100 to-blue-50 rounded-2xl overflow-hidden shadow-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Water/bubble background effect */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-blue-300"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Bubbles */}
        <AnimatePresence>
          {bubbles.map(bubble => (
            <motion.button
              key={bubble.id}
              className={`absolute rounded-full bg-gradient-to-br ${bubble.color} flex items-center justify-center text-white font-bold shadow-lg cursor-pointer`}
              style={{
                width: bubble.size,
                height: bubble.size,
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                marginLeft: -bubble.size / 2,
                marginTop: -bubble.size / 2,
              }}
              onClick={() => handlePop(bubble)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Bubble highlight */}
              <div
                className="absolute top-2 left-3 w-1/4 h-1/4 rounded-full bg-white opacity-50"
              />
              <span
                className="text-center px-1 leading-tight"
                style={{ fontSize: Math.max(10, bubble.size / 6) }}
              >
                {bubble.label}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Escape zone indicator */}
        {!poppedBubble && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-red-200/50 to-transparent flex items-start justify-center pt-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-xs text-red-500 font-medium">⬆️ Escape zone</span>
          </motion.div>
        )}

        {/* Result overlay with confirm/retry */}
        <AnimatePresence>
          {showResult && poppedBubble && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="bg-white rounded-xl px-6 py-4 shadow-2xl text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3, repeat: 3 }}
                >
                  🫧
                </motion.div>
                <p className="text-lg font-bold text-gray-800">{poppedBubble}</p>
                <p className="text-sm text-gray-500 mb-4">Popped!</p>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleRetry}
                    className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Try Again
                  </motion.button>
                  <motion.button
                    onClick={handleConfirm}
                    className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700"
                    whileTap={{ scale: 0.95 }}
                  >
                    Confirm
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Options legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {options.map((option, index) => (
          <motion.span
            key={option}
            className={`px-3 py-1 rounded-full text-sm text-white bg-gradient-to-r ${bubbleColors[index % bubbleColors.length]} ${
              poppedBubble === option ? 'ring-2 ring-offset-2 ring-gray-400' : ''
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            {option}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
