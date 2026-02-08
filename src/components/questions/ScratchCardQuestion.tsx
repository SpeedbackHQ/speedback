'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface ScratchCardQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const cardColors = [
  { bg: 'from-purple-500 to-indigo-600', text: 'text-white' },
  { bg: 'from-pink-500 to-rose-600', text: 'text-white' },
  { bg: 'from-cyan-500 to-blue-600', text: 'text-white' },
  { bg: 'from-amber-500 to-orange-600', text: 'text-white' },
  { bg: 'from-emerald-500 to-green-600', text: 'text-white' },
]

export function ScratchCardQuestion({ question, onAnswer }: ScratchCardQuestionProps) {
  const { options: rawOptions = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }
  const options = rawOptions.slice(0, 4)  // Cap at 4 options max

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [scratchProgress, setScratchProgress] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isScratching = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  // Initialize scratch canvas when option is selected
  useEffect(() => {
    if (selectedOption === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 280
    canvas.height = 140

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

    // Add scratch instruction
    ctx.font = 'bold 18px Arial'
    ctx.fillStyle = '#666'
    ctx.textAlign = 'center'
    ctx.fillText('✨ SCRATCH TO CONFIRM ✨', canvas.width / 2, canvas.height / 2 + 6)
  }, [selectedOption])

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fill()

    // Draw line from last position
    ctx.lineWidth = 40
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

    // Auto-reveal at 70%
    if (progress >= 70 && !isRevealed) {
      setIsRevealed(true)
      setShowResult(true)

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 100])
      }

      // Submit answer
      setTimeout(() => {
        onAnswer(selectedOption!)
      }, 1500)
    }
  }, [isRevealed, selectedOption, onAnswer])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (selectedOption === null || isRevealed) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    isScratching.current = true
    lastPos.current = { x, y }
    scratch(x, y)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }, [selectedOption, isRevealed, scratch])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isScratching.current || isRevealed) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    scratch(x, y)
  }, [scratch, isRevealed])

  const handlePointerUp = useCallback(() => {
    isScratching.current = false
  }, [])

  const handleSelectOption = (option: string, index: number) => {
    setSelectedOption(option)
    setSelectedIndex(index)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

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
        {selectedOption === null
          ? 'Pick your answer, then scratch to confirm!'
          : isRevealed
          ? 'Confirmed!'
          : 'Scratch to confirm your choice!'}
      </p>

      {/* Options selection */}
      {selectedOption === null ? (
        <div className="space-y-3">
          {options.map((option, index) => {
            const colors = cardColors[index % cardColors.length]

            return (
              <motion.button
                key={option}
                onClick={() => handleSelectOption(option, index)}
                className={`
                  w-full py-4 px-6 rounded-xl bg-gradient-to-r ${colors.bg}
                  shadow-lg text-white font-semibold text-lg
                  transition-all
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  <span className="text-white/70">🎫</span>
                </div>
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
          {/* Selected option badge */}
          <div className="text-center mb-4">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium">
              Your choice: {selectedOption}
            </span>
          </div>

          {/* Scratch card with reveal underneath */}
          <div
            className={`relative rounded-xl bg-gradient-to-br ${cardColors[selectedIndex! % cardColors.length].bg} p-5 shadow-xl overflow-hidden`}
          >
            {/* Content underneath the scratch area */}
            <div className="bg-white rounded-lg p-5 text-center min-h-[140px] flex flex-col items-center justify-center">
              <motion.div
                className="text-5xl mb-3"
                animate={isRevealed ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                {isRevealed ? '🎉' : '🎁'}
              </motion.div>
              <p className="text-xl font-bold text-gray-800">
                {isRevealed ? selectedOption : '???'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isRevealed ? 'Great choice!' : 'Scratch to reveal!'}
              </p>
            </div>

            {/* Scratch canvas overlay */}
            {!isRevealed && (
              <canvas
                ref={canvasRef}
                className="absolute top-5 left-5 right-5 bottom-5 rounded-lg cursor-crosshair touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{
                  touchAction: 'none',
                  width: 'calc(100% - 40px)',
                  height: 'calc(100% - 40px)',
                }}
              />
            )}
          </div>

          {/* Progress indicator */}
          {!isRevealed && (
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-green-500"
                  animate={{ width: `${Math.min(100, (scratchProgress / 70) * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                />
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {Math.min(100, Math.round((scratchProgress / 70) * 100))}% scratched
              </p>
            </div>
          )}

          {/* Back button */}
          {!isRevealed && (
            <button
              onClick={() => {
                setSelectedOption(null)
                setSelectedIndex(null)
                setScratchProgress(0)
              }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center"
            >
              ← Pick a different answer
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
              className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-5 py-2.5 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              <span className="text-xl">✨</span>
              <span className="font-bold">Confirmed!</span>
              <span className="text-xl">✨</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
