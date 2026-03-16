import type { QuestionType } from './supabase'

export interface QuestionTypeEntry {
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
      { type: 'swipe', label: 'Like / Dislike', emoji: '👍', description: 'Swipe yes or no', tooltip: '💡 Best for agree/disagree or like/dislike. Group multiple for rapid-fire streaks!' },
      { type: 'this_or_that', label: 'This or That', emoji: '⚔️', description: 'Pick A or B', tooltip: '💡 Great for "coffee or tea?" style preference questions' },
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
      { type: 'tilt_maze', label: 'Drop Zone', emoji: '📦', description: 'Drag to your answer' },
      { type: 'racing_lanes', label: 'Racing Lanes', emoji: '🏎️', description: 'Tap to race ahead' },
      { type: 'gravity_drop', label: 'Gravity Drop', emoji: '🪂', description: 'Drop into bucket' },
      { type: 'bubble_pop', label: 'Bubble Pop', emoji: '🫧', description: 'Pop before escape' },
      { type: 'slingshot', label: 'Slingshot', emoji: '🏹', description: 'Aim and launch' },
      { type: 'scratch_card', label: 'Scratch Card', emoji: '🎫', description: 'Scratch to reveal' },
      { type: 'treasure_chest', label: 'Treasure Chest', emoji: '🏴‍☠️', description: 'Tap to crack open' },
      { type: 'pinata', label: 'Pinata', emoji: '🪅', description: 'Smash to reveal' },
      { type: 'spin_stop', label: 'Spin & Stop', emoji: '🎰', description: 'Tap to stop the reel' },
      { type: 'door_choice', label: 'Door Choice', emoji: '🚪', description: 'Open a door' },
      { type: 'whack_a_mole', label: 'Whack-a-Mole', emoji: '🔨', description: 'Bonk your pick' },
      { type: 'flick', label: 'Flick Cards', emoji: '📲', description: 'Flick through & pick' },
      { type: 'wheel', label: 'Spin the Wheel', emoji: '🎡', description: 'Spin to pick' },
    ],
  },
  'Multi-Select': {
    description: 'Choose multiple options',
    types: [
      { type: 'tap', label: 'Tap to Select', emoji: '💥', description: 'Tap all that apply' },
      { type: 'paint_splatter', label: 'Paint Splatter', emoji: '🎨', description: 'Splash your picks' },
      { type: 'bingo_card', label: 'Bingo Card', emoji: '🎰', description: 'Stamp your picks' },
      { type: 'shopping_cart', label: 'Shopping Cart', emoji: '🛒', description: 'Add to cart' },
      { type: 'sticker_board', label: 'Sticker Board', emoji: '🏷️', description: 'Peel & place' },
      { type: 'jar_fill', label: 'Jar Fill', emoji: '🫙', description: 'Fill the jar' },
      { type: 'conveyor_belt', label: 'Conveyor Belt', emoji: '🏭', description: 'Grab from belt' },
      { type: 'magnet_board', label: 'Magnet Board', emoji: '🧲', description: 'Magnetize picks' },
      { type: 'claw_machine', label: 'Claw Machine', emoji: '🕹️', description: 'Grab prizes' },
    ],
  },
  'Scale/Rating': {
    description: 'Rate on a scale',
    types: [
      { type: 'slider', label: 'Emoji Slider', emoji: '😊', description: 'Slide to rate' },
      { type: 'stars', label: 'Star Rating', emoji: '⭐', description: '1-5 stars' },
      { type: 'thermometer', label: 'Thermometer', emoji: '🌡️', description: 'Hot or cold?' },
      { type: 'bullseye', label: 'Bullseye', emoji: '🎯', description: 'Hit the target' },
      { type: 'dial', label: 'Dial', emoji: '🎛️', description: 'Turn the knob' },
      { type: 'press_hold', label: 'Press & Hold', emoji: '👇', description: 'Hold to fill' },
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
      { type: 'email_capture', label: 'Email Capture', emoji: '📧', description: 'Collect email leads' },
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

// Reverse lookup: question type -> category name
const _categoryLookup: Record<string, string> = {}
Object.entries(questionCategories).forEach(([category, { types }]) => {
  types.forEach(t => {
    _categoryLookup[t.type] = category
  })
})

export function getQuestionCategory(type: QuestionType): string {
  return _categoryLookup[type] || 'Unknown'
}

// Mechanics that reward speed over deliberation
const SPEED_BIASED_MECHANICS: Set<string> = new Set([
  'swipe', 'tap_meter', 'racing_lanes', 'conveyor_belt',
])

// Categories where deliberation matters for response quality
const DELIBERATION_CATEGORIES: Set<string> = new Set([
  'Scale/Rating', 'Open Response',
])

export function getSpeedBiasWarning(type: QuestionType): string | null {
  if (!SPEED_BIASED_MECHANICS.has(type)) return null
  const category = getQuestionCategory(type)
  if (!DELIBERATION_CATEGORIES.has(category)) return null
  return `This mechanic rewards speed, which may reduce response quality for ${category.toLowerCase()} questions.`
}
