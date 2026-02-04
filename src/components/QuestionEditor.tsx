'use client'

import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { QuestionType } from '@/lib/types'

export interface QuestionDraft {
  id: string
  type: QuestionType
  text: string
  config: Record<string, unknown>
  isNew?: boolean
}

// Question type entry with optional tooltip
interface QuestionTypeEntry {
  type: QuestionType
  label: string
  emoji: string
  description: string
  tooltip?: string
}

// Question types organized by category
export const questionCategories: Record<string, { description: string; types: QuestionTypeEntry[] }> = {
  'Yes/No': {
    description: 'Binary choice questions',
    types: [
      { type: 'swipe', label: 'Swipe Cards', emoji: '👆', description: 'Swipe left/right', tooltip: '💡 Group multiple Yes/No questions together for rapid-fire streaks!' },
    ],
  },
  'Single-Select': {
    description: 'Choose one option',
    types: [
      { type: 'tap_meter', label: 'Tap Meter', emoji: '📈', description: 'Fill the meter!' },
      { type: 'rolodex', label: 'Carousel', emoji: '🎠', description: 'Swipe through cards' },
      { type: 'fanned', label: 'Fanned Cards', emoji: '🃏', description: 'Tap to select' },
      { type: 'fanned_swipe', label: 'Fanned Swipe', emoji: '🎴', description: 'Swipe to browse' },
      { type: 'stacked', label: 'Card Stack', emoji: '📚', description: 'Swipe through stack' },
      // Mini-games
      { type: 'tilt_maze', label: 'Tilt Maze', emoji: '🎱', description: 'Roll ball into hole' },
      { type: 'racing_lanes', label: 'Racing Lanes', emoji: '🏎️', description: 'Tap to race ahead' },
      { type: 'slot_machine', label: 'Slot Machine', emoji: '🎰', description: 'Stop the reel' },
      { type: 'gravity_drop', label: 'Gravity Drop', emoji: '🪂', description: 'Drop into bucket' },
      { type: 'bubble_pop', label: 'Bubble Pop', emoji: '🫧', description: 'Pop before escape' },
      { type: 'slingshot', label: 'Slingshot', emoji: '🏹', description: 'Aim and launch' },
      { type: 'scratch_card', label: 'Scratch Card', emoji: '🎫', description: 'Scratch to reveal' },
    ],
  },
  'Multi-Select': {
    description: 'Choose multiple options',
    types: [
      { type: 'tap', label: 'Tap to Select', emoji: '💥', description: 'Tap all that apply' },
    ],
  },
  'Scale/Rating': {
    description: 'Rate on a scale',
    types: [
      { type: 'slider', label: 'Emoji Slider', emoji: '😊', description: 'Slide to rate' },
      { type: 'stars', label: 'Star Rating', emoji: '⭐', description: '1-5 stars' },
      { type: 'thermometer', label: 'Thermometer', emoji: '🌡️', description: 'Hot or cold?' },
      { type: 'bullseye', label: 'Bullseye', emoji: '🎯', description: 'Hit the target' },
    ],
  },
}

// Flat lookup for question type info
export const questionTypeInfo: Partial<Record<QuestionType, { label: string; emoji: string; description: string; tooltip?: string }>> = {}
Object.values(questionCategories).forEach(cat => {
  cat.types.forEach(t => {
    questionTypeInfo[t.type] = { label: t.label, emoji: t.emoji, description: t.description, tooltip: t.tooltip }
  })
})

// Get default config for a question type
export function getDefaultConfig(type: QuestionType): Record<string, unknown> {
  switch (type) {
    case 'swipe':
      return { left_label: 'No', right_label: 'Yes', up_label: 'Meh', show_meh: false }
    case 'slider':
    case 'thermometer':
      return { min_label: 'Not great', max_label: 'Amazing!' }
    case 'stars':
      return { min_label: 'Poor', max_label: 'Excellent' }
    case 'tap':
      return { options: ['Option 1', 'Option 2', 'Option 3'], multi_select: true }
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
      return { options: ['Option 1', 'Option 2', 'Option 3'] }
    case 'bullseye':
      return { min_label: 'Disagree', max_label: 'Agree' }
    default:
      return {}
  }
}

interface QuestionEditorProps {
  questions: QuestionDraft[]
  onQuestionsChange: (questions: QuestionDraft[]) => void
  onQuestionUpdate: (id: string, updates: Partial<QuestionDraft>) => void
  onQuestionDelete: (id: string) => void
}

export function QuestionEditor({
  questions,
  onQuestionsChange,
  onQuestionUpdate,
  onQuestionDelete,
}: QuestionEditorProps) {
  // Render config section for a question
  const renderQuestionConfig = (question: QuestionDraft) => {
    switch (question.type) {
      case 'swipe':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(question.config.show_meh as boolean) ?? false}
              onChange={(e) => onQuestionUpdate(question.id, {
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
                    onQuestionUpdate(question.id, {
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
                    onQuestionUpdate(question.id, {
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
                onQuestionUpdate(question.id, {
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
                  onChange={(e) => onQuestionUpdate(question.id, {
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
    <Reorder.Group
      axis="y"
      values={questions}
      onReorder={onQuestionsChange}
      className="space-y-4"
    >
      <AnimatePresence>
        {questions.map((question, index) => (
          <Reorder.Item
            key={question.id}
            value={question}
            className="bg-slate-50 rounded-xl p-4 border border-slate-100"
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
                  onChange={(e) => onQuestionUpdate(question.id, { text: e.target.value })}
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
                onClick={() => onQuestionDelete(question.id)}
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
  )
}

interface QuestionTypeSelectorProps {
  onSelect: (type: QuestionType) => void
  onCancel: () => void
}

export function QuestionTypeSelector({ onSelect, onCancel }: QuestionTypeSelectorProps) {
  return (
    <motion.div
      className="p-4 bg-indigo-50 rounded-xl max-h-[70vh] overflow-y-auto"
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
            {types.map(({ type, label, emoji, description: typeDesc, tooltip }) => (
              <div key={type} className="relative group">
                <button
                  onClick={() => onSelect(type)}
                  className="w-full flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-indigo-100 transition-colors text-left border border-transparent hover:border-indigo-200"
                >
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{label}</div>
                    <div className="text-xs text-gray-500">{typeDesc}</div>
                  </div>
                </button>
                {/* Tooltip for rapid-fire guidance */}
                {tooltip && (
                  <div className="absolute left-0 right-0 -bottom-1 translate-y-full z-10 hidden group-hover:block">
                    <div className="bg-indigo-600 text-white text-xs rounded-lg px-3 py-2 shadow-lg mx-1">
                      {tooltip}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-indigo-600 rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={onCancel}
        className="mt-2 text-sm text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>
    </motion.div>
  )
}
