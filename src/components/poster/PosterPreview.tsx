'use client'

import { forwardRef } from 'react'
import { PosterTemplate, PosterSize } from '@/lib/types'
import { GradientHeroTemplate } from './templates/GradientHeroTemplate'
import { MinimalistTemplate } from './templates/MinimalistTemplate'
import { PlayfulTemplate } from './templates/PlayfulTemplate'
import { EventPosterTemplate } from './templates/EventPosterTemplate'

interface PosterPreviewProps {
  template: PosterTemplate
  headline: string
  qrUrl: string
  brandColor?: string
  showTimeEstimate: boolean
  size: PosterSize
}

/**
 * PosterPreview renders the selected poster template
 * Can be captured by html2canvas for download
 */
export const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ template, headline, qrUrl, brandColor, showTimeEstimate, size }, ref) => {
    const templateProps = {
      headline,
      qrUrl,
      brandColor,
      showTimeEstimate,
      size: { width: size.width, height: size.height },
    }

    return (
      <div ref={ref} className="inline-block">
        {template === 'gradient-hero' && <GradientHeroTemplate {...templateProps} />}
        {template === 'minimalist' && <MinimalistTemplate {...templateProps} />}
        {template === 'playful' && <PlayfulTemplate {...templateProps} />}
        {template === 'event-poster' && <EventPosterTemplate {...templateProps} />}
      </div>
    )
  }
)

PosterPreview.displayName = 'PosterPreview'
