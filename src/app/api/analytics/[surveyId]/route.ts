import { NextRequest, NextResponse } from 'next/server'
import { getEventCount, getAvgProperty, getDropoffByQuestion } from '@/lib/posthog-server'

interface RouteParams {
  params: Promise<{ surveyId: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { surveyId } = await params
  const questionCount = parseInt(req.nextUrl.searchParams.get('questions') || '0')

  const [started, completed, avgTimeMs, dropoff] = await Promise.all([
    getEventCount('survey_started', surveyId),
    getEventCount('survey_completed', surveyId),
    getAvgProperty('survey_completed', 'total_time_ms', surveyId),
    questionCount > 0 ? getDropoffByQuestion(surveyId, questionCount) : Promise.resolve([]),
  ])

  const completionRate = started > 0 ? Math.round((completed / started) * 100) : null
  const avgTimeSec = avgTimeMs != null ? Math.round(avgTimeMs / 1000) : null

  return NextResponse.json({
    started,
    completed,
    completionRate,
    avgTimeSec,
    dropoff,
  })
}
