'use client'

import { useEffect, type ReactNode } from 'react'

export function FullscreenShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Trigger a tiny scroll to collapse mobile browser chrome (URL bar + nav buttons)
    const timer = setTimeout(() => {
      window.scrollTo(0, 1)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ minHeight: '101vh' }}>
      {children}
    </div>
  )
}
