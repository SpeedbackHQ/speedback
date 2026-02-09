'use client'

import { useState, useEffect } from 'react'

interface PhoneFrameProps {
  children: React.ReactNode
}

const PHONE_WIDTH = 375 + 24
const PHONE_HEIGHT = 812 + 24

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      // Use viewport height minus a fixed top allowance (header + info) and bottom margin
      const availableHeight = window.innerHeight - 200 // ~200px for header/info above
      const newScale = Math.min(1, availableHeight / PHONE_HEIGHT)
      setScale(Math.max(0.4, newScale))
    }

    updateScale()

    // Only recalculate on window resize, not on scroll
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  return (
    <div
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
          {/* Screen content — pt-12 clears the dynamic island */}
          <div className="w-full h-full overflow-y-auto overflow-x-hidden pt-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
