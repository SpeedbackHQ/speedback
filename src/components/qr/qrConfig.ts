import type { Options } from 'qr-code-styling'

/**
 * Get styled QR code configuration
 * Generates beautiful QR codes with gradients, rounded dots, and brand colors
 */
export function getStyledQRConfig(
  data: string,
  size: number = 600,
  brandColor?: string
): Options {
  const primaryColor = brandColor || '#8B5CF6' // Default indigo
  const isDefault = !brandColor || brandColor === '#8B5CF6'

  // SpeedBack default: gradient with purple/amber
  // Custom brand color: solid single color (clean, no gradient)
  const dotsStyle = isDefault
    ? {
        type: 'rounded' as const,
        gradient: {
          type: 'linear' as const,
          rotation: 135,
          colorStops: [
            { offset: 0, color: primaryColor },
            { offset: 0.5, color: '#A855F7' },
            { offset: 1, color: '#F59E0B' },
          ],
        },
      }
    : {
        type: 'rounded' as const,
        color: primaryColor,
      }

  const cornersStyle = isDefault
    ? {
        type: 'extra-rounded' as const,
        gradient: {
          type: 'linear' as const,
          rotation: 135,
          colorStops: [
            { offset: 0, color: primaryColor },
            { offset: 1, color: '#A855F7' },
          ],
        },
      }
    : {
        type: 'extra-rounded' as const,
        color: primaryColor,
      }

  return {
    width: size,
    height: size,
    type: 'canvas',
    data,
    margin: 10,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: 'M',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 8,
      crossOrigin: 'anonymous',
    },
    dotsOptions: dotsStyle,
    cornersSquareOptions: cornersStyle,
    cornersDotOptions: {
      type: 'dot',
      color: primaryColor,
    },
    backgroundOptions: {
      color: '#FFFFFF',
    },
  }
}

/**
 * Get display-size QR config (300px)
 */
export function getDisplayQRConfig(data: string, brandColor?: string): Options {
  return getStyledQRConfig(data, 300, brandColor)
}

/**
 * Get download-size QR config (1200px for print quality)
 */
export function getDownloadQRConfig(data: string, brandColor?: string): Options {
  return getStyledQRConfig(data, 1200, brandColor)
}

/**
 * Get poster-size QR config (variable size for posters)
 */
export function getPosterQRConfig(data: string, size: number, brandColor?: string): Options {
  return getStyledQRConfig(data, size, brandColor)
}
