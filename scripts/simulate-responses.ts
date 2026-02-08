/**
 * Simulate survey responses for testing
 *
 * Usage:
 *   npx tsx scripts/simulate-responses.ts <survey_id> [count] [--clean]
 *
 * Examples:
 *   npx tsx scripts/simulate-responses.ts abc123          # 15 responses
 *   npx tsx scripts/simulate-responses.ts abc123 20       # 20 responses
 *   npx tsx scripts/simulate-responses.ts abc123 10 --clean  # delete existing first
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// --- Random helpers ---

/** Normal distribution using Box-Muller, clamped to [min, max] */
function gaussian(mean: number, stddev: number, min: number, max: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  const value = Math.round(mean + z * stddev)
  return Math.max(min, Math.min(max, value))
}

/** Pick a random element from an array */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Pick a random subset (1 to all) from an array */
function pickRandomSubset(arr: string[]): string[] {
  const count = 1 + Math.floor(Math.random() * arr.length)
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// --- Answer generation by type ---

interface QuestionRow {
  id: string
  type: string
  config: Record<string, unknown>
}

function generateAnswer(question: QuestionRow): unknown {
  const { type, config } = question
  const rawOptions = (config.options as string[]) || ['Option 1', 'Option 2', 'Option 3']
  const options = rawOptions.filter(o => o.trim() !== '')

  switch (type) {
    // Binary
    case 'swipe': {
      const showMeh = config.show_meh === true
      if (showMeh) {
        return pickRandom(['left', 'right', 'right', 'right', 'up'])
      }
      return pickRandom(['left', 'right', 'right', 'right'])
    }

    // Scale types (0-100)
    case 'slider':
    case 'thermometer':
      return gaussian(65, 20, 0, 100)

    case 'bullseye':
      return gaussian(60, 25, 0, 100)

    case 'stars': {
      // Stars converts 1-5 to 0-100: Math.round((rating / 5) * 100)
      // So valid values are 20, 40, 60, 80, 100
      const starValues = [20, 40, 60, 60, 80, 80, 80, 100, 100]
      return pickRandom(starValues)
    }

    // Multi-select
    case 'tap':
      return pickRandomSubset(options)

    // Binary (left/right only)
    case 'toggle_switch':
    case 'tug_of_war':
      return pickRandom(['left', 'right', 'right', 'right'])

    // Scale types (Phase B)
    case 'dial':
    case 'tilt':
      return gaussian(60, 25, 0, 100)

    case 'press_hold':
      return gaussian(55, 25, 0, 100)

    case 'countdown_tap':
      return gaussian(50, 20, 0, 100)

    // All single-select types
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
      return pickRandom(options)

    default:
      console.warn(`  Unknown type "${type}", using random option`)
      return pickRandom(options)
  }
}

/** Generate realistic duration: 3-8 seconds per question, with noise */
function generateDuration(questionCount: number): number {
  const perQuestion = 3000 + Math.random() * 5000
  const total = perQuestion * questionCount
  const noise = 0.8 + Math.random() * 0.4
  return Math.round(total * noise)
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2)
  const cleanFlag = args.includes('--clean')
  const positionalArgs = args.filter(a => !a.startsWith('--'))

  const surveyId = positionalArgs[0]
  const respondentCount = parseInt(positionalArgs[1] || '15', 10)

  if (!surveyId) {
    console.error('Usage: npx tsx scripts/simulate-responses.ts <survey_id> [count] [--clean]')
    console.error('')
    console.error('Options:')
    console.error('  count     Number of simulated respondents (default: 15)')
    console.error('  --clean   Delete existing responses for this survey first')
    process.exit(1)
  }

  // Verify the survey exists
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id, title')
    .eq('id', surveyId)
    .single()

  if (surveyError || !survey) {
    console.error(`Survey "${surveyId}" not found:`, surveyError?.message || 'Not found')
    process.exit(1)
  }

  console.log(`\nSurvey: "${survey.title}" (${surveyId})`)

  // Fetch questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, type, config')
    .eq('survey_id', surveyId)
    .order('order_index')

  if (questionsError || !questions?.length) {
    console.error('Failed to fetch questions:', questionsError?.message || 'No questions found')
    process.exit(1)
  }

  console.log(`Questions: ${questions.length}`)
  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.type}] config: ${JSON.stringify(q.config).slice(0, 60)}...`)
  })

  // Clean existing responses if requested
  if (cleanFlag) {
    const { error: deleteError } = await supabase
      .from('responses')
      .delete()
      .eq('survey_id', surveyId)

    if (deleteError) {
      console.error('Failed to clean responses:', deleteError.message)
    } else {
      console.log('\nCleaned existing responses.')
    }
  }

  // Generate and insert responses
  console.log(`\nGenerating ${respondentCount} responses...\n`)

  let successCount = 0
  for (let i = 0; i < respondentCount; i++) {
    const answers = questions.map(q => ({
      question_id: q.id,
      value: generateAnswer(q as QuestionRow),
    }))

    const duration_ms = generateDuration(questions.length)

    const { error: insertError } = await supabase.from('responses').insert({
      survey_id: surveyId,
      answers,
      duration_ms,
    })

    if (insertError) {
      console.error(`  [${i + 1}/${respondentCount}] Error: ${insertError.message}`)
    } else {
      const durationSec = (duration_ms / 1000).toFixed(1)
      const preview = answers.map(a => {
        const val = a.value
        if (typeof val === 'string') return val
        if (typeof val === 'number') return `${val}%`
        if (Array.isArray(val)) return val.join(', ')
        return String(val)
      }).join(' | ')
      console.log(`  [${i + 1}/${respondentCount}] ${durationSec}s  ${preview}`)
      successCount++
    }
  }

  console.log(`\nDone! Inserted ${successCount}/${respondentCount} responses.`)
  console.log(`View results at: /admin/surveys/${surveyId}?tab=responses`)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
