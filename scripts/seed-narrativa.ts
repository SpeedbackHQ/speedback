/**
 * Seed all Narrativa Improv Festival surveys and festival config
 *
 * Usage:
 *   npx tsx scripts/seed-narrativa.ts
 *   npx tsx scripts/seed-narrativa.ts --clean   # delete existing Narrativa surveys first
 *
 * Idempotent: skips surveys whose slug already exists.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// --- Owner user ID (millerdjonathan@proton.me) ---
async function getOwnerUserId(): Promise<string> {
  // Look up the owner by checking user_profiles
  const { data } = await supabase
    .from('surveys')
    .select('user_id')
    .limit(1)
    .single()
  if (!data?.user_id) {
    console.error('No existing surveys found — cannot determine owner user_id. Create at least one survey first.')
    process.exit(1)
  }
  return data.user_id
}

// --- Question type shortcuts ---
type Q = {
  type: string
  text: string
  config: Record<string, unknown>
}

// --- Survey definitions ---

const WORKSHOP_QUESTIONS: Q[] = [
  // Swipe stack (Q1-Q4)
  { type: 'swipe', text: 'How valuable was this workshop?', config: { left_label: 'Not really', right_label: 'Very!' } },
  { type: 'swipe', text: 'Would you recommend it?', config: { left_label: 'No', right_label: 'Yes!' } },
  { type: 'swipe', text: 'Would you take another workshop by this facilitator?', config: { left_label: 'No', right_label: 'Absolutely' } },
  { type: 'swipe', text: 'Worth the price?', config: { left_label: 'Not really', right_label: 'Definitely' } },
  // This or That (Q5-Q6)
  { type: 'this_or_that', text: 'Content or facilitator — what mattered more?', config: { left_label: 'Content', right_label: 'Facilitator' } },
  { type: 'this_or_that', text: 'Better suited for beginners or experienced players?', config: { left_label: 'Beginners', right_label: 'Experienced' } },
  // Other mechanics (Q7-Q9)
  { type: 'stars', text: 'Overall rating', config: {} },
  { type: 'slider', text: 'Pacing', config: { min_label: 'Too Slow', max_label: 'Too Fast' } },
  { type: 'tap', text: 'Best part of the workshop?', config: { options: ['Concepts', 'Exercises', 'Facilitator Energy', 'Group Dynamic'] } },
  // Q10 — conditional: only if Q1 or Q2 negative
  { type: 'short_text', text: 'One thing to improve?', config: { placeholder: 'What would make it better?', max_length: 140, show_conditions: [{ question_index: 0, value: 'left' }, { question_index: 1, value: 'left' }] } },
]

function makeShowQuestions(actNames: string[]): Q[] {
  return [
    // Swipe stack
    { type: 'swipe', text: 'Would you see these performers again?', config: { left_label: 'Probably not', right_label: 'Definitely' } },
    { type: 'swipe', text: 'Tell your friends about tonight?', config: { left_label: 'Nah', right_label: 'For sure' } },
    { type: 'this_or_that', text: 'Better half of the show?', config: { left_label: 'First Half', right_label: 'Second Half' } },
    // Other mechanics
    { type: 'stars', text: 'Overall rating', config: {} },
    { type: 'slider', text: 'Your energy right now', config: { min_label: '😴', max_label: '🔥' } },
    { type: 'tap', text: 'Standout act of the night?', config: { options: actNames } },
    // Q7 — conditional: follow_up on Q4 (stars) if ≥ 4 stars (80/100)
    { type: 'short_text', text: 'What made it special?', config: { placeholder: 'Tell us...', max_length: 140, show_conditions: [{ question_index: 3, value: ['80', '100'] }] } },
  ]
}

const SHOW_THU_QUESTIONS = makeShowQuestions(['Tournus', "King's Whim", 'I Will Survive'])
const SHOW_FRI_QUESTIONS = makeShowQuestions(['Man Band', 'The Winchesters', 'Sound Off'])
const SHOW_SAT_QUESTIONS = makeShowQuestions(['Postcards', 'Object of Affection', "Roh's Choice"])

const OPENING_PARTY_QUESTIONS: Q[] = [
  { type: 'treasure_chest', text: 'Arriving energy?', config: { options: ['Just Getting Started', 'Warmed Up', 'Full Send'] } },
  { type: 'swipe', text: 'Met anyone interesting yet?', config: { left_label: 'Not yet', right_label: 'Yes!' } },
  { type: 'stars', text: 'Festival excitement level', config: {} },
]

const MURDER_MYSTERY_QUESTIONS: Q[] = [
  { type: 'stars', text: 'Was your character interesting to play?', config: {} },
  { type: 'swipe', text: 'Did you have enough to do and say throughout?', config: { left_label: 'Not enough', right_label: 'Plenty' } },
  { type: 'slider', text: 'Could you follow the mystery logic?', config: { min_label: 'Totally Lost', max_label: 'Crystal Clear' } },
  { type: 'swipe', text: 'Did you figure out the murderer?', config: { left_label: 'No', right_label: 'Yes' } },
  // Q4a — only if Q4 = Yes (right)
  { type: 'swipe', text: 'Did the reveal feel fair?', config: { left_label: 'Not really', right_label: 'Yes', show_conditions: [{ question_index: 3, value: 'right' }] } },
  // Q4b — only if Q4 = No (left)
  { type: 'this_or_that', text: 'Was that frustrating or fine?', config: { left_label: 'Frustrating', right_label: 'Fine, Part of the Fun', show_conditions: [{ question_index: 3, value: 'left' }] } },
  { type: 'slider', text: 'Pacing of the game', config: { min_label: 'Way Too Short', max_label: 'Way Too Long' } },
  { type: 'swipe', text: 'Did the ending feel satisfying?', config: { left_label: 'Not really', right_label: 'Yes!' } },
  { type: 'short_text', text: 'What would have made it better?', config: { placeholder: 'Any thoughts...', max_length: 140 } },
]

const CJR_QUESTIONS: Q[] = [
  { type: 'swipe', text: 'Did the game create real connection?', config: { left_label: 'Not really', right_label: 'Absolutely' } },
  { type: 'swipe', text: 'Would you play it again?', config: { left_label: 'Probably not', right_label: 'Yes!' } },
  { type: 'swipe', text: 'Would you recommend it to friends?', config: { left_label: 'No', right_label: 'Yes!' } },
  { type: 'stars', text: 'How was the facilitation?', config: {} },
  { type: 'slider', text: 'Pacing of the game', config: { min_label: 'Too Slow', max_label: 'Too Fast' } },
  { type: 'tap', text: 'Best part?', config: { options: ['The Questions', 'The Conversations', 'The Group Energy', 'The Format'] } },
  { type: 'short_text', text: 'One thing to improve?', config: { placeholder: 'Any thoughts...', max_length: 140 } },
]

const QUESTSCAPE_QUESTIONS: Q[] = [
  { type: 'swipe', text: 'Did you enjoy the experience?', config: { left_label: 'Not really', right_label: 'Loved it' } },
  { type: 'swipe', text: 'Easy enough to figure out?', config: { left_label: 'Confusing', right_label: 'Easy' } },
  { type: 'swipe', text: 'Any technical issues?', config: { left_label: 'No', right_label: 'Yes' } },
  // Q3a — only if Q3 = Yes (right = had issues)
  { type: 'short_text', text: 'What went wrong?', config: { placeholder: 'Describe the issue...', max_length: 140, show_conditions: [{ question_index: 2, value: 'right' }] } },
  { type: 'slider', text: 'Difficulty of the challenges', config: { min_label: 'Too Easy', max_label: 'Too Hard' } },
  { type: 'stars', text: 'Overall rating', config: {} },
  { type: 'tap', text: 'Best part?', config: { options: ['The Challenges', 'Exploring the City', 'Playing with the Group', 'Discovering New Places'] } },
  { type: 'short_text', text: 'What would make it better?', config: { placeholder: 'Any thoughts...', max_length: 140 } },
]

const CLOSING_QUESTIONS: Q[] = [
  { type: 'tap', text: 'This festival was...', config: { options: ['Life-Changing', 'Really Great', 'Worth It'] } },
  { type: 'swipe', text: 'Coming back next year?', config: { left_label: 'Not sure', right_label: 'Definitely!' } },
  { type: 'paint_splatter', text: 'Best part of Narrativa?', config: { options: ['Workshops', 'Shows', 'Community', 'Valencia', 'The People'], multi_select: true } },
]

const META_QUESTIONS: Q[] = [
  { type: 'stars', text: 'SpeedBack across the whole festival?', config: {} },
  { type: 'this_or_that', text: 'Did it get boring or stay fresh?', config: { left_label: 'Got Boring', right_label: 'Stayed Fresh' } },
  { type: 'tap', text: 'Favorite type of interaction?', config: { options: ['Swipes', 'Sliders', 'Stars', 'Taps', 'The Wild Game Ones'] } },
  { type: 'swipe', text: 'Would you use SpeedBack for your own events?', config: { left_label: 'No', right_label: 'Yes' } },
  // Q4a — only if Q4 = Yes (right)
  { type: 'paint_splatter', text: 'What type of events?', config: { options: ['Workshops', 'Conferences', 'Team Events', 'Community', 'Other'], multi_select: true, show_conditions: [{ question_index: 3, value: 'right' }] } },
  { type: 'swipe', text: 'Do you organize events professionally?', config: { left_label: 'No', right_label: 'Yes' } },
  // Q5a — only if Q5 = Yes (right) — email capture (index 5 in this array)
  { type: 'email_capture', text: 'Want to hear when SpeedBack launches for event planners?', config: { placeholder: 'your@email.com', show_organizer_checkbox: true, show_conditions: [{ question_index: 5, value: 'right' }] } },
  { type: 'short_text', text: 'One thing to improve?', config: { placeholder: 'Any thoughts...', max_length: 140 } },
]

// --- All surveys to create ---
interface SurveyDef {
  slug: string
  title: string
  thank_you_message: string
  questions: Q[]
  intro_text?: string
}

const ALL_SURVEYS: SurveyDef[] = [
  {
    slug: 'narrativa-workshops',
    title: 'Workshop Feedback',
    thank_you_message: 'Thanks for your feedback! Enjoy the rest of Narrativa 🎭',
    questions: WORKSHOP_QUESTIONS,
  },
  {
    slug: 'narrativa-show-thu',
    title: 'Thursday Night Show',
    thank_you_message: 'Thanks! What a night 🌟',
    questions: SHOW_THU_QUESTIONS,
  },
  {
    slug: 'narrativa-show-fri',
    title: 'Friday Night Show',
    thank_you_message: 'Thanks! What a night 🌟',
    questions: SHOW_FRI_QUESTIONS,
  },
  {
    slug: 'narrativa-show-sat',
    title: 'Saturday Night Show',
    thank_you_message: 'Thanks! What a night 🌟',
    questions: SHOW_SAT_QUESTIONS,
  },
  {
    slug: 'narrativa-opening',
    title: 'Opening Party',
    thank_you_message: 'Welcome to Narrativa! 🎉',
    questions: OPENING_PARTY_QUESTIONS,
  },
  {
    slug: 'narrativa-murder-mystery',
    title: 'Murder Mystery',
    thank_you_message: 'Case closed! Thanks for playing 🔍',
    questions: MURDER_MYSTERY_QUESTIONS,
  },
  {
    slug: 'narrativa-cjr',
    title: 'Cozy Juicy Real',
    thank_you_message: 'Thanks for playing! Keep those conversations going 💬',
    questions: CJR_QUESTIONS,
  },
  {
    slug: 'narrativa-questscape',
    title: 'Questscape City Scavenger Hunt',
    thank_you_message: 'Thanks for testing Questscape! Your feedback helps Nick build it better 🏙️',
    questions: QUESTSCAPE_QUESTIONS,
  },
  {
    slug: 'narrativa-closing',
    title: 'Closing Celebration',
    thank_you_message: 'See you next year! 🎭❤️',
    questions: CLOSING_QUESTIONS,
  },
  {
    slug: 'narrativa-meta',
    title: 'SpeedBack Feedback',
    thank_you_message: 'Meta! Thanks for the feedback on our feedback tool ⚡',
    questions: META_QUESTIONS,
  },
]

// --- Festival config ---
const FESTIVAL_CONFIG = {
  'workshops-thu': {
    survey_slug: 'narrativa-workshops',
    type: 'workshop',
    day: 'Thursday Mar 26',
    workshops: [
      { name: 'Tournus (Mixer)', facilitator: 'Gael Doorneweerd-Perry' },
      { name: 'Fantasy', facilitator: 'Katy Schutte' },
      { name: 'Seven Basic Plots', facilitator: 'Feña Ortalli' },
      { name: 'Intro to Storytelling', facilitator: 'Rocío Barquilla' },
    ],
  },
  'workshops-fri': {
    survey_slug: 'narrativa-workshops',
    type: 'workshop',
    day: 'Friday Mar 27',
    workshops: [
      { name: 'Man Band', facilitator: 'Katy Schutte' },
      { name: 'No Words Needed', facilitator: 'Anne Rab' },
      { name: 'Didaskalia', facilitator: 'Feña Ortalli' },
      { name: 'The Art of Soft Editing', facilitator: 'Rocío Barquilla' },
    ],
  },
  'workshops-sat': {
    survey_slug: 'narrativa-workshops',
    type: 'workshop',
    day: 'Saturday Mar 28',
    workshops: [
      { name: 'Postcards From The Future Past', facilitator: 'Anne Rab' },
      { name: 'Black Mirror', facilitator: 'Katy Schutte' },
      { name: 'Improv Toolbox', facilitator: 'Gael Doorneweerd-Perry' },
      { name: 'Side Characters', facilitator: 'Adrià Lerma' },
    ],
  },
  'workshops-sun': {
    survey_slug: 'narrativa-workshops',
    type: 'workshop',
    day: 'Sunday Mar 29',
    workshops: [
      { name: 'The (Improvised) Improvised Play', facilitator: 'Gael Doorneweerd-Perry' },
      { name: 'Adventure Time', facilitator: 'Anne Rab' },
      { name: 'Improvised Dramaturgy', facilitator: 'Feña Ortalli' },
      { name: 'Object Work', facilitator: 'Adrià Lerma' },
    ],
  },
  'show-thu-mar26': { survey_slug: 'narrativa-show-thu', type: 'show' },
  'show-fri-mar27': { survey_slug: 'narrativa-show-fri', type: 'show' },
  'show-sat-mar28': { survey_slug: 'narrativa-show-sat', type: 'show' },
  'community-wed-opening': { survey_slug: 'narrativa-opening', type: 'community' },
  'community-wed-murder-mystery': { survey_slug: 'narrativa-murder-mystery', type: 'community' },
  'community-thu-cjr': { survey_slug: 'narrativa-cjr', type: 'community' },
  'community-fri-questscape': { survey_slug: 'narrativa-questscape', type: 'community' },
  'community-sun-closing': { survey_slug: 'narrativa-closing', type: 'community' },
  'meta-closing': { survey_slug: 'narrativa-meta', type: 'meta' },
}

// --- Main ---
async function main() {
  const clean = process.argv.includes('--clean')
  const userId = await getOwnerUserId()

  console.log(`Owner user ID: ${userId}`)

  if (clean) {
    console.log('Cleaning existing Narrativa surveys...')
    const { data: existing } = await supabase
      .from('surveys')
      .select('id')
      .eq('folder', 'Narrativa 2026')

    if (existing) {
      for (const s of existing) {
        await supabase.from('responses').delete().eq('survey_id', s.id)
        await supabase.from('leads').delete().eq('survey_id', s.id)
        await supabase.from('questions').delete().eq('survey_id', s.id)
        await supabase.from('surveys').delete().eq('id', s.id)
      }
      console.log(`  Deleted ${existing.length} surveys`)
    }
    await supabase.from('festival_configs').delete().eq('festival_slug', 'narrativa')
    console.log('  Deleted festival config')
  }

  // Get existing org or create placeholder
  const { data: existingSurvey } = await supabase
    .from('surveys')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  const orgId = existingSurvey?.org_id

  if (!orgId) {
    console.error('No org_id found. Create at least one survey manually first.')
    process.exit(1)
  }

  // Create surveys
  for (const def of ALL_SURVEYS) {
    // Check if slug already exists
    const { data: exists } = await supabase
      .from('surveys')
      .select('id')
      .eq('slug', def.slug)
      .maybeSingle()

    if (exists) {
      console.log(`  ⏭  ${def.slug} — already exists, skipping`)
      continue
    }

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        org_id: orgId,
        user_id: userId,
        title: def.title,
        slug: def.slug,
        folder: 'Narrativa 2026',
        thank_you_message: def.thank_you_message,
        is_active: true,
        max_responses: null, // unlimited
        branding_config: {
          primary_color: '#8B5CF6',
          mascot_enabled: false,
        },
      })
      .select('id')
      .single()

    if (surveyError || !survey) {
      console.error(`  ❌ Failed to create ${def.slug}:`, surveyError)
      continue
    }

    // Create questions
    const questionInserts = def.questions.map((q, i) => ({
      survey_id: survey.id,
      type: q.type,
      text: q.text,
      config: q.config,
      order_index: i,
    }))

    const { error: qError } = await supabase
      .from('questions')
      .insert(questionInserts)

    if (qError) {
      console.error(`  ❌ Failed to create questions for ${def.slug}:`, qError)
    } else {
      console.log(`  ✅ ${def.slug} — ${def.questions.length} questions`)
    }
  }

  // Create festival config
  const { data: existingConfig } = await supabase
    .from('festival_configs')
    .select('id')
    .eq('festival_slug', 'narrativa')
    .maybeSingle()

  if (existingConfig) {
    console.log('\n  ⏭  Festival config already exists, updating...')
    await supabase
      .from('festival_configs')
      .update({ config: FESTIVAL_CONFIG, name: 'Narrativa Improv Festival 2026' })
      .eq('festival_slug', 'narrativa')
  } else {
    const { error: fcError } = await supabase
      .from('festival_configs')
      .insert({
        festival_slug: 'narrativa',
        name: 'Narrativa Improv Festival 2026',
        config: FESTIVAL_CONFIG,
      })

    if (fcError) {
      console.error('  ❌ Failed to create festival config:', fcError)
    } else {
      console.log('\n  ✅ Festival config created')
    }
  }

  console.log('\nDone! 🎭')
  console.log('\nQR URLs:')
  for (const slug of Object.keys(FESTIVAL_CONFIG)) {
    console.log(`  https://speedback.fun/f/narrativa/${slug}`)
  }
}

main().catch(console.error)
