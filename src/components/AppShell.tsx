'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import type { User } from '@supabase/supabase-js'
import { BottomNav } from '@/components/ui/BottomNav'

interface NavItem {
  href: string
  label: string
  emoji?: string
  matchPrefix?: boolean
}

const mainNavItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/templates', label: 'Templates', matchPrefix: true },
  { href: '/admin/playground', label: 'Playground', matchPrefix: true },
]

const mobileNavItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', emoji: '📊' },
  { href: '/admin/templates', label: 'Templates', emoji: '📋' },
  { href: '/admin/playground', label: 'Playground', emoji: '🎮' },
]

interface AppShellProps {
  children: React.ReactNode
  accountTabs?: boolean
}

export default function AppShell({ children, accountTabs }: AppShellProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data.user)
      if (data.user) loadProfile(data.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') setDropdownOpen(false)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [dropdownOpen, handleKeyDown])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (item: NavItem) =>
    item.matchPrefix ? pathname?.startsWith(item.href) : pathname === item.href

  const planLabel = profile?.plan_type === 'starter' ? 'Starter Plan' : profile?.plan_type === 'per-event' ? 'Per-Event' : 'Free Plan'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-violet-100/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="text-xl sm:text-2xl font-chonko tracking-tight whitespace-nowrap" style={{ color: '#0F172A' }}>
            Speed<span style={{ color: '#8B5CF6' }}>Back</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4" aria-label="Main navigation">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-outfit font-medium transition-colors px-3 py-2 rounded-lg ${
                  isActive(item)
                    ? 'text-violet-500 bg-violet-50'
                    : 'text-slate-600 hover:text-violet-500 hover:bg-violet-50'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* User Dropdown */}
            {user && (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-violet-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">
                    {(profile?.display_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <svg className={`w-4 h-4 text-slate-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{profile?.display_name || user.email}</p>
                      <p className="text-xs text-gray-500">{planLabel}</p>
                    </div>
                    <Link href="/account/profile" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Account</Link>
                    <Link href="/account/billing" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Billing</Link>
                    <hr className="my-2 border-gray-100" />
                    <button onClick={handleSignOut} role="menuitem" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Navigation */}
          {user && (
            <div className="md:hidden relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Menu"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-violet-50 transition-colors touch-target"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">
                  {(profile?.display_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </div>
                <svg className={`w-4 h-4 text-slate-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{profile?.display_name || user.email}</p>
                    <p className="text-xs text-gray-500">{planLabel}</p>
                  </div>
                  {mobileNavItems.map((item) => (
                    <Link key={item.href} href={item.href} role="menuitem" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                      {item.emoji} {item.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-gray-100" />
                  <Link href="/account/profile" role="menuitem" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>👤 Account</Link>
                  <Link href="/account/billing" role="menuitem" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>💳 Billing</Link>
                  <hr className="my-2 border-gray-100" />
                  <button onClick={handleSignOut} role="menuitem" className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">🚪 Sign Out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-500" aria-hidden="true" />

      {/* Account sub-navigation tabs */}
      {accountTabs && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex gap-0" aria-label="Account sections">
              {[
                { href: '/account/profile', label: 'Profile' },
                { href: '/account/billing', label: 'Billing' },
                { href: '/account/settings', label: 'Settings' },
              ].map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    pathname === tab.href
                      ? 'border-violet-500 text-violet-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 pb-20 md:pb-8">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
