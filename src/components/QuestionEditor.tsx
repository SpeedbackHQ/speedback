'use client'

import { useState } from 'react'
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
      { type: 'toggle_switch', label: 'Toggle Switch', emoji: '🔘', description: 'Flick to choose' },
      { type: 'tug_of_war', label: 'Tug of War', emoji: '🪢', description: 'Drag to your side' },
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
      { type: 'tilt_maze', label: 'Drop Zone', emoji: '📦', description: 'Drag to your answer' },
      { type: 'racing_lanes', label: 'Racing Lanes', emoji: '🏎️', description: 'Tap to race ahead' },
      { type: 'gravity_drop', label: 'Gravity Drop', emoji: '🪂', description: 'Drop into bucket' },
      { type: 'bubble_pop', label: 'Bubble Pop', emoji: '🫧', description: 'Pop before escape' },
      { type: 'slingshot', label: 'Slingshot', emoji: '🏹', description: 'Aim and launch' },
      { type: 'scratch_card', label: 'Scratch Card', emoji: '🎫', description: 'Scratch to reveal' },
      { type: 'treasure_chest', label: 'Treasure Chest', emoji: '🏴‍☠️', description: 'Tap to crack open' },
      { type: 'pinata', label: 'Pinata', emoji: '🪅', description: 'Smash to reveal' },
      // Phase B
      { type: 'spin_stop', label: 'Spin & Stop', emoji: '🎰', description: 'Tap to stop the reel' },
      { type: 'door_choice', label: 'Door Choice', emoji: '🚪', description: 'Open a door' },
      { type: 'whack_a_mole', label: 'Whack-a-Mole', emoji: '🔨', description: 'Bonk your pick' },
      { type: 'flick', label: 'Flick Cards', emoji: '📲', description: 'Flick through & pick' },
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
      // Phase B
      { type: 'dial', label: 'Dial', emoji: '🎛️', description: 'Turn the knob' },
      { type: 'press_hold', label: 'Press & Hold', emoji: '👇', description: 'Hold to fill' },
      { type: 'countdown_tap', label: 'Countdown Tap', emoji: '⏱️', description: 'Tap fast!' },
      { type: 'tilt', label: 'Tilt Meter', emoji: '⚖️', description: 'Tilt to rate' },
    ],
  },
  'Open Response': {
    description: 'Free-form text, voice & emoji',
    types: [
      { type: 'short_text', label: 'Quick Text', emoji: '💬', description: 'Short text reply' },
      { type: 'mad_libs', label: 'Fill in the Blank', emoji: '📝', description: 'Complete the sentence' },
      { type: 'emoji_reaction', label: 'Emoji Reaction', emoji: '😍', description: 'React with emoji' },
      { type: 'word_cloud', label: 'Word Cloud', emoji: '☁️', description: 'Pick describing words' },
      { type: 'voice_note', label: 'Voice Note', emoji: '🎤', description: 'Record a voice clip' },
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
    case 'gravity_drop':
    case 'bubble_pop':
    case 'slingshot':
    case 'scratch_card':
    case 'treasure_chest':
    case 'pinata':
    case 'spin_stop':
    case 'door_choice':
    case 'whack_a_mole':
    case 'flick':
      return { options: ['Option 1', 'Option 2', 'Option 3'] }
    case 'bullseye':
      return { min_label: 'Disagree', max_label: 'Agree' }
    case 'dial':
    case 'press_hold':
    case 'countdown_tap':
    case 'tilt':
      return { min_label: 'Low', max_label: 'High' }
    case 'toggle_switch':
    case 'tug_of_war':
      return { left_label: 'No', right_label: 'Yes' }
    case 'short_text':
      return { max_length: 140, placeholder: 'Share your thought...' }
    case 'mad_libs':
      return { template: 'The best part was ___', max_length: 80 }
    case 'emoji_reaction':
      return { emojis: ['😍', '🙂', '😐', '🙁', '😡'], show_reason: true }
    case 'word_cloud':
      return { words: ['Creative', 'Fun', 'Boring', 'Innovative', 'Slow', 'Exciting', 'Confusing', 'Clear', 'Inspiring', 'Tedious'], max_selections: 5 }
    case 'voice_note':
      return { max_duration: 15 }
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
      case 'gravity_drop':
      case 'bubble_pop':
      case 'slingshot':
      case 'scratch_card':
      case 'treasure_chest':
      case 'pinata':
      case 'spin_stop':
      case 'door_choice':
      case 'whack_a_mole':
      case 'flick':
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
                  className={`px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ${
                    ((question.config.options as string[]) || []).length <= 2 ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  disabled={((question.config.options as string[]) || []).length <= 2}
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
                  config: { ...question.config, options: [...currentOptions, `Option ${currentOptions.length + 1}`] }
                })
              }}
              className={`w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm ${
                ((question.config.options as string[]) || []).length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={((question.config.options as string[]) || []).length >= 4}
            >
              + Add option
            </button>
            {((question.config.options as string[]) || []).length >= 4 && (
              <p className="text-xs text-gray-400 mt-1">Maximum 4 options</p>
            )}
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

      case 'toggle_switch':
      case 'tug_of_war':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium">Labels</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={(question.config.left_label as string) || ''}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, left_label: e.target.value }
                })}
                placeholder="Left label"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
              <input
                type="text"
                value={(question.config.right_label as string) || ''}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, right_label: e.target.value }
                })}
                placeholder="Right label"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        )

      case 'slider':
      case 'stars':
      case 'thermometer':
      case 'bullseye':
      case 'dial':
      case 'press_hold':
      case 'countdown_tap':
      case 'tilt':
        return (
          <p className="text-sm text-gray-400 italic">No additional settings for this question type.</p>
        )

      case 'short_text':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Placeholder text</label>
              <input
                type="text"
                value={(question.config.placeholder as string) || ''}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, placeholder: e.target.value }
                })}
                placeholder="Share your thought..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Max characters</label>
              <input
                type="number"
                value={(question.config.max_length as number) || 140}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, max_length: Math.max(20, Math.min(500, Number(e.target.value))) }
                })}
                min={20}
                max={500}
                className="w-24 mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>
        )

      case 'mad_libs':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Template (use ___ for the blank)</label>
              <input
                type="text"
                value={(question.config.template as string) || ''}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, template: e.target.value }
                })}
                placeholder="The best part was ___"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Max characters for answer</label>
              <input
                type="number"
                value={(question.config.max_length as number) || 80}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, max_length: Math.max(20, Math.min(200, Number(e.target.value))) }
                })}
                min={20}
                max={200}
                className="w-24 mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>
        )

      case 'emoji_reaction':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Emojis (space-separated)</label>
              <input
                type="text"
                value={((question.config.emojis as string[]) || []).join(' ')}
                onChange={(e) => {
                  const emojis = [...e.target.value].filter(c => c.trim() && !/[a-zA-Z0-9\s]/.test(c))
                  if (emojis.length > 0) {
                    onQuestionUpdate(question.id, {
                      config: { ...question.config, emojis }
                    })
                  }
                }}
                placeholder="😍 🙂 😐 🙁 😡"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(question.config.show_reason as boolean) ?? true}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, show_reason: e.target.checked }
                })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">
                Ask &quot;Tell us why&quot; after emoji selection
              </span>
            </label>
          </div>
        )

      case 'word_cloud':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium">Words</label>
            {((question.config.words as string[]) || []).map((word, wordIndex) => (
              <div key={wordIndex} className="flex gap-2">
                <input
                  type="text"
                  value={word}
                  onChange={(e) => {
                    const newWords = [...((question.config.words as string[]) || [])]
                    newWords[wordIndex] = e.target.value
                    onQuestionUpdate(question.id, {
                      config: { ...question.config, words: newWords }
                    })
                  }}
                  placeholder={`Word ${wordIndex + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newWords = ((question.config.words as string[]) || []).filter((_, i) => i !== wordIndex)
                    onQuestionUpdate(question.id, {
                      config: { ...question.config, words: newWords }
                    })
                  }}
                  className={`px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ${
                    ((question.config.words as string[]) || []).length <= 3 ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  disabled={((question.config.words as string[]) || []).length <= 3}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const currentWords = (question.config.words as string[]) || []
                onQuestionUpdate(question.id, {
                  config: { ...question.config, words: [...currentWords, `Word ${currentWords.length + 1}`] }
                })
              }}
              className={`w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm ${
                ((question.config.words as string[]) || []).length >= 20 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={((question.config.words as string[]) || []).length >= 20}
            >
              + Add word
            </button>
            {((question.config.words as string[]) || []).length >= 20 && (
              <p className="text-xs text-gray-400 mt-1">Maximum 20 words</p>
            )}
            <div className="mt-2">
              <label className="text-xs text-gray-500 font-medium">Max selections</label>
              <input
                type="number"
                value={(question.config.max_selections as number) || 5}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, max_selections: Math.max(1, Math.min(10, Number(e.target.value))) }
                })}
                min={1}
                max={10}
                className="w-20 ml-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>
        )

      case 'voice_note':
        return (
          <div>
            <label className="text-xs text-gray-500 font-medium">Max recording duration (seconds)</label>
            <input
              type="number"
              value={(question.config.max_duration as number) || 15}
              onChange={(e) => onQuestionUpdate(question.id, {
                config: { ...question.config, max_duration: Math.max(5, Math.min(30, Number(e.target.value))) }
              })}
              min={5}
              max={30}
              className="w-20 ml-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
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

// Emoji representing each category
const categoryEmojis: Record<string, string> = {
  'Yes/No': '👆',
  'Single-Select': '🎯',
  'Multi-Select': '💥',
  'Scale/Rating': '⭐',
  'Open Response': '💬',
}

export function QuestionTypeSelector({ onSelect, onCancel }: QuestionTypeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <motion.div
      className="p-4 bg-indigo-50 rounded-xl max-h-[70vh] overflow-y-auto"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="wait">
        {selectedCategory === null ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-sm font-medium text-gray-700 mb-4">What type of question?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(questionCategories).map(([category, { description, types }]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-indigo-100 transition-all text-left border-2 border-transparent hover:border-indigo-200 hover:shadow-sm"
                >
                  <span className="text-2xl">{categoryEmojis[category] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">{category}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                  <span className="text-xs font-medium bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {types.length}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={onCancel}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="mechanics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <span>←</span> Back
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {selectedCategory}
              </span>
              <span className="text-xs text-gray-400">
                {questionCategories[selectedCategory]?.description}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {questionCategories[selectedCategory]?.types.map(({ type, label, emoji, description: typeDesc, tooltip }) => (
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

            <button
              onClick={onCancel}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
