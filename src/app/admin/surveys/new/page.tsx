'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { QuestionType } from '@/lib/types'

interface QuestionDraft {
  id: string
  type: QuestionType
  text: string
  config: Record<string, unknown>
}

// Question types organized by category
const questionCategories = {
  'Yes/No': {
    description: 'Binary choice questions',
    types: [
      { type: 'swipe' as QuestionType, label: 'Swipe Cards', emoji: '👆', description: 'Swipe left/right' },
    ],
  },
  'Single-Select': {
    description: 'Choose one option',
    types: [
      { type: 'tap_meter' as QuestionType, label: 'Tap Meter', emoji: '📈', description: 'Fill the meter!' },
      { type: 'rolodex' as QuestionType, label: 'Carousel', emoji: '🎠', description: 'Swipe through cards' },
      { type: 'fanned' as QuestionType, label: 'Fanned Cards', emoji: '🃏', description: 'Tap to select' },
      { type: 'fanned_swipe' as QuestionType, label: 'Fanned Swipe', emoji: '🎴', description: 'Swipe to browse' },
      { type: 'stacked' as QuestionType, label: 'Card Stack', emoji: '📚', description: 'Swipe through stack' },
      // Mini-games
      { type: 'tilt_maze' as QuestionType, label: 'Tilt Maze', emoji: '🎱', description: 'Roll ball into hole' },
      { type: 'racing_lanes' as QuestionType, label: 'Racing Lanes', emoji: '🏎️', description: 'Tap to race ahead' },
      { type: 'slot_machine' as QuestionType, label: 'Slot Machine', emoji: '🎰', description: 'Stop the reel' },
      { type: 'gravity_drop' as QuestionType, label: 'Gravity Drop', emoji: '🪂', description: 'Drop into bucket' },
      { type: 'bubble_pop' as QuestionType, label: 'Bubble Pop', emoji: '🫧', description: 'Pop before escape' },
      { type: 'slingshot' as QuestionType, label: 'Slingshot', emoji: '🏹', description: 'Aim and launch' },
      { type: 'scratch_card' as QuestionType, label: 'Scratch Card', emoji: '🎫', description: 'Scratch to reveal' },
    ],
  },
  'Multi-Select': {
    description: 'Choose multiple options',
    types: [
      { type: 'tap' as QuestionType, label: 'Tap to Select', emoji: '💥', description: 'Tap all that apply' },
    ],
  },
  'Scale/Rating': {
    description: 'Rate on a scale',
    types: [
      { type: 'slider' as QuestionType, label: 'Emoji Slider', emoji: '😊', description: 'Slide to rate' },
      { type: 'stars' as QuestionType, label: 'Star Rating', emoji: '⭐', description: '1-5 stars' },
      { type: 'thermometer' as QuestionType, label: 'Thermometer', emoji: '🌡️', description: 'Hot or cold?' },
      { type: 'bullseye' as QuestionType, label: 'Bullseye', emoji: '🎯', description: 'Hit the target' },
    ],
  },
}

// Flat lookup for question type info
const questionTypeInfo: Partial<Record<QuestionType, { label: string; emoji: string; description: string }>> = {}
Object.values(questionCategories).forEach(cat => {
  cat.types.forEach(t => {
    questionTypeInfo[t.type] = { label: t.label, emoji: t.emoji, description: t.description }
  })
})

export default function NewSurveyPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuestionDraft = {
      id: crypto.randomUUID(),
      type,
      text: '',
      config: type === 'swipe'
        ? { left_label: 'No', right_label: 'Yes', up_label: 'Meh', show_meh: false }
        : type === 'slider' || type === 'thermometer'
        ? { min_label: 'Not great', max_label: 'Amazing!' }
        : type === 'stars'
        ? { min_label: 'Poor', max_label: 'Excellent' }
        : type === 'tap'
        ? { options: ['Option 1', 'Option 2', 'Option 3'], multi_select: true }
        : type === 'tap_meter' || type === 'rolodex' || type === 'fanned' || type === 'fanned_swipe' || type === 'stacked'
        ? { options: ['Option 1', 'Option 2', 'Option 3'] }
        // Mini-games with options
        : type === 'tilt_maze' || type === 'racing_lanes' || type === 'slot_machine' || type === 'gravity_drop' || type === 'bubble_pop' || type === 'slingshot' || type === 'scratch_card'
        ? { options: ['Option 1', 'Option 2', 'Option 3'] }
        // Bullseye is a scale type
        : type === 'bullseye'
        ? { min_label: 'Disagree', max_label: 'Agree' }
        : {},
    }
    setQuestions([...questions, newQuestion])
    setIsAddingQuestion(false)
  }

  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleSave = async () => {
    if (!title.trim() || questions.length === 0) return

    setIsSaving(true)

    try {
      // First, ensure we have an organization
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
          title,
          branding_config: { primary_color: '#6366F1', mascot_enabled: true },
        })
        .select()
        .single()

      if (surveyError) throw surveyError

      // Create questions
      const questionsToInsert = questions.map((q, index) => ({
        survey_id: survey!.id,
        type: q.type,
        text: q.text,
        config: q.config,
        order_index: index,
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      router.push(`/admin/surveys/${survey!.id}`)
    } catch (error) {
      console.error('Error saving survey:', error)
      alert('Failed to save survey. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Render config section for a question
  const renderQuestionConfig = (question: QuestionDraft) => {
    switch (question.type) {
      case 'swipe':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(question.config.show_meh as boolean) ?? false}
              onChange={(e) => updateQuestion(question.id, {
                config: { ...question.config, show_meh: e.target.checked }
              })}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-600">
              Include &quot;Meh&quot; (neutral) option
            </span>
          </label>
        )

      case 'tap':
      case 'tap_meter':
      case 'rolodex':
      case 'fanned':
      case 'fanned_swipe':
      case 'stacked':
      case 'tilt_maze':
      case 'racing_lanes':
      case 'slot_machine':
      case 'gravity_drop':
      case 'bubble_pop':
      case 'slingshot':
      case 'scratch_card':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium">Options</label>
            {((question.config.options as string[]) || []).map((option, optIndex) => (
              <div key={optIndex} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...((question.config.options as string[]) || [])]
                    newOptions[optIndex] = e.target.value
                    updateQuestion(question.id, {
                      config: { ...question.config, options: newOptions }
                    })
                  }}
                  placeholder={`Option ${optIndex + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = ((question.config.options as string[]) || []).filter((_, i) => i !== optIndex)
                    updateQuestion(question.id, {
                      config: { ...question.config, options: newOptions }
                    })
                  }}
                  className="px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const currentOptions = (question.config.options as string[]) || []
                updateQuestion(question.id, {
                  config: { ...question.config, options: [...currentOptions, ''] }
                })
              }}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm"
            >
              + Add option
            </button>
            {question.type === 'tap' && (
              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={(question.config.multi_select as boolean) ?? true}
                  onChange={(e) => updateQuestion(question.id, {
                    config: { ...question.config, multi_select: e.target.checked }
                  })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">
                  Allow multiple selections
                </span>
              </label>
            )}
          </div>
        )

      case 'slider':
      case 'stars':
      case 'thermometer':
      case 'bullseye':
        return (
          <p className="text-sm text-gray-400 italic">No additional settings for this question type.</p>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Survey</h1>

      {/* Title */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Survey Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Event Feedback"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Questions ({questions.length})
        </h2>

        <Reorder.Group
          axis="y"
          values={questions}
          onReorder={setQuestions}
          className="space-y-4"
        >
          <AnimatePresence>
            {questions.map((question, index) => (
              <Reorder.Item
                key={question.id}
                value={question}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  {/* 6-dot drag handle */}
                  <div className="flex flex-col items-center justify-center py-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                    <svg className="w-5 h-6" viewBox="0 0 20 24" fill="currentColor">
                      <circle cx="6" cy="4" r="2" />
                      <circle cx="14" cy="4" r="2" />
                      <circle cx="6" cy="12" r="2" />
                      <circle cx="14" cy="12" r="2" />
                      <circle cx="6" cy="20" r="2" />
                      <circle cx="14" cy="20" r="2" />
                    </svg>
                  </div>

                  {/* Question type emoji */}
                  <div className="text-2xl">{questionTypeInfo[question.type]?.emoji || '❓'}</div>

                  {/* Question content */}
                  <div className="flex-1">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                        {questionTypeInfo[question.type]?.label || question.type}
                      </span>
                      <span className="text-gray-400 text-sm">#{index + 1}</span>
                    </div>

                    {/* Question text input */}
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                    />

                    {/* Config section - always visible */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {renderQuestionConfig(question)}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {/* Add question button */}
        {!isAddingQuestion ? (
          <button
            onClick={() => setIsAddingQuestion(true)}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
          >
            + Add Question
          </button>
        ) : (
          <motion.div
            className="mt-4 p-4 bg-indigo-50 rounded-lg max-h-[70vh] overflow-y-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-medium text-gray-700 mb-4">Choose question type:</p>

            {/* Question categories */}
            {Object.entries(questionCategories).map(([category, { description, types }]) => (
              <div key={category} className="mb-5">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">
                  {category}
                </h4>
                <p className="text-xs text-gray-500 mb-2">{description}</p>

                <div className="grid grid-cols-2 gap-2">
                  {types.map(({ type, label, emoji, description: typeDesc }) => (
                    <button
                      key={type}
                      onClick={() => addQuestion(type)}
                      className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-indigo-100 transition-colors text-left border border-transparent hover:border-indigo-200"
                    >
                      <span className="text-xl">{emoji}</span>
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{label}</div>
                        <div className="text-xs text-gray-500">{typeDesc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => setIsAddingQuestion(false)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>

      {/* Save button */}
      <motion.button
        onClick={handleSave}
        disabled={!title.trim() || questions.length === 0 || isSaving}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          title.trim() && questions.length > 0
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileHover={title.trim() && questions.length > 0 ? { scale: 1.01 } : {}}
        whileTap={title.trim() && questions.length > 0 ? { scale: 0.99 } : {}}
      >
        {isSaving ? 'Saving...' : 'Create Survey'}
      </motion.button>
    </div>
  )
}
