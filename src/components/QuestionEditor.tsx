'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { QuestionType, InlineFollowUp } from '@/lib/types'
import { questionCategories, questionTypeInfo, getSpeedBiasWarning } from '@/lib/question-types'
export type { QuestionTypeEntry } from '@/lib/question-types'
export { questionCategories, questionTypeInfo }

export interface QuestionDraft {
  id: string
  type: QuestionType
  text: string
  config: Record<string, unknown>
  isNew?: boolean
}

// Get default config for a question type
export function getDefaultConfig(type: QuestionType): Record<string, unknown> {
  switch (type) {
    case 'swipe':
      return { left_label: 'No', right_label: 'Yes', up_label: 'Meh', show_meh: false }
    case 'this_or_that':
      return { left_label: 'Coffee', right_label: 'Tea' }
    case 'slider':
    case 'thermometer':
      return { min_label: 'Not great', max_label: 'Amazing!' }
    case 'stars':
      return { min_label: 'Poor', max_label: 'Excellent' }
    case 'tap':
      return { options: ['Flying', 'Invisibility', 'Time travel'], multi_select: true }
    case 'paint_splatter':
      return { options: ['Leadership', 'Creativity', 'Communication'] }
    case 'bingo_card':
      return { options: ['AI', 'Design', 'Marketing', 'Engineering'] }
    case 'shopping_cart':
      return { options: ['Free lunch', 'Gym pass', 'Extra PTO'] }
    case 'sticker_board':
      return { options: ['Innovation', 'Teamwork', 'Growth'] }
    case 'jar_fill':
      return { options: ['Trust', 'Communication', 'Fun'] }
    case 'conveyor_belt':
      return { options: ['Dark mode', 'Mobile app', 'Integrations'] }
    case 'magnet_board':
      return { options: ['Culture', 'Growth', 'Impact'] }
    case 'claw_machine':
      return { options: ['Health plan', 'Remote work', 'Stock options'] }
    case 'tap_meter':
      return { options: ['Spring', 'Summer', 'Autumn', 'Winter'] }
    case 'rolodex':
      return { options: ['Beach', 'Mountains', 'City', 'Countryside'] }
    case 'fanned':
      return { options: ['Red', 'Blue', 'Green', 'Purple'] }
    case 'fanned_swipe':
      return { options: ['Pop', 'Rock', 'Jazz', 'Hip-hop'] }
    case 'stacked':
      return { options: ['Dog', 'Cat', 'Rabbit', 'Parrot'] }
    case 'tilt_maze':
      return { options: ['Love it', 'Needs work', 'Not sure'] }
    case 'racing_lanes':
      return { options: ['Alpha', 'Beta', 'Gamma', 'Delta'] }
    case 'gravity_drop':
      return { options: ['Product', 'Marketing', 'Engineering'] }
    case 'bubble_pop':
      return { options: ['Pizza', 'Sushi', 'Tacos', 'Pasta'] }
    case 'slingshot':
      return { options: ['Option A', 'Option B', 'Option C'] }
    case 'scratch_card':
      return { options: ['Prize 1', 'Prize 2', 'Prize 3'] }
    case 'treasure_chest':
      return { options: ['Gold', 'Silver', 'Bronze'] }
    case 'pinata':
      return { options: ['Candy', 'Confetti', 'Surprise'] }
    case 'spin_stop':
      return { options: ['Speed', 'Quality', 'Design'] }
    case 'door_choice':
      return { options: ['Mystery A', 'Mystery B', 'Mystery C', 'Mystery D'] }
    case 'whack_a_mole':
      return { options: ['Bugs', 'Meetings', 'Email', 'Slack'] }
    case 'flick':
      return { options: ['Chips', 'Chocolate', 'Fruit', 'Coffee'] }
    case 'wheel':
      return { options: ['Italian', 'Mexican', 'Japanese', 'Thai'] }
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
  const [changingTypeFor, setChangingTypeFor] = useState<string | null>(null)

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
              className="w-4 h-4 text-violet-500 border-slate-300 rounded focus:ring-violet-500"
            />
            <span className="text-sm text-slate-600">
              Include &quot;Meh&quot; (neutral) option
            </span>
          </label>
        )

      case 'tap':
      case 'paint_splatter':
      case 'bingo_card':
      case 'shopping_cart':
      case 'sticker_board':
      case 'jar_fill':
      case 'conveyor_belt':
      case 'magnet_board':
      case 'claw_machine':
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
      case 'wheel': {
        // Tap supports up to 6 options (2-column grid for 5+), others cap at 4
        const maxOptions = question.type === 'tap' ? 6 : 4
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
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
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
              className={`w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors text-sm ${
                ((question.config.options as string[]) || []).length >= maxOptions ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={((question.config.options as string[]) || []).length >= maxOptions}
            >
              + Add option
            </button>
            {((question.config.options as string[]) || []).length >= maxOptions && (
              <p className="text-xs text-gray-400 mt-1">Maximum {maxOptions} options</p>
            )}
            {question.type === 'tap' && (
              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={(question.config.multi_select as boolean) ?? true}
                  onChange={(e) => onQuestionUpdate(question.id, {
                    config: { ...question.config, multi_select: e.target.checked }
                  })}
                  className="w-4 h-4 text-violet-500 border-slate-300 rounded focus:ring-violet-500"
                />
                <span className="text-sm text-slate-600">
                  Allow multiple selections
                </span>
              </label>
            )}
          </div>
        )
      }

      case 'this_or_that':
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
              <input
                type="text"
                value={(question.config.right_label as string) || ''}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, right_label: e.target.value }
                })}
                placeholder="Right label"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
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
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
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
                className="w-24 mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900"
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
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
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
                className="w-24 mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900"
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
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(question.config.show_reason as boolean) ?? true}
                onChange={(e) => onQuestionUpdate(question.id, {
                  config: { ...question.config, show_reason: e.target.checked }
                })}
                className="w-4 h-4 text-violet-500 border-slate-300 rounded focus:ring-violet-500"
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
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
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
              className={`w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors text-sm ${
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
                className="w-20 ml-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900"
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
              className="w-20 ml-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
        )

      default:
        return null
    }
  }

  const renderFollowUpSection = (question: QuestionDraft) => {
    const supportedTypes = ['slider', 'thermometer', 'stars', 'dial', 'swipe', 'toggle_switch', 'bubble_pop', 'door_choice', 'tap_meter']
    if (!supportedTypes.includes(question.type)) return null

    const followUp = question.config.follow_up as InlineFollowUp | undefined
    const conditionKind = ['slider', 'thermometer', 'stars', 'dial'].includes(question.type)
      ? 'scale'
      : ['swipe', 'this_or_that', 'toggle_switch'].includes(question.type)
      ? 'binary'
      : 'choice'

    const addFollowUp = () => {
      let defaultCondition: InlineFollowUp['condition']
      if (conditionKind === 'scale') {
        defaultCondition = { type: 'above_threshold', threshold: 75 }
      } else if (conditionKind === 'binary') {
        defaultCondition = { type: 'equals', value: 'right' }
      } else {
        const firstOption = ((question.config.options as string[]) || [])[0] || 'Option 1'
        defaultCondition = { type: 'equals', value: firstOption }
      }
      onQuestionUpdate(question.id, {
        config: {
          ...question.config,
          follow_up: {
            condition: defaultCondition,
            question: { type: 'bubble_pop', text: '', config: { options: ['Option A', 'Option B'] } },
          },
        },
      })
    }

    const removeFollowUp = () => {
      const newConfig = { ...question.config }
      delete newConfig.follow_up
      onQuestionUpdate(question.id, { config: newConfig })
    }

    const updateFollowUp = (updates: Partial<InlineFollowUp>) => {
      onQuestionUpdate(question.id, {
        config: {
          ...question.config,
          follow_up: { ...followUp!, ...updates },
        },
      })
    }

    if (!followUp) {
      return (
        <button
          type="button"
          onClick={addFollowUp}
          className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1 mt-1"
        >
          + Add follow-up question
        </button>
      )
    }

    const conditionOptions = conditionKind === 'binary'
      ? question.type === 'swipe'
        ? [
            { label: 'Yes (→ right)', value: 'right' },
            { label: 'No (← left)', value: 'left' },
            { label: 'Skip (↑ up)', value: 'up' },
          ]
        : question.type === 'this_or_that'
        ? [
            { label: (question.config.left_label as string) || 'This', value: (question.config.left_label as string) || 'This' },
            { label: (question.config.right_label as string) || 'That', value: (question.config.right_label as string) || 'That' },
          ]
        : [
            { label: (question.config.right_label as string) || 'Right', value: 'right' },
            { label: (question.config.left_label as string) || 'Left', value: 'left' },
          ]
      : conditionKind === 'choice'
      ? ((question.config.options as string[]) || []).map(o => ({ label: o, value: o }))
      : []

    const followUpTypes = [
      { type: 'bubble_pop', label: 'Bubble Pop', emoji: '🫧' },
      { type: 'short_text', label: 'Short Text', emoji: '💬' },
      { type: 'slider', label: 'Slider', emoji: '😊' },
      { type: 'swipe', label: 'Swipe', emoji: '👆' },
    ] as const

    return (
      <div className="mt-3 pt-3 border-t border-violet-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-violet-600">↳ Follow-up question</span>
          <button type="button" onClick={removeFollowUp} className="text-xs text-gray-400 hover:text-red-500">
            Remove
          </button>
        </div>

        {/* Condition control */}
        {conditionKind === 'scale' ? (
          <div>
            <label className="text-xs text-gray-500">Show follow-up when score is above</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min={0}
                max={100}
                value={followUp.condition.threshold ?? 75}
                onChange={(e) => updateFollowUp({
                  condition: { ...followUp.condition, threshold: Number(e.target.value) },
                })}
                className="flex-1 accent-violet-500"
              />
              <span className="text-sm font-medium text-violet-600 w-9 text-right">
                {followUp.condition.threshold ?? 75}%
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-500">Show follow-up when answer is</label>
            <select
              value={followUp.condition.value ?? ''}
              onChange={(e) => updateFollowUp({
                condition: { type: 'equals', value: e.target.value },
              })}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none text-gray-900"
            >
              {conditionOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Follow-up question text */}
        <div>
          <label className="text-xs text-gray-500">Follow-up question text</label>
          <input
            type="text"
            value={followUp.question.text}
            onChange={(e) => updateFollowUp({ question: { ...followUp.question, text: e.target.value } })}
            placeholder="Ask them something..."
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Follow-up mechanic picker */}
        <div>
          <label className="text-xs text-gray-500">Follow-up mechanic</label>
          <div className="flex gap-2 mt-1 flex-wrap">
            {followUpTypes.map(ft => (
              <button
                key={ft.type}
                type="button"
                onClick={() => {
                  const newConfig = ft.type === 'bubble_pop'
                    ? { options: (followUp.question.config.options as string[] | undefined) || ['Option A', 'Option B'] }
                    : ft.type === 'short_text'
                    ? { placeholder: 'Share your thought...' }
                    : ft.type === 'slider'
                    ? { min_label: 'Not at all', max_label: 'Absolutely' }
                    : { left_label: 'No', right_label: 'Yes' }
                  updateFollowUp({ question: { ...followUp.question, type: ft.type, config: newConfig } })
                }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                  followUp.question.type === ft.type
                    ? 'bg-violet-100 border-violet-300 text-violet-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-violet-200'
                }`}
              >
                <span>{ft.emoji}</span> {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options — only for bubble_pop follow-up */}
        {followUp.question.type === 'bubble_pop' && (
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Options</label>
            {((followUp.question.config.options as string[]) || []).map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...((followUp.question.config.options as string[]) || [])]
                    newOpts[i] = e.target.value
                    updateFollowUp({ question: { ...followUp.question, config: { ...followUp.question.config, options: newOpts } } })
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOpts = ((followUp.question.config.options as string[]) || []).filter((_, j) => j !== i)
                    updateFollowUp({ question: { ...followUp.question, config: { ...followUp.question.config, options: newOpts } } })
                  }}
                  disabled={((followUp.question.config.options as string[]) || []).length <= 2}
                  className={`px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ${
                    ((followUp.question.config.options as string[]) || []).length <= 2 ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const currentOpts = (followUp.question.config.options as string[]) || []
                updateFollowUp({ question: { ...followUp.question, config: { ...followUp.question.config, options: [...currentOpts, `Option ${currentOpts.length + 1}`] } } })
              }}
              disabled={((followUp.question.config.options as string[]) || []).length >= 4}
              className={`w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors text-sm ${
                ((followUp.question.config.options as string[]) || []).length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              + Add option
            </button>
          </div>
        )}

        {/* Labels — only for swipe follow-up */}
        {followUp.question.type === 'swipe' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={(followUp.question.config.left_label as string) || ''}
              onChange={(e) => updateFollowUp({ question: { ...followUp.question, config: { ...followUp.question.config, left_label: e.target.value } } })}
              placeholder="Left (No)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
            />
            <input
              type="text"
              value={(followUp.question.config.right_label as string) || ''}
              onChange={(e) => updateFollowUp({ question: { ...followUp.question, config: { ...followUp.question.config, right_label: e.target.value } } })}
              placeholder="Right (Yes)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        )}
      </div>
    )
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
              <div className="text-2xl mt-0.5 flex-shrink-0">
                {questionTypeInfo[question.type]?.emoji || '❓'}
              </div>

              {/* Question content */}
              <div className="flex-1">
                {/* Header row */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setChangingTypeFor(changingTypeFor === question.id ? null : question.id)}
                    className="text-xs font-medium text-violet-500 bg-violet-100 hover:bg-violet-200 px-2 py-1 rounded transition-colors flex items-center gap-1.5 group"
                    title="Click to change mechanic"
                  >
                    <span>{questionTypeInfo[question.type]?.label || question.type}</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${changingTypeFor === question.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <span className="text-gray-400 text-sm">#{index + 1}</span>
                </div>

                {/* Question text input */}
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => onQuestionUpdate(question.id, { text: e.target.value })}
                  placeholder="Enter your question..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                />

                {/* Inline mechanic type picker */}
                {changingTypeFor === question.id && (
                  <div className="mt-2">
                    <QuestionTypeSelector
                      onSelect={(newType) => {
                        onQuestionUpdate(question.id, { type: newType, config: getDefaultConfig(newType) })
                        setChangingTypeFor(null)
                      }}
                      onCancel={() => setChangingTypeFor(null)}
                    />
                  </div>
                )}

                {/* Speed-bias warning */}
                {(() => {
                  const warning = getSpeedBiasWarning(question.type)
                  return warning ? (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-amber-500 text-sm flex-shrink-0 mt-px">&#9888;</span>
                      <span className="text-xs text-amber-700">{warning}</span>
                    </div>
                  ) : null
                })()}

                {/* Config section - always visible */}
                {changingTypeFor !== question.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {renderQuestionConfig(question)}
                    {renderFollowUpSection(question)}
                  </div>
                )}
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
      className="p-4 bg-violet-50 rounded-xl max-h-[70vh] overflow-y-auto"
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
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-violet-100 transition-all text-left border-2 border-transparent hover:border-violet-200 hover:shadow-sm"
                >
                  <span className="text-2xl">{categoryEmojis[category] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">{category}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                  <span className="text-xs font-medium bg-violet-100 text-violet-500 px-2 py-1 rounded-full">
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
                className="text-sm text-violet-500 hover:text-violet-700 font-medium flex items-center gap-1"
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
                    className="w-full flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-violet-100 transition-colors text-left border border-transparent hover:border-violet-200"
                  >
                    <span className="text-xl">{emoji}</span>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{typeDesc}</div>
                    </div>
                  </button>
                  {tooltip && (
                    <div className="absolute left-0 right-0 -bottom-1 translate-y-full z-10 hidden group-hover:block">
                      <div className="bg-violet-500 text-white text-xs rounded-lg px-3 py-2 shadow-lg mx-1">
                        {tooltip}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-violet-500 rotate-45" />
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
