import { supabase } from './supabase'
import type { FestivalConfig } from './supabase'

export interface FestivalSlugConfig {
  survey_slug: string
  type: 'workshop' | 'show' | 'community' | 'meta'
  day?: string
  workshops?: Array<{ name: string; facilitator: string }>
}

export async function getFestivalConfig(festivalSlug: string): Promise<FestivalConfig | null> {
  const { data, error } = await supabase
    .from('festival_configs')
    .select('*')
    .eq('festival_slug', festivalSlug)
    .single()

  if (error || !data) return null
  return data as FestivalConfig
}

export function getSlugConfig(festivalConfig: FestivalConfig, slug: string): FestivalSlugConfig | null {
  const config = festivalConfig.config[slug]
  if (!config) return null
  return config as FestivalSlugConfig
}

export async function getSurveyBySlug(surveySlug: string) {
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('*')
    .eq('slug', surveySlug)
    .single()

  if (surveyError || !survey) return null

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', survey.id)
    .order('order_index')

  if (questionsError) return null

  return { ...survey, questions: questions || [] }
}
