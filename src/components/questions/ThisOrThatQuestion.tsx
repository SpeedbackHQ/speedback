'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface ThisOrThatQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

export function ThisOrThatQuestion({ question, onAnswer }: ThisOrThatQuestionProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])

  // Background shifts toward the chosen side
  const background = useTransform(
    x,
    [-200, 0, 200],
    ['rgb(239, 246, 255)', 'rgb(255, 255, 255)', 'rgb(240, 253, 244)']
  )

  // Highlight the side you're dragging toward
  const leftOpacity = useTransform(x, [-150, -30, 0], [1, 0.7, 0.4])
  const rightOpacity = useTransform(x, [0, 30, 150], [0.4, 0.7, 1])
  const leftScale = useTransform(x, [-150, -50, 0], [1.15, 1.05, 1])
  const rightScale = useTransform(x, [0, 50, 150], [1, 1.05, 1.15])

  const {
    left_label = 'This',
    right_label = 'That',
  } = question.config as {
    left_label?: string
    right_label?: string
  }

  const handleDragEnd = (_: never, info: PanInfo) => {
    const threshold = 100
    const velocityThreshold = 500

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      triggerExit('right')
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      triggerExit('left')
    }
  }

  const triggerExit = (direction: 'left' | 'right') => {
    setExitDirection(direction)
    setIsExiting(true)

    if (navigator.vibrate) navigator.vibrate(50)

    setTimeout(() => {
      onAnswer(direction === 'left' ? left_label : right_label)
    }, 300)
  }

  const exitVariants = {
    left: { x: -500, opacity: 0, transition: { duration: 0.3 } },
    right: { x: 500, opacity: 0, transition: { duration: 0.3 } },
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      <div className="flex items-center justify-center w-full relative">
        <motion.div
          className="w-[92vw] max-w-md h-[70vh] max-h-[520px] bg-white rounded-3xl shadow-2xl flex flex-col cursor-grab active:cursor-grabbing overflow-hidden"
          style={{ x, rotate, background }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          animate={isExiting && exitDirection ? exitVariants[exitDirection] : {}}
          whileTap={{ scale: 1.02 }}
        >
          {/* Question text */}
          <div className="flex flex-col items-center justify-center pt-8 pb-4 px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 break-words max-w-md px-2">
              {question.text}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Swipe or tap to choose
            </p>
          </div>

          {/* VS display — the two options */}
          <div className="flex-1 flex items-center justify-center px-6 gap-4">
            {/* Left option */}
            <motion.button
              onClick={() => !isExiting && triggerExit('left')}
              className="flex-1 h-32 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow active:scale-95 px-3"
              style={{ opacity: leftOpacity, scale: leftScale }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-blue-700 text-lg font-bold text-center leading-tight">
                {left_label}
              </span>
            </motion.button>

            {/* VS divider */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-8 bg-slate-200" />
              <span className="text-slate-400 font-bold text-sm">VS</span>
              <div className="w-px h-8 bg-slate-200" />
            </div>

            {/* Right option */}
            <motion.button
              onClick={() => !isExiting && triggerExit('right')}
              className="flex-1 h-32 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow active:scale-95 px-3"
              style={{ opacity: rightOpacity, scale: rightScale }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-green-700 text-lg font-bold text-center leading-tight">
                {right_label}
              </span>
            </motion.button>
          </div>

          {/* Swipe hint arrows */}
          <div className="flex items-center justify-between px-10 pb-8 text-slate-300">
            <span className="text-sm">← {left_label}</span>
            <span className="text-sm">{right_label} →</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
