'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, animate } from 'framer-motion'
import { Question } from '@/lib/types'

interface TiltMazeQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

interface Hole {
  x: number
  y: number
  label: string
  radius: number
}

interface Position {
  x: number
  y: number
}

export function TiltMazeQuestion({ question, onAnswer }: TiltMazeQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 300, height: 400 })
  const [isDropping, setIsDropping] = useState(false)
  const [selectedHole, setSelectedHole] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(true)

  // Ball physics
  const ballX = useMotionValue(containerSize.width / 2)
  const ballY = useMotionValue(50)
  const velocityX = useRef(0)
  const velocityY = useRef(0)

  // Smooth spring for visual position
  const springX = useSpring(ballX, { stiffness: 300, damping: 30 })
  const springY = useSpring(ballY, { stiffness: 300, damping: 30 })

  // Tilt values (from device orientation or drag)
  const tiltX = useRef(0)
  const tiltY = useRef(0)

  const ballRadius = 18
  const holeRadius = 32
  const friction = 0.98
  const gravity = 0.5
  const maxVelocity = 12

  // Calculate hole positions based on options count
  const holes: Hole[] = options.map((label, index) => {
    const count = options.length
    const cols = count <= 2 ? count : count <= 4 ? 2 : 3
    const rows = Math.ceil(count / cols)
    const col = index % cols
    const row = Math.floor(index / cols)

    const xSpacing = containerSize.width / (cols + 1)
    const ySpacing = (containerSize.height - 120) / (rows + 1)

    return {
      x: xSpacing * (col + 1),
      y: 150 + ySpacing * (row + 1),
      label,
      radius: holeRadius,
    }
  })

  // Update container size
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
      ballX.set(rect.width / 2)
    }
  }, [ballX])

  // Hide hint after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Check if ball is in a hole
  const checkHoleCollision = useCallback((x: number, y: number): Hole | null => {
    for (const hole of holes) {
      const dx = x - hole.x
      const dy = y - hole.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < hole.radius - ballRadius / 2) {
        return hole
      }
    }
    return null
  }, [holes])

  // Physics update loop
  useEffect(() => {
    if (isDropping) return

    let animationId: number

    const updatePhysics = () => {
      // Apply tilt as acceleration
      velocityX.current += tiltX.current * gravity
      velocityY.current += tiltY.current * gravity

      // Apply friction
      velocityX.current *= friction
      velocityY.current *= friction

      // Clamp velocity
      velocityX.current = Math.max(-maxVelocity, Math.min(maxVelocity, velocityX.current))
      velocityY.current = Math.max(-maxVelocity, Math.min(maxVelocity, velocityY.current))

      // Update position
      let newX = ballX.get() + velocityX.current
      let newY = ballY.get() + velocityY.current

      // Bounce off walls
      if (newX < ballRadius) {
        newX = ballRadius
        velocityX.current = -velocityX.current * 0.6
      } else if (newX > containerSize.width - ballRadius) {
        newX = containerSize.width - ballRadius
        velocityX.current = -velocityX.current * 0.6
      }

      if (newY < ballRadius) {
        newY = ballRadius
        velocityY.current = -velocityY.current * 0.6
      } else if (newY > containerSize.height - ballRadius) {
        newY = containerSize.height - ballRadius
        velocityY.current = -velocityY.current * 0.6
      }

      ballX.set(newX)
      ballY.set(newY)

      // Check for hole collision
      const hole = checkHoleCollision(newX, newY)
      if (hole) {
        setIsDropping(true)
        setSelectedHole(hole.label)

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

        // Animate ball dropping into hole
        animate(ballX, hole.x, { duration: 0.3 })
        animate(ballY, hole.y, { duration: 0.3 })

        // Submit answer after animation
        setTimeout(() => {
          onAnswer(hole.label)
        }, 600)

        return
      }

      animationId = requestAnimationFrame(updatePhysics)
    }

    animationId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animationId)
  }, [ballX, ballY, containerSize, isDropping, checkHoleCollision, onAnswer])

  // Device orientation (mobile tilt)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
        // gamma is left-right tilt (-90 to 90)
        // beta is front-back tilt (-180 to 180)
        tiltX.current = (event.gamma / 90) * 2
        tiltY.current = Math.max(-1, Math.min(1, (event.beta - 30) / 45))
        setShowHint(false)
      }
    }

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      // We'll request on first interaction
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  // Mouse/touch drag for desktop
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDropping) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Calculate tilt based on pointer position relative to center
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const offsetX = (e.clientX - rect.left - centerX) / centerX
    const offsetY = (e.clientY - rect.top - centerY) / centerY

    tiltX.current = offsetX * 1.5
    tiltY.current = offsetY * 1.5
    setShowHint(false)
  }, [isDropping])

  const handlePointerLeave = useCallback(() => {
    // Gradually return to level
    tiltX.current *= 0.5
    tiltY.current *= 0.5
  }, [])

  // Request device orientation permission on touch
  const handleTouchStart = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
            if (event.gamma !== null && event.beta !== null) {
              tiltX.current = (event.gamma / 90) * 2
              tiltY.current = Math.max(-1, Math.min(1, (event.beta - 30) / 45))
            }
          })
        }
      } catch {
        // Fall back to touch drag
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Question text */}
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        Tilt to guide the ball into a hole
      </p>

      {/* Game board */}
      <motion.div
        ref={containerRef}
        className="relative w-full aspect-[3/4] bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl shadow-lg overflow-hidden border-4 border-amber-300"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Wood grain texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              rgba(139, 69, 19, 0.1) 20px,
              rgba(139, 69, 19, 0.1) 40px
            )`,
          }}
        />

        {/* Hint text */}
        {showHint && (
          <motion.div
            className="absolute top-4 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-amber-700 text-sm font-medium bg-white/80 px-3 py-1 rounded-full">
              Move cursor or tilt device
            </span>
          </motion.div>
        )}

        {/* Holes */}
        {holes.map((hole, index) => (
          <motion.div
            key={hole.label}
            className="absolute flex flex-col items-center"
            style={{
              left: hole.x,
              top: hole.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
          >
            {/* Hole shadow */}
            <div
              className={`rounded-full ${
                selectedHole === hole.label
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                  : 'bg-gray-800'
              }`}
              style={{
                width: hole.radius * 2,
                height: hole.radius * 2,
                boxShadow: selectedHole === hole.label
                  ? undefined
                  : 'inset 0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
            {/* Label */}
            <span className="mt-2 text-sm font-medium text-gray-700 text-center max-w-[80px] leading-tight">
              {hole.label}
            </span>
          </motion.div>
        ))}

        {/* Ball */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            x: springX,
            y: springY,
            width: ballRadius * 2,
            height: ballRadius * 2,
            marginLeft: -ballRadius,
            marginTop: -ballRadius,
          }}
          animate={isDropping ? { scale: [1, 0.8, 0], opacity: [1, 1, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {/* Ball gradient */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #e0e0e0, #888888)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
            }}
          />
          {/* Ball highlight */}
          <div
            className="absolute top-1 left-2 w-3 h-2 rounded-full bg-white opacity-60"
          />
        </motion.div>

        {/* Success overlay */}
        {selectedHole && (
          <motion.div
            className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white rounded-xl px-6 py-4 shadow-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <p className="text-emerald-600 font-bold text-lg">{selectedHole}</p>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {options.map((option, index) => (
          <motion.span
            key={option}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedHole === option
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            {option}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
