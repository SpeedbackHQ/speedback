import { supabase } from '@/lib/supabase'
import { SurveyPlayer } from '@/components/SurveyPlayer'
import { SurveyFull } from '@/components/SurveyFull'
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

async function getResponseCount(surveyId: string): Promise<number> {
  const { count } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .eq('survey_id', surveyId)
  return count ?? 0
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

  // Enforce free tier response limit (null/undefined = unlimited for paid accounts)
  if (survey.max_responses != null) {
    const count = await getResponseCount(surveyId)
    if (count >= survey.max_responses) {
      return <SurveyFull surveyTitle={survey.title} />
    }
  }

  // Determine if Speedback branding should be shown (for free surveys)
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('plan_type, id')
    .eq('id', survey.user_id)
    .maybeSingle()

  // Get survey owner's email to check if test account
  const { data: ownerUser } = await supabase.auth.admin.getUserById(survey.user_id)
  const isTestAccount = ownerUser?.user?.email === 'millerdjonathan@proton.me'

  const showSpeedbackBranding =
    !isTestAccount && (
      !userProfile ||
      userProfile.plan_type === 'free' ||
      survey.max_responses !== null
    )

  return <SurveyPlayer survey={survey} showSpeedbackBranding={showSpeedbackBranding} />
}
