'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface WhackAMoleQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const HOLE_COUNT = 9
const SHOW_DURATION = 1600
const HIDE_GAP = 400 // time after hide before hole can be reused

const moleColors = [
  'bg-indigo-400',
  'bg-rose-400',
  'bg-emerald-400',
  'bg-amber-400',
]

interface MoleEvent {
  hole: number
  option: string
  showAt: number
  hideAt: number
}

export function WhackAMoleQuestion({ question, onAnswer }: WhackAMoleQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = useMemo(() => (rawOptions as string[]).slice(0, 4).filter(o => o.trim() !== ''), [rawOptions])

  // Each hole tracks its current option (null = empty)
  const [holes, setHoles] = useState<(string | null)[]>(Array(HOLE_COUNT).fill(null))
  const [whackedHole, setWhackedHole] = useState<number | null>(null)
  const [whackedOption, setWhackedOption] = useState<string | null>(null)
  const [showBonk, setShowBonk] = useState(false)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const holesRef = useRef<(string | null)[]>(Array(HOLE_COUNT).fill(null))

  // Cleanup
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  // Build schedule: 2 moles at a time, always different options per pair
  // Cycles through all options evenly so every option appears
  const schedule = useMemo(() => {
    const events: MoleEvent[] = []
    const holeFreeAt: number[] = Array(HOLE_COUNT).fill(0)
    let time = 600

    // Build pairs of different options, cycling evenly through all options
    // Each pair draws 2 different options. We build by shuffling options
    // and taking them in pairs.
    const optionQueue: string[] = []
    // Need enough for 6 pairs = 12 slots
    while (optionQueue.length < 12) {
      const shuffled = [...options]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      optionQueue.push(...shuffled)
    }
    let optIdx = 0

    for (let pair = 0; pair < 6; pair++) {
      // Find 2 available holes
      const availableHoles: number[] = []
      for (let h = 0; h < HOLE_COUNT; h++) {
        if (holeFreeAt[h] <= time) availableHoles.push(h)
      }
      for (let i = availableHoles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[availableHoles[i], availableHoles[j]] = [availableHoles[j], availableHoles[i]]
      }

      // Pick 2 different options for this pair
      const opt1 = optionQueue[optIdx++ % optionQueue.length]
      let opt2 = optionQueue[optIdx++ % optionQueue.length]
      // Ensure they're different
      if (opt2 === opt1 && options.length > 1) {
        const others = options.filter(o => o !== opt1)
        opt2 = others[Math.floor(Math.random() * others.length)]
      }
      const pairOptions = [opt1, opt2]

      const count = Math.min(2, availableHoles.length)
      for (let m = 0; m < count; m++) {
        const hole = availableHoles[m]
        const showAt = time + m * 200
        const hideAt = showAt + SHOW_DURATION

        events.push({ hole, option: pairOptions[m], showAt, hideAt })
        holeFreeAt[hole] = hideAt + HIDE_GAP
      }

      time += SHOW_DURATION + HIDE_GAP + 200
    }

    return events
  }, [options])

  // Run the schedule
  useEffect(() => {
    if (whackedHole !== null) return

    schedule.forEach((event) => {
      const showT = setTimeout(() => {
        if (whackedHole !== null) return
        holesRef.current = [...holesRef.current]
        holesRef.current[event.hole] = event.option
        setHoles([...holesRef.current])
      }, event.showAt)

      const hideT = setTimeout(() => {
        holesRef.current = [...holesRef.current]
        // Only clear if option hasn't been changed (prevents clearing a newly assigned mole)
        if (holesRef.current[event.hole] === event.option) {
          holesRef.current[event.hole] = null
          setHoles([...holesRef.current])
        }
      }, event.hideAt)

      timeoutsRef.current.push(showT, hideT)
    })

    // After all events, show all holes as final chance
    const lastEvent = schedule[schedule.length - 1]
    if (lastEvent) {
      const allShowTime = lastEvent.hideAt + 800
      const allT = setTimeout(() => {
        if (whackedHole !== null) return
        const finalHoles: (string | null)[] = Array(HOLE_COUNT).fill(null)
        for (let i = 0; i < HOLE_COUNT; i++) {
          finalHoles[i] = options[i % options.length]
        }
        holesRef.current = finalHoles
        setHoles(finalHoles)
      }, allShowTime)
      timeoutsRef.current.push(allT)
    }
  }, [schedule, options, whackedHole])

  const handleWhack = useCallback((holeIndex: number) => {
    if (whackedHole !== null) return
    const option = holesRef.current[holeIndex]
    if (!option) return

    setWhackedHole(holeIndex)
    setWhackedOption(option)
    setShowBonk(true)

    // Stop all future moles
    timeoutsRef.current.forEach(t => clearTimeout(t))

    if (navigator.vibrate) {
      navigator.vibrate([40, 20, 60])
    }

    setTimeout(() => setShowBonk(false), 600)

    setTimeout(() => {
      onAnswer(option)
    }, 800)
  }, [whackedHole, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        Tap a mole to bonk your pick!
      </p>

      {/* BONK overlay */}
      <AnimatePresence>
        {showBonk && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-6xl font-black text-red-500 drop-shadow-lg" style={{ WebkitTextStroke: '2px white' }}>
              BONK!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3x3 Mole grid */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: HOLE_COUNT }).map((_, i) => {
          const option = holes[i]
          const isVisible = option !== null
          const isWhacked = whackedHole === i

          return (
            <div
              key={i}
              className="relative flex flex-col items-center cursor-pointer"
              onClick={() => handleWhack(i)}
            >
              {/* Hole container */}
              <div
                className="relative w-full overflow-hidden"
                style={{ height: 80 }}
              >
                {/* Mole */}
                <motion.div
                  className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full ${
                    option ? moleColors[options.indexOf(option) % moleColors.length] : moleColors[0]
                  } shadow-lg flex items-center justify-center`}
                  initial={{ y: 60 }}
                  animate={{
                    y: isWhacked ? 15 : isVisible ? 0 : 60,
                    scaleY: isWhacked ? 0.6 : 1,
                    scaleX: isWhacked ? 1.2 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: isWhacked ? 15 : 20,
                  }}
                >
                  <span className="text-white font-bold text-[10px] text-center px-0.5 leading-tight">
                    {option || ''}
                  </span>

                  {/* Stars on whack */}
                  {isWhacked && (
                    <>
                      <motion.span
                        className="absolute -top-2 -left-1 text-yellow-400 text-xs"
                        initial={{ opacity: 1, scale: 0 }}
                        animate={{ opacity: 0, scale: 1.5, y: -15 }}
                        transition={{ duration: 0.5 }}
                      >
                        ⭐
                      </motion.span>
                      <motion.span
                        className="absolute -top-2 -right-1 text-yellow-400 text-xs"
                        initial={{ opacity: 1, scale: 0 }}
                        animate={{ opacity: 0, scale: 1.5, y: -10 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        ⭐
                      </motion.span>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Hole (ground) */}
              <div className="w-16 h-4 bg-gradient-to-b from-amber-800 to-amber-900 rounded-[50%] -mt-2 shadow-inner" />
            </div>
          )
        })}
      </div>

      {/* Result */}
      <AnimatePresence>
        {whackedOption && !showBonk && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium text-sm">
              🔨 {whackedOption}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
