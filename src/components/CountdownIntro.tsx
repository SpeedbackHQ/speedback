'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Survey } from '@/lib/types'

interface CountdownIntroProps {
  survey: Survey
  questionCount: number
  onComplete: () => void
}

type CountdownPhase = 'intro' | '3' | '2' | '1' | 'go'

const phaseMessages: Record<CountdownPhase, string> = {
  intro: 'Get Ready!',
  '3': '3',
  '2': '2',
  '1': '1',
  go: 'GO!',
}

export function CountdownIntro({ survey, questionCount, onComplete }: CountdownIntroProps) {
  const [phase, setPhase] = useState<CountdownPhase>('intro')
  const [hasStarted, setHasStarted] = useState(false)

  const primaryColor = survey.branding_config?.primary_color || '#8B5CF6'

  const startCountdown = () => {
    setHasStarted(true)
    setPhase('3')

    setTimeout(() => setPhase('2'), 1000)
    setTimeout(() => setPhase('1'), 2000)
    setTimeout(() => setPhase('go'), 3000)
    setTimeout(onComplete, 3400)
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #F8F7FF 0%, #F3EEFF 50%, #EFF6FF 100%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Subtle brand tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}18 100%)` }}
      />

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
        className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 relative z-10 px-4 max-w-2xl break-words"
        style={{ color: '#0F172A' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {survey.title}
      </motion.h1>

      <motion.p
        className="text-sm sm:text-base text-center mb-8 relative z-10 px-4"
        style={{ color: '#64748B' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {questionCount} quick question{questionCount !== 1 ? 's' : ''}
      </motion.p>

      {/* Countdown number */}
      <div className="relative z-20 h-24 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasStarted && (
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

      {/* Start button */}
      {!hasStarted && (
        <motion.button
          onClick={startCountdown}
          className="mt-12 px-8 sm:px-12 py-3 sm:py-4 text-white font-bold text-lg sm:text-xl rounded-full shadow-lg relative z-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.95 }}
        >
          Let&apos;s Go!
        </motion.button>
      )}
    </motion.div>
  )
}
