'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface ClawMachineQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const prizeColors = [
  { bg: 'bg-purple-400', border: 'border-purple-500' },
  { bg: 'bg-pink-400', border: 'border-pink-500' },
  { bg: 'bg-cyan-400', border: 'border-cyan-500' },
  { bg: 'bg-amber-400', border: 'border-amber-500' },
]

type Phase = 'positioning' | 'dropping' | 'grabbing' | 'lifting'

export function ClawMachineQuestion({ question, onAnswer }: ClawMachineQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = useMemo(() => (rawOptions as string[]).slice(0, 4), [rawOptions])

  const [clawX, setClawX] = useState(50) // percentage
  const [phase, setPhase] = useState<Phase>('positioning')
  const [prizes, setPrizes] = useState<string[]>([])
  const [grabbedItem, setGrabbedItem] = useState<string | null>(null)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Prize positions (evenly spaced)
  const prizePositions = useMemo(() => {
    const spacing = 100 / (options.length + 1)
    return options.map((_, i) => spacing * (i + 1))
  }, [options])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== 'positioning') return
    isDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [phase])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || phase !== 'positioning') return
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setClawX(Math.max(10, Math.min(90, x)))
  }, [phase])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleDrop = useCallback(() => {
    if (phase !== 'positioning') return
    setPhase('dropping')

    // Find closest prize
    let closest: { option: string; dist: number } | null = null
    options.forEach((option, i) => {
      if (prizes.includes(option)) return // already grabbed
      const dist = Math.abs(prizePositions[i] - clawX)
      if (!closest || dist < closest.dist) {
        closest = { option, dist }
      }
    })

    // Drop animation -> grab -> lift
    setTimeout(() => {
      setPhase('grabbing')

      if (closest && closest.dist < 15) {
        setGrabbedItem(closest.option)
        if (navigator.vibrate) navigator.vibrate([30, 20, 50])

        setTimeout(() => {
          setPhase('lifting')

          setTimeout(() => {
            setPrizes(prev => [...prev, closest!.option])
            setGrabbedItem(null)
            setPhase('positioning')
          }, 600)
        }, 400)
      } else {
        // Miss
        if (navigator.vibrate) navigator.vibrate(20)
        setTimeout(() => {
          setPhase('positioning')
        }, 500)
      }
    }, 500)
  }, [phase, clawX, options, prizePositions, prizes])

  const handleSubmit = useCallback(() => {
    if (prizes.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(prizes)
  }, [prizes, onAnswer])

  const clawY = phase === 'dropping' || phase === 'grabbing' ? 65 : phase === 'lifting' ? 10 : 8
  const clawOpen = phase !== 'grabbing' && phase !== 'lifting'

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-3 text-sm">
        Drag the claw &amp; tap Drop!
      </p>

      {/* Prize collection */}
      <div className="flex gap-2 justify-center mb-2 min-h-[32px]">
        <AnimatePresence>
          {prizes.map((prize) => {
            const idx = options.indexOf(prize)
            const color = prizeColors[idx % prizeColors.length]
            return (
              <motion.span
                key={prize}
                className={`${color.bg} text-white px-3 py-1 rounded-full text-xs font-bold`}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {prize}
              </motion.span>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Machine */}
      <div
        ref={containerRef}
        className="relative h-56 bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-2xl overflow-hidden border-4 border-indigo-700 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Rail */}
        <div className="absolute top-4 left-4 right-4 h-1.5 bg-gray-500 rounded" />

        {/* Claw assembly */}
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ left: `${clawX}%`, transform: 'translateX(-50%)' }}
          animate={{ top: `${clawY}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {/* Cable */}
          <div className="w-0.5 bg-gray-400" style={{ height: 20 }} />

          {/* Claw body */}
          <div className="w-6 h-4 bg-gray-300 rounded-t-lg" />

          {/* Claw arms */}
          <div className="flex">
            <motion.div
              className="w-1.5 h-5 bg-gray-400 rounded-b origin-top"
              animate={{ rotate: clawOpen ? -25 : 0 }}
              transition={{ duration: 0.2 }}
            />
            <div className="w-2" />
            <motion.div
              className="w-1.5 h-5 bg-gray-400 rounded-b origin-top"
              animate={{ rotate: clawOpen ? 25 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Grabbed item */}
          {grabbedItem && (
            <motion.div
              className={`${prizeColors[options.indexOf(grabbedItem) % prizeColors.length].bg} text-white rounded-lg px-2 py-1 text-[10px] font-bold mt-0.5`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {grabbedItem}
            </motion.div>
          )}
        </motion.div>

        {/* Prizes in pit */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-indigo-800/50 rounded-t-xl">
          {options.map((option, index) => {
            if (prizes.includes(option)) return null
            if (grabbedItem === option) return null
            const color = prizeColors[index % prizeColors.length]

            return (
              <div
                key={option}
                className={`absolute bottom-3 ${color.bg} text-white rounded-xl px-3 py-2 text-xs font-bold shadow-lg`}
                style={{
                  left: `${prizePositions[index]}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {option}
              </div>
            )
          })}
        </div>

        {/* Glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Drop button */}
      <motion.button
        onClick={handleDrop}
        disabled={phase !== 'positioning'}
        className={`w-full mt-3 py-3 font-bold text-base rounded-xl transition-colors ${
          phase === 'positioning'
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        whileTap={phase === 'positioning' ? { scale: 0.97 } : {}}
      >
        {phase === 'positioning' ? '🕹️ Drop!' : 'Grabbing...'}
      </motion.button>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={prizes.length === 0}
        className={`w-full mt-2 py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          prizes.length > 0
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={prizes.length > 0 ? { scale: 0.98 } : {}}
      >
        {prizes.length > 0 ? `🎁 Collect prizes (${prizes.length})` : 'Grab prizes first'}
      </motion.button>
    </div>
  )
}
