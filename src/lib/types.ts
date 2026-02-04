// Re-export types from supabase for convenience
export type { Organization, Survey, Question, Response, QuestionType } from './supabase'
import type { Question } from './supabase'

// Extended types for the app
export interface SurveyWithQuestions {
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
  questions: Question[]
}

export interface QuestionConfig {
  // Swipe
  left_label?: string
  right_label?: string
  up_label?: string
  // Slider
  min_label?: string
  max_label?: string
  // Tap
  options?: string[]
  multi_select?: boolean
  // Rank
  items?: string[]
}

// Answer types
export type SwipeAnswer = 'left' | 'right' | 'up'
export type SliderAnswer = number // 0-100
export type TapAnswer = string[] // selected options
export type RadioAnswer = string // single selected option
export type RankAnswer = string[] // ordered items
export type CounterAnswer = number // tap count

export type AnswerValue = SwipeAnswer | SliderAnswer | TapAnswer | RadioAnswer | RankAnswer | CounterAnswer
