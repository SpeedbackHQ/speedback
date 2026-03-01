'use client'

import { BunnyMascot } from '@/components/BunnyMascot'
import { getPosterQRConfig } from '@/components/qr/qrConfig'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useRef } from 'react'

interface PlayfulTemplateProps {
  headline: string
  qrUrl: string
  brandColor?: string
  showTimeEstimate?: boolean
  size: { width: number; height: number }
}

export function PlayfulTemplate({
  headline,
  qrUrl,
  brandColor,
  showTimeEstimate = true,
  size,
}: PlayfulTemplateProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrRef.current) return

    const config = getPosterQRConfig(qrUrl, 350, brandColor)
    const qrCode = new QRCodeStyling(config)
    qrCode.append(qrRef.current)

    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = ''
      }
    }
  }, [qrUrl, brandColor])

  return (
    <div
      className="relative bg-gradient-to-br from-yellow-50 to-pink-50"
      style={{
        width: size.width,
        height: size.height,
      }}
    >
      {/* Emoji decorations in corners */}
      <div className="absolute top-8 left-8 text-6xl">✨</div>
      <div className="absolute top-8 right-8 text-6xl">🎉</div>
      <div className="absolute bottom-8 left-8 text-6xl">🎮</div>
      <div className="absolute bottom-8 right-8 text-6xl">🚀</div>

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
        {/* Bunny mascot */}
        <div className="mb-8">
          <BunnyMascot state="celebrating" size="lg" className="w-36 h-36" />
        </div>

        {/* Speech bubble with headline */}
        <div
          className="relative bg-white rounded-3xl px-8 py-6 mb-8 shadow-lg"
          style={{
            maxWidth: size.width * 0.8,
          }}
        >
          {/* Speech bubble tail */}
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '20px solid transparent',
              borderRight: '20px solid transparent',
              borderBottom: '20px solid white',
            }}
          />
          <h1
            className="text-gray-900 font-black text-center leading-tight"
            style={{
              fontSize: Math.min(52, size.width / 16),
              fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            }}
          >
            {headline}
          </h1>
        </div>

        {/* Time estimate */}
        {showTimeEstimate && (
          <div className="bg-white rounded-full px-6 py-2 mb-8 shadow-md">
            <p className="text-gray-700 font-bold text-lg">
              ⚡ Under 60 seconds
            </p>
          </div>
        )}

        {/* QR Code with slight rotation */}
        <div
          className="bg-white rounded-2xl p-4 shadow-xl mb-8"
          style={{
            transform: 'rotate(-3deg)',
          }}
          ref={qrRef}
        />

        {/* Multiple emoji CTAs */}
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="bg-white rounded-full px-5 py-2 shadow-md">
            <p className="text-gray-800 font-bold">👉 Scan to play</p>
          </div>
          <div className="bg-white rounded-full px-5 py-2 shadow-md">
            <p className="text-gray-800 font-bold">🏆 Beat the record!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
