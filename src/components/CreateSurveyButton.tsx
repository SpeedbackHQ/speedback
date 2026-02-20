'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/auth-client'

interface CreateSurveyButtonProps {
  className?: string
  children?: React.ReactNode
}

export function CreateSurveyButton({ className, children }: CreateSurveyButtonProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (isCreating) return
    setIsCreating(true)

    try {
      const supabase = createBrowserSupabaseClient()

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Not authenticated')
      }

      // Test account bypass - millerdjonathan@proton.me gets unlimited everything
      const isTestAccount = user.email === 'millerdjonathan@proton.me'

      // Get user's profile to check plan type and credits
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan_type, premium_credits')
        .eq('id', user.id)
        .single()

      // Determine max_responses based on plan type and credits
      let maxResponses: number | null = 25 // Default for free users
      let shouldDecrementCredit = false

      if (isTestAccount) {
        // Test account gets unlimited everything
        maxResponses = null
      } else if (profile?.plan_type === 'starter') {
        // Subscription users get unlimited responses
        maxResponses = null
      } else if ((profile?.plan_type === 'free' || profile?.plan_type === 'per-event') && (profile?.premium_credits || 0) > 0) {
        // Free or per-event users with credits get unlimited responses
        maxResponses = null
        shouldDecrementCredit = true
      }

      // Ensure we have an organization
      let { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!org) {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({ name: 'My Organization' })
          .select()
          .single()
        org = newOrg
      }

      // Create empty survey with default title
      const { data: survey, error } = await supabase
        .from('surveys')
        .insert({
          org_id: org!.id,
          user_id: user.id,
          title: 'Untitled Survey',
          branding_config: { primary_color: '#8B5CF6', mascot_enabled: true },
          max_responses: maxResponses,
        })
        .select()
        .single()

      if (error) throw error

      // Decrement premium credit if used
      if (shouldDecrementCredit && profile) {
        await supabase
          .from('user_profiles')
          .update({ premium_credits: (profile.premium_credits || 1) - 1 })
          .eq('id', user.id)
      }

      // Redirect to the editor
      router.push(`/admin/surveys/${survey!.id}`)
    } catch (error) {
      console.error('Error creating survey:', error)
      alert('Failed to create survey. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className={className}
    >
      {isCreating ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Creating...
        </span>
      ) : (
        children || 'Create Survey'
      )}
    </button>
  )
}
