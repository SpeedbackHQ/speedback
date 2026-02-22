'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import type { UserProfile, Survey } from '@/lib/supabase'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/ToastProvider'
import { ButtonSpinner } from '@/components/ui/Spinner'

export default function BillingPage() {
  const supabase = createBrowserSupabaseClient()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [planType, setPlanType] = useState<'free' | 'starter' | 'per-event'>('free')
  const [surveyCount, setSurveyCount] = useState(0)
  const [totalResponses, setTotalResponses] = useState(0)

  useEffect(() => {
    loadBillingInfo()
  }, [])

  async function loadBillingInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan_type')
        .eq('id', user.id)
        .single()

      if (profile) {
        setPlanType(profile.plan_type || 'free')
      }

      // Get survey count
      const { count: surveys } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setSurveyCount(surveys || 0)

      // Get total responses
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
    } catch (err) {
      console.error('Error loading billing info:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton.Line width="w-56" className="h-7 mb-6" />
        <div className="mb-8">
          <Skeleton.Line width="w-28" className="h-5 mb-4" />
          <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg p-6 border border-violet-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton.Line width="w-24" className="h-7" />
                <Skeleton.Line width="w-40" className="h-4" />
              </div>
              <Skeleton.Line width="w-20" className="h-8" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton.Stat />
          <Skeleton.Stat />
        </div>
      </div>
    )
  }

  const plans = {
    free: { name: 'Free', price: '$0', limit: '25 responses per survey' },
    starter: { name: 'Starter', price: '$19/mo', limit: 'Unlimited responses' },
    'per-event': { name: 'Per-Event', price: '$15/event', limit: 'One event, unlimited responses' },
  }

  const currentPlan = plans[planType]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscription</h2>

      {/* Current Plan */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Plan</h3>
        <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg p-6 border border-violet-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-violet-700">{currentPlan.name}</h4>
              <p className="text-gray-600 mt-1">{currentPlan.limit}</p>
            </div>
            <div className="text-3xl font-bold text-violet-700">{currentPlan.price}</div>
          </div>

          {planType === 'free' && (
            <div className="mt-4 pt-4 border-t border-violet-200">
              <Link
                href="/pricing"
                className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Upgrade to Starter
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage</h3>
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

      {/* Billing Details */}
      {planType !== 'free' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Subscription</h3>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-gray-600 mb-4">
              Update payment methods, view invoices, or manage your subscription through the Stripe Customer Portal.
            </p>
            <button
              onClick={async () => {
                setPortalLoading(true)
                try {
                  const res = await fetch('/api/billing/portal', { method: 'POST' })
                  const data = await res.json()
                  if (data.url) {
                    window.location.href = data.url
                  } else {
                    toast.error(data.error || 'Failed to open billing portal')
                  }
                } catch {
                  toast.error('Failed to open billing portal')
                } finally {
                  setPortalLoading(false)
                }
              }}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white font-semibold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              {portalLoading && <ButtonSpinner />}
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
