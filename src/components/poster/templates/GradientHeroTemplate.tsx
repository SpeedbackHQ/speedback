'use client'

import { BunnyMascot } from '@/components/BunnyMascot'
import { StyledQRCode } from '@/components/qr/StyledQRCode'
import { getPosterQRConfig } from '@/components/qr/qrConfig'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useRef } from 'react'

interface GradientHeroTemplateProps {
  headline: string
  qrUrl: string
  brandColor?: string
  showTimeEstimate?: boolean
  size: { width: number; height: number }
}

export function GradientHeroTemplate({
  headline,
  qrUrl,
  brandColor,
  showTimeEstimate = true,
  size,
}: GradientHeroTemplateProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrRef.current) return

    const config = getPosterQRConfig(qrUrl, 400, brandColor)
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
      className="relative overflow-hidden"
      style={{
        width: size.width,
        height: size.height,
        background: `linear-gradient(135deg, ${brandColor || '#8B5CF6'} 0%, #A855F7 50%, #F59E0B 100%)`,
      }}
    >
      {/* Bunny mascot at top */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
        <BunnyMascot state="running" size="xl" className="w-48 h-48" />
      </div>

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
        {/* Headline */}
        <h1
          className="text-white font-black text-center mb-8 leading-tight"
          style={{
            fontSize: Math.min(72, size.width / 12),
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            marginTop: '80px',
          }}
        >
          {headline}
        </h1>

        {/* Time estimate */}
        {showTimeEstimate && (
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
            <p className="text-white font-bold text-xl">
              ⏱️ Under 60 seconds
            </p>
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl mb-8" ref={qrRef} />

        {/* CTA */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-4">
          <p className="text-gray-800 font-bold text-2xl">
            Scan to Play ⚡
          </p>
        </div>
      </div>
    </div>
  )
}
