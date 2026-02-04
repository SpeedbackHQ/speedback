import { supabase } from '@/lib/supabase'
import { SurveyPlayer } from '@/components/SurveyPlayer'
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
    .eq('is_active', true)
    .single()

  if (surveyError || !survey) {
    return null
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('order_index')

  // Debug: Log fetched questions
  console.log('[getSurvey] Fetched questions for survey', surveyId, ':', questions?.length, 'questions')
  console.log('[getSurvey] Questions:', questions?.map(q => ({ id: q.id, type: q.type, text: q.text })))

  if (questionsError) {
    console.log('[getSurvey] Questions error:', questionsError)
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

  return <SurveyPlayer survey={survey} />
}
