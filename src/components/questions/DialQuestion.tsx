'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Question } from '@/lib/types'

interface DialQuestionProps {
  question: Question
  onAnswer: (answer: number) => void
}

export function DialQuestion({ question, onAnswer }: DialQuestionProps) {
  const {
    min_label = 'Low',
    max_label = 'High',
  } = question.config as { min_label?: string; max_label?: string }

  const [value, setValue] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert value (0-100) to angle in degrees
  // Arc spans 270 degrees: from 135deg (bottom-left) to 405deg (bottom-right)
  const valueToAngle = (v: number) => 135 + (v / 100) * 270

  // Convert pointer position to value
  const pointerToValue = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = clientX - centerX
    const dy = clientY - centerY

    // atan2 returns angle from -PI to PI, with 0 = right
    let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)

    // Convert to our coordinate system where 135deg = 0%, 405deg = 100%
    // atan2: 0=right, 90=down, -90=up, 180/-180=left
    // Our system: 135=bottom-left, going clockwise to 405=bottom-right
    // Normalize to 0-360
    if (angleDeg < 0) angleDeg += 360

    // The gap is at the bottom (from ~45deg to ~135deg in standard coords)
    // In our arc: 135deg start = standard 135deg (bottom-left), 405deg end = standard 45deg (bottom-right)

    // Map standard angle to our value
    // standard 135 = value 0
    // standard 225 = value ~33 (left/top)
    // standard 315 = value ~67 (top/right)
    // standard 45 = value 100

    let mapped: number
    if (angleDeg >= 135) {
      // From 135 to 360 -> value 0 to ~83
      mapped = ((angleDeg - 135) / 270) * 100
    } else if (angleDeg <= 45) {
      // From 0 to 45 -> value ~83 to 100
      mapped = ((angleDeg + 360 - 135) / 270) * 100
    } else {
      // In the gap (45 to 135) -> clamp
      if (angleDeg <= 90) return 100
      return 0
    }

    return Math.max(0, Math.min(100, Math.round(mapped)))
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isSubmitted) return
    e.preventDefault()
    setIsDragging(true)
    const v = pointerToValue(e.clientX, e.clientY)
    if (v !== null) setValue(v)
  }, [isSubmitted, pointerToValue])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isSubmitted) return
    const v = pointerToValue(e.clientX, e.clientY)
    if (v !== null) setValue(v)
  }, [isDragging, isSubmitted, pointerToValue])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (isSubmitted) return
    setIsSubmitted(true)

    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 50])
    }

    setTimeout(() => {
      onAnswer(value)
    }, 600)
  }, [isSubmitted, value, onAnswer])

  // SVG arc calculations
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const radius = 95
  const knobRadius = 30

  // Create arc path
  const startAngle = 135 * (Math.PI / 180)
  const endAngle = (135 + 270) * (Math.PI / 180)
  const currentAngle = valueToAngle(value) * (Math.PI / 180)

  const arcPoint = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  })

  const start = arcPoint(startAngle, radius)
  const end = arcPoint(endAngle, radius)
  const current = arcPoint(currentAngle, radius)
  const knobPos = arcPoint(currentAngle, radius)

  // SVG arc path (background)
  const describeArc = (startA: number, endA: number) => {
    const s = arcPoint(startA, radius)
    const e = arcPoint(endA, radius)
    const largeArc = endA - startA > Math.PI ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  // Color based on value
  const getColor = () => {
    if (value >= 70) return { text: 'text-emerald-600', stroke: '#10b981' }
    if (value >= 40) return { text: 'text-amber-600', stroke: '#f59e0b' }
    return { text: 'text-rose-500', stroke: '#f43f5e' }
  }
  const color = getColor()

  // Tick marks
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const angle = (135 + i * 27) * (Math.PI / 180)
    const inner = arcPoint(angle, radius - 10)
    const outer = arcPoint(angle, radius + 5)
    return { inner, outer, major: i % 5 === 0 }
  })

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-2 text-sm">
        Drag around the dial to set your value
      </p>

      {/* Value display */}
      <motion.div className="text-center mb-2">
        <span className={`text-4xl font-bold ${color.text}`}>{value}%</span>
      </motion.div>

      {/* Dial SVG */}
      <motion.div
        ref={containerRef}
        className="relative mx-auto touch-none cursor-pointer"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <svg width={size} height={size}>
          {/* Background arc */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Value arc */}
          {value > 0 && (
            <path
              d={describeArc(startAngle, currentAngle)}
              fill="none"
              stroke={color.stroke}
              strokeWidth="12"
              strokeLinecap="round"
            />
          )}

          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.inner.x}
              y1={tick.inner.y}
              x2={tick.outer.x}
              y2={tick.outer.y}
              stroke={tick.major ? '#94a3b8' : '#cbd5e1'}
              strokeWidth={tick.major ? 2 : 1}
            />
          ))}

          {/* Start/end labels */}
          <text x={start.x - 15} y={start.y + 22} fontSize="11" fill="#94a3b8" textAnchor="middle">
            {min_label}
          </text>
          <text x={end.x + 15} y={end.y + 22} fontSize="11" fill="#94a3b8" textAnchor="middle">
            {max_label}
          </text>
        </svg>

        {/* Knob indicator */}
        <motion.div
          className={`absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
            isSubmitted ? 'bg-green-500' : 'bg-violet-500'
          }`}
          style={{
            left: knobPos.x - 28,
            top: knobPos.y - 28,
          }}
          animate={{ scale: isDragging ? 1.15 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="w-6 h-6 rounded-full bg-white/80" />
        </motion.div>
      </motion.div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitted}
        className={`
          w-full py-4 rounded-xl font-bold text-lg shadow-lg mt-2
          ${isSubmitted
            ? 'bg-green-500 text-white'
            : 'bg-violet-500 text-white hover:bg-violet-600'
          }
          transition-colors
        `}
        whileHover={!isSubmitted ? { scale: 1.02 } : {}}
        whileTap={!isSubmitted ? { scale: 0.98 } : {}}
      >
        {isSubmitted ? 'Locked in!' : 'Confirm'}
      </motion.button>
    </div>
  )
}
