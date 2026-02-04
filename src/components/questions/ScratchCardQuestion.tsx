'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface ScratchCardQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const cardColors = [
  { bg: 'from-purple-500 to-indigo-600', accent: 'text-purple-300' },
  { bg: 'from-pink-500 to-rose-600', accent: 'text-pink-300' },
  { bg: 'from-cyan-500 to-blue-600', accent: 'text-cyan-300' },
  { bg: 'from-amber-500 to-orange-600', accent: 'text-amber-300' },
  { bg: 'from-emerald-500 to-green-600', accent: 'text-emerald-300' },
]

export function ScratchCardQuestion({ question, onAnswer }: ScratchCardQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [scratchProgress, setScratchProgress] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isScratching = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // Initialize scratch canvas
  useEffect(() => {
    if (selectedCard === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 280
    canvas.height = 120

    // Fill with silver scratch coating
    ctx.fillStyle = '#C0C0C0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add texture
    ctx.globalAlpha = 0.3
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#A8A8A8' : '#D8D8D8'
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2
      )
    }
    ctx.globalAlpha = 1

    // Add "SCRATCH HERE" text
    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = '#888'
    ctx.textAlign = 'center'
    ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2 + 6)
  }, [selectedCard])

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 25, 0, Math.PI * 2)
    ctx.fill()

    // Draw line from last position
    ctx.lineWidth = 50
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPos.current = { x, y }

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++
    }
    const progress = (transparent / (pixels.length / 4)) * 100
    setScratchProgress(progress)

    // Auto-reveal at 60%
    if (progress >= 60 && !isRevealed) {
      setIsRevealed(true)
      setShowResult(true)

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 100])
      }

      // Submit answer
      setTimeout(() => {
        onAnswer(options[selectedCard!])
      }, 1500)
    }
  }, [isRevealed, options, selectedCard, onAnswer])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (selectedCard === null || isRevealed) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    isScratching.current = true
    lastPos.current = { x, y }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }, [selectedCard, isRevealed])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isScratching.current || isRevealed) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    scratch(x, y)
  }, [scratch, isRevealed])

  const handlePointerUp = useCallback(() => {
    isScratching.current = false
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

      <p className="text-gray-500 text-center mb-6 text-sm">
        {selectedCard === null
          ? 'Choose a card and scratch to reveal!'
          : isRevealed
          ? 'Revealed!'
          : `Scratch ${Math.min(100, Math.round(scratchProgress * 1.67))}% complete...`}
      </p>

      {/* Cards to choose from OR scratch area */}
      {selectedCard === null ? (
        <div className="grid grid-cols-2 gap-4">
          {options.map((option, index) => {
            const colors = cardColors[index % cardColors.length]

            return (
              <motion.button
                key={option}
                onClick={() => setSelectedCard(index)}
                className={`
                  relative aspect-[4/3] rounded-xl bg-gradient-to-br ${colors.bg}
                  shadow-lg overflow-hidden
                `}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, rotate: Math.random() > 0.5 ? 2 : -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Card design */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <span className={`text-4xl mb-1 ${colors.accent}`}>?</span>
                  <span className="text-white font-medium text-sm text-center">
                    Card {index + 1}
                  </span>
                </div>

                {/* Sparkle effects */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </motion.button>
            )
          })}
        </div>
      ) : (
        <motion.div
          className="relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Selected card with scratch area */}
          <div
            className={`relative rounded-xl bg-gradient-to-br ${cardColors[selectedCard % cardColors.length].bg} p-6 shadow-xl`}
          >
            {/* Hidden content underneath */}
            <div className="bg-white rounded-lg p-4 text-center">
              <motion.div
                className="text-4xl mb-2"
                animate={isRevealed ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                🎉
              </motion.div>
              <p className="text-xl font-bold text-gray-800">
                {options[selectedCard]}
              </p>
              <p className="text-sm text-gray-500 mt-1">Your selection!</p>
            </div>

            {/* Scratch canvas overlay */}
            {!isRevealed && (
              <canvas
                ref={canvasRef}
                className="absolute inset-6 rounded-lg cursor-crosshair touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ touchAction: 'none' }}
              />
            )}
          </div>

          {/* Progress bar */}
          {!isRevealed && (
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-green-500"
                animate={{ width: `${Math.min(100, scratchProgress * 1.67)}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              />
            </div>
          )}

          {/* Back button */}
          {!isRevealed && (
            <button
              onClick={() => {
                setSelectedCard(null)
                setScratchProgress(0)
              }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Choose different card
            </button>
          )}
        </motion.div>
      )}

      {/* Result celebration */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <span className="text-xl">✨</span>
              <span className="font-bold">Winner!</span>
              <span className="text-xl">✨</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
