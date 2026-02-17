'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { getStyledQRConfig } from './qrConfig'

interface StyledQRCodeProps {
  data: string
  size?: number
  brandColor?: string
  className?: string
}

export interface StyledQRCodeRef {
  download: (filename: string) => Promise<void>
  getRawData: (extension?: 'png' | 'jpeg' | 'webp') => Promise<Blob | Buffer | null>
}

/**
 * Styled QR Code component using qr-code-styling
 * Renders beautiful QR codes with gradients and rounded dots
 */
export const StyledQRCode = forwardRef<StyledQRCodeRef, StyledQRCodeProps>(
  ({ data, size = 300, brandColor, className = '' }, ref) => {
    const qrRef = useRef<HTMLDivElement>(null)
    const qrCodeInstance = useRef<QRCodeStyling | null>(null)

    // Initialize QR code
    useEffect(() => {
      if (!qrRef.current) return

      const config = getStyledQRConfig(data, size, brandColor)
      qrCodeInstance.current = new QRCodeStyling(config)
      qrCodeInstance.current.append(qrRef.current)

      return () => {
        if (qrRef.current) {
          qrRef.current.innerHTML = ''
        }
      }
    }, [data, size, brandColor])

    // Expose download and getRawData methods
    useImperativeHandle(ref, () => ({
      download: async (filename: string) => {
        if (qrCodeInstance.current) {
          await qrCodeInstance.current.download({
            name: filename,
            extension: 'png',
          })
        }
      },
      getRawData: async (extension: 'png' | 'jpeg' | 'webp' = 'png') => {
        if (qrCodeInstance.current) {
          return await qrCodeInstance.current.getRawData(extension)
        }
        return null
      },
    }))

    return <div ref={qrRef} className={className} />
  }
)

StyledQRCode.displayName = 'StyledQRCode'
