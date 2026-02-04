'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
}

type GamePhase = 'ready' | 'playing' | 'landed'

export function TiltMazeQuestion({ question, onAnswer }: TiltMazeQuestionProps) {
  const { options = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 300, height: 400 })
  const [gamePhase, setGamePhase] = useState<GamePhase>('ready')
  const [selectedHole, setSelectedHole] = useState<string | null>(null)
  const [hasMotionPermission, setHasMotionPermission] = useState<boolean | null>(null)
  const [debugTilt, setDebugTilt] = useState({ x: 0, y: 0 })

  // Ball position
  const ballX = useMotionValue(containerSize.width / 2)
  const ballY = useMotionValue(60)

  // Smooth spring for visual position
  const springX = useSpring(ballX, { stiffness: 200, damping: 25 })
  const springY = useSpring(ballY, { stiffness: 200, damping: 25 })

  // Physics refs
  const velocityX = useRef(0)
  const velocityY = useRef(0)
  const tiltX = useRef(0) // -1 to 1 (left to right)
  const tiltY = useRef(0) // -1 to 1 (forward to back)

  // Constants
  const ballRadius = 18
  const holeRadius = 42
  const boardPadding = 35
  const holeY = containerSize.height - 85

  // Calculate hole positions - spread across full width
  const holes: Hole[] = options.map((label, index) => {
    const usableWidth = containerSize.width - (boardPadding * 2) - (holeRadius * 2)
    const xPos = options.length === 1
      ? containerSize.width / 2
      : boardPadding + holeRadius + (usableWidth * index / (options.length - 1))

    return {
      x: xPos,
      y: holeY,
      label,
    }
  })

  // Channel dividers (vertical walls between holes)
  const channelDividers = options.length > 1
    ? Array.from({ length: options.length - 1 }, (_, i) => {
        const leftHole = holes[i]
        const rightHole = holes[i + 1]
        return (leftHole.x + rightHole.x) / 2
      })
    : []

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
        if (gamePhase === 'ready') {
          ballX.set(rect.width / 2)
          ballY.set(60)
        }
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [ballX, ballY, gamePhase])

  // Check if ball is in a hole
  const checkHoleCollision = useCallback((x: number, y: number): Hole | null => {
    for (const hole of holes) {
      const dx = x - hole.x
      const dy = y - hole.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < holeRadius + ballRadius / 2) {
        return hole
      }
    }
    return null
  }, [holes, holeRadius, ballRadius])

  // Device orientation handler
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.gamma !== null && event.beta !== null) {
      // gamma: -90 to 90 (left-right tilt)
      // beta: -180 to 180 (front-back tilt)

      // Normalize to -1 to 1 range with sensitivity adjustment
      // Clamp gamma to reasonable range for comfortable play
      const normalizedGamma = Math.max(-1, Math.min(1, event.gamma / 30))

      // For beta, we expect phone held at ~45-60 degree angle
      // So we center around 45 degrees and use a range
      const betaOffset = event.beta - 45
      const normalizedBeta = Math.max(-1, Math.min(1, betaOffset / 30))

      tiltX.current = normalizedGamma
      tiltY.current = normalizedBeta

      // Debug display
      setDebugTilt({ x: Math.round(normalizedGamma * 100), y: Math.round(normalizedBeta * 100) })
    }
  }, [])

  // Physics simulation
  useEffect(() => {
    if (gamePhase !== 'playing') return

    let animationId: number
    const gravity = 0.5 // How much tilt affects acceleration
    const friction = 0.96
    const bounceDamping = 0.4
    const maxSpeed = 12
    const attractionStrength = 0.4

    const updatePhysics = () => {
      let x = ballX.get()
      let y = ballY.get()

      // Apply tilt as acceleration (like gravity on a tilted surface)
      velocityX.current += tiltX.current * gravity
      velocityY.current += tiltY.current * gravity

      // Apply friction
      velocityX.current *= friction
      velocityY.current *= friction

      // Clamp velocity
      velocityX.current = Math.max(-maxSpeed, Math.min(maxSpeed, velocityX.current))
      velocityY.current = Math.max(-maxSpeed, Math.min(maxSpeed, velocityY.current))

      // Attraction toward nearby holes (helps ball land)
      for (const hole of holes) {
        const dx = hole.x - x
        const dy = hole.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < holeRadius * 2 && distance > 0) {
          const pullStrength = attractionStrength * (1 - distance / (holeRadius * 2))
          velocityX.current += (dx / distance) * pullStrength
          velocityY.current += (dy / distance) * pullStrength
        }
      }

      // Update position
      x += velocityX.current
      y += velocityY.current

      // Bounce off container walls
      if (x < ballRadius) {
        x = ballRadius
        velocityX.current = -velocityX.current * bounceDamping
      } else if (x > containerSize.width - ballRadius) {
        x = containerSize.width - ballRadius
        velocityX.current = -velocityX.current * bounceDamping
      }

      if (y < ballRadius) {
        y = ballRadius
        velocityY.current = -velocityY.current * bounceDamping
      } else if (y > containerSize.height - ballRadius) {
        y = containerSize.height - ballRadius
        velocityY.current = -velocityY.current * bounceDamping
      }

      // Bounce off channel dividers
      const dividerTop = 120
      const dividerBottom = holeY - holeRadius - 15

      for (const dividerX of channelDividers) {
        if (y > dividerTop && y < dividerBottom) {
          if (x + ballRadius > dividerX - 4 && x < dividerX && velocityX.current > 0) {
            x = dividerX - ballRadius - 4
            velocityX.current = -velocityX.current * bounceDamping
          } else if (x - ballRadius < dividerX + 4 && x > dividerX && velocityX.current < 0) {
            x = dividerX + ballRadius + 4
            velocityX.current = -velocityX.current * bounceDamping
          }
        }
      }

      ballX.set(x)
      ballY.set(y)

      // Check for hole collision
      const hole = checkHoleCollision(x, y)
      if (hole) {
        setSelectedHole(hole.label)
        setGamePhase('landed')

        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100])
        }

        animate(ballX, hole.x, { duration: 0.3, ease: 'easeOut' })
        animate(ballY, hole.y, { duration: 0.3, ease: 'easeOut' })
        return
      }

      animationId = requestAnimationFrame(updatePhysics)
    }

    animationId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animationId)
  }, [gamePhase, ballX, ballY, containerSize, holes, channelDividers, checkHoleCollision, holeRadius, holeY])

  // Start game and request motion permission
  const handleStart = async () => {
    // Request device orientation permission (required on iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        if (permission === 'granted') {
          setHasMotionPermission(true)
          window.addEventListener('deviceorientation', handleOrientation)
        } else {
          setHasMotionPermission(false)
        }
      } catch {
        setHasMotionPermission(false)
      }
    } else {
      // Non-iOS or older iOS - just add listener
      setHasMotionPermission(true)
      window.addEventListener('deviceorientation', handleOrientation)
    }

    setGamePhase('playing')
    velocityX.current = 0
    velocityY.current = 0
  }

  // Cleanup orientation listener
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [handleOrientation])

  // Fallback: Mouse/touch control for desktop or if motion permission denied
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (gamePhase !== 'playing' || hasMotionPermission === true) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const offsetX = (e.clientX - rect.left - centerX) / centerX
    const offsetY = (e.clientY - rect.top - centerY) / centerY

    tiltX.current = Math.max(-1, Math.min(1, offsetX * 1.5))
    tiltY.current = Math.max(-1, Math.min(1, offsetY * 1.5))
  }, [gamePhase, hasMotionPermission])

  const handlePointerLeave = useCallback(() => {
    if (hasMotionPermission !== true) {
      tiltX.current *= 0.5
      tiltY.current *= 0.5
    }
  }, [hasMotionPermission])

  const handleConfirm = () => {
    if (selectedHole) {
      onAnswer(selectedHole)
    }
  }

  const handleReset = () => {
    setSelectedHole(null)
    setGamePhase('playing')
    velocityX.current = 0
    velocityY.current = 0
    tiltX.current = 0
    tiltY.current = 0
    ballX.set(containerSize.width / 2)
    ballY.set(60)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-6">
      {/* Question text */}
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        {gamePhase === 'ready'
          ? 'Tap Start, then tilt your phone to roll the ball'
          : hasMotionPermission === false
          ? 'Move cursor to tilt the board'
          : 'Tilt your phone to guide the ball'}
      </p>

      {/* Game board */}
      <motion.div
        ref={containerRef}
        className="relative w-full max-w-sm aspect-[3/4] bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl shadow-lg overflow-hidden border-4 border-amber-400 touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          // Subtle 3D tilt effect to show the board responding to motion
          transform: gamePhase === 'playing'
            ? `perspective(500px) rotateX(${tiltY.current * -8}deg) rotateY(${tiltX.current * 8}deg)`
            : undefined,
          transition: 'transform 0.1s ease-out',
        }}
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

        {/* Channel dividers */}
        {channelDividers.map((dividerX, index) => (
          <div
            key={index}
            className="absolute bg-amber-700 rounded"
            style={{
              left: dividerX - 4,
              top: 120,
              width: 8,
              height: holeY - 120 - holeRadius - 15,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        ))}

        {/* Lane labels at top */}
        <div
          className="absolute top-4 left-0 right-0 flex justify-around px-3"
          style={{ pointerEvents: 'none' }}
        >
          {options.map((label, index) => (
            <div
              key={index}
              className="bg-white/90 px-2 py-1.5 rounded-lg shadow-sm text-center"
              style={{
                maxWidth: `${85 / options.length}%`,
                minWidth: '50px'
              }}
            >
              <span className="text-xs font-semibold text-gray-700 line-clamp-2">{label}</span>
            </div>
          ))}
        </div>

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
            <div
              className={`rounded-full flex items-center justify-center ${
                selectedHole === hole.label
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                  : 'bg-gray-900'
              }`}
              style={{
                width: holeRadius * 2,
                height: holeRadius * 2,
                boxShadow: selectedHole === hole.label
                  ? undefined
                  : 'inset 0 8px 16px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {selectedHole === hole.label && (
                <motion.span
                  className="text-white text-2xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </div>
          </motion.div>
        ))}

        {/* Ball */}
        {gamePhase !== 'ready' && (
          <motion.div
            className="absolute z-10 pointer-events-none"
            style={{
              x: springX,
              y: springY,
              width: ballRadius * 2,
              height: ballRadius * 2,
              marginLeft: -ballRadius,
              marginTop: -ballRadius,
            }}
            animate={gamePhase === 'landed' ? { scale: [1, 0.8, 0], opacity: [1, 1, 0] } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #c0c0c0, #404040)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(0,0,0,0.3)',
              }}
            />
            <div
              className="absolute top-1.5 left-2.5 w-3 h-2 rounded-full bg-white opacity-50"
            />
          </motion.div>
        )}

        {/* Tilt indicator (debug) - only show during play */}
        {gamePhase === 'playing' && hasMotionPermission === true && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Tilt: {debugTilt.x}%, {debugTilt.y}%
          </div>
        )}

        {/* Ready screen overlay */}
        {gamePhase === 'ready' && (
          <motion.div
            className="absolute inset-0 bg-black/30 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              className="bg-white rounded-2xl px-8 py-5 shadow-2xl text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
            >
              <motion.div
                className="text-5xl mb-3"
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  y: [0, -3, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📱
              </motion.div>
              <p className="text-lg font-bold text-gray-800">Tap to Start</p>
              <p className="text-sm text-gray-500 mt-1">Then tilt to roll the ball</p>
            </motion.button>
          </motion.div>
        )}

        {/* Motion permission denied fallback message */}
        {gamePhase === 'playing' && hasMotionPermission === false && (
          <motion.div
            className="absolute top-16 left-4 right-4 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2 text-center z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-amber-800 text-xs font-medium">
              Motion access denied. Move your cursor to control instead.
            </p>
          </motion.div>
        )}

        {/* Landed confirmation overlay */}
        {gamePhase === 'landed' && selectedHole && (
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
                🎯
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
