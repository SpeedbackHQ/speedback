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
  const { options: rawOptions = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }
  const options = rawOptions.slice(0, 4)  // Cap at 4 options max

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [isOverTarget, setIsOverTarget] = useState(false)
  const [droppedOption, setDroppedOption] = useState<string | null>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  const checkOverTarget = useCallback((info: PanInfo) => {
    if (!targetRef.current) return false

    const targetRect = targetRef.current.getBoundingClientRect()

    const pointerX = info.point.x
    const pointerY = info.point.y

    return (
      pointerX >= targetRect.left &&
      pointerX <= targetRect.right &&
      pointerY >= targetRect.top &&
      pointerY <= targetRect.bottom
    )
  }, [])

  const handleDragStart = (index: number) => {
    setDraggingIndex(index)
    if (navigator.vibrate) {
      navigator.vibrate(20)
    }
  }

  const handleDrag = (info: PanInfo) => {
    const over = checkOverTarget(info)
    setIsOverTarget(over)
  }

  const handleDragEnd = (index: number, info: PanInfo) => {
    const over = checkOverTarget(info)

    if (over) {
      setDroppedOption(options[index])

      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 80])
      }

      // Auto-submit after brief animation
      setTimeout(() => {
        onAnswer(options[index])
      }, 600)
    }

    setDraggingIndex(null)
    setIsOverTarget(false)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-6">
      {/* Question text */}
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-6 text-sm">
        Drag your answer to the target
      </p>

      {/* Game area */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl shadow-lg p-6 flex-1 min-h-0 flex flex-col">

        {/* Options to drag */}
        {!droppedOption && (
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {options.map((option, index) => {
              const colors = optionColors[index % optionColors.length]
              const isDragging = draggingIndex === index

              return (
                <motion.div
                  key={option}
                  className={`
                    relative w-24 h-24 rounded-full cursor-grab active:cursor-grabbing
                    flex items-center justify-center text-center
                    ${colors.light} border-2 ${colors.border}
                    ${isDragging ? 'z-50 shadow-2xl' : 'shadow-md'}
                  `}
                  drag
                  dragSnapToOrigin
                  dragElastic={0.1}
                  onDragStart={() => handleDragStart(index)}
                  onDrag={(_, info) => handleDrag(info)}
                  onDragEnd={(_, info) => handleDragEnd(index, info)}
                  whileDrag={{ scale: 1.1 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="font-semibold text-gray-700 text-[11px] leading-tight px-2 line-clamp-3 overflow-hidden">
                    {option}
                  </span>
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
              w-32 h-32 rounded-full border-4 border-dashed
              flex items-center justify-center
              transition-all duration-200
              ${isOverTarget
                ? 'border-emerald-500 bg-emerald-100 scale-110'
                : droppedOption
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-gray-300 bg-white/50'
              }
            `}
            animate={isOverTarget ? { scale: 1.1 } : { scale: 1 }}
          >
            {droppedOption ? (
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <span className="text-xl">✓</span>
                <span className="text-white font-bold text-xs text-center px-2 leading-tight">{droppedOption}</span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">🎯</span>
                <span className="text-gray-400 text-xs font-medium">
                  {isOverTarget ? 'Release!' : 'Drop here'}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Result badge */}
        <AnimatePresence>
          {droppedOption && (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium text-sm">
                🎯 {droppedOption}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
