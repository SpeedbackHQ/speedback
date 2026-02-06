'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BunnyMascot, BunnyState } from './BunnyMascot'
import { Survey } from '@/lib/types'

interface CountdownIntroProps {
  survey: Survey
  questionCount: number
  onComplete: () => void
}

type CountdownPhase = 'intro' | '3' | '2' | '1' | 'go' | 'running'

const phaseMessages = {
  intro: 'Get Ready!',
  '3': '3',
  '2': '2',
  '1': '1',
  go: 'GO!',
  running: '',
}

const phaseBunnyState: Record<CountdownPhase, BunnyState> = {
  intro: 'idle',
  '3': 'idle',
  '2': 'ready',
  '1': 'ready',
  go: 'running',
  running: 'running',
}

export function CountdownIntro({ survey, questionCount, onComplete }: CountdownIntroProps) {
  const [phase, setPhase] = useState<CountdownPhase>('intro')
  const [hasStarted, setHasStarted] = useState(false)

  const primaryColor = survey.branding_config?.primary_color || '#8B5CF6'

  const startCountdown = () => {
    setHasStarted(true)
    setPhase('3')

    // Countdown sequence
    setTimeout(() => setPhase('2'), 1000)
    setTimeout(() => setPhase('1'), 2000)
    setTimeout(() => setPhase('go'), 3000)
    setTimeout(() => {
      setPhase('running')
      // Brief running animation then complete
      setTimeout(onComplete, 800)
    }, 3500)
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}44 100%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Track lines background */}
      <div className="absolute inset-0 flex items-end justify-center pb-32 opacity-20">
        <div className="w-full max-w-md">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 border-b-2 border-dashed"
              style={{ borderColor: primaryColor }}
            />
          ))}
        </div>
      </div>

      {/* Logo */}
      {survey.branding_config?.logo_url && (
        <motion.img
          src={survey.branding_config.logo_url}
          alt="Logo"
          className="h-12 mb-4 relative z-10"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        />
      )}

      {/* Title */}
      <motion.h1
        className="text-2xl font-bold text-gray-800 text-center mb-2 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {survey.title}
      </motion.h1>

      <motion.p
        className="text-gray-500 text-center mb-8 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {questionCount} quick question{questionCount !== 1 ? 's' : ''}
      </motion.p>

      {/* Countdown number - positioned separately above bunny container */}
      <div className="relative z-20 h-24 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasStarted && phase !== 'running' && (
            <motion.div
              key={phase}
              className="text-8xl font-bold drop-shadow-lg"
              style={{ color: phase === 'go' ? '#22C55E' : primaryColor }}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {phaseMessages[phase]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bunny */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={phase === 'running' ? {
            x: [0, 300],
            opacity: [1, 1, 0],
          } : {}}
          transition={{ duration: 0.8, ease: 'easeIn' }}
        >
          <BunnyMascot
            state={phaseBunnyState[phase]}
            size="xl"
          />
        </motion.div>

        {/* Starting line */}
        {!hasStarted && (
          <motion.div
            className="w-48 h-2 rounded-full mt-4"
            style={{ backgroundColor: primaryColor }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5 }}
          />
        )}
      </div>

      {/* Start button - only show before countdown starts */}
      {!hasStarted && (
        <motion.button
          onClick={startCountdown}
          className="mt-12 px-12 py-4 text-white font-bold text-xl rounded-full shadow-lg relative z-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.95 }}
        >
          Ready, Set...
        </motion.button>
      )}

      {/* Dust clouds when running */}
      {phase === 'running' && (
        <motion.div
          className="absolute left-1/2 bottom-1/3 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-8 h-8 bg-gray-300 rounded-full"
              initial={{ scale: 0, x: 0 }}
              animate={{
                scale: [0, 1, 0.5],
                x: [-20 * i, -40 * i, -60 * i],
                opacity: [0, 0.5, 0],
              }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
