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

interface Wall {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function TiltMazeQuestion({ question, onAnswer }: TiltMazeQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 300, height: 400 })
  const [selectedHole, setSelectedHole] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHint, setShowHint] = useState(true)

  // Ball physics
  const ballX = useMotionValue(containerSize.width / 2)
  const ballY = useMotionValue(40)
  const velocityX = useRef(0)
  const velocityY = useRef(0)

  // Smooth spring for visual position
  const springX = useSpring(ballX, { stiffness: 400, damping: 35 })
  const springY = useSpring(ballY, { stiffness: 400, damping: 35 })

  // Tilt values (from device orientation or drag)
  const tiltX = useRef(0)
  const tiltY = useRef(0)

  const ballRadius = 14
  const holeRadius = 32 // Larger holes for easier landing
  const friction = 0.96
  const gravity = 0.35
  const maxVelocity = 8

  // Calculate hole positions based on options count (bottom area of board)
  const holes: Hole[] = options.map((label, index) => {
    const count = options.length
    const xSpacing = containerSize.width / (count + 1)

    return {
      x: xSpacing * (index + 1),
      y: containerSize.height - 70,
      label,
      radius: holeRadius,
    }
  })

  // Create funnel/channel walls that guide ball toward holes
  const walls: Wall[] = []
  const wallThickness = 6

  // Add horizontal rails at different heights that create a pachinko effect
  const railY1 = 90
  const railY2 = 160
  const railY3 = 230
  const gapWidth = 50

  // Row 1 - Two gaps
  walls.push({ x1: 0, y1: railY1, x2: containerSize.width * 0.3, y2: railY1 })
  walls.push({ x1: containerSize.width * 0.3 + gapWidth, y1: railY1, x2: containerSize.width * 0.7 - gapWidth, y2: railY1 })
  walls.push({ x1: containerSize.width * 0.7, y1: railY1, x2: containerSize.width, y2: railY1 })

  // Row 2 - Offset gaps
  walls.push({ x1: 0, y1: railY2, x2: containerSize.width * 0.15, y2: railY2 })
  walls.push({ x1: containerSize.width * 0.15 + gapWidth, y1: railY2, x2: containerSize.width * 0.5 - gapWidth / 2, y2: railY2 })
  walls.push({ x1: containerSize.width * 0.5 + gapWidth / 2, y1: railY2, x2: containerSize.width * 0.85 - gapWidth, y2: railY2 })
  walls.push({ x1: containerSize.width * 0.85, y1: railY2, x2: containerSize.width, y2: railY2 })

  // Row 3 - Guide toward holes
  walls.push({ x1: 0, y1: railY3, x2: containerSize.width * 0.2, y2: railY3 })
  walls.push({ x1: containerSize.width * 0.2 + gapWidth, y1: railY3, x2: containerSize.width * 0.8 - gapWidth, y2: railY3 })
  walls.push({ x1: containerSize.width * 0.8, y1: railY3, x2: containerSize.width, y2: railY3 })

  // Vertical dividers between holes (if 2+ options)
  if (options.length >= 2) {
    for (let i = 1; i < options.length; i++) {
      const dividerX = containerSize.width / (options.length + 1) * (i + 0.5)
      walls.push({ x1: dividerX, y1: railY3 + 30, x2: dividerX, y2: containerSize.height - holeRadius - 50 })
    }
  }

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
    const timer = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  // Check collision with walls
  const checkWallCollision = useCallback((x: number, y: number, vx: number, vy: number): { x: number; y: number; vx: number; vy: number } => {
    let newX = x
    let newY = y
    let newVx = vx
    let newVy = vy

    for (const wall of walls) {
      const isHorizontal = Math.abs(wall.y1 - wall.y2) < 2
      const isVertical = Math.abs(wall.x1 - wall.x2) < 2

      if (isHorizontal) {
        const wallY = wall.y1
        const minX = Math.min(wall.x1, wall.x2)
        const maxX = Math.max(wall.x1, wall.x2)

        // Check if ball is within wall's horizontal range
        if (x >= minX - ballRadius && x <= maxX + ballRadius) {
          // Ball hitting from above
          if (y + ballRadius > wallY - 4 && y + ballRadius < wallY + 12 && vy > 0) {
            newY = wallY - ballRadius - 4
            newVy = -vy * 0.4
          }
          // Ball hitting from below
          else if (y - ballRadius < wallY + 4 && y - ballRadius > wallY - 12 && vy < 0) {
            newY = wallY + ballRadius + 4
            newVy = -vy * 0.4
          }
        }
      }

      if (isVertical) {
        const wallX = wall.x1
        const minY = Math.min(wall.y1, wall.y2)
        const maxY = Math.max(wall.y1, wall.y2)

        // Check if ball is within wall's vertical range
        if (y >= minY - ballRadius && y <= maxY + ballRadius) {
          // Ball hitting from left
          if (x + ballRadius > wallX - 4 && x + ballRadius < wallX + 12 && vx > 0) {
            newX = wallX - ballRadius - 4
            newVx = -vx * 0.4
          }
          // Ball hitting from right
          else if (x - ballRadius < wallX + 4 && x - ballRadius > wallX - 12 && vx < 0) {
            newX = wallX + ballRadius + 4
            newVx = -vx * 0.4
          }
        }
      }
    }

    return { x: newX, y: newY, vx: newVx, vy: newVy }
  }, [walls, ballRadius])

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
  }, [holes, ballRadius])

  // Physics update loop
  useEffect(() => {
    if (showConfirm) return

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

      // Check wall collisions
      const wallResult = checkWallCollision(newX, newY, velocityX.current, velocityY.current)
      newX = wallResult.x
      newY = wallResult.y
      velocityX.current = wallResult.vx
      velocityY.current = wallResult.vy

      // Bounce off container walls
      if (newX < ballRadius) {
        newX = ballRadius
        velocityX.current = -velocityX.current * 0.4
      } else if (newX > containerSize.width - ballRadius) {
        newX = containerSize.width - ballRadius
        velocityX.current = -velocityX.current * 0.4
      }

      if (newY < ballRadius) {
        newY = ballRadius
        velocityY.current = -velocityY.current * 0.4
      } else if (newY > containerSize.height - ballRadius) {
        newY = containerSize.height - ballRadius
        velocityY.current = -velocityY.current * 0.4
      }

      ballX.set(newX)
      ballY.set(newY)

      // Check for hole collision
      const hole = checkHoleCollision(newX, newY)
      if (hole) {
        setSelectedHole(hole.label)
        setShowConfirm(true)

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

        // Animate ball dropping into hole
        animate(ballX, hole.x, { duration: 0.3 })
        animate(ballY, hole.y, { duration: 0.3 })

        return
      }

      animationId = requestAnimationFrame(updatePhysics)
    }

    animationId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animationId)
  }, [ballX, ballY, containerSize, showConfirm, checkHoleCollision, checkWallCollision, friction, gravity, maxVelocity, ballRadius])

  // Device orientation (mobile tilt)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
        tiltX.current = (event.gamma / 90) * 2.5
        tiltY.current = Math.max(-1, Math.min(1, (event.beta - 30) / 40))
        setShowHint(false)
      }
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      // iOS - will request on first touch
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  // Mouse/touch drag for desktop
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (showConfirm) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const offsetX = (e.clientX - rect.left - centerX) / centerX
    const offsetY = (e.clientY - rect.top - centerY) / centerY

    tiltX.current = offsetX * 2
    tiltY.current = offsetY * 2
    setShowHint(false)
  }, [showConfirm])

  const handlePointerLeave = useCallback(() => {
    tiltX.current *= 0.3
    tiltY.current *= 0.3
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
              tiltX.current = (event.gamma / 90) * 2.5
              tiltY.current = Math.max(-1, Math.min(1, (event.beta - 30) / 40))
            }
          })
        }
      } catch {
        // Fall back to touch drag
      }
    }
  }

  const handleConfirm = () => {
    if (selectedHole) {
      onAnswer(selectedHole)
    }
  }

  const handleReset = () => {
    setSelectedHole(null)
    setShowConfirm(false)
    velocityX.current = 0
    velocityY.current = 0
    ballX.set(containerSize.width / 2)
    ballY.set(40)
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
        className="relative w-full aspect-[3/4] bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl shadow-lg overflow-hidden border-4 border-amber-400"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Wood grain texture */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 30px,
              rgba(139, 69, 19, 0.15) 30px,
              rgba(139, 69, 19, 0.15) 60px
            )`,
          }}
        />

        {/* Hint text */}
        {showHint && !showConfirm && (
          <motion.div
            className="absolute top-6 left-0 right-0 text-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-amber-800 text-sm font-medium bg-white/90 px-4 py-2 rounded-full shadow">
              📱 Tilt device or move cursor
            </span>
          </motion.div>
        )}

        {/* Rails/Walls */}
        {walls.map((wall, index) => {
          const isHorizontal = Math.abs(wall.y1 - wall.y2) < 2
          return (
            <div
              key={index}
              className="absolute bg-amber-700 rounded-sm"
              style={{
                left: Math.min(wall.x1, wall.x2),
                top: Math.min(wall.y1, wall.y2) - (isHorizontal ? 3 : 0),
                width: isHorizontal ? Math.abs(wall.x2 - wall.x1) : wallThickness,
                height: isHorizontal ? wallThickness : Math.abs(wall.y2 - wall.y1),
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          )
        })}

        {/* Holes */}
        {holes.map((hole, index) => (
          <motion.div
            key={hole.label}
            className="absolute"
            style={{
              left: hole.x,
              top: hole.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
          >
            {/* Hole */}
            <div
              className={`rounded-full flex items-center justify-center ${
                selectedHole === hole.label
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                  : 'bg-gray-900'
              }`}
              style={{
                width: hole.radius * 2,
                height: hole.radius * 2,
                boxShadow: selectedHole === hole.label
                  ? undefined
                  : 'inset 0 6px 12px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {/* Label inside hole */}
              <span className={`text-[10px] font-bold text-center px-1 leading-tight ${
                selectedHole === hole.label ? 'text-white' : 'text-gray-400'
              }`} style={{ maxWidth: hole.radius * 1.8 }}>
                {hole.label}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Ball */}
        <motion.div
          className="absolute pointer-events-none z-10"
          style={{
            x: springX,
            y: springY,
            width: ballRadius * 2,
            height: ballRadius * 2,
            marginLeft: -ballRadius,
            marginTop: -ballRadius,
          }}
          animate={showConfirm ? { scale: [1, 0.7, 0], opacity: [1, 1, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #f5f5f5, #777777)',
              boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)',
            }}
          />
          <div
            className="absolute top-0.5 left-1.5 w-2 h-1.5 rounded-full bg-white opacity-70"
          />
        </motion.div>

        {/* Confirm/Reset overlay */}
        {showConfirm && selectedHole && (
          <motion.div
            className="absolute inset-0 bg-black/40 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white rounded-2xl px-6 py-5 shadow-2xl text-center mx-4"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <motion.div
                className="text-4xl mb-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                🎱
              </motion.div>
              <p className="text-lg font-bold text-gray-800 mb-1">{selectedHole}</p>
              <p className="text-sm text-gray-500 mb-4">Is this your answer?</p>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
