'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import { Skeleton } from '@/components/ui/Skeleton'

export default function UsagePage() {
  const supabase = createBrowserSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [surveyCount, setSurveyCount] = useState(0)
  const [totalResponses, setTotalResponses] = useState(0)

  useEffect(() => {
    loadUsageInfo()
  }, [])

  async function loadUsageInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count: surveys } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setSurveyCount(surveys || 0)

      const { data: userSurveys } = await supabase
        .from('surveys')
        .select('id')
        .eq('user_id', user.id)

      if (userSurveys && userSurveys.length > 0) {
        const surveyIds = userSurveys.map((s: any) => s.id)
        const { count: responses } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .in('survey_id', surveyIds)

        setTotalResponses(responses || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton.Line width="w-56" className="h-7 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton.Stat />
          <Skeleton.Stat />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage</h2>

      <div className="mb-8">
        <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg p-6 border border-violet-200 mb-6">
          <h4 className="text-2xl font-bold text-violet-700">Community Edition</h4>
          <p className="text-gray-600 mt-1">Free forever &mdash; all features, no limits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-violet-500">{surveyCount}</div>
            <div className="text-gray-600 mt-1">Surveys Created</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-emerald-600">{totalResponses}</div>
            <div className="text-gray-600 mt-1">Total Responses</div>
          </div>
        </div>
      </div>
    </div>
  )
}
