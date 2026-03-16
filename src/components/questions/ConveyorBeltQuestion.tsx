'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface ConveyorBeltQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const beltColors = [
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
]

const BELT_SPEED = 60 // px per second
const ITEM_SPACING = 140 // px between items
const LOOPS = 3

export function ConveyorBeltQuestion({ question, onAnswer }: ConveyorBeltQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = useMemo(() => (rawOptions as string[]).slice(0, 4), [rawOptions])

  const [grabbed, setGrabbed] = useState<string[]>([])
  const [beltOffset, setBeltOffset] = useState(0)
  const [loopCount, setLoopCount] = useState(0)
  const [done, setDone] = useState(false)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const containerWidth = 320 // approximate visible width

  // Total belt length
  const totalBeltLength = options.length * ITEM_SPACING

  // Animate belt
  useEffect(() => {
    if (done) return

    lastTimeRef.current = performance.now()

    const animate = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      setBeltOffset(prev => {
        const next = prev + BELT_SPEED * delta
        if (next >= totalBeltLength) {
          setLoopCount(c => c + 1)
          return next - totalBeltLength
        }
        return next
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [done, totalBeltLength])

  const handleGrab = useCallback((option: string) => {
    if (done) return
    if (navigator.vibrate) navigator.vibrate(40)
    setGrabbed(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }, [done])

  const handleRemove = useCallback((option: string) => {
    if (navigator.vibrate) navigator.vibrate(20)
    setGrabbed(prev => prev.filter(o => o !== option))
  }, [])

  const handleSubmit = useCallback(() => {
    if (grabbed.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(grabbed)
  }, [grabbed, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-3 text-sm">
        Tap items on the belt to grab them!
      </p>

      {/* Kept tray */}
      <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-2.5 mb-3 min-h-[48px] flex flex-wrap gap-2 items-center">
        {grabbed.length === 0 ? (
          <span className="text-emerald-400 text-xs mx-auto">Grabbed items appear here</span>
        ) : (
          <AnimatePresence>
            {grabbed.map((option) => {
              const idx = options.indexOf(option)
              return (
                <motion.button
                  key={option}
                  onClick={() => handleRemove(option)}
                  className={`${beltColors[idx % beltColors.length]} text-white px-3 py-1 rounded-full text-xs font-bold shadow`}
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {option} ✕
                </motion.button>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Conveyor belt */}
      <div className="relative h-24 bg-gray-200 rounded-xl overflow-hidden mb-3">
        {/* Belt texture - animated stripes */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, #666 20px, #666 22px)',
            backgroundPosition: `${-beltOffset}px 0`,
          }}
        />

        {/* Items on belt */}
        {options.map((option, index) => {
          const isGrabbed = grabbed.includes(option)
          // Calculate item position on belt
          const rawX = index * ITEM_SPACING - beltOffset
          // Wrap around
          const x = ((rawX % totalBeltLength) + totalBeltLength) % totalBeltLength - ITEM_SPACING / 2
          const isVisible = x > -60 && x < containerWidth + 20

          if (!isVisible) return null

          return (
            <motion.button
              key={`${option}-${index}`}
              className={`absolute top-1/2 -translate-y-1/2 ${beltColors[index % beltColors.length]} text-white rounded-xl px-4 py-3 font-bold text-sm shadow-lg whitespace-nowrap ${isGrabbed ? 'opacity-40 ring-2 ring-white' : ''}`}
              style={{ left: x }}
              onClick={() => handleGrab(option)}
              whileTap={{ scale: 0.9, y: -20 }}
            >
              {option} {isGrabbed && '✓'}
            </motion.button>
          )
        })}

        {/* Belt rollers */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-400 border-2 border-gray-500">
          <motion.div
            className="w-full h-full rounded-full border-t-2 border-gray-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-400 border-2 border-gray-500">
          <motion.div
            className="w-full h-full rounded-full border-t-2 border-gray-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>

      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={grabbed.length === 0}
        className={`w-full py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          grabbed.length > 0
            ? 'bg-violet-500 text-white hover:bg-violet-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={grabbed.length > 0 ? { scale: 0.98 } : {}}
      >
        {grabbed.length > 0 ? `🏭 Done (${grabbed.length})` : 'Tap items to grab'}
      </motion.button>
    </div>
  )
}
