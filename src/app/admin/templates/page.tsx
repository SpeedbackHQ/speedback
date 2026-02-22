'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { surveyTemplates, SurveyTemplate } from '@/lib/templates'
import { questionTypeInfo } from '@/components/QuestionEditor'
import { useToast } from '@/components/ui/ToastProvider'

const categories = ['All', 'Team', 'Events', 'Product', 'Fun'] as const

export default function TemplatesPage() {
  const router = useRouter()
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [creatingId, setCreatingId] = useState<string | null>(null)

  const filtered = activeCategory === 'All'
    ? surveyTemplates
    : surveyTemplates.filter(t => t.category === activeCategory)

  const handleUseTemplate = async (template: SurveyTemplate) => {
    if (creatingId) return
    setCreatingId(template.id)

    try {
      // Ensure org exists
      let { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!org) {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({ name: 'My Organization' })
          .select()
          .single()
        org = newOrg
      }

      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          org_id: org!.id,
          title: template.title,
          branding_config: { primary_color: template.color, mascot_enabled: true },
        })
        .select()
        .single()

      if (surveyError) throw surveyError

      // Insert all questions
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(
          template.questions.map((q, i) => ({
            survey_id: survey!.id,
            type: q.type,
            text: q.text,
            config: q.config,
            order_index: i,
          }))
        )

      if (questionsError) throw questionsError

      router.push(`/admin/surveys/${survey!.id}?tab=questions`)
    } catch (error) {
      console.error('Error creating survey from template:', error)
      toast.error('Failed to create survey. Please try again.')
      setCreatingId(null)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Survey Templates</h1>
        <p className="text-gray-500 mt-1">
          Start with a ready-made survey. Pick a template, customize it, and share.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((template, index) => {
          const isCreating = creatingId === template.id

          return (
            <motion.div
              key={template.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Color accent bar */}
              <div className="h-1.5" style={{ backgroundColor: template.color }} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{template.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800">{template.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {template.questions.length} Q&apos;s
                  </span>
                </div>

                {/* Mechanic pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {template.questions.map((q, i) => {
                    const info = questionTypeInfo[q.type]
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-600"
                      >
                        <span>{info?.emoji || '?'}</span>
                        <span>{info?.label || q.type}</span>
                      </span>
                    )
                  })}
                </div>

                {/* Use template button */}
                <button
                  onClick={() => handleUseTemplate(template)}
                  disabled={!!creatingId}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: isCreating ? '#e5e7eb' : template.color + '15',
                    color: isCreating ? '#9ca3af' : template.color,
                    border: `2px solid ${isCreating ? '#e5e7eb' : template.color + '30'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!creatingId) {
                      e.currentTarget.style.backgroundColor = template.color
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!creatingId) {
                      e.currentTarget.style.backgroundColor = template.color + '15'
                      e.currentTarget.style.color = template.color
                    }
                  }}
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Use This Template'
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
