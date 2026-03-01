'use client'

import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'

interface CelebrationProps {
  message?: string
  elapsedTime?: number // in milliseconds
  percentile?: number | null // 0-100, null means don't show
  surveyId?: string
  responseId?: string | null
  onComplete?: () => void
  showSpeedbackBranding?: boolean
}

interface LeaderboardEntry {
  initials: string
  duration_ms: number
}

type CelebrationStage = 'results' | 'initials' | 'leaderboard'

// Format time: decimal for <60s, whole numbers for 60s+
const formatTime = (ms: number) => {
  const seconds = ms / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`  // "32.7 seconds"
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSecs = Math.floor(seconds % 60)  // No decimal for 60s+
  return `${minutes}m ${remainingSecs}s`  // "2m 15s"
}

// Compact time for leaderboard rows
const formatTimeShort = (ms: number) => {
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSecs = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSecs}s`
}

const getPercentileCopy = (percentile: number): { text: string; emoji: string } | null => {
  if (percentile >= 90) return { text: `Lightning fast! Faster than ${percentile}% of people`, emoji: '⚡' }
  if (percentile >= 70) return { text: `Nice speed! Faster than ${percentile}% of people`, emoji: '🔥' }
  if (percentile >= 50) return { text: `Faster than ${percentile}% of people`, emoji: '💨' }
  // Below 50%: don't show percentile (no one wants to feel slow)
  return null
}

const RANK_STYLES = [
  'text-yellow-300', // 1st - gold
  'text-gray-300',   // 2nd - silver
  'text-amber-600',  // 3rd - bronze
]

// Completion chime via Web Audio API — short ascending C5→E5→G5 arpeggio
// Note: On iOS, Web Audio API plays even in silent mode. At gain 0.2 this is a soft chime,
// acceptable for ambient room awareness without being intrusive.
const playCompletionChime = () => {
  try {
    const ctx = new AudioContext()
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const startTime = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.2, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  } catch {
    // AudioContext not available — fail silently
  }
}

// Pre-generate confetti data (seeded by index for stability)
const generateConfetti = () => Array.from({ length: 50 }, (_, i) => {
  const r1 = ((i * 9301 + 49297) % 233280) / 233280
  const r2 = ((i * 7919 + 12345) % 233280) / 233280
  const r3 = ((i * 3571 + 67890) % 233280) / 233280
  const r4 = ((i * 5387 + 11111) % 233280) / 233280
  const r5 = ((i * 2749 + 22222) % 233280) / 233280
  const r6 = ((i * 8191 + 33333) % 233280) / 233280

  return {
    id: i,
    x: r1 * 100,
    delay: r2 * 0.5,
    duration: 2 + r3 * 2,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][
      Math.floor(r4 * 7)
    ],
    size: 8 + r5 * 8,
    rotation: r6 * 360,
    isRound: r4 > 0.5,
  }
})

const CONFETTI_DATA = generateConfetti()

export function Celebration({ message = 'Thanks for your feedback!', elapsedTime, percentile, surveyId, responseId, onComplete, showSpeedbackBranding = false }: CelebrationProps) {
  const confetti = useMemo(() => CONFETTI_DATA, [])
  const hasPlayedChime = useRef(false)
  const [stage, setStage] = useState<CelebrationStage>('results')
  const [initials, setInitials] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialsInputRef = useRef<HTMLInputElement>(null)

  // Play completion chime once on mount
  useEffect(() => {
    if (!hasPlayedChime.current) {
      hasPlayedChime.current = true
      playCompletionChime()
    }
  }, [])

  // Auto-advance to initials prompt after 2s (only if we have a responseId to update)
  useEffect(() => {
    if (stage === 'results' && responseId) {
      const timer = setTimeout(() => setStage('initials'), 2000)
      return () => clearTimeout(timer)
    }
  }, [stage, responseId])

  // Focus initials input when stage changes
  useEffect(() => {
    if (stage === 'initials') {
      setTimeout(() => initialsInputRef.current?.focus(), 300)
    }
  }, [stage])

  const fetchLeaderboard = useCallback(async () => {
    if (!surveyId) return
    try {
      const { data } = await supabase
        .from('responses')
        .select('initials, duration_ms')
        .eq('survey_id', surveyId)
        .not('duration_ms', 'is', null)
        .not('initials', 'is', null)
        .order('duration_ms', { ascending: true })
        .limit(10)

      if (data) {
        setLeaderboard(data as LeaderboardEntry[])
        track('leaderboard_viewed', { survey_id: surveyId, entry_count: data.length })
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }, [surveyId])

  const submitInitials = async () => {
    if (!responseId || !initials.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await supabase
        .from('responses')
        .update({ initials: initials.trim().toUpperCase() })
        .eq('id', responseId)

      track('initials_entered', { survey_id: surveyId, duration_ms: elapsedTime })
    } catch (error) {
      console.error('Failed to save initials:', error)
    }
    setIsSubmitting(false)
    await fetchLeaderboard()
    setStage('leaderboard')
  }

  const skipInitials = async () => {
    track('initials_skipped', { survey_id: surveyId, duration_ms: elapsedTime })
    await fetchLeaderboard()
    setStage('leaderboard')
  }

  const handleInitialsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && initials.trim()) {
      submitInitials()
    }
  }

  const percentileCopy = percentile != null ? getPercentileCopy(percentile) : null

  // Find current user's rank in leaderboard
  const userRank = elapsedTime
    ? leaderboard.findIndex(e => e.initials === initials.trim().toUpperCase() && e.duration_ms === elapsedTime) + 1
    : 0

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-amber-400 overflow-hidden">
      {/* Confetti */}
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: -20,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.isRound ? '50%' : '2px',
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: '100vh',
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'linear',
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {/* Stage 1: Results (time + percentile) */}
          {stage === 'results' && (
            <motion.div
              key="results"
              className="flex flex-col items-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            >
              {/* Lightning bolt */}
              <motion.div
                className="text-7xl mb-6"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }}
              >
                ⚡
              </motion.div>

              <motion.h1
                className="text-4xl font-bold text-white mb-4 drop-shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {message}
              </motion.h1>

              {elapsedTime !== undefined && elapsedTime > 0 && (
                <motion.div
                  className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-white/70 text-sm mb-1">Completed in</p>
                  <p className="text-3xl font-bold text-white">
                    {formatTime(elapsedTime)}
                  </p>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {percentileCopy ? (
                  <motion.div
                    key="percentile"
                    className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-3 mb-6"
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <p className="text-white/90 text-lg font-semibold">
                      {percentileCopy.emoji} {percentileCopy.text}
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="fallback"
                    className="text-white/90 text-lg font-medium mb-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: elapsedTime ? 0.7 : 0 }}
                  >
                    {elapsedTime ? 'Wow, that was fast! ⚡' : 'Your feedback helps us improve!'}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Stage 2: Initials Input */}
          {stage === 'initials' && (
            <motion.div
              key="initials"
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <motion.div
                className="text-5xl mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                🏆
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                Join the leaderboard!
              </h2>

              {elapsedTime !== undefined && elapsedTime > 0 && (
                <p className="text-white/70 text-sm mb-6">
                  Your time: {formatTime(elapsedTime)}
                </p>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  ref={initialsInputRef}
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
                  onKeyDown={handleInitialsKeyDown}
                  placeholder="AAA"
                  maxLength={3}
                  className="w-32 text-center text-3xl font-mono font-bold tracking-[0.3em] bg-black/30 backdrop-blur-sm border-2 border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/60 uppercase"
                  autoComplete="off"
                />
              </div>

              <motion.button
                onClick={submitInitials}
                disabled={!initials.trim() || isSubmitting}
                className="px-8 py-3 bg-white text-violet-600 font-bold rounded-full shadow-lg disabled:opacity-40 disabled:cursor-not-allowed mb-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? 'Saving...' : 'Submit'}
              </motion.button>

              <button
                onClick={skipInitials}
                className="text-white/60 text-sm font-medium hover:text-white/80 transition-colors"
              >
                Skip
              </button>
            </motion.div>
          )}

          {/* Stage 3: Leaderboard */}
          {stage === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              className="flex flex-col items-center w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                Leaderboard
              </h2>
              <p className="text-white/60 text-sm mb-4">Fastest completions</p>

              {leaderboard.length > 0 ? (
                <div className="w-full bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
                  {leaderboard.map((entry, i) => {
                    const isUser = userRank === i + 1
                    return (
                      <motion.div
                        key={`${entry.initials}-${entry.duration_ms}-${i}`}
                        className={`flex items-center px-4 py-3 ${
                          i < leaderboard.length - 1 ? 'border-b border-white/5' : ''
                        } ${isUser ? 'bg-white/10' : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        {/* Rank */}
                        <span className={`w-8 text-lg font-bold font-mono ${RANK_STYLES[i] || 'text-white/50'}`}>
                          {i + 1}.
                        </span>

                        {/* Initials */}
                        <span className={`flex-1 text-lg font-mono font-bold tracking-widest ${isUser ? 'text-white' : 'text-white/80'}`}>
                          {entry.initials}
                        </span>

                        {/* Time */}
                        <span className={`text-sm font-mono ${isUser ? 'text-white font-bold' : 'text-white/60'}`}>
                          {formatTimeShort(entry.duration_ms)}
                        </span>

                        {/* User indicator */}
                        {isUser && (
                          <motion.span
                            className="ml-2 text-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: i * 0.08 + 0.2 }}
                          >
                            ← you
                          </motion.span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <p className="text-white/50 text-sm text-center">
                    No entries yet. Be the first!
                  </p>
                </div>
              )}

              {/* Show user's time if they're not on the board */}
              {elapsedTime && userRank === 0 && (
                <motion.div
                  className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-white/70 text-sm">
                    Your time: <span className="font-mono font-bold text-white">{formatTimeShort(elapsedTime)}</span>
                  </p>
                </motion.div>
              )}

              {onComplete && (
                <motion.button
                  onClick={onComplete}
                  className="mt-4 px-8 py-3 bg-white text-violet-500 font-bold rounded-full shadow-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Done
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Speedback branding (for free users) */}
      {showSpeedbackBranding && (
        <motion.div
          className="absolute bottom-6 left-0 right-0 flex justify-center z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <a
            href="https://speedback.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
          >
            <span className="text-white/80 text-sm font-medium">Powered by</span>
            <span className="text-white font-bold text-lg" style={{ fontFamily: 'Chonko, sans-serif' }}>
              Speed<span className="text-violet-200">Back</span>
            </span>
            <span className="text-white text-lg">⚡</span>
          </a>
        </motion.div>
      )}

      {/* Background circles */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-white/10"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1.2] }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-white/10"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.8, 1.5] }}
        transition={{ duration: 1, delay: 0.4 }}
      />
    </div>
  )
}
