'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface JarFillQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const itemColors = [
  { bg: 'bg-purple-400', color: '#a855f7', emoji: '🟣' },
  { bg: 'bg-pink-400', color: '#ec4899', emoji: '🩷' },
  { bg: 'bg-cyan-400', color: '#06b6d4', emoji: '🔵' },
  { bg: 'bg-amber-400', color: '#f59e0b', emoji: '🟡' },
]

export function JarFillQuestion({ question, onAnswer }: JarFillQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4)

  const [inJar, setInJar] = useState<string[]>([])
  const [draggingOption, setDraggingOption] = useState<string | null>(null)
  const [isOverJar, setIsOverJar] = useState(false)
  const jarRef = useRef<HTMLDivElement>(null)

  // Stable positions for items in jar
  const jarPositions = useMemo(
    () => options.map((_, i) => ({
      x: (i % 2 === 0 ? 30 : 70) + ((i * 7) % 10 - 5),
      yBase: 75 - i * 18,
    })),
    [options]
  )

  const checkOverZone = useCallback((ref: React.RefObject<HTMLDivElement | null>, info: PanInfo) => {
    if (!ref.current) return false
    const rect = ref.current.getBoundingClientRect()
    return (
      info.point.x >= rect.left &&
      info.point.x <= rect.right &&
      info.point.y >= rect.top &&
      info.point.y <= rect.bottom
    )
  }, [])

  const handleDragStart = useCallback((option: string) => {
    setDraggingOption(option)
    if (navigator.vibrate) navigator.vibrate(20)
  }, [])

  const handleDrag = useCallback((_option: string, info: PanInfo) => {
    setIsOverJar(checkOverZone(jarRef, info))
  }, [checkOverZone])

  const handleDragEnd = useCallback((option: string, info: PanInfo) => {
    if (checkOverZone(jarRef, info)) {
      setInJar(prev => [...prev, option])
      if (navigator.vibrate) navigator.vibrate([30, 20, 50])
    }
    setDraggingOption(null)
    setIsOverJar(false)
  }, [checkOverZone])

  const handleRemove = useCallback((option: string) => {
    if (navigator.vibrate) navigator.vibrate(20)
    setInJar(prev => prev.filter(o => o !== option))
  }, [])

  const handleSubmit = useCallback(() => {
    if (inJar.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(inJar)
  }, [inJar, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <motion.p
        className="text-center mb-4 text-base font-bold text-violet-600 select-none"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        ↕ Drag items into the jar!
      </motion.p>

      {/* Jar visualization */}
      <motion.div
        ref={jarRef}
        className="relative mx-auto w-48 h-56 mb-5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Jar body */}
        <div className={`absolute bottom-0 left-4 right-4 h-44 rounded-b-3xl rounded-t-lg border-4 backdrop-blur-sm transition-all duration-200 ${
          isOverJar
            ? 'border-violet-500 bg-white/80 shadow-lg shadow-violet-200/50'
            : 'border-gray-300 bg-white/60'
        }`}>
          {/* Fill level */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-100 to-violet-50 rounded-b-3xl"
            animate={{ height: `${(inJar.length / options.length) * 80 + 10}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />

          {/* Drop hint when dragging */}
          {draggingOption && !inJar.includes(draggingOption) && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className={`text-sm font-medium ${isOverJar ? 'text-violet-500' : 'text-gray-400'}`}>
                {isOverJar ? 'Drop!' : '↓'}
              </span>
            </div>
          )}
        </div>

        {/* Items in jar — rendered as siblings (not inside overflow-hidden jar body) */}
        <div className="absolute bottom-0 left-4 right-4 h-44 pointer-events-none">
          <AnimatePresence>
            {inJar.map((option) => {
              const idx = options.indexOf(option)
              const orderInJar = inJar.indexOf(option)
              const color = itemColors[idx % itemColors.length]
              const pos = jarPositions[idx]

              return (
                <motion.div
                  key={option}
                  className={`absolute ${color.bg} rounded-full w-12 h-12 flex items-center justify-center shadow-md cursor-pointer pointer-events-auto`}
                  style={{ left: `${pos.x - 15}%` }}
                  initial={{ y: -100, opacity: 0 }}
                  animate={{
                    y: pos.yBase + (orderInJar * 2),
                    opacity: 1,
                  }}
                  exit={{ y: -60, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 18,
                    bounce: 0.4,
                  }}
                  onClick={() => handleRemove(option)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-white text-[9px] font-bold text-center leading-tight px-0.5">
                    {option.slice(0, 8)}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Jar lid */}
        <div className="absolute top-0 left-2 right-2 h-6 bg-gray-400 rounded-t-xl border-2 border-gray-500" />

        {/* Jar neck */}
        <div className="absolute top-5 left-6 right-6 h-4 bg-white/60 border-x-4 border-gray-300" />
      </motion.div>

      {/* Item buttons — drag source */}
      <div className="space-y-2.5">
        {options.map((option, index) => {
          const isInJar = inJar.includes(option)
          const color = itemColors[index % itemColors.length]
          const isDragging = draggingOption === option

          return (
            <motion.div
              key={option}
              className={`w-full rounded-xl p-3.5 font-semibold text-left border-2 touch-none select-none ${
                isInJar
                  ? 'bg-gray-100 border-gray-200 text-gray-400'
                  : 'bg-white border-gray-200 text-gray-700 cursor-grab active:cursor-grabbing hover:border-gray-400'
              } ${isDragging ? 'z-50' : ''}`}
              drag={!isInJar}
              dragSnapToOrigin
              dragElastic={0.1}
              onDragStart={() => !isInJar && handleDragStart(option)}
              onDrag={(_, info) => !isInJar && handleDrag(option, info)}
              onDragEnd={(_, info) => !isInJar && handleDragEnd(option, info)}
              whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{color.emoji}</span>
                  <span className={isInJar ? 'line-through' : ''}>{option}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {isInJar ? 'in jar ✓' : 'drag to jar ↑'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={inJar.length === 0}
        className={`w-full mt-5 py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          inJar.length > 0
            ? 'bg-violet-500 text-white hover:bg-violet-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={inJar.length > 0 ? { scale: 0.98 } : {}}
      >
        {inJar.length > 0 ? `🫙 Seal jar (${inJar.length})` : 'Drag items into the jar'}
      </motion.button>
    </div>
  )
}
