import { QuestionType, Question } from './supabase'
import { AnswerValue } from './types'
import { getDefaultConfig } from '@/components/QuestionEditor'

// Fun sample question text per type
const demoQuestionTexts: Record<string, string> = {
  swipe: 'Is pizza the best food ever?',
  this_or_that: 'Coffee or tea?',
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
  // Phase B
  dial: 'How strongly do you feel?',
  press_hold: 'How much energy do you have?',
  toggle_switch: 'Are you a morning person?',
  spin_stop: 'What should we focus on?',
  countdown_tap: 'How pumped are you?',
  door_choice: 'Pick a mystery door!',
  whack_a_mole: 'Bonk your favorite!',
  tug_of_war: 'Which side are you on?',
  tilt: 'How confident are you in this plan?',
  flick: 'Flick to your favorite!',
  // Multi-select games
  paint_splatter: 'Which skills do you value most?',
  bingo_card: 'What topics interest you?',
  shopping_cart: 'Which perks would you pick?',
  sticker_board: 'Which values resonate with you?',
  jar_fill: 'What ingredients make a great team?',
  conveyor_belt: 'Grab the features you want!',
  magnet_board: 'What attracts you to this role?',
  claw_machine: 'Win your favorite benefits!',
  // Qualitative
  short_text: 'What was the highlight of your day?',
  mad_libs: 'The best part of the event was ___',
  emoji_reaction: 'How did this session make you feel?',
  word_cloud: 'Which words describe our culture?',
  voice_note: 'Tell us what you really think!',
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
  if (type === 'voice_note' && typeof value === 'string' && value.startsWith('data:audio')) {
    return '🎤 Voice recorded'
  }
  if (type === 'emoji_reaction' && typeof value === 'string') {
    const pipeIndex = value.indexOf('|')
    if (pipeIndex > 0) return `${value.substring(0, pipeIndex)} "${value.substring(pipeIndex + 1)}"`
    return value
  }
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    if (type === 'stars') return `${value}%`
    return `${value}%`
  }
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
