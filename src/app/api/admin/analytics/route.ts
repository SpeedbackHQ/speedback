import { NextResponse } from 'next/server'
import { getUser, createServerSupabaseClient } from '@/lib/auth'
import { isOwner } from '@/lib/owner'
import { questionCategories, questionTypeInfo, getQuestionCategory } from '@/lib/question-types'
import {
  getAnswersByQuestionType,
  getAbandonmentsByQuestionType,
  getPlatformEventCounts,
  getCompletionCurves,
  getSequenceEffects,
} from '@/lib/posthog-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Owner-only access
  const user = await getUser()
  if (!user || !isOwner(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createServerSupabaseClient()

  // Run all data fetches in parallel
  const [
    answersByType,
    abandonmentsByType,
    platformCounts,
    completionCurves,
    sequenceEffects,
    surveysResult,
    responsesResult,
    questionsResult,
    recentResponses,
  ] = await Promise.all([
    getAnswersByQuestionType(),
    getAbandonmentsByQuestionType(),
    getPlatformEventCounts(),
    getCompletionCurves(),
    getSequenceEffects(),
    supabase.from('surveys').select('*', { count: 'exact', head: true }),
    supabase.from('responses').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('type'),
    // Fetch recent responses with answers for quality analysis
    supabase.from('responses').select('answers').order('completed_at', { ascending: false }).limit(5000),
  ])

  // Question type usage counts from Supabase
  const usageCounts: Record<string, number> = {}
  if (questionsResult.data) {
    for (const q of questionsResult.data) {
      usageCounts[q.type] = (usageCounts[q.type] || 0) + 1
    }
  }

  // Average survey length
  const totalQuestions = questionsResult.data?.length || 0
  const totalSurveys = surveysResult.count || 0
  const avgSurveyLength = totalSurveys > 0 ? totalQuestions / totalSurveys : null

  // Build question ID -> type lookup for quality analysis
  // (We don't have question data in responses, so we analyze based on answer value patterns)
  const qualitySignals: Record<string, {
    avgCharCount?: number
    avgSelectionsCount?: number
    distributionSpread?: number
  }> = {}

  // To compute quality signals, we need to know which question type each answer belongs to.
  // Since responses only store question_id (not type), we fetch all questions to build a lookup.
  const { data: allQuestions } = await supabase.from('questions').select('id, type')
  const questionTypeMap: Record<string, string> = {}
  if (allQuestions) {
    for (const q of allQuestions) {
      questionTypeMap[q.id] = q.type
    }
  }

  // Process response quality signals
  if (recentResponses.data) {
    const textLengths: Record<string, number[]> = {}
    const selectCounts: Record<string, number[]> = {}
    const scaleValues: Record<string, number[]> = {}

    const textTypes = new Set(['short_text', 'mad_libs'])
    const multiSelectTypes = new Set(['tap', 'paint_splatter', 'bingo_card', 'shopping_cart', 'sticker_board', 'jar_fill', 'conveyor_belt', 'magnet_board', 'claw_machine', 'word_cloud'])
    const scaleTypes = new Set(['slider', 'thermometer', 'bullseye', 'stars', 'dial', 'press_hold', 'countdown_tap', 'tilt'])

    for (const response of recentResponses.data) {
      if (!Array.isArray(response.answers)) continue
      for (const answer of response.answers as Array<{ question_id: string; value: unknown }>) {
        const qType = questionTypeMap[answer.question_id]
        if (!qType) continue

        if (textTypes.has(qType) && typeof answer.value === 'string') {
          if (!textLengths[qType]) textLengths[qType] = []
          textLengths[qType].push(answer.value.length)
        } else if (multiSelectTypes.has(qType) && Array.isArray(answer.value)) {
          if (!selectCounts[qType]) selectCounts[qType] = []
          selectCounts[qType].push(answer.value.length)
        } else if (scaleTypes.has(qType) && typeof answer.value === 'number') {
          if (!scaleValues[qType]) scaleValues[qType] = []
          scaleValues[qType].push(answer.value)
        }
      }
    }

    // Compute averages and standard deviations
    for (const [qType, lengths] of Object.entries(textLengths)) {
      if (lengths.length > 0) {
        qualitySignals[qType] = { avgCharCount: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) }
      }
    }
    for (const [qType, counts] of Object.entries(selectCounts)) {
      if (counts.length > 0) {
        qualitySignals[qType] = { avgSelectionsCount: +(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1) }
      }
    }
    for (const [qType, values] of Object.entries(scaleValues)) {
      if (values.length > 1) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
        qualitySignals[qType] = { distributionSpread: +Math.sqrt(variance).toFixed(1) }
      }
    }
  }

  // Build mechanics array — one entry per question type
  const allTypes = new Set<string>()
  Object.values(questionCategories).forEach(cat => cat.types.forEach(t => allTypes.add(t.type)))

  const mechanics = Array.from(allTypes).map(type => {
    const info = questionTypeInfo[type as keyof typeof questionTypeInfo]
    const answerData = answersByType[type]
    return {
      type,
      label: info?.label || type,
      emoji: info?.emoji || '❓',
      category: getQuestionCategory(type as any),
      usageCount: usageCounts[type] || 0,
      totalAnswers: answerData?.count || 0,
      avgTimeSec: answerData?.avgTimeMs != null ? +(answerData.avgTimeMs / 1000).toFixed(1) : null,
      abandonmentCount: abandonmentsByType[type] || 0,
      ...(qualitySignals[type] || {}),
    }
  })

  // Platform stats
  const completionRate = platformCounts.totalStarts > 0
    ? Math.round((platformCounts.totalCompletions / platformCounts.totalStarts) * 100)
    : null
  const avgCompletionTimeSec = platformCounts.avgCompletionTimeMs != null
    ? Math.round(platformCounts.avgCompletionTimeMs / 1000)
    : null

  return NextResponse.json({
    platform: {
      totalSurveys,
      totalResponses: responsesResult.count || 0,
      totalStarts: platformCounts.totalStarts,
      totalCompletions: platformCounts.totalCompletions,
      overallCompletionRate: completionRate,
      avgCompletionTimeSec,
      avgSurveyLength: avgSurveyLength != null ? +avgSurveyLength.toFixed(1) : null,
    },
    mechanics,
    completionCurves,
    sequenceEffects,
    fetchedAt: new Date().toISOString(),
  })
}
