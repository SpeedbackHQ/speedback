'use client'

import { useRef, useState, useEffect } from 'react'

interface PhoneFrameProps {
  children: React.ReactNode
}

const PHONE_WIDTH = 375 + 24
const PHONE_HEIGHT = 812 + 24

export function PhoneFrame({ children }: PhoneFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScale = () => {
      // Measure available height from viewport minus the container's top offset
      const rect = container.getBoundingClientRect()
      const availableHeight = window.innerHeight - rect.top - 24 // 24px bottom margin
      const newScale = Math.min(1, availableHeight / PHONE_HEIGHT)
      setScale(Math.max(0.4, newScale)) // Don't go below 40%
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    observer.observe(document.body)
    window.addEventListener('scroll', updateScale, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateScale)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex justify-center"
      style={{ height: PHONE_HEIGHT * scale, width: PHONE_WIDTH * scale }}
    >
      {/* Phone shell */}
      <div
        className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl"
        style={{
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Dynamic island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30" />

        {/* Screen */}
        <div
          className="relative w-[375px] h-[812px] rounded-[2.2rem] overflow-hidden bg-slate-50"
        >
          {/* Screen content */}
          <div className="w-full h-full overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
