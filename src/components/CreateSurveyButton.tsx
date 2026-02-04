'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
          branding_config: { primary_color: '#6366F1', mascot_enabled: true },
        })
        .select()
        .single()

      if (error) throw error

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
