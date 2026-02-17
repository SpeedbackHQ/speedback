'use client'

import { PosterTemplate, PosterSize, POSTER_SIZES } from '@/lib/types'

interface PosterCustomizerProps {
  template: PosterTemplate
  onTemplateChange: (template: PosterTemplate) => void
  headline: string
  onHeadlineChange: (headline: string) => void
  size: PosterSize
  onSizeChange: (size: PosterSize) => void
  showTimeEstimate: boolean
  onShowTimeEstimateChange: (show: boolean) => void
}

const HEADLINE_PRESETS = [
  'Follow the Rabbit',
  'Quick Challenge Inside',
  '30 Seconds of Fun',
  'Ready to Play?',
]

const TEMPLATES: { value: PosterTemplate; label: string; emoji: string }[] = [
  { value: 'gradient-hero', label: 'Gradient Hero', emoji: '🌈' },
  { value: 'minimalist', label: 'Minimalist', emoji: '✨' },
  { value: 'playful', label: 'Playful', emoji: '🎉' },
  { value: 'event-poster', label: 'Event Poster', emoji: '🎯' },
]

export function PosterCustomizer({
  template,
  onTemplateChange,
  headline,
  onHeadlineChange,
  size,
  onSizeChange,
  showTimeEstimate,
  onShowTimeEstimateChange,
}: PosterCustomizerProps) {
  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Template
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTemplateChange(t.value)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                template === t.value
                  ? 'border-violet-500 bg-violet-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-violet-300'
              }`}
            >
              <div className="text-2xl mb-1">{t.emoji}</div>
              <div className="text-xs font-semibold text-gray-700">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Headline editor */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Headline
        </label>
        <div className="space-y-2">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {HEADLINE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => onHeadlineChange(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  headline === preset
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          {/* Custom input */}
          <input
            type="text"
            value={headline}
            onChange={(e) => onHeadlineChange(e.target.value)}
            placeholder="Custom headline..."
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none text-sm font-medium"
            maxLength={50}
          />
          <p className="text-xs text-gray-500">
            {headline.length}/50 characters
          </p>
        </div>
      </div>

      {/* Size picker */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Poster Size
        </label>
        <div className="space-y-2">
          {Object.entries(POSTER_SIZES).map(([key, posterSize]) => (
            <button
              key={key}
              onClick={() => onSizeChange(posterSize)}
              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                size.label === posterSize.label
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 bg-white hover:border-violet-300'
              }`}
            >
              <div className="font-semibold text-sm text-gray-800">
                {posterSize.label}
              </div>
              <div className="text-xs text-gray-500">
                {posterSize.width} × {posterSize.height}px
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time estimate toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showTimeEstimate}
            onChange={(e) => onShowTimeEstimateChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-violet-500 focus:ring-violet-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Show time estimate (30 seconds)
          </span>
        </label>
      </div>
    </div>
  )
}
