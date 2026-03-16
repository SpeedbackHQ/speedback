import { getFestivalConfig, getSlugConfig, getSurveyBySlug } from '@/lib/festival'
import { SurveyPlayer } from '@/components/SurveyPlayer'
import { SurveyClosed } from '@/components/SurveyClosed'
import { WorkshopPicker } from '@/components/WorkshopPicker'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ festival: string; slug: string }>
}

export default async function FestivalSurveyPage({ params }: PageProps) {
  const { festival, slug } = await params

  // 1. Fetch festival config
  const festivalConfig = await getFestivalConfig(festival)
  if (!festivalConfig) notFound()

  // 2. Look up this slug in the config
  const slugConfig = getSlugConfig(festivalConfig, slug)
  if (!slugConfig) notFound()

  // 3. Fetch the survey by its slug
  const survey = await getSurveyBySlug(slugConfig.survey_slug)
  if (!survey) notFound()

  if (!survey.is_active) {
    return <SurveyClosed surveyTitle={survey.title} />
  }

  // Determine branding visibility
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('plan_type, id')
    .eq('id', survey.user_id)
    .maybeSingle()

  const { data: ownerUser } = await supabase.auth.admin.getUserById(survey.user_id)
  const isTestAccount = ownerUser?.user?.email === 'millerdjonathan@proton.me'

  const showSpeedbackBranding =
    !isTestAccount && (
      !userProfile ||
      userProfile.plan_type === 'free' ||
      survey.max_responses !== null
    )

  // 4. Workshop slugs → show picker first
  if (slugConfig.type === 'workshop' && slugConfig.workshops) {
    return (
      <WorkshopPicker
        workshops={slugConfig.workshops}
        dayLabel={slugConfig.day || ''}
        survey={survey}
        showSpeedbackBranding={showSpeedbackBranding}
      />
    )
  }

  // 5. All other types → render survey directly
  return <SurveyPlayer survey={survey} showSpeedbackBranding={showSpeedbackBranding} />
}
