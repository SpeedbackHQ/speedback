/**
 * Seed demo surveys for SpeedBack
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *   npx tsx scripts/seed-demo.ts --clean   # delete demo surveys first
 *
 * Prerequisites:
 *   - .env.local with SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *   - At least one user signed up (the script uses the first user it finds)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// --- Get the first user's ID ---
async function getUserId(): Promise<string> {
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1)
    .single()
  if (!data?.id) {
    console.error('No users found. Sign up at least one user first.')
    process.exit(1)
  }
  return data.id
}

// --- Question definitions ---
type Q = { type: string; text: string; config: Record<string, unknown> }

const EVENT_FEEDBACK_QUESTIONS: Q[] = [
  { type: 'swipe', text: 'Would you come to this event again?', config: { left_label: 'Probably not', right_label: 'Definitely!' } },
  { type: 'swipe', text: 'Would you recommend it to a friend?', config: { left_label: 'No', right_label: 'Yes!' } },
  { type: 'stars', text: 'Overall rating', config: {} },
  { type: 'slider', text: 'How was the pacing?', config: { min_label: 'Too slow', max_label: 'Too fast' } },
  { type: 'tap', text: 'Best part of the event?', config: { options: ['The content', 'The people', 'The venue', 'The food', 'The energy'] } },
  { type: 'thermometer', text: 'Your energy level right now', config: { min_label: 'Running on empty', max_label: 'Fully charged' } },
  { type: 'short_text', text: 'One thing we could improve?', config: { placeholder: 'Any thoughts...', max_length: 140 } },
]

const TEAM_PULSE_QUESTIONS: Q[] = [
  { type: 'swipe', text: 'Are you enjoying the work you\'re doing?', config: { left_label: 'Not really', right_label: 'Loving it' } },
  { type: 'thermometer', text: 'Energy level this week?', config: { min_label: 'Running on fumes', max_label: 'Fully charged' } },
  { type: 'this_or_that', text: 'What mattered more this week?', config: { left_label: 'Deep work', right_label: 'Collaboration' } },
  { type: 'bubble_pop', text: 'What\'s taking most of your time?', config: { options: ['Deep work', 'Meetings', 'Admin', 'Firefighting', 'Learning'] } },
  { type: 'stars', text: 'How supported do you feel by the team?', config: {} },
  { type: 'short_text', text: 'Anything on your mind?', config: { placeholder: 'Optional — skip if nothing comes to mind', max_length: 200, optional: true } },
]

// --- Survey definitions ---
interface SurveyDef {
  slug: string
  title: string
  thank_you_message: string
  questions: Q[]
}

const DEMO_SURVEYS: SurveyDef[] = [
  {
    slug: 'demo-event-feedback',
    title: 'Event Feedback (Demo)',
    thank_you_message: 'Thanks for your feedback! 🎉',
    questions: EVENT_FEEDBACK_QUESTIONS,
  },
  {
    slug: 'demo-team-pulse',
    title: 'Team Pulse Check (Demo)',
    thank_you_message: 'Thanks — your voice matters! 💜',
    questions: TEAM_PULSE_QUESTIONS,
  },
]

// --- Main ---
async function main() {
  const clean = process.argv.includes('--clean')
  const userId = await getUserId()

  console.log(`User ID: ${userId}`)

  if (clean) {
    console.log('Cleaning existing demo surveys...')
    const { data: existing } = await supabase
      .from('surveys')
      .select('id')
      .eq('folder', 'Demo')

    if (existing) {
      for (const s of existing) {
        await supabase.from('responses').delete().eq('survey_id', s.id)
        await supabase.from('leads').delete().eq('survey_id', s.id)
        await supabase.from('questions').delete().eq('survey_id', s.id)
        await supabase.from('surveys').delete().eq('id', s.id)
      }
      console.log(`  Deleted ${existing.length} surveys`)
    }
  }

  // Get or create organization
  let { data: org } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (!org) {
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({ name: 'Demo Organization' })
      .select()
      .single()
    org = newOrg
  }

  if (!org) {
    console.error('Failed to get or create organization')
    process.exit(1)
  }

  // Create surveys
  for (const def of DEMO_SURVEYS) {
    const { data: exists } = await supabase
      .from('surveys')
      .select('id')
      .eq('slug', def.slug)
      .maybeSingle()

    if (exists) {
      console.log(`  Skipped ${def.slug} — already exists`)
      continue
    }

    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        org_id: org.id,
        user_id: userId,
        title: def.title,
        slug: def.slug,
        folder: 'Demo',
        thank_you_message: def.thank_you_message,
        is_active: true,
        max_responses: null,
        branding_config: { primary_color: '#8B5CF6', mascot_enabled: true },
      })
      .select('id')
      .single()

    if (surveyError || !survey) {
      console.error(`  Failed to create ${def.slug}:`, surveyError)
      continue
    }

    const questionInserts = def.questions.map((q, i) => ({
      survey_id: survey.id,
      type: q.type,
      text: q.text,
      config: q.config,
      order_index: i,
    }))

    const { error: qError } = await supabase.from('questions').insert(questionInserts)

    if (qError) {
      console.error(`  Failed to create questions for ${def.slug}:`, qError)
    } else {
      console.log(`  Created ${def.slug} — ${def.questions.length} questions`)
    }
  }

  console.log('\nDone! Open your dashboard to see the demo surveys.')
}

main().catch(console.error)
