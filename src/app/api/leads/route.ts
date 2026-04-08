import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limit: 10 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = rateLimit(`leads:${ip}`, { maxRequests: 10, windowMs: 60_000 })
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const { email, is_organizer, survey_id, response_session_id } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Get the survey slug for tracking
    let source_survey_slug: string | null = null
    if (survey_id) {
      const { data: survey } = await supabase
        .from('surveys')
        .select('slug')
        .eq('id', survey_id)
        .single()
      source_survey_slug = survey?.slug ?? null
    }

    // Deduplicate: skip if same email + survey already exists
    if (survey_id) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .eq('survey_id', survey_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ ok: true, deduplicated: true })
      }
    }

    const { error } = await supabase.from('leads').insert({
      email,
      is_organizer: is_organizer ?? false,
      source_survey_slug,
      survey_id: survey_id ?? null,
      response_session_id: response_session_id ?? null,
    })

    if (error) {
      console.error('Failed to save lead:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
