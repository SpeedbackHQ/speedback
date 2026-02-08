'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface DoorChoiceQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const doorColors = [
  { frame: 'bg-indigo-600', panel: 'bg-indigo-500', knob: 'bg-amber-400' },
  { frame: 'bg-rose-600', panel: 'bg-rose-500', knob: 'bg-amber-400' },
  { frame: 'bg-emerald-600', panel: 'bg-emerald-500', knob: 'bg-amber-400' },
  { frame: 'bg-amber-600', panel: 'bg-amber-500', knob: 'bg-amber-700' },
]

export function DoorChoiceQuestion({ question, onAnswer }: DoorChoiceQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = useMemo(() => (rawOptions as string[]).slice(0, 4).filter(o => o.trim() !== ''), [rawOptions])

  const [chosenDoor, setChosenDoor] = useState<number | null>(null)
  const [phase, setPhase] = useState<'picking' | 'zooming' | 'revealing' | 'revealed'>('picking')

  const handleDoorTap = useCallback((index: number) => {
    if (phase !== 'picking') return

    setChosenDoor(index)
    setPhase('zooming')

    if (navigator.vibrate) navigator.vibrate(15)

    // After other doors fade, start the door opening reveal
    setTimeout(() => {
      setPhase('revealing')
      if (navigator.vibrate) navigator.vibrate([20, 10, 40])
    }, 700)

    // Show the revealed content
    setTimeout(() => {
      setPhase('revealed')
    }, 1200)

    // Submit
    setTimeout(() => {
      onAnswer(options[index])
    }, 2200)
  }, [phase, options, onAnswer])

  const gridCols = 'grid-cols-2'

  return (
    <div className="w-full max-w-md mx-auto px-4 relative">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase === 'picking' ? 1 : 0, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <motion.p
        className="text-gray-500 text-center mb-6 text-sm"
        animate={{ opacity: phase === 'picking' ? 1 : 0 }}
      >
        Tap a door to reveal what&apos;s behind it
      </motion.p>

      {/* Doors grid */}
      <div className={`grid ${gridCols} gap-3`}>
        {options.map((option, i) => {
          const isChosen = chosenDoor === i
          const color = doorColors[i % doorColors.length]

          return (
            <motion.div
              key={i}
              className="relative cursor-pointer"
              style={{ perspective: 800 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: phase === 'picking' || isChosen ? 1 : 0,
                y: 0,
                scale: isChosen && phase !== 'picking' ? 1.15 : 1,
                zIndex: isChosen ? 50 : 1,
              }}
              transition={{
                delay: phase === 'picking' ? i * 0.1 : 0,
                duration: 0.4,
              }}
              onClick={() => handleDoorTap(i)}
            >
              {/* Door frame */}
              <div className={`${color.frame} rounded-xl p-1.5 shadow-lg`} style={{ height: 160 }}>
                {/* Content behind door */}
                <div className="absolute inset-1.5 rounded-lg bg-yellow-50 flex items-center justify-center overflow-hidden">
                  <AnimatePresence>
                    {isChosen && (phase === 'revealing' || phase === 'revealed') && (
                      <motion.div
                        className="text-center px-2"
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                      >
                        <motion.span
                          className="text-4xl block"
                          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          ✨
                        </motion.span>
                        <motion.p
                          className="font-bold text-gray-800 text-base mt-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {option}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Door panel (swings open) */}
                <motion.div
                  className={`absolute inset-1.5 ${color.panel} rounded-lg flex flex-col items-center justify-center shadow-md`}
                  style={{ transformOrigin: 'left center' }}
                  animate={{
                    rotateY: isChosen && phase !== 'picking' ? -110 : 0,
                    opacity: isChosen && phase !== 'picking' ? 0.15 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 18,
                    delay: isChosen ? 0.3 : 0,
                  }}
                >
                  {/* Door number */}
                  <span className="text-3xl font-black text-white/90">{i + 1}</span>

                  {/* Question mark */}
                  <span className="text-white/60 text-lg mt-1">?</span>

                  {/* Knob */}
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${color.knob} shadow-sm`} />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Revealed result badge */}
      <AnimatePresence>
        {phase === 'revealed' && chosenDoor !== null && (
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium text-sm">
              🚪 {options[chosenDoor]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
