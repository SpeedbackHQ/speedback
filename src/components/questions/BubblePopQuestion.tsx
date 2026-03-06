'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface BubblePopQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

interface Bubble {
  label: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
}

const bubbleColors = [
  'from-pink-400 to-pink-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
]

// Bubble size based on option count — fewer bubbles = bigger
const getBubbleSize = (count: number) => {
  if (count <= 2) return 100
  if (count === 3) return 90
  return 80
}

// Pre-generated background particle positions (stable across renders)
const BACKGROUND_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: ((i * 9301 + 49297) % 233280) / 233280 * 100,
  top: ((i * 7919 + 12345) % 233280) / 233280 * 100,
  duration: 2 + ((i * 3571 + 67890) % 233280) / 233280 * 2,
  delay: ((i * 5387 + 11111) % 233280) / 233280 * 2,
}))

export function BubblePopQuestion({ question, onAnswer }: BubblePopQuestionProps) {
  const { options: rawOptions } = question.config as { options?: string[] }
  // Memoize options to prevent re-initialization on every render
  const options = useMemo(
    () => (rawOptions || ['Option 1', 'Option 2', 'Option 3']).slice(0, 4),
    [rawOptions]
  )

  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [poppedBubble, setPoppedBubble] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const animationRef = useRef<number | null>(null)

  // Initialize bubbles — one per option, spread out
  useEffect(() => {
    const size = getBubbleSize(options.length)
    // Convert size to percentage of container for boundary math
    // Container is ~300px wide (max-w-md) and ~400px tall (aspect 3/4)
    const sizePercent = { x: (size / 2) * 100 / 300, y: (size / 2) * 100 / 400 }

    const initialBubbles: Bubble[] = options.map((label, i) => {
      // Spread initial positions to avoid overlap
      const angle = (i / options.length) * Math.PI * 2
      const cx = 50 + Math.cos(angle) * 20
      const cy = 50 + Math.sin(angle) * 20

      // Random velocity direction, gentle speed
      const speed = 0.15 + Math.random() * 0.15
      const velAngle = Math.random() * Math.PI * 2

      return {
        label,
        x: Math.max(sizePercent.x + 2, Math.min(100 - sizePercent.x - 2, cx)),
        y: Math.max(sizePercent.y + 2, Math.min(100 - sizePercent.y - 2, cy)),
        vx: Math.cos(velAngle) * speed,
        vy: Math.sin(velAngle) * speed,
        size,
        color: bubbleColors[i % bubbleColors.length],
      }
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialization based on props is a valid pattern
    setBubbles(initialBubbles)
  }, [options])

  // Physics loop — gentle floating with wall bouncing
  useEffect(() => {
    if (poppedBubble) return

    const animate = () => {
      setBubbles(prev => prev.map(bubble => {
        const { size } = bubble
        let { x, y, vx, vy } = bubble
        const sizePercent = { x: (size / 2) * 100 / 300, y: (size / 2) * 100 / 400 }

        x += vx
        y += vy

        // Bounce off walls
        if (x <= sizePercent.x + 1 || x >= 100 - sizePercent.x - 1) {
          vx = -vx
          x = Math.max(sizePercent.x + 1, Math.min(100 - sizePercent.x - 1, x))
        }
        if (y <= sizePercent.y + 1 || y >= 100 - sizePercent.y - 1) {
          vy = -vy
          y = Math.max(sizePercent.y + 1, Math.min(100 - sizePercent.y - 1, y))
        }

        return { ...bubble, x, y, vx, vy }
      }))

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

    // Auto-submit after brief delay
    setTimeout(() => {
      onAnswer(bubble.label)
    }, 1200)
  }, [poppedBubble, onAnswer])

  return (
    <div className="w-full h-full max-w-md mx-auto px-4 flex flex-col">
      {/* Question text */}
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        Pop a bubble to select your answer!
      </p>

      {/* Game area */}
      <motion.div
        className="relative w-full flex-1 min-h-0 bg-gradient-to-b from-blue-100 to-blue-50 rounded-2xl overflow-hidden shadow-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Water/bubble background effect */}
        <div className="absolute inset-0 opacity-30">
          {BACKGROUND_PARTICLES.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 rounded-full bg-blue-300"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        {/* Bubbles */}
        <AnimatePresence>
          {bubbles.map((bubble, index) => {
            const isPopped = poppedBubble === bubble.label
            const isOther = poppedBubble && !isPopped

            return (
              <motion.button
                key={bubble.label}
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
                whileHover={!poppedBubble ? { scale: 1.1 } : {}}
                whileTap={!poppedBubble ? { scale: 0.9 } : {}}
                initial={{ scale: 0 }}
                animate={{
                  scale: isPopped ? [1, 1.5, 0] : isOther ? 0 : 1,
                  opacity: isPopped ? [1, 1, 0] : isOther ? 0 : 1,
                }}
                transition={
                  isPopped
                    ? { duration: 0.4, times: [0, 0.5, 1] }
                    : isOther
                    ? { duration: 0.3, delay: 0.1 }
                    : { type: 'spring', stiffness: 300, damping: 20, delay: index * 0.1 }
                }
                disabled={!!poppedBubble}
              >
                {/* Bubble highlight */}
                <div
                  className="absolute top-2 left-3 w-1/4 h-1/4 rounded-full bg-white opacity-50"
                />
                <span
                  className="text-center px-2 leading-tight"
                  style={{ fontSize: Math.max(11, bubble.size / 5.5) }}
                >
                  {bubble.label}
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>

        {/* Result overlay */}
        <AnimatePresence>
          {showResult && poppedBubble && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="bg-white rounded-xl px-6 py-4 shadow-2xl text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3, repeat: 3 }}
                >
                  🫧
                </motion.div>
                <p className="text-lg font-bold text-gray-800">{poppedBubble}</p>
                <p className="text-sm text-gray-500">Popped!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Options legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 flex-shrink-0">
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
