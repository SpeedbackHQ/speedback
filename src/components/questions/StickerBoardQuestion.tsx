'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Question } from '@/lib/types'

interface StickerBoardQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const stickerStyles = [
  { bg: 'bg-purple-400', emoji: '💜' },
  { bg: 'bg-pink-400', emoji: '💗' },
  { bg: 'bg-cyan-400', emoji: '💎' },
  { bg: 'bg-amber-400', emoji: '⭐' },
]

export function StickerBoardQuestion({ question, onAnswer }: StickerBoardQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4)

  const [placed, setPlaced] = useState<string[]>([])
  const [draggingOption, setDraggingOption] = useState<string | null>(null)
  const [isOverBoard, setIsOverBoard] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  // Stable random rotations per option
  const rotations = useMemo(
    () => options.map((_, i) => (i * 7 + 3) % 15 - 7),
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
    setIsOverBoard(checkOverZone(boardRef, info))
  }, [checkOverZone])

  const handleDragEnd = useCallback((option: string, info: PanInfo) => {
    if (checkOverZone(boardRef, info)) {
      setPlaced(prev => [...prev, option])
      if (navigator.vibrate) navigator.vibrate(30)
    }
    setDraggingOption(null)
    setIsOverBoard(false)
  }, [checkOverZone])

  const handleRemove = useCallback((option: string) => {
    if (navigator.vibrate) navigator.vibrate(20)
    setPlaced(prev => prev.filter(o => o !== option))
  }, [])

  const handleSubmit = useCallback(() => {
    if (placed.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(placed)
  }, [placed, onAnswer])

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
        Drag stickers to the board!
      </p>

      {/* Board area — drop target */}
      <motion.div
        ref={boardRef}
        className={`relative rounded-2xl min-h-[100px] mb-4 p-3 flex flex-wrap gap-2 items-center justify-center border-2 transition-all duration-200 ${
          isOverBoard
            ? 'border-amber-500 bg-amber-100 shadow-lg shadow-amber-200/50 scale-[1.02]'
            : 'border-dashed border-amber-300 bg-amber-50'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {placed.length === 0 ? (
          <span className={`text-sm ${isOverBoard ? 'text-amber-600 font-medium' : 'text-amber-400'}`}>
            {isOverBoard ? 'Drop here!' : draggingOption ? '↓ Drop sticker here ↓' : 'Drag stickers here'}
          </span>
        ) : (
          <AnimatePresence>
            {placed.map((option) => {
              const idx = options.indexOf(option)
              const style = stickerStyles[idx % stickerStyles.length]
              const rotation = rotations[idx]

              return (
                <motion.div
                  key={option}
                  className={`${style.bg} text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-md cursor-pointer hover:shadow-lg`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                  initial={{ scale: 0, y: 40, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => handleRemove(option)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {style.emoji} {option} ✕
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Sticker sheet — drag source */}
      <div className="space-y-2.5">
        {options.map((option, index) => {
          const isPlaced = placed.includes(option)
          const style = stickerStyles[index % stickerStyles.length]
          const isDragging = draggingOption === option

          return (
            <motion.div
              key={option}
              className={`w-full rounded-xl p-3.5 font-semibold text-left border-2 touch-none select-none ${
                isPlaced
                  ? 'bg-gray-100 border-gray-200 text-gray-400'
                  : `bg-white border-gray-200 text-gray-700 cursor-grab active:cursor-grabbing hover:border-gray-400`
              } ${isDragging ? 'z-50' : ''}`}
              drag={!isPlaced}
              dragSnapToOrigin
              dragElastic={0.1}
              onDragStart={() => !isPlaced && handleDragStart(option)}
              onDrag={(_, info) => !isPlaced && handleDrag(option, info)}
              onDragEnd={(_, info) => !isPlaced && handleDragEnd(option, info)}
              whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
              initial={{ opacity: 0, x: -15 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: isPlaced ? 0.97 : 1,
              }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.emoji}</span>
                  <span className={isPlaced ? 'line-through' : ''}>{option}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {isPlaced ? 'placed ✓' : 'drag to board ↑'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={placed.length === 0}
        className={`w-full mt-5 py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          placed.length > 0
            ? 'bg-violet-500 text-white hover:bg-violet-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={placed.length > 0 ? { scale: 0.98 } : {}}
      >
        {placed.length > 0 ? `🏷️ Done! (${placed.length})` : 'Drag stickers to select'}
      </motion.button>
    </div>
  )
}
