'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface TugOfWarQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function TugOfWarQuestion({ question, onAnswer }: TugOfWarQuestionProps) {
  const {
    left_label = 'No',
    right_label = 'Yes',
  } = question.config as { left_label?: string; right_label?: string }

  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [winner, setWinner] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const threshold = 100 // px from center to trigger

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (winner) return
    e.preventDefault()
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [winner])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || winner) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.left + rect.width / 2
    const offset = e.clientX - centerX
    // Add resistance the further you drag
    const dampened = offset * 0.7
    setDragX(Math.max(-rect.width / 2, Math.min(rect.width / 2, dampened)))
  }, [isDragging, winner])

  const handlePointerUp = useCallback(() => {
    if (!isDragging || winner) return
    setIsDragging(false)

    if (Math.abs(dragX) >= threshold) {
      const side = dragX < 0 ? 'left' : 'right'
      setWinner(side)
      // Snap fully to that side
      setDragX(side === 'left' ? -160 : 160)

      if (navigator.vibrate) {
        navigator.vibrate([30, 20, 50])
      }

      setTimeout(() => {
        onAnswer(side)
      }, 600)
    } else {
      // Spring back
      setDragX(0)
    }
  }, [isDragging, winner, dragX, onAnswer])

  // Color intensity based on drag distance
  const intensity = Math.min(1, Math.abs(dragX) / threshold)
  const isLeft = dragX < 0
  const pastThreshold = Math.abs(dragX) >= threshold

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-8 text-sm">
        Drag the handle to your side
      </p>

      {/* Labels */}
      <div className="flex justify-between items-center mb-4 px-2">
        <motion.span
          className="text-lg font-bold"
          animate={{
            color: winner === 'left' ? '#e11d48' : dragX < 0 ? `rgba(225,29,72,${intensity})` : '#9ca3af',
            scale: winner === 'left' ? 1.2 : 1,
          }}
        >
          {left_label}
        </motion.span>
        <motion.span
          className="text-lg font-bold"
          animate={{
            color: winner === 'right' ? '#059669' : dragX > 0 ? `rgba(5,150,105,${intensity})` : '#9ca3af',
            scale: winner === 'right' ? 1.2 : 1,
          }}
        >
          {right_label}
        </motion.span>
      </div>

      {/* Tug of war track */}
      <motion.div
        ref={containerRef}
        className="relative h-20 rounded-full overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Background zones */}
        <div className="absolute inset-0 flex">
          <motion.div
            className="flex-1 bg-rose-100"
            animate={{ opacity: isLeft ? 0.5 + intensity * 0.5 : 0.3 }}
          />
          <motion.div
            className="flex-1 bg-emerald-100"
            animate={{ opacity: !isLeft && dragX > 0 ? 0.5 + intensity * 0.5 : 0.3 }}
          />
        </div>

        {/* Center line */}
        <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-gray-300 -translate-x-1/2 z-10" />

        {/* Threshold markers */}
        <div className="absolute top-2 bottom-2 w-0.5 bg-rose-300/50" style={{ left: `calc(50% - ${threshold}px)` }} />
        <div className="absolute top-2 bottom-2 w-0.5 bg-emerald-300/50" style={{ left: `calc(50% + ${threshold}px)` }} />

        {/* Rope */}
        <motion.div
          className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2"
          style={{
            background: 'repeating-linear-gradient(90deg, #a8a29e 0px, #a8a29e 8px, #78716c 8px, #78716c 16px)',
          }}
          animate={{ x: dragX }}
          transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
        />

        {/* Handle */}
        <motion.div
          className={`absolute top-1/2 left-1/2 w-14 h-14 -translate-y-1/2 -translate-x-1/2 rounded-full shadow-lg flex items-center justify-center z-20 ${
            winner === 'left'
              ? 'bg-rose-500'
              : winner === 'right'
              ? 'bg-emerald-500'
              : pastThreshold
              ? isLeft ? 'bg-rose-400' : 'bg-emerald-400'
              : 'bg-white border-4 border-gray-300'
          }`}
          animate={{
            x: dragX,
            scale: isDragging ? 1.1 : winner ? 1.15 : 1,
          }}
          transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
        >
          {winner ? (
            <motion.span
              className="text-white font-bold text-xs"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {winner === 'left' ? left_label : right_label}
            </motion.span>
          ) : (
            <span className="text-gray-400 text-lg">⟷</span>
          )}
        </motion.div>
      </motion.div>

      {/* Winner announcement */}
      {winner && (
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${
            winner === 'right' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {winner === 'left' ? left_label : right_label}
          </span>
        </motion.div>
      )}
    </div>
  )
}
