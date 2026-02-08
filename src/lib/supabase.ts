import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
// Core question types + mechanics for single-select and scale
export type QuestionType =
  | 'swipe' | 'slider' | 'tap' | 'rank' | 'counter'
  | 'tap_meter' | 'rolodex' | 'stars' | 'thermometer'
  | 'fanned' | 'fanned_swipe' | 'stacked'
  // Mini-games
  | 'tilt_maze' | 'racing_lanes' | 'gravity_drop'
  | 'bubble_pop' | 'bullseye' | 'slingshot' | 'scratch_card'
  | 'treasure_chest' | 'pinata'
  // Phase B
  | 'dial' | 'press_hold' | 'toggle_switch' | 'spin_stop'
  | 'countdown_tap' | 'door_choice' | 'whack_a_mole'
  | 'tug_of_war' | 'tilt' | 'flick'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Survey {
  id: string
  org_id: string
  title: string
  branding_config: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    mascot_enabled?: boolean
  }
  thank_you_message: string
  is_active: boolean
  created_at: string
}

export interface Question {
  id: string
  survey_id: string
  type: QuestionType
  text: string
  config: {
    // For swipe: labels for left/right/up
    left_label?: string
    right_label?: string
    up_label?: string
    // For slider: min/max labels
    min_label?: string
    max_label?: string
    // For tap: options array
    options?: string[]
    multi_select?: boolean
    // For rank: items array
    items?: string[]
  }
  order_index: number
  created_at: string
}

export interface Response {
  id: string
  survey_id: string
  answers: Array<{
    question_id: string
    value: unknown // varies by question type
  }>
  completed_at: string
  duration_ms: number | null
}
