'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface TiltMazeQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

// Fun themes for the drag item
const themes = [
  { item: '📦', zones: '📍', name: 'Delivery' },
  { item: '🌱', zones: '🌷', name: 'Garden' },
  { item: '⭐', zones: '🎯', name: 'Star' },
  { item: '🎁', zones: '🎄', name: 'Gift' },
]

const zoneColors = [
  { bg: 'from-rose-400 to-red-500', border: 'border-red-400', shadow: 'shadow-red-500/30' },
  { bg: 'from-sky-400 to-blue-500', border: 'border-blue-400', shadow: 'shadow-blue-500/30' },
  { bg: 'from-emerald-400 to-green-500', border: 'border-green-400', shadow: 'shadow-green-500/30' },
  { bg: 'from-violet-400 to-purple-500', border: 'border-purple-400', shadow: 'shadow-purple-500/30' },
  { bg: 'from-amber-400 to-orange-500', border: 'border-orange-400', shadow: 'shadow-orange-500/30' },
]

export function TiltMazeQuestion({ question, onAnswer }: TiltMazeQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [hoveredZone, setHoveredZone] = useState<number | null>(null)
  const [droppedZone, setDroppedZone] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const zoneRefs = useRef<(HTMLDivElement | null)[]>([])

  // Pick a random theme
  const theme = themes[Math.floor(Math.random() * themes.length)]

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (showConfirm) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setStartPosition({ x: e.clientX, y: e.clientY })
    setDragPosition({ x: 0, y: 0 })
    e.currentTarget.setPointerCapture(e.pointerId)

    if (navigator.vibrate) {
      navigator.vibrate(20)
    }
  }, [showConfirm])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || showConfirm) return

    const dx = e.clientX - startPosition.x
    const dy = e.clientY - startPosition.y
    setDragPosition({ x: dx, y: dy })

    // Check which zone we're hovering over
    const itemRect = e.currentTarget.getBoundingClientRect()
    const itemCenterX = itemRect.left + itemRect.width / 2 + dx
    const itemCenterY = itemRect.top + itemRect.height / 2 + dy

    let foundZone: number | null = null
    zoneRefs.current.forEach((zone, index) => {
      if (zone) {
        const zoneRect = zone.getBoundingClientRect()
        if (
          itemCenterX >= zoneRect.left &&
          itemCenterX <= zoneRect.right &&
          itemCenterY >= zoneRect.top &&
          itemCenterY <= zoneRect.bottom
        ) {
          foundZone = index
        }
      }
    })
    setHoveredZone(foundZone)
  }, [isDragging, startPosition, showConfirm])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return

    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)

    if (hoveredZone !== null) {
      // Dropped in a zone!
      setDroppedZone(options[hoveredZone])
      setShowConfirm(true)

      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 80])
      }
    } else {
      // Snap back
      setDragPosition({ x: 0, y: 0 })
    }
    setHoveredZone(null)
  }, [isDragging, hoveredZone, options])

  const handleConfirm = () => {
    if (droppedZone) {
      onAnswer(droppedZone)
    }
  }

  const handleReset = () => {
    setDroppedZone(null)
    setShowConfirm(false)
    setDragPosition({ x: 0, y: 0 })
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-6">
      {/* Question text */}
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-6 text-sm">
        {showConfirm ? 'Confirm your choice' : 'Drag to your answer'}
      </p>

      {/* Game area */}
      <div
        ref={containerRef}
        className="relative w-full max-w-sm bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl shadow-lg p-6 min-h-[400px] flex flex-col"
      >
        {/* Draggable item area */}
        <div className="flex-1 flex items-center justify-center mb-6">
          {!showConfirm && (
            <motion.div
              className={`
                w-24 h-24 rounded-2xl bg-white shadow-xl
                flex items-center justify-center text-5xl
                cursor-grab active:cursor-grabbing
                border-4 border-dashed border-gray-300
                ${isDragging ? 'z-50' : ''}
              `}
              style={{
                x: dragPosition.x,
                y: dragPosition.y,
              }}
              animate={{
                scale: isDragging ? 1.1 : 1,
                boxShadow: isDragging
                  ? '0 20px 40px rgba(0,0,0,0.2)'
                  : '0 10px 25px rgba(0,0,0,0.1)',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <motion.span
                animate={isDragging ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.3, repeat: isDragging ? Infinity : 0 }}
              >
                {theme.item}
              </motion.span>
            </motion.div>
          )}

          {/* Instruction when not dragging */}
          {!isDragging && !showConfirm && (
            <motion.div
              className="absolute top-1/4 left-0 right-0 text-center pointer-events-none"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-gray-400 text-sm">👆 Drag me down!</span>
            </motion.div>
          )}
        </div>

        {/* Drop zones */}
        <div className={`grid gap-3 ${options.length <= 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {options.map((option, index) => {
            const colors = zoneColors[index % zoneColors.length]
            const isHovered = hoveredZone === index
            const isDropped = droppedZone === option

            return (
              <motion.div
                key={option}
                ref={el => { zoneRefs.current[index] = el }}
                className={`
                  relative rounded-xl p-4 min-h-[80px]
                  flex flex-col items-center justify-center
                  bg-gradient-to-br ${colors.bg}
                  border-2 ${colors.border}
                  transition-all duration-200
                  ${isHovered ? `scale-110 ${colors.shadow} shadow-lg` : ''}
                  ${isDropped ? 'ring-4 ring-white ring-offset-2' : ''}
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Dropped item */}
                {isDropped && (
                  <motion.div
                    className="text-3xl mb-1"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {theme.item}
                  </motion.div>
                )}

                {/* Zone label */}
                <span className={`text-white font-semibold text-sm text-center leading-tight ${isDropped ? 'text-xs' : ''}`}>
                  {option}
                </span>

                {/* Hover indicator */}
                {isHovered && !isDropped && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-white/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Confirm overlay */}
        <AnimatePresence>
          {showConfirm && droppedZone && (
            <motion.div
              className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl px-6 py-5 shadow-2xl text-center mx-4"
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {theme.item}
                </motion.div>
                <p className="text-lg font-bold text-gray-800 mb-1">{droppedZone}</p>
                <p className="text-sm text-gray-500 mb-4">Is this your answer?</p>

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
