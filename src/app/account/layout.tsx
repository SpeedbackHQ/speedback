import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-outfit font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              {/* Back to Dashboard Link */}
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors mb-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              <AccountNavLink href="/account/profile" label="Profile" />
              <AccountNavLink href="/account/billing" label="Billing" />
              <AccountNavLink href="/account/settings" label="Settings" />
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {label}
    </Link>
  )
}
