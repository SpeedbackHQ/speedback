'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface TapQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

interface Particle {
  id: number
  x: number
  y: number
  angle: number
  color: string
}

const optionColors = [
  { bg: 'bg-purple-50', border: 'border-purple-200', selectedBg: 'bg-purple-500', text: 'text-purple-700', selectedText: 'text-white', glowColor: 'rgba(168, 85, 247, 0.6)', particleColor: '#a855f7' },
  { bg: 'bg-pink-50', border: 'border-pink-200', selectedBg: 'bg-pink-500', text: 'text-pink-700', selectedText: 'text-white', glowColor: 'rgba(236, 72, 153, 0.6)', particleColor: '#ec4899' },
  { bg: 'bg-blue-50', border: 'border-blue-200', selectedBg: 'bg-blue-500', text: 'text-blue-700', selectedText: 'text-white', glowColor: 'rgba(59, 130, 246, 0.6)', particleColor: '#3b82f6' },
  { bg: 'bg-green-50', border: 'border-green-200', selectedBg: 'bg-green-500', text: 'text-green-700', selectedText: 'text-white', glowColor: 'rgba(34, 197, 94, 0.6)', particleColor: '#22c55e' },
  { bg: 'bg-orange-50', border: 'border-orange-200', selectedBg: 'bg-orange-500', text: 'text-orange-700', selectedText: 'text-white', glowColor: 'rgba(249, 115, 22, 0.6)', particleColor: '#f97316' },
  { bg: 'bg-teal-50', border: 'border-teal-200', selectedBg: 'bg-teal-500', text: 'text-teal-700', selectedText: 'text-white', glowColor: 'rgba(20, 184, 166, 0.6)', particleColor: '#14b8a6' },
]

export function TapQuestion({ question, onAnswer }: TapQuestionProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [justSelected, setJustSelected] = useState<string | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const { options: rawOptions = [], multi_select = true } = question.config
  const options = (rawOptions as string[]).slice(0, 4)  // Cap at 4 options max

  const handleTap = (option: string, event: React.MouseEvent<HTMLButtonElement>, colorIndex: number) => {
    const colors = optionColors[colorIndex % optionColors.length]
    const isCurrentlySelected = selected.includes(option)
    // eslint-disable-next-line react-hooks/purity -- Date.now() is valid in event handlers
    const now = Date.now()

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(isCurrentlySelected ? 20 : 40)
    }

    if (!isCurrentlySelected) {
      // Get click position relative to button for particle origin
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Spawn particles
      const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
        id: now + i,
        x,
        y,
        angle: (i / 12) * 360,
        color: colors.particleColor,
      }))
      setParticles(prev => [...prev, ...newParticles])

      // Clean up particles after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id < now || p.id > now + 11))
      }, 600)

      // Trigger selection animation
      setJustSelected(option)
      setTimeout(() => setJustSelected(null), 500)
    }

    if (multi_select) {
      if (isCurrentlySelected) {
        setSelected(prev => prev.filter(o => o !== option))
      } else {
        setSelected(prev => [...prev, option])
      }
    } else {
      setSelected([option])
    }
  }

  const handleSubmit = () => {
    if (selected.length === 0) return
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 100])
    }
    onAnswer(selected)
  }

  return (
    <div className="w-full max-w-md mx-auto px-4" ref={containerRef}>
      {/* Question text */}
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-6">
        {multi_select ? 'Tap all that apply' : 'Tap to select'}
      </p>

      {/* Vertical stack of options */}
      <div className="flex flex-col gap-3 relative">
        <AnimatePresence>
          {(options as string[]).map((option, index) => {
            const isSelected = selected.includes(option)
            const isJustSelected = justSelected === option
            const colors = optionColors[index % optionColors.length]

            return (
              <motion.button
                key={option}
                onClick={(e) => handleTap(option, e, index)}
                className={`
                  relative w-full py-4 px-6 rounded-xl font-semibold text-left
                  border-2 overflow-hidden
                  ${isSelected
                    ? `${colors.selectedBg} ${colors.selectedText} border-transparent`
                    : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-md`
                  }
                `}
                style={isSelected ? {
                  boxShadow: `0 12px 30px -5px ${colors.glowColor}, 0 10px 15px -6px ${colors.glowColor}`,
                  filter: 'brightness(1.05)',
                } : undefined}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: isSelected ? -8 : 0,
                  scale: isSelected ? 1.03 : 1,
                }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                  type: 'spring',
                  stiffness: 600,
                  damping: 22,
                  delay: index * 0.05,
                }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.92 }}
              >
                {/* Pulse/glow effect on selection */}
                {isJustSelected && (
                  <>
                    {/* White flash */}
                    <motion.div
                      className="absolute inset-0 bg-white rounded-xl"
                      initial={{ opacity: 0.7, scale: 0.95 }}
                      animate={{ opacity: 0, scale: 1.15 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    {/* Colored glow burst */}
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{ boxShadow: `0 0 40px 15px ${colors.glowColor}` }}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    {/* Ring expansion */}
                    <motion.div
                      className="absolute inset-0 rounded-xl border-4"
                      style={{ borderColor: colors.particleColor }}
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.3 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </>
                )}

                {/* Particles */}
                {particles
                  .filter(p => p.color === colors.particleColor)
                  .map(particle => (
                    <motion.div
                      key={particle.id}
                      className="absolute w-3 h-3 rounded-full pointer-events-none"
                      style={{
                        left: particle.x,
                        top: particle.y,
                        backgroundColor: particle.color,
                      }}
                      initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                      animate={{
                        x: Math.cos((particle.angle * Math.PI) / 180) * 70,
                        y: Math.sin((particle.angle * Math.PI) / 180) * 70,
                        scale: 0,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  ))}

                <div className="flex items-center justify-between relative z-10">
                  <motion.span
                    className="text-lg"
                    animate={{ scale: isSelected ? 1.03 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {option}
                  </motion.span>

                  {/* Selection indicator */}
                  <motion.div
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center
                      ${isSelected
                        ? 'bg-white/30'
                        : `border-2 ${colors.border}`
                      }
                    `}
                    animate={{
                      scale: isSelected ? 1.15 : 1,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{
                            type: 'spring',
                            stiffness: 600,
                            damping: 12,
                          }}
                          className="text-white text-sm font-bold"
                        >
                          ✓
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Selected count */}
      {multi_select && selected.length > 0 && (
        <motion.p
          className="text-center text-gray-500 mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={selected.length}
        >
          <motion.span
            key={selected.length}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="inline-block font-bold text-indigo-600"
          >
            {selected.length}
          </motion.span>
          {' '}selected
        </motion.p>
      )}

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className={`
          w-full mt-6 py-4 font-bold text-lg rounded-xl shadow-lg
          transition-colors duration-200
          ${selected.length > 0
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        animate={{
          scale: selected.length > 0 ? 1 : 0.98,
        }}
        whileHover={selected.length > 0 ? { scale: 1.02 } : {}}
        whileTap={selected.length > 0 ? { scale: 0.98 } : {}}
      >
        {selected.length > 0 ? 'Done!' : 'Tap to select'}
      </motion.button>
    </div>
  )
}
