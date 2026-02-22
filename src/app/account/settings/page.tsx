'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ButtonSpinner } from '@/components/ui/Spinner'

export default function SettingsPage() {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setShowDeleteConfirm(true)
  }

  async function executeDelete() {
    setShowDeleteConfirm(false)
    setDeleting(true)

    try {
      await supabase.auth.signOut()
      router.push('/?deleted=true')
    } catch (err: any) {
      toast.error('Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {/* Email Preferences */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            <span className="text-gray-700">Send me product updates and tips</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            <span className="text-gray-700">Notify me when surveys hit response limits</span>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="font-bold text-gray-900 mb-2">Delete Account</h4>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <div className="mb-4">
            <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700 mb-2">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="confirmDelete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="DELETE"
            />
          </div>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting || confirmText !== 'DELETE'}
            className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <span className="flex items-center gap-2">
                <ButtonSpinner />
                Deleting...
              </span>
            ) : (
              'Delete Account'
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        message="This will permanently delete your account, all surveys, and all response data. This action cannot be undone."
        confirmLabel="Delete Forever"
        cancelLabel="Keep Account"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
