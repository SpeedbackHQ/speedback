'use client'

import { BunnyMascot } from '@/components/BunnyMascot'
import { getPosterQRConfig } from '@/components/qr/qrConfig'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useRef } from 'react'

interface MinimalistTemplateProps {
  headline: string
  qrUrl: string
  brandColor?: string
  showTimeEstimate?: boolean
  size: { width: number; height: number }
}

export function MinimalistTemplate({
  headline,
  qrUrl,
  brandColor,
  showTimeEstimate = true,
  size,
}: MinimalistTemplateProps) {
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
      className="relative bg-white"
      style={{
        width: size.width,
        height: size.height,
      }}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '40px',
          backgroundColor: brandColor || '#8B5CF6',
        }}
      />

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-16 pt-16">
        {/* Small bunny */}
        <div className="mb-8">
          <BunnyMascot state="ready" size="md" className="w-24 h-24" />
        </div>

        {/* Headline */}
        <h1
          className="text-gray-900 font-bold text-center mb-4 leading-snug"
          style={{
            fontSize: Math.min(56, size.width / 15),
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          }}
        >
          {headline}
        </h1>

        {/* Time estimate */}
        {showTimeEstimate && (
          <p className="text-gray-500 font-medium text-lg mb-12">
            30 seconds of your time
          </p>
        )}

        {/* QR Code with subtle shadow */}
        <div
          className="bg-white rounded-2xl p-4 mb-12"
          style={{
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          }}
          ref={qrRef}
        />

        {/* CTA */}
        <p
          className="font-semibold text-lg"
          style={{ color: brandColor || '#8B5CF6' }}
        >
          Scan to begin →
        </p>
      </div>
    </div>
  )
}
