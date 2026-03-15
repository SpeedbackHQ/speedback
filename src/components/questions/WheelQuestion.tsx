'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface WheelQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const segmentColors = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#10B981', // emerald
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#EF4444', // red
]

export function WheelQuestion({ question, onAnswer }: WheelQuestionProps) {
  const { options: rawOptions = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }
  const options = useMemo(() => rawOptions.slice(0, 6), [rawOptions])

  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const spinRef = useRef(false)

  const segmentAngle = 360 / options.length

  const handleSpin = useCallback(() => {
    if (isSpinning || result) return
    spinRef.current = true
    setIsSpinning(true)

    if (navigator.vibrate) navigator.vibrate(30)

    // Pick random landing: 3-5 full rotations + random segment offset
    const fullRotations = (3 + Math.floor(Math.random() * 3)) * 360
    const segmentOffset = Math.random() * 360
    const totalRotation = rotation + fullRotations + segmentOffset

    setRotation(totalRotation)

    // After spin completes (~3s), determine result
    setTimeout(() => {
      // The pointer is at top (0°). Figure out which segment is at the pointer.
      // The wheel rotated totalRotation degrees clockwise. The segment at the
      // top is at angle (360 - (totalRotation % 360)) % 360
      const normalizedAngle = ((360 - (totalRotation % 360)) % 360)
      const winningIndex = Math.floor(normalizedAngle / segmentAngle) % options.length

      setResult(options[winningIndex])
      setIsSpinning(false)
      spinRef.current = false

      if (navigator.vibrate) navigator.vibrate([50, 30, 100])
    }, 3200)
  }, [isSpinning, result, rotation, segmentAngle, options])

  const handleConfirm = useCallback(() => {
    if (result) {
      if (navigator.vibrate) navigator.vibrate(50)
      onAnswer(result)
    }
  }, [result, onAnswer])

  const handleRetry = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(30)
    setResult(null)
    setIsSpinning(false)
    // Keep current rotation as starting point for next spin
  }, [])

  // Build SVG segments
  const wheelSize = 260
  const center = wheelSize / 2
  const radius = wheelSize / 2 - 4

  const segments = useMemo(() => {
    return options.map((option, i) => {
      const startAngle = (i * segmentAngle - 90) * (Math.PI / 180)
      const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180)
      const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180)

      const x1 = center + radius * Math.cos(startAngle)
      const y1 = center + radius * Math.sin(startAngle)
      const x2 = center + radius * Math.cos(endAngle)
      const y2 = center + radius * Math.sin(endAngle)

      const largeArc = segmentAngle > 180 ? 1 : 0
      const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

      // Text position (2/3 out from center)
      const textRadius = radius * 0.6
      const textX = center + textRadius * Math.cos(midAngle)
      const textY = center + textRadius * Math.sin(midAngle)
      const textRotation = (i + 0.5) * segmentAngle

      return { option, path, textX, textY, textRotation, color: segmentColors[i % segmentColors.length] }
    })
  }, [options, segmentAngle, center, radius])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        {result ? `Landed on: ${result}` : 'Tap the wheel to spin!'}
      </p>

      {/* Wheel container */}
      <div className="relative flex flex-col items-center">
        {/* Pointer triangle at top */}
        <div className="relative z-10 -mb-2">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '20px solid #1F2937',
            }}
          />
        </div>

        {/* Spinning wheel */}
        <motion.div
          className="cursor-pointer select-none"
          onClick={handleSpin}
          animate={{ rotate: rotation }}
          transition={{
            duration: 3,
            ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for deceleration
          }}
          whileTap={!isSpinning && !result ? { scale: 0.97 } : {}}
        >
          <svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
            {/* Outer ring */}
            <circle cx={center} cy={center} r={radius + 2} fill="none" stroke="#374151" strokeWidth="3" />

            {/* Segments */}
            {segments.map(({ option, path, textX, textY, textRotation, color }) => (
              <g key={option}>
                <path d={path} fill={color} stroke="white" strokeWidth="2" />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize={options.length > 4 ? 11 : 13}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                >
                  {option.length > 12 ? option.slice(0, 11) + '…' : option}
                </text>
              </g>
            ))}

            {/* Center dot */}
            <circle cx={center} cy={center} r={14} fill="#1F2937" />
            <circle cx={center} cy={center} r={10} fill="#374151" />
          </svg>
        </motion.div>

        {/* Spin prompt */}
        {!isSpinning && !result && (
          <motion.p
            className="mt-4 text-gray-400 text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Tap to spin!
          </motion.p>
        )}

        {/* Spinning indicator */}
        {isSpinning && (
          <motion.p
            className="mt-4 text-violet-500 font-medium text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            Spinning...
          </motion.p>
        )}

        {/* Result with confirm/retry */}
        {result && !isSpinning && (
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="text-3xl mb-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              🎡
            </motion.div>
            <p className="text-lg font-bold text-gray-800 mb-1">{result}</p>

            <div className="flex gap-3 w-64 mx-auto mt-3">
              <motion.button
                onClick={handleRetry}
                className="flex-1 py-2 px-4 rounded-lg border-2 border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50"
                whileTap={{ scale: 0.95 }}
              >
                Spin Again
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 rounded-lg bg-violet-600 text-white font-medium text-sm hover:bg-violet-700"
                whileTap={{ scale: 0.95 }}
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
