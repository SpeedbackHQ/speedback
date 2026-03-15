import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
// Core question types + mechanics for single-select and scale
export type QuestionType =
  | 'swipe' | 'this_or_that' | 'slider' | 'tap' | 'rank' | 'counter'
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
  // Wheel
  | 'wheel'
  // Multi-select games
  | 'paint_splatter' | 'bingo_card' | 'shopping_cart' | 'sticker_board'
  | 'jar_fill' | 'conveyor_belt' | 'magnet_board' | 'claw_machine'
  // Qualitative
  | 'short_text' | 'mad_libs' | 'emoji_reaction' | 'word_cloud' | 'voice_note'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Survey {
  id: string
  org_id: string
  user_id?: string // User who owns this survey
  title: string
  branding_config: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    mascot_enabled?: boolean
    demo_leaderboard?: Array<{ initials: string; duration_ms: number }>
  }
  thank_you_message: string
  is_active: boolean
  max_responses?: number | null // null = unlimited (paid); default 25 (free)
  context?: Record<string, unknown> // Optional metadata: audience_size, event_type, industry
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
    follow_up_value?: unknown
    time_spent_ms?: number
  }>
  completed_at: string
  duration_ms: number | null
  initials: string | null
}

export interface UserProfile {
  id: string // References auth.users(id)
  display_name: string | null
  plan_type: 'free' | 'starter' | 'per-event'
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan_type: 'free' | 'starter' | 'per-event'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}
