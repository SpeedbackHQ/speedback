'use client'

import AppShell from '@/components/AppShell'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell accountTabs>{children}</AppShell>
}
