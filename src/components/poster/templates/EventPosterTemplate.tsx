'use client'

import { BunnyMascot } from '@/components/BunnyMascot'
import { getPosterQRConfig } from '@/components/qr/qrConfig'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useRef } from 'react'

interface EventPosterTemplateProps {
  headline: string
  qrUrl: string
  brandColor?: string
  showTimeEstimate?: boolean
  size: { width: number; height: number }
}

export function EventPosterTemplate({
  headline,
  qrUrl,
  brandColor,
  showTimeEstimate = true,
  size,
}: EventPosterTemplateProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrRef.current) return

    const config = getPosterQRConfig(qrUrl, 500, brandColor)
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
      className="relative bg-black"
      style={{
        width: size.width,
        height: size.height,
      }}
    >
      {/* Heavy border */}
      <div
        className="absolute inset-4"
        style={{
          border: `16px solid ${brandColor || '#8B5CF6'}`,
        }}
      >
        {/* Inner content area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-16 py-12">
          {/* Bold all-caps headline */}
          <h1
            className="text-white font-black text-center mb-6 leading-none tracking-tighter"
            style={{
              fontSize: Math.min(68, size.width / 13),
              fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            {headline}
          </h1>

          {/* Decorative line */}
          <div
            className="h-2 mb-8"
            style={{
              width: '60%',
              backgroundColor: brandColor || '#8B5CF6',
            }}
          />

          {/* Time estimate */}
          {showTimeEstimate && (
            <p
              className="font-black text-2xl mb-8 tracking-wide"
              style={{ color: brandColor || '#8B5CF6' }}
            >
              UNDER 60 SECONDS
            </p>
          )}

          {/* Large QR Code */}
          <div
            className="bg-white rounded-3xl p-6 mb-8"
            style={{
              boxShadow: `0 0 40px ${brandColor || '#8B5CF6'}`,
            }}
            ref={qrRef}
          />

          {/* Bullet-separated footer */}
          <div className="flex items-center gap-4 text-white font-bold text-xl">
            <span>SCAN</span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: brandColor || '#8B5CF6' }}
            />
            <span>PLAY</span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: brandColor || '#8B5CF6' }}
            />
            <span>BEAT THE CLOCK</span>
          </div>
        </div>
      </div>

      {/* Corner bunny */}
      <div className="absolute bottom-8 right-8">
        <BunnyMascot state="running" size="lg" className="w-32 h-32 opacity-80" />
      </div>
    </div>
  )
}
