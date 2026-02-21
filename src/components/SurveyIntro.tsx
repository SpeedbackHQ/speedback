'use client'

import { motion } from 'framer-motion'
import { Mascot } from './Mascot'
import { Survey } from '@/lib/types'

interface SurveyIntroProps {
  survey: Survey
  questionCount: number
  onStart: () => void
}

export function SurveyIntro({ survey, questionCount, onStart }: SurveyIntroProps) {
  const primaryColor = survey.branding_config?.primary_color || '#8B5CF6'

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}44 100%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Logo placeholder */}
      {survey.branding_config?.logo_url && (
        <motion.img
          src={survey.branding_config.logo_url}
          alt="Logo"
          className="h-16 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        />
      )}

      {/* Mascot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <Mascot mood="excited" size="lg" />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center mt-8 mb-4 px-6 max-w-2xl break-words"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {survey.title}
      </motion.h1>

      {/* Question count */}
      <motion.p
        className="text-sm sm:text-base text-gray-600 text-center mb-8 px-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {questionCount} quick question{questionCount !== 1 ? 's' : ''} • Takes ~{Math.ceil(questionCount * 10 / 60)} min
      </motion.p>

      {/* Fun animated dots */}
      <motion.div
        className="flex gap-2 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[...Array(questionCount)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: primaryColor }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          />
        ))}
      </motion.div>

      {/* Start button */}
      <motion.button
        onClick={onStart}
        className="px-8 sm:px-12 py-3 sm:py-4 text-white font-bold text-lg sm:text-xl rounded-full shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
        whileTap={{ scale: 0.95 }}
      >
        Let&apos;s Go!
      </motion.button>
    </motion.div>
  )
}
