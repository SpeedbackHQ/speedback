'use client'
/* eslint-disable react-hooks/preserve-manual-memoization -- Complex animation callbacks with valid dependencies */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface SlingshotQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

const targetColors = [
  { bg: 'bg-red-500', ring: 'ring-red-300', glow: 'shadow-red-500/50' },
  { bg: 'bg-blue-500', ring: 'ring-blue-300', glow: 'shadow-blue-500/50' },
  { bg: 'bg-green-500', ring: 'ring-green-300', glow: 'shadow-green-500/50' },
  { bg: 'bg-purple-500', ring: 'ring-purple-300', glow: 'shadow-purple-500/50' },
  { bg: 'bg-orange-500', ring: 'ring-orange-300', glow: 'shadow-orange-500/50' },
]

export function SlingshotQuestion({ question, onAnswer }: SlingshotQuestionProps) {
  const { options: rawOptions = ['Option 1', 'Option 2', 'Option 3'] } = question.config as { options?: string[] }
  const options = rawOptions.slice(0, 4)  // Cap at 4 options max

  const [pullback, setPullback] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isLaunched, setIsLaunched] = useState(false)
  const [projectilePos, setProjectilePos] = useState({ x: 50, y: 85 })
  const [hitTarget, setHitTarget] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const launchOrigin = { x: 50, y: 85 }

  // Dynamic sizing based on option count (max 4 options)
  const targetSizeClass = options.length <= 3 ? 'w-14 h-14' : 'w-12 h-12'
  const labelMaxWidth = options.length <= 3 ? 'max-w-20' : 'max-w-16'
  const hitRadius = options.length <= 3 ? 12 : 10

  // All targets in a single row across the top
  const targets = options.map((label, i) => {
    const count = options.length
    const totalWidth = count <= 3 ? 60 : 70
    const xSpacing = count > 1 ? totalWidth / (count - 1) : 0
    const xOffset = count > 1 ? (100 - totalWidth) / 2 : 50

    return {
      label,
      x: count > 1 ? xOffset + i * xSpacing : 50,
      y: 18,  // Below rounded corners
      color: targetColors[i % targetColors.length],
    }
  })

  const handlePointerDown = useCallback(() => {
    if (isLaunched) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
  }, [isLaunched])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isLaunched) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Limit pullback distance
    const dx = x - launchOrigin.x
    const dy = y - launchOrigin.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxPull = 30

    if (distance > maxPull) {
      const angle = Math.atan2(dy, dx)
      setPullback({
        x: Math.cos(angle) * maxPull,
        y: Math.sin(angle) * maxPull,
      })
    } else {
      setPullback({ x: dx, y: dy })
    }
  }, [isDragging, isLaunched])

  const handlePointerUp = useCallback(() => {
    if (!isDragging || isLaunched) return
    setIsDragging(false)

    // Only launch if pulled back enough
    const pullDistance = Math.sqrt(pullback.x * pullback.x + pullback.y * pullback.y)
    if (pullDistance < 10) {
      setPullback({ x: 0, y: 0 })
      return
    }

    setIsLaunched(true)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    // Calculate launch direction (opposite of pullback)
    const launchAngle = Math.atan2(-pullback.y, -pullback.x)
    const launchDirX = Math.cos(launchAngle)
    const launchDirY = Math.sin(launchAngle)

    // Find the best target along the launch trajectory
    // Score each target by how close it is to the aim line
    let bestTarget: typeof targets[0] | null = null
    let bestScore = Infinity

    for (const target of targets) {
      const toTargetX = target.x - launchOrigin.x
      const toTargetY = target.y - launchOrigin.y

      // Dot product: how far along the launch direction is the target
      const dot = toTargetX * launchDirX + toTargetY * launchDirY
      if (dot <= 0) continue // target is behind the launch direction

      // Perpendicular distance from the aim line
      const perpDist = Math.abs(toTargetX * launchDirY - toTargetY * launchDirX)

      // Must be within reasonable aim (hitRadius * 2 for generous aiming)
      if (perpDist < hitRadius * 2 && perpDist < bestScore) {
        bestScore = perpDist
        bestTarget = target
      }
    }

    // Animate projectile toward the target (or fly off if no hit)
    const targetX = bestTarget ? bestTarget.x : launchOrigin.x + launchDirX * 120
    const targetY = bestTarget ? bestTarget.y : launchOrigin.y + launchDirY * 120
    const totalDist = Math.sqrt(
      (targetX - launchOrigin.x) ** 2 + (targetY - launchOrigin.y) ** 2
    )
    const speed = 4 // units per frame (consistent regardless of pull strength)
    const totalFrames = Math.max(8, Math.round(totalDist / speed))
    let frame = 0

    const animateProjectile = () => {
      frame++
      const t = Math.min(1, frame / totalFrames)
      // Ease out for satisfying deceleration
      const eased = 1 - (1 - t) * (1 - t)

      const currentX = launchOrigin.x + (targetX - launchOrigin.x) * eased
      const currentY = launchOrigin.y + (targetY - launchOrigin.y) * eased
      setProjectilePos({ x: currentX, y: currentY })

      if (t >= 1) {
        if (bestTarget) {
          // Hit!
          setHitTarget(bestTarget.label)
          setShowResult(true)

          if (navigator.vibrate) {
            navigator.vibrate([50, 30, 100])
          }

          setTimeout(() => {
            onAnswer(bestTarget.label)
          }, 1200)
        } else {
          // Missed - reset
          setTimeout(() => {
            setIsLaunched(false)
            setPullback({ x: 0, y: 0 })
            setProjectilePos({ x: 50, y: 85 })
          }, 300)
        }
        return
      }

      requestAnimationFrame(animateProjectile)
    }

    requestAnimationFrame(animateProjectile)
  }, [isDragging, isLaunched, pullback, targets, onAnswer])

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
        Pull back and aim at your answer!
      </p>

      {/* Game area */}
      <motion.div
        ref={containerRef}
        className="relative w-full aspect-[3/4] bg-gradient-to-b from-sky-200 to-green-100 rounded-2xl overflow-hidden shadow-lg touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Targets */}
        {targets.map((target, index) => {
          const isHit = hitTarget === target.label

          return (
            <motion.div
              key={target.label}
              className="absolute flex flex-col items-center"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                transform: 'translateX(-50%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: isHit ? 1.3 : 1 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
            >
              {/* Target board */}
              <div
                className={`${targetSizeClass} rounded-lg ${target.color.bg} ${
                  isHit ? `shadow-xl ${target.color.glow} ring-4 ${target.color.ring}` : 'shadow-md'
                } flex items-center justify-center`}
              >
                {isHit && (
                  <motion.div
                    className="text-2xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    💥
                  </motion.div>
                )}
              </div>
              <span className={`mt-1 text-xs font-medium text-gray-700 bg-white/80 px-2 py-0.5 rounded text-center ${labelMaxWidth} leading-tight`}>
                {target.label}
              </span>
            </motion.div>
          )
        })}

        {/* Slingshot */}
        <div
          className="absolute"
          style={{
            left: `${launchOrigin.x}%`,
            top: `${launchOrigin.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Left arm */}
          <div className="absolute -left-8 -top-16 w-3 h-20 bg-amber-800 rounded-full origin-bottom rotate-[-15deg]" />
          {/* Right arm */}
          <div className="absolute -right-8 -top-16 w-3 h-20 bg-amber-800 rounded-full origin-bottom rotate-[15deg]" />
          {/* Base */}
          <div className="absolute -left-4 -top-4 w-8 h-8 bg-amber-700 rounded" />

          {/* Elastic bands */}
          {isDragging && (
            <>
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: -60,
                  top: -70,
                  width: 120,
                  height: 100,
                }}
              >
                {/* Left band */}
                <line
                  x1={15}
                  y1={10}
                  x2={60 + pullback.x}
                  y2={70 + pullback.y}
                  stroke="#8B4513"
                  strokeWidth={4}
                />
                {/* Right band */}
                <line
                  x1={105}
                  y1={10}
                  x2={60 + pullback.x}
                  y2={70 + pullback.y}
                  stroke="#8B4513"
                  strokeWidth={4}
                />
              </svg>
            </>
          )}
        </div>

        {/* Projectile (rock) */}
        <motion.div
          className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg"
          style={{
            left: `${isLaunched ? projectilePos.x : launchOrigin.x + pullback.x}%`,
            top: `${isLaunched ? projectilePos.y : launchOrigin.y + pullback.y}%`,
            marginLeft: -16,
            marginTop: -16,
          }}
          animate={isDragging ? { scale: 1.1 } : {}}
        >
          <div className="absolute top-1 left-2 w-2 h-1.5 rounded-full bg-white/50" />
        </motion.div>

        {/* Aim guide */}
        {isDragging && pullback.y !== 0 && (
          <div
            className="absolute w-1 h-16 bg-red-400/30 rounded"
            style={{
              left: `${launchOrigin.x}%`,
              top: `${launchOrigin.y - 20}%`,
              transform: `translateX(-50%) rotate(${Math.atan2(-pullback.x, pullback.y) * (180 / Math.PI)}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
        )}

        {/* Result overlay */}
        <AnimatePresence>
          {showResult && hitTarget && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="bg-white rounded-xl px-6 py-4 shadow-2xl text-center"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.3, repeat: 2 }}
                >
                  🎯
                </motion.div>
                <p className="text-lg font-bold text-gray-800">{hitTarget}</p>
                <p className="text-sm text-gray-500">Direct hit!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Instructions */}
      <p className="mt-4 text-center text-xs text-gray-400">
        Pull back from the slingshot, aim, and release!
      </p>
    </div>
  )
}
