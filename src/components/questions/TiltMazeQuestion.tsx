'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface TiltMazeQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const optionColors = [
  { bg: 'bg-rose-500', light: 'bg-rose-100', border: 'border-rose-300' },
  { bg: 'bg-sky-500', light: 'bg-sky-100', border: 'border-sky-300' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', border: 'border-emerald-300' },
  { bg: 'bg-violet-500', light: 'bg-violet-100', border: 'border-violet-300' },
  { bg: 'bg-amber-500', light: 'bg-amber-100', border: 'border-amber-300' },
]

export function TiltMazeQuestion({ question, onAnswer }: TiltMazeQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [isOverTarget, setIsOverTarget] = useState(false)
  const [droppedOption, setDroppedOption] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  const checkOverTarget = useCallback((info: PanInfo, element: HTMLElement) => {
    if (!targetRef.current) return false

    const targetRect = targetRef.current.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    // Get center of dragged element
    const centerX = elementRect.left + elementRect.width / 2 + info.offset.x
    const centerY = elementRect.top + elementRect.height / 2 + info.offset.y

    // Check if center is within target
    return (
      centerX >= targetRect.left &&
      centerX <= targetRect.right &&
      centerY >= targetRect.top &&
      centerY <= targetRect.bottom
    )
  }, [])

  const handleDragStart = (index: number) => {
    setDraggingIndex(index)
    if (navigator.vibrate) {
      navigator.vibrate(20)
    }
  }

  const handleDrag = (info: PanInfo, element: HTMLElement) => {
    const over = checkOverTarget(info, element)
    setIsOverTarget(over)
  }

  const handleDragEnd = (index: number, info: PanInfo, element: HTMLElement) => {
    const over = checkOverTarget(info, element)

    if (over) {
      // Dropped in target!
      setDroppedOption(options[index])
      setShowConfirm(true)

      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 80])
      }
    }

    setDraggingIndex(null)
    setIsOverTarget(false)
  }

  const handleConfirm = () => {
    if (droppedOption) {
      onAnswer(droppedOption)
    }
  }

  const handleReset = () => {
    setDroppedOption(null)
    setShowConfirm(false)
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
        {showConfirm ? 'Confirm your choice' : 'Drag your answer to the target'}
      </p>

      {/* Game area */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl shadow-lg p-6 min-h-[420px] flex flex-col">

        {/* Options to drag */}
        {!showConfirm && (
          <div className="space-y-3 mb-6">
            {options.map((option, index) => {
              const colors = optionColors[index % optionColors.length]
              const isDragging = draggingIndex === index

              return (
                <motion.div
                  key={option}
                  className={`
                    relative px-5 py-4 rounded-xl cursor-grab active:cursor-grabbing
                    ${colors.light} border-2 ${colors.border}
                    ${isDragging ? 'z-50 shadow-2xl' : 'shadow-md'}
                  `}
                  drag
                  dragSnapToOrigin
                  dragElastic={0.1}
                  onDragStart={() => handleDragStart(index)}
                  onDrag={(_, info) => handleDrag(info, _.target as HTMLElement)}
                  onDragEnd={(_, info) => handleDragEnd(index, info, _.target as HTMLElement)}
                  whileDrag={{ scale: 1.05, rotate: 2 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                    <span className="font-semibold text-gray-700">{option}</span>
                  </div>

                  {/* Drag hint on first option */}
                  {index === 0 && !draggingIndex && (
                    <motion.div
                      className="absolute -right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ← drag
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Drop target */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            ref={targetRef}
            className={`
              w-40 h-40 rounded-full border-4 border-dashed
              flex items-center justify-center
              transition-all duration-200
              ${isOverTarget
                ? 'border-emerald-500 bg-emerald-100 scale-110'
                : showConfirm
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-gray-300 bg-white/50'
              }
            `}
            animate={isOverTarget ? { scale: 1.1 } : { scale: 1 }}
          >
            {showConfirm && droppedOption ? (
              <motion.div
                className="text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <motion.div
                  className="text-4xl mb-1"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  ✓
                </motion.div>
                <span className="text-white font-bold text-sm">{droppedOption}</span>
              </motion.div>
            ) : (
              <div className="text-center">
                <motion.div
                  className="text-3xl mb-1"
                  animate={isOverTarget ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  🎯
                </motion.div>
                <span className="text-gray-400 text-sm font-medium">
                  {isOverTarget ? 'Release!' : 'Drop here'}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Confirm overlay */}
        <AnimatePresence>
          {showConfirm && droppedOption && (
            <motion.div
              className="absolute bottom-6 left-6 right-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <p className="text-center text-gray-600 mb-3">
                  You selected <span className="font-bold text-gray-800">{droppedOption}</span>
                </p>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
