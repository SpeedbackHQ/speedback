'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SurveyPlayer } from './SurveyPlayer'
import type { SurveyWithQuestions } from '@/lib/types'

interface Workshop {
  name: string
  facilitator: string
}

interface WorkshopPickerProps {
  workshops: Workshop[]
  dayLabel: string
  survey: SurveyWithQuestions
  showSpeedbackBranding: boolean
}

export function WorkshopPicker({ workshops, dayLabel, survey, showSpeedbackBranding }: WorkshopPickerProps) {
  const [selected, setSelected] = useState<Workshop | null>(null)

  if (selected) {
    return (
      <SurveyPlayer
        survey={survey}
        showSpeedbackBranding={showSpeedbackBranding}
        metadata={{
          workshop_name: selected.name,
          facilitator: selected.facilitator,
          day: dayLabel,
        }}
      />
    )
  }

  const primaryColor = survey.branding_config?.primary_color || '#8B5CF6'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎭</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Which workshop did you attend?
          </h1>
          <p className="text-slate-500 font-medium">{dayLabel}</p>
        </div>

        <div className="space-y-3">
          {workshops.map((workshop, index) => (
            <motion.button
              key={workshop.name}
              onClick={() => setSelected(workshop)}
              className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-lg font-bold text-slate-800">{workshop.name}</h3>
              <p className="text-slate-500 text-sm mt-0.5">with {workshop.facilitator}</p>
            </motion.button>
          ))}
        </div>

        {showSpeedbackBranding && (
          <div className="mt-8 text-center">
            <span className="text-xs text-slate-400">
              Powered by{' '}
              <a href="https://speedback.fun" className="underline hover:text-slate-500" style={{ color: primaryColor }}>
                SpeedBack
              </a>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
