'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Survey } from '@/lib/types'
import { PosterTemplate, PosterSize, POSTER_SIZES } from '@/lib/types'
import { PosterCustomizer } from './PosterCustomizer'
import { PosterPreview } from './PosterPreview'
import { generatePosterPNG } from './posterGenerator'
import { useToast } from '@/components/ui/ToastProvider'

interface PosterModalProps {
  survey: Survey
  qrUrl: string
  playUrl: string
  onClose: () => void
}

export function PosterModal({ survey, playUrl, onClose }: PosterModalProps) {
  const toast = useToast()
  const [template, setTemplate] = useState<PosterTemplate>('gradient-hero')
  const [headline, setHeadline] = useState('Follow the Rabbit')
  const [size, setSize] = useState<PosterSize>(POSTER_SIZES.print)
  const [showTimeEstimate, setShowTimeEstimate] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  const previewRef = useRef<HTMLDivElement>(null)
  const brandColor = survey.branding_config?.primary_color

  // Load saved config from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('posterConfig')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        if (config.template) setTemplate(config.template)
        if (config.headline) setHeadline(config.headline)
        if (config.size) setSize(config.size)
        if (config.showTimeEstimate !== undefined) setShowTimeEstimate(config.showTimeEstimate)
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  // Save config to session storage
  useEffect(() => {
    sessionStorage.setItem(
      'posterConfig',
      JSON.stringify({ template, headline, size, showTimeEstimate })
    )
  }, [template, headline, size, showTimeEstimate])

  const handleDownload = async () => {
    if (!previewRef.current || isDownloading) return

    setIsDownloading(true)
    try {
      await generatePosterPNG(
        previewRef.current,
        `${survey.title}-poster`,
        size.width,
        size.height
      )
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download poster. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Calculate display scale to fit preview in viewport
  const displayScale = Math.min(0.5, 600 / Math.max(size.width, size.height))

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Create Poster</h2>
            <p className="text-sm text-gray-500 mt-1">
              Design a poster to promote your survey
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left sidebar - Customizer */}
          <div className="w-80 border-r border-gray-100 p-6 overflow-y-auto">
            <PosterCustomizer
              template={template}
              onTemplateChange={setTemplate}
              headline={headline}
              onHeadlineChange={setHeadline}
              size={size}
              onSizeChange={setSize}
              showTimeEstimate={showTimeEstimate}
              onShowTimeEstimateChange={setShowTimeEstimate}
            />
          </div>

          {/* Right area - Preview */}
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50 flex flex-col items-center justify-center">
            <div className="mb-6">
              <p className="text-sm text-gray-600 text-center">
                Preview (scaled to fit)
              </p>
            </div>

            {/* Scaled preview for display */}
            <div
              className="shadow-2xl rounded-xl overflow-hidden mb-6"
              style={{
                transform: `scale(${displayScale})`,
                transformOrigin: 'center',
              }}
            >
              <PosterPreview
                ref={previewRef}
                template={template}
                headline={headline}
                qrUrl={playUrl}
                brandColor={brandColor}
                showTimeEstimate={showTimeEstimate}
                size={size}
              />
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-8 py-4 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isDownloading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                `📥 Download Poster (${size.label})`
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              High-resolution PNG • Ready for print or digital use
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
