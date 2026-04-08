import { getFestivalConfig, getSlugConfig, getSurveyBySlug } from '@/lib/festival'
import { SurveyPlayer } from '@/components/SurveyPlayer'
import { SurveyClosed } from '@/components/SurveyClosed'
import { WorkshopPicker } from '@/components/WorkshopPicker'
import { notFound } from 'next/navigation'

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

  // 4. Workshop slugs → show picker first
  if (slugConfig.type === 'workshop' && slugConfig.workshops) {
    return (
      <WorkshopPicker
        workshops={slugConfig.workshops}
        dayLabel={slugConfig.day || ''}
        survey={survey}
      />
    )
  }

  // 5. All other types → render survey directly
  return <SurveyPlayer survey={survey} />
}
