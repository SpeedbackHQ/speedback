'use client'

import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  steps?: { emoji: string; label: string }[]
}

export function EmptyState({ icon, title, description, action, steps }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
      <motion.div
        className="text-6xl mb-4 inline-block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>

      <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 mb-6 font-medium max-w-md mx-auto">{description}</p>

      {steps && (
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2">
                <span className="text-lg">{step.emoji}</span>
                <span className="text-sm font-medium text-slate-600">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <svg className="w-4 h-4 text-slate-300 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {action && <div>{action}</div>}
    </div>
  )
}
