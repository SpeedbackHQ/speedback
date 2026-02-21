'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Question, SwipeAnswer } from '@/lib/types'

interface SwipeQuestionProps {
  question: Question
  onAnswer: (answer: SwipeAnswer) => void
  streak?: number
  isSpeedBonus?: boolean
  hasNextSwipe?: boolean
}

export function SwipeQuestion({
  question,
  onAnswer,
  streak = 0,
  isSpeedBonus = false,
  hasNextSwipe = false,
}: SwipeQuestionProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Rotate based on horizontal drag
  const rotate = useTransform(x, [-200, 200], [-25, 25])

  // Background color shift
  const background = useTransform(
    x,
    [-200, 0, 200],
    ['rgb(254, 226, 226)', 'rgb(255, 255, 255)', 'rgb(220, 252, 231)']
  )

  // Button highlight based on drag
  const leftButtonScale = useTransform(x, [-150, -50, 0], [1.2, 1.1, 1])
  const rightButtonScale = useTransform(x, [0, 50, 150], [1, 1.1, 1.2])
  const upButtonScale = useTransform(y, [-150, -50, 0], [1.2, 1.1, 1])

  const {
    left_label = 'No',
    right_label = 'Yes',
    up_label = 'Meh',
    show_meh = false,
  } = question.config as {
    left_label?: string
    right_label?: string
    up_label?: string
    show_meh?: boolean
  }

  const handleDragEnd = (_: never, info: PanInfo) => {
    const threshold = 100
    const velocityThreshold = 500

    // Check for swipe up first (only if meh is enabled)
    if (show_meh && (info.offset.y < -threshold || info.velocity.y < -velocityThreshold)) {
      triggerExit('up')
      return
    }

    // Check horizontal swipes
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      triggerExit('right')
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      triggerExit('left')
    }
  }

  const triggerExit = (direction: 'left' | 'right' | 'up') => {
    setExitDirection(direction)
    setIsExiting(true)

    // Haptic feedback - shorter during streaks
    if (navigator.vibrate) {
      navigator.vibrate(streak >= 2 ? 30 : 50)
    }

    // Faster animation during streaks
    const exitDelay = streak >= 2 && hasNextSwipe ? 180 : 300
    setTimeout(() => {
      onAnswer(direction)
    }, exitDelay)
  }

  // Faster exit animations during streaks
  const exitDuration = streak >= 2 && hasNextSwipe ? 0.18 : 0.3
  const exitVariants = {
    left: { x: -500, opacity: 0, transition: { duration: exitDuration } },
    right: { x: 500, opacity: 0, transition: { duration: exitDuration } },
    up: { y: -500, opacity: 0, transition: { duration: exitDuration } },
  }

  // Visual enhancements during streak
  const isInStreak = streak >= 2
  const streakGlow = isInStreak
    ? isSpeedBonus
      ? '0 0 30px rgba(249, 115, 22, 0.4), 0 0 60px rgba(249, 115, 22, 0.2)'
      : '0 0 25px rgba(99, 102, 241, 0.3), 0 0 50px rgba(99, 102, 241, 0.15)'
    : undefined

  // Bottom layout with meh button between No/Yes
  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      <div className="flex items-center justify-center w-full relative">
        <motion.div
          className={`w-[92vw] max-w-md h-[70vh] max-h-[520px] bg-white rounded-3xl shadow-2xl flex flex-col cursor-grab active:cursor-grabbing overflow-hidden ${
            isInStreak ? 'ring-2 ring-violet-400/50' : ''
          } ${isSpeedBonus ? 'ring-orange-400/60' : ''}`}
          style={{ x, y, rotate, background, boxShadow: streakGlow }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          animate={isExiting && exitDirection ? exitVariants[exitDirection] : {}}
          whileTap={{ scale: 1.02 }}
        >
          {/* Question text ON the card */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 break-words max-w-md px-2">
              {question.text}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Swipe {show_meh ? 'left, right, or up' : 'left or right'}
            </p>
          </div>

          {/* Swipe up indicator for meh */}
          {show_meh && (
            <motion.div
              className="flex flex-col items-center pb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <div className="text-amber-500 text-2xl">↑</div>
              <span className="text-amber-500 text-xs font-medium">swipe for {up_label}</span>
            </motion.div>
          )}

          {/* Action buttons at bottom of card */}
          <div className={`flex items-center justify-center gap-6 pb-8 px-6 ${show_meh ? 'gap-4' : 'gap-12'}`}>
            {/* No button */}
            <motion.button
              onClick={() => !isExiting && triggerExit('left')}
              className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-200 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-shadow active:scale-95"
              style={{ scale: leftButtonScale }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-red-500 text-2xl font-bold">✗</span>
            </motion.button>

            {/* Meh button (optional) */}
            {show_meh && (
              <motion.button
                onClick={() => !isExiting && triggerExit('up')}
                className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-200 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-shadow active:scale-95"
                style={{ scale: upButtonScale }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-amber-500 text-xl font-bold">~</span>
              </motion.button>
            )}

            {/* Yes button */}
            <motion.button
              onClick={() => !isExiting && triggerExit('right')}
              className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-200 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-shadow active:scale-95"
              style={{ scale: rightButtonScale }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-emerald-500 text-2xl">♥</span>
            </motion.button>
          </div>

          {/* Labels below buttons */}
          <div className={`flex items-center justify-center pb-6 px-6 ${show_meh ? 'gap-8' : 'gap-20'}`}>
            <span className="text-red-500 font-semibold text-sm">{left_label}</span>
            {show_meh && (
              <span className="text-amber-500 font-semibold text-sm">{up_label}</span>
            )}
            <span className="text-emerald-500 font-semibold text-sm">{right_label}</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
