'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface SpinStopQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const ITEM_HEIGHT = 72

export function SpinStopQuestion({ question, onAnswer }: SpinStopQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = useMemo(() => (rawOptions as string[]).slice(0, 4).filter(o => o.trim() !== ''), [rawOptions])

  const [spinState, setSpinState] = useState<'spinning' | 'slowing' | 'stopped'>('spinning')
  const [offset, setOffset] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const speedRef = useRef(12)
  const rafRef = useRef<number>(0)
  const offsetRef = useRef(0)
  const lastLandedIndexRef = useRef<number>(-1)

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Spin animation loop
  useEffect(() => {
    if (spinState === 'stopped') return

    const animate = () => {
      if (spinState === 'slowing') {
        speedRef.current *= 0.97
        if (speedRef.current < 0.5) {
          // Snap to nearest option, but NOT the same as last time
          const totalHeight = options.length * ITEM_HEIGHT
          const normalized = ((offsetRef.current % totalHeight) + totalHeight) % totalHeight
          let nearestIndex = Math.round(normalized / ITEM_HEIGHT) % options.length

          // If we'd land on the same option, move to the next one
          if (nearestIndex === lastLandedIndexRef.current && options.length > 1) {
            nearestIndex = (nearestIndex + 1) % options.length
          }

          const snappedOffset = nearestIndex * ITEM_HEIGHT
          lastLandedIndexRef.current = nearestIndex

          offsetRef.current = snappedOffset
          setOffset(snappedOffset)
          setSpinState('stopped')
          setSelectedOption(options[nearestIndex])

          if (navigator.vibrate) {
            navigator.vibrate([30, 20, 50])
          }
          return
        }
      }

      offsetRef.current += speedRef.current
      setOffset(offsetRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [spinState, options])

  const handleStop = useCallback(() => {
    if (spinState !== 'spinning') return
    setSpinState('slowing')
  }, [spinState])

  const handleRetry = useCallback(() => {
    setSpinState('spinning')
    setSelectedOption(null)
    speedRef.current = 12
    // Push offset forward so it doesn't just snap back to the same spot
    offsetRef.current = offsetRef.current + ITEM_HEIGHT * 2 + Math.random() * ITEM_HEIGHT * 3
  }, [])

  const handleConfirm = useCallback(() => {
    if (!selectedOption || confirmed) return
    setConfirmed(true)

    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 40])
    }

    setTimeout(() => {
      onAnswer(selectedOption)
    }, 500)
  }, [selectedOption, confirmed, onAnswer])

  // Get visible items (3 items: prev, current, next)
  const getVisibleItems = () => {
    const totalHeight = options.length * ITEM_HEIGHT
    const normalized = ((offset % totalHeight) + totalHeight) % totalHeight
    const currentIdx = Math.floor(normalized / ITEM_HEIGHT) % options.length
    const fraction = (normalized % ITEM_HEIGHT) / ITEM_HEIGHT

    const items = []
    for (let i = -1; i <= 1; i++) {
      const idx = ((currentIdx + i) % options.length + options.length) % options.length
      items.push({
        option: options[idx],
        yOffset: (i - fraction) * ITEM_HEIGHT,
        index: idx,
      })
    }
    return items
  }

  const visibleItems = getVisibleItems()
  const isBlurring = spinState === 'spinning'

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-6 text-sm">
        {spinState === 'stopped' ? 'Happy with this? Confirm or retry!' : 'Tap STOP to lock in'}
      </p>

      {/* Slot machine frame */}
      <motion.div
        className="relative mx-auto w-64 overflow-hidden rounded-2xl border-4 border-gray-300 bg-white shadow-xl"
        style={{ height: ITEM_HEIGHT * 3 }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Reel items */}
        <div className="absolute inset-0">
          {visibleItems.map((item, i) => (
            <div
              key={`${item.index}-${i}`}
              className="absolute left-0 right-0 flex items-center justify-center font-bold text-lg text-gray-800"
              style={{
                height: ITEM_HEIGHT,
                top: ITEM_HEIGHT + item.yOffset,
                filter: isBlurring
                  ? `blur(${Math.abs(item.yOffset) > 20 ? 3 : 1}px)`
                  : 'none',
                transition: spinState === 'stopped' ? 'filter 0.3s' : 'none',
              }}
            >
              {item.option}
            </div>
          ))}
        </div>

        {/* Center highlight bar */}
        <div
          className="absolute left-0 right-0 border-y-2 border-violet-400 bg-violet-50/30 pointer-events-none"
          style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
        />

        {/* Side arrows */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-violet-400 text-lg pointer-events-none">▶</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-violet-400 text-lg pointer-events-none">◀</div>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </motion.div>

      {/* Result display */}
      <AnimatePresence>
        {selectedOption && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-600 px-4 py-2 rounded-full font-medium text-sm">
              🎰 {selectedOption}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {spinState !== 'stopped' ? (
        <motion.button
          onClick={handleStop}
          disabled={spinState !== 'spinning'}
          className={`
            w-full py-4 rounded-xl font-black text-xl shadow-lg mt-6 uppercase tracking-wider
            ${spinState === 'spinning'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-amber-500 text-white'
            }
            transition-colors
          `}
          animate={spinState === 'spinning' ? { scale: 1.03 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, repeat: spinState === 'spinning' ? Infinity : 0, repeatType: 'reverse' as const }}
          whileTap={spinState === 'spinning' ? { scale: 0.95 } : {}}
        >
          {spinState === 'spinning' ? 'STOP' : 'Stopping...'}
        </motion.button>
      ) : (
        <motion.div
          className="flex gap-3 mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={handleRetry}
            disabled={confirmed}
            className="flex-1 py-4 rounded-xl font-bold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            Retry
          </motion.button>
          <motion.button
            onClick={handleConfirm}
            disabled={confirmed}
            className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-colors ${
              confirmed ? 'bg-green-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-600'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {confirmed ? 'Locked!' : 'Confirm'}
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
