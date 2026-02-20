'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import type { UserProfile } from '@/lib/supabase'

export default function ProfilePage() {
  const supabase = createBrowserSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      setEmail(user.email || '')

      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || '')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      if (!user) throw new Error('No user found')

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        } as any)

      if (profileError) throw profileError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email cannot be changed. Contact support if you need to update it.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
