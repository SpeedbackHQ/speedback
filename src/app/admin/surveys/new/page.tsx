'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// This page now redirects to the new tabbed editor flow
// Instead of a separate "create" form, we create an empty survey and go straight to the editor

export default function NewSurveyRedirect() {
  const router = useRouter()

  useEffect(() => {
    const createAndRedirect = async () => {
      try {
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
            title: 'Untitled Survey',
            branding_config: { primary_color: '#8B5CF6', mascot_enabled: true },
          })
          .select()
          .single()

        if (error) throw error

        // Redirect to the tabbed editor
        router.replace(`/admin/surveys/${survey!.id}`)
      } catch (error) {
        console.error('Error creating survey:', error)
        alert('Failed to create survey. Redirecting to dashboard.')
        router.replace('/admin')
      }
    }

    createAndRedirect()
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Creating your survey...</p>
      </div>
    </div>
  )
}
