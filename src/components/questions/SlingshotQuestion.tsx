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
  { outer: '#ef4444', middle: '#f87171', inner: '#fca5a5', label: '#dc2626' }, // red
  { outer: '#3b82f6', middle: '#60a5fa', inner: '#93c5fd', label: '#2563eb' }, // blue
  { outer: '#22c55e', middle: '#4ade80', inner: '#86efac', label: '#16a34a' }, // green
  { outer: '#a855f7', middle: '#c084fc', inner: '#d8b4fe', label: '#9333ea' }, // purple
  { outer: '#f97316', middle: '#fb923c', inner: '#fdba74', label: '#ea580c' }, // orange
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
    const totalWidth = count <= 3 ? 70 : 80
    const xSpacing = count > 1 ? totalWidth / (count - 1) : 0
    const xOffset = count > 1 ? (100 - totalWidth) / 2 : 50

    return {
      label,
      x: count > 1 ? xOffset + i * xSpacing : 50,
      y: 20,  // Top of screen - shoot upward at them
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

      <motion.p
        className="text-gray-600 text-center mb-4 text-sm font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        🎯 Pull back the slingshot and launch at your answer!
      </motion.p>

      {/* Game area */}
      <motion.div
        ref={containerRef}
        className="relative w-full aspect-[3/4] bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100 rounded-2xl overflow-hidden shadow-lg touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Target backdrop board at top */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-amber-900/30 to-transparent border-b-2 border-amber-900/20" />

        {/* Carnival game backdrop pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
          <div className="absolute top-8 left-0 right-0 h-1 bg-blue-500" />
          <div className="absolute top-16 left-0 right-0 h-1 bg-yellow-500" />
        </div>
        {/* Targets - carnival bullseye style */}
        {targets.map((target, index) => {
          const isHit = hitTarget === target.label
          const targetSize = options.length <= 3 ? 56 : 48 // px

          return (
            <motion.div
              key={target.label}
              className="absolute flex flex-col items-center"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                transform: 'translateX(-50%)',
              }}
              initial={{ y: -20, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: isHit ? 1.15 : 1,
              }}
              transition={{ delay: index * 0.1, type: 'spring' }}
            >
              {/* Bullseye target board */}
              <div className="relative" style={{ width: targetSize, height: targetSize }}>
                {/* Outer ring */}
                <div
                  className="absolute inset-0 rounded-full shadow-lg"
                  style={{
                    backgroundColor: target.color.outer,
                    boxShadow: isHit ? `0 0 20px ${target.color.outer}` : '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                />
                {/* Middle ring */}
                <div
                  className="absolute inset-[15%] rounded-full"
                  style={{ backgroundColor: target.color.middle }}
                />
                {/* Inner bullseye */}
                <div
                  className="absolute inset-[35%] rounded-full"
                  style={{ backgroundColor: target.color.inner }}
                />

                {/* Hit explosion */}
                {isHit && (
                  <>
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center text-3xl z-10"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      💥
                    </motion.div>
                    {/* Impact rings */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-4"
                        style={{ borderColor: target.color.outer }}
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Label below target */}
              <div
                className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg text-center ${labelMaxWidth} leading-tight shadow-md`}
                style={{
                  backgroundColor: 'white',
                  color: target.color.label,
                  border: `2px solid ${target.color.label}`,
                  minWidth: '60px'
                }}
              >
                {target.label}
              </div>
            </motion.div>
          )
        })}

        {/* Wooden slingshot base */}
        <div
          className="absolute"
          style={{
            left: `${launchOrigin.x}%`,
            top: `${launchOrigin.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Base platform */}
          <div className="absolute -left-6 -top-2 w-12 h-4 rounded"
               style={{
                 background: 'linear-gradient(to bottom, #92400e, #78350f)',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
               }} />

          {/* Left arm (Y-fork) */}
          <div className="absolute -left-7 -top-16 w-3.5 h-20 rounded-full origin-bottom"
               style={{
                 background: 'linear-gradient(to right, #92400e, #78350f)',
                 transform: 'rotate(-12deg)',
                 boxShadow: '-2px 0 4px rgba(0,0,0,0.3)'
               }} />

          {/* Right arm (Y-fork) */}
          <div className="absolute -right-7 -top-16 w-3.5 h-20 rounded-full origin-bottom"
               style={{
                 background: 'linear-gradient(to left, #92400e, #78350f)',
                 transform: 'rotate(12deg)',
                 boxShadow: '2px 0 4px rgba(0,0,0,0.3)'
               }} />

          {/* Elastic bands */}
          {isDragging && (
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
                stroke="#451a03"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* Right band */}
              <line
                x1={105}
                y1={10}
                x2={60 + pullback.x}
                y2={70 + pullback.y}
                stroke="#451a03"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* Leather pouch */}
              <ellipse
                cx={60 + pullback.x}
                cy={70 + pullback.y}
                rx={12}
                ry={6}
                fill="#78350f"
                stroke="#451a03"
                strokeWidth={2}
              />
            </svg>
          )}
        </div>

        {/* Projectile (rock) */}
        <motion.div
          className="absolute w-9 h-9 rounded-full shadow-lg z-30"
          style={{
            left: `${isLaunched ? projectilePos.x : launchOrigin.x + pullback.x}%`,
            top: `${isLaunched ? projectilePos.y : launchOrigin.y + pullback.y}%`,
            marginLeft: -18,
            marginTop: -18,
            background: 'radial-gradient(circle at 30% 30%, #9ca3af, #4b5563, #1f2937)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.3)',
          }}
          animate={isDragging ? { scale: 1.15, rotate: 5 } : { rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Rock texture/highlight */}
          <div className="absolute top-1.5 left-2 w-3 h-2 rounded-full bg-white/40 blur-[1px]" />
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-black/30" />
        </motion.div>

        {/* Aim guide - dotted trajectory line */}
        {isDragging && pullback.y !== 0 && (
          <svg
            className="absolute pointer-events-none"
            style={{
              left: `${launchOrigin.x}%`,
              top: `${launchOrigin.y}%`,
              width: 200,
              height: 200,
              marginLeft: -100,
              marginTop: -100,
            }}
          >
            <line
              x1={100}
              y1={100}
              x2={100 + (-pullback.x * 3)}
              y2={100 + (-pullback.y * 3)}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4 4"
              opacity={0.5}
            />
            {/* Arrow head */}
            <polygon
              points={`
                ${100 + (-pullback.x * 3)},${100 + (-pullback.y * 3) - 6}
                ${100 + (-pullback.x * 3) - 4},${100 + (-pullback.y * 3) + 2}
                ${100 + (-pullback.x * 3) + 4},${100 + (-pullback.y * 3) + 2}
              `}
              fill="#ef4444"
              opacity={0.6}
              transform={`rotate(${Math.atan2(-pullback.y, -pullback.x) * (180 / Math.PI) - 90}, ${100 + (-pullback.x * 3)}, ${100 + (-pullback.y * 3)})`}
            />
          </svg>
        )}

        {/* Result overlay */}
        <AnimatePresence>
          {showResult && hitTarget && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="bg-white rounded-2xl px-6 py-5 shadow-2xl text-center max-w-xs w-full mx-4"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.3, repeat: 2 }}
                >
                  🎯
                </motion.div>
                <p className="text-xl font-bold text-gray-800 mb-1">{hitTarget}</p>
                <p className="text-sm text-gray-500 mb-6">Direct hit!</p>

                {/* Confirm/Retry buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      // Reset for retry
                      setIsLaunched(false)
                      setPullback({ x: 0, y: 0 })
                      setProjectilePos({ x: 50, y: 85 })
                      setHitTarget(null)
                      setShowResult(false)
                      if (navigator.vibrate) navigator.vibrate(20)
                    }}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ↺ Retry
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate([30, 50, 100])
                      onAnswer(hitTarget)
                    }}
                    className="flex-1 py-3 px-4 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✓ Confirm
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Visual hint when not interacting */}
      {!isDragging && !isLaunched && !showResult && (
        <motion.div
          className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-base">👆</span>
          <span className="font-medium">Drag the rock back to aim</span>
        </motion.div>
      )}
    </div>
  )
}
