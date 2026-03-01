// Server-side PostHog Query API wrapper
// Uses POSTHOG_PERSONAL_API_KEY (never exposed to client)

const POSTHOG_HOST = 'https://us.posthog.com'
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '316777'

async function queryPostHog(query: object, revalidateSeconds = 300) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) return null

  const res = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: revalidateSeconds },
  })

  if (!res.ok) return null
  return res.json()
}

// --- Per-survey queries (existing) ---

export async function getEventCount(eventName: string, surveyId: string): Promise<number> {
  const result = await queryPostHog({
    kind: 'EventsQuery',
    event: eventName,
    properties: [{ key: 'survey_id', value: surveyId, operator: 'exact' }],
    select: ['count()'],
    limit: 1,
  })
  return result?.results?.[0]?.[0] ?? 0
}

export async function getAvgProperty(eventName: string, property: string, surveyId: string): Promise<number | null> {
  const result = await queryPostHog({
    kind: 'EventsQuery',
    event: eventName,
    properties: [{ key: 'survey_id', value: surveyId, operator: 'exact' }],
    select: [`avg(properties.${property})`],
    limit: 1,
  })
  return result?.results?.[0]?.[0] ?? null
}

export async function getDropoffByQuestion(surveyId: string, questionCount: number): Promise<number[]> {
  const counts: number[] = []
  for (let i = 0; i < questionCount; i++) {
    const result = await queryPostHog({
      kind: 'EventsQuery',
      event: 'question_answered',
      properties: [
        { key: 'survey_id', value: surveyId, operator: 'exact' },
        { key: 'question_index', value: i, operator: 'exact' },
      ],
      select: ['count()'],
      limit: 1,
    })
    counts.push(result?.results?.[0]?.[0] ?? 0)
  }
  return counts
}

// --- Aggregate queries for internal dashboard (no survey_id filter) ---

async function queryHogQL(hogql: string): Promise<unknown[][] | null> {
  const result = await queryPostHog({
    kind: 'HogQLQuery',
    query: hogql,
  }, 900) // 15-minute cache for aggregate data
  return result?.results ?? null
}

// Per-mechanic answer counts and avg time
export async function getAnswersByQuestionType(): Promise<Record<string, { count: number; avgTimeMs: number | null }>> {
  const results = await queryHogQL(`
    SELECT
      properties.question_type as qtype,
      count() as total,
      avg(toFloat64OrNull(properties.time_spent_ms)) as avg_time
    FROM events
    WHERE event = 'question_answered'
      AND properties.question_type IS NOT NULL
    GROUP BY qtype
    ORDER BY total DESC
  `)
  const map: Record<string, { count: number; avgTimeMs: number | null }> = {}
  if (results) {
    for (const [qtype, total, avgTime] of results) {
      map[qtype as string] = { count: total as number, avgTimeMs: avgTime as number | null }
    }
  }
  return map
}

// Per-mechanic abandonment counts
export async function getAbandonmentsByQuestionType(): Promise<Record<string, number>> {
  const results = await queryHogQL(`
    SELECT
      properties.last_question_type as qtype,
      count() as total
    FROM events
    WHERE event = 'survey_abandoned'
      AND properties.last_question_type IS NOT NULL
    GROUP BY qtype
    ORDER BY total DESC
  `)
  const map: Record<string, number> = {}
  if (results) {
    for (const [qtype, total] of results) {
      map[qtype as string] = total as number
    }
  }
  return map
}

// Platform-level event totals
export async function getPlatformEventCounts(): Promise<{
  totalStarts: number
  totalCompletions: number
  avgCompletionTimeMs: number | null
}> {
  const [starts, completions, avgTime] = await Promise.all([
    queryHogQL(`SELECT count() FROM events WHERE event = 'survey_started'`),
    queryHogQL(`SELECT count() FROM events WHERE event = 'survey_completed'`),
    queryHogQL(`SELECT avg(toFloat64OrNull(properties.total_time_ms)) FROM events WHERE event = 'survey_completed'`),
  ])
  return {
    totalStarts: (starts?.[0]?.[0] as number) ?? 0,
    totalCompletions: (completions?.[0]?.[0] as number) ?? 0,
    avgCompletionTimeMs: (avgTime?.[0]?.[0] as number) ?? null,
  }
}

// Completion curves — answer counts by normalized position bucket and question type
export async function getCompletionCurves(): Promise<Array<{ positionBucket: number; questionType: string; count: number }>> {
  const results = await queryHogQL(`
    SELECT
      floor(toFloat64OrNull(properties.question_position_pct) * 10) / 10 as pos_bucket,
      properties.question_type as qtype,
      count() as total
    FROM events
    WHERE event = 'question_answered'
      AND properties.question_position_pct IS NOT NULL
      AND properties.question_type IS NOT NULL
    GROUP BY pos_bucket, qtype
    ORDER BY pos_bucket, total DESC
  `)
  if (!results) return []
  return results.map(([pos, qtype, total]) => ({
    positionBucket: pos as number,
    questionType: qtype as string,
    count: total as number,
  }))
}

// Sequence effects — performance by current mechanic × previous mechanic
export async function getSequenceEffects(): Promise<Array<{
  questionType: string
  previousType: string
  count: number
  avgTimeMs: number | null
}>> {
  const results = await queryHogQL(`
    SELECT
      properties.question_type as qtype,
      properties.previous_question_type as prev_type,
      count() as total,
      avg(toFloat64OrNull(properties.time_spent_ms)) as avg_time
    FROM events
    WHERE event = 'question_answered'
      AND properties.previous_question_type IS NOT NULL
      AND properties.question_type IS NOT NULL
    GROUP BY qtype, prev_type
    ORDER BY total DESC
    LIMIT 200
  `)
  if (!results) return []
  return results.map(([qtype, prevType, total, avgTime]) => ({
    questionType: qtype as string,
    previousType: prevType as string,
    count: total as number,
    avgTimeMs: avgTime as number | null,
  }))
}
