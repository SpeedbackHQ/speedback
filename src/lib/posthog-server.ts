// Server-side PostHog Query API wrapper
// Uses POSTHOG_PERSONAL_API_KEY (never exposed to client)

const POSTHOG_HOST = 'https://us.posthog.com'
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '316777'

async function queryPostHog(query: object) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) return null

  const res = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: 300 }, // cache 5 min
  })

  if (!res.ok) return null
  return res.json()
}

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
  // For each question index 0..N-1, count how many question_answered events fired
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
