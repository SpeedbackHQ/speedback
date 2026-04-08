import { supabase } from '@/lib/supabase'
import { SurveyPlayer } from '@/components/SurveyPlayer'
import { SurveyClosed } from '@/components/SurveyClosed'
import { notFound } from 'next/navigation'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ surveyId: string }>
}

async function getSurvey(surveyId: string) {
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single()

  if (surveyError || !survey) {
    return null
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('order_index')

  if (questionsError) {
    return null
  }

  return { ...survey, questions: questions || [] }
}

export default async function PlaySurveyPage({ params }: PageProps) {
  const { surveyId } = await params
  const survey = await getSurvey(surveyId)

  if (!survey) {
    notFound()
  }

  // Paused surveys show a friendly "closed" message instead of 404
  if (!survey.is_active) {
    return <SurveyClosed surveyTitle={survey.title} />
  }

  return <SurveyPlayer survey={survey} />
}
