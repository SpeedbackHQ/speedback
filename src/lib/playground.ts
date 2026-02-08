import { QuestionType, Question } from './supabase'
import { AnswerValue } from './types'
import { getDefaultConfig } from '@/components/QuestionEditor'

// Fun sample question text per type
const demoQuestionTexts: Record<string, string> = {
  swipe: 'Is pizza the best food ever?',
  slider: 'How excited are you right now?',
  tap: 'Which superpowers would you want?',
  tap_meter: 'What is your favorite season?',
  rolodex: 'Pick your ideal vacation spot',
  stars: 'Rate your current mood',
  thermometer: 'How hot is this take?',
  fanned: 'Choose your favorite color',
  fanned_swipe: 'What genre is your jam?',
  stacked: 'Pick the best animal',
  tilt_maze: 'Where does this idea land?',
  racing_lanes: 'Which team wins?',
  gravity_drop: 'Where should we invest?',
  bubble_pop: 'Pop your favorite!',
  bullseye: 'How much do you agree?',
  slingshot: 'Launch your choice!',
  scratch_card: 'Scratch to reveal your pick',
  treasure_chest: 'Unlock your answer!',
  pinata: 'Smash to reveal!',
}

export function getDemoText(type: QuestionType): string {
  return demoQuestionTexts[type] || 'Sample question'
}

export function createMockQuestion(type: QuestionType): Question {
  return {
    id: `playground-${type}-${Date.now()}`,
    survey_id: 'playground-mock',
    type,
    text: getDemoText(type),
    config: getDefaultConfig(type),
    order_index: 0,
    created_at: new Date().toISOString(),
  }
}

export function formatAnswerDisplay(type: QuestionType, value: AnswerValue): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    if (type === 'stars') return `${value}%`
    return `${value}%`
  }
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
