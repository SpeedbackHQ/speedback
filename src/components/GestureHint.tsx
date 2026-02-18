'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuestionType } from '@/lib/types'

type GestureType = 'swipe-lr' | 'drag-to-target' | 'pull-release' | 'drag-side' | 'swipe-browse' | 'hold' | 'scratch'

const gestureForType: Partial<Record<QuestionType, GestureType>> = {
  swipe: 'swipe-lr',
  tilt_maze: 'drag-to-target',
  bullseye: 'drag-to-target',
  slingshot: 'pull-release',
  // slider: omitted — visible thumb + gradient track + "Slide to rate" button text are sufficient affordance
  // tug_of_war: omitted — visible rope makes the drag mechanic self-evident
  thermometer: 'drag-side',
  tilt: 'drag-side',
  dial: 'drag-side',
  rolodex: 'swipe-browse',
  fanned_swipe: 'swipe-browse',
  stacked: 'swipe-browse',
  flick: 'swipe-browse',
  press_hold: 'hold',
  scratch_card: 'scratch',
  claw_machine: 'drag-side',
  sticker_board: 'drag-to-target',
  jar_fill: 'drag-to-target',
}

const gestureConfig: Record<GestureType, { text: string }> = {
  'swipe-lr': { text: 'Swipe to choose' },
  'drag-to-target': { text: 'Drag to your answer' },
  'pull-release': { text: 'Pull back and release' },
  'drag-side': { text: 'Drag to set your value' },
  'swipe-browse': { text: 'Swipe to browse' },
  'hold': { text: 'Press and hold' },
  'scratch': { text: 'Scratch to reveal' },
}

// CSS keyframes for each gesture animation applied to the thumb
const gestureAnimations: Record<GestureType, string> = {
  'swipe-lr': 'gestureSwipeLR 1.6s ease-in-out infinite',
  'drag-to-target': 'gestureDragToTarget 2s ease-in-out infinite',
  'pull-release': 'gesturePullRelease 1.8s ease-in-out infinite',
  'drag-side': 'gestureDragSide 1.8s ease-in-out infinite',
  'swipe-browse': 'gestureSwipeBrowse 1.4s ease-in-out infinite',
  'hold': 'gestureHold 2s ease-in-out infinite',
  'scratch': 'gestureScratch 1.2s ease-in-out infinite',
}

// Global styles for keyframes (injected once)
const keyframesCSS = `
@keyframes gestureSwipeLR {
  0%, 100% { transform: translateX(-30px); }
  50% { transform: translateX(30px); }
}
@keyframes gestureDragToTarget {
  0%, 10% { transform: translateY(-30px) scale(1); opacity: 0.9; }
  15% { transform: translateY(-30px) scale(0.85); }
  60% { transform: translateY(40px) scale(0.85); }
  70% { transform: translateY(40px) scale(1); opacity: 0.9; }
  100% { transform: translateY(40px) scale(1); opacity: 0.5; }
}
@keyframes gesturePullRelease {
  0%, 10% { transform: translateY(0); }
  40% { transform: translateY(40px) scale(0.9); }
  50% { transform: translateY(40px) scale(0.9); }
  65% { transform: translateY(-50px) scale(1); }
  100% { transform: translateY(-50px) scale(1); opacity: 0.3; }
}
@keyframes gestureDragSide {
  0%, 10% { transform: translateX(-35px) scale(1); }
  15% { transform: translateX(-35px) scale(0.85); }
  80% { transform: translateX(35px) scale(0.85); }
  90%, 100% { transform: translateX(35px) scale(1); }
}
@keyframes gestureSwipeBrowse {
  0% { transform: translateX(20px); }
  30% { transform: translateX(-40px); }
  50% { transform: translateX(10px); }
  80% { transform: translateX(-30px); }
  100% { transform: translateX(20px); }
}
@keyframes gestureHold {
  0%, 15% { transform: scale(1); }
  25% { transform: scale(0.8); }
  75% { transform: scale(0.8); }
  90%, 100% { transform: scale(1); }
}
@keyframes gestureHoldRing {
  0%, 25% { transform: scale(0); opacity: 0.6; }
  75% { transform: scale(2.5); opacity: 0; }
  100% { transform: scale(0); opacity: 0; }
}
@keyframes gestureScratch {
  0% { transform: translate(0, 0); }
  20% { transform: translate(25px, 8px); }
  40% { transform: translate(-20px, 16px); }
  60% { transform: translate(20px, 24px); }
  80% { transform: translate(-25px, 8px); }
  100% { transform: translate(0, 0); }
}
`

/** Returns the gesture type for a question type, or null if no hint needed */
export function getGestureType(questionType: QuestionType): GestureType | null {
  return gestureForType[questionType] ?? null
}

interface GestureHintProps {
  questionType: QuestionType
  onDismiss: () => void
}

export function GestureHint({ questionType, onDismiss }: GestureHintProps) {
  const gesture = getGestureType(questionType)
  const [visible, setVisible] = useState(false)

  // Inject keyframes CSS once
  useEffect(() => {
    if (document.getElementById('gesture-hint-keyframes')) return
    const style = document.createElement('style')
    style.id = 'gesture-hint-keyframes'
    style.textContent = keyframesCSS
    document.head.appendChild(style)
  }, [])

  // Show after brief delay, auto-dismiss after 2s
  useEffect(() => {
    if (!gesture) {
      onDismiss()
      return
    }

    const showTimer = setTimeout(() => setVisible(true), 200)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300) // wait for fade-out
    }, 2200)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [gesture, onDismiss])

  const handleTap = () => {
    setVisible(false)
    setTimeout(onDismiss, 200)
  }

  if (!gesture) return null

  const config = gestureConfig[gesture]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/55 rounded-2xl cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleTap}
          onPointerDown={handleTap}
        >
          {/* Gesture animation area */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-4">
            {/* Thumb/finger */}
            <div
              className="w-10 h-10 rounded-full bg-white/80 shadow-lg relative z-10"
              style={{ animation: gestureAnimations[gesture] }}
            >
              {/* Finger highlight */}
              <div className="absolute top-1.5 left-2.5 w-3 h-2 rounded-full bg-white/60" />
            </div>

            {/* Hold ring effect */}
            {gesture === 'hold' && (
              <div
                className="absolute w-10 h-10 rounded-full border-2 border-white/50"
                style={{ animation: 'gestureHoldRing 2s ease-in-out infinite' }}
              />
            )}

            {/* Swipe trail for swipe gestures */}
            {(gesture === 'swipe-lr' || gesture === 'drag-side' || gesture === 'swipe-browse') && (
              <div className="absolute w-16 h-0.5 bg-white/20 rounded-full" />
            )}

            {/* Vertical trail for drag-to-target and pull-release */}
            {(gesture === 'drag-to-target' || gesture === 'pull-release') && (
              <div className="absolute w-0.5 h-16 bg-white/20 rounded-full" />
            )}
          </div>

          {/* Instruction text */}
          <p className="text-white font-semibold text-lg tracking-wide">
            {config.text}
          </p>

          {/* Tap to start */}
          <p className="text-white/50 text-xs mt-3">
            Tap to start
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
