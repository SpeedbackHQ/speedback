import { getUser, createServerSupabaseClient } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Server Component - creates a new survey and redirects to the editor
export default async function NewSurveyPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerSupabaseClient()

  // Ensure we have an organization
  let { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', user.id)
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
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating survey:', error)
    redirect('/dashboard')
  }

  // Redirect to the tabbed editor
  redirect(`/dashboard/surveys/${survey!.id}`)
}
