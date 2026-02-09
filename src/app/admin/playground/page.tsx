'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { QuestionType } from '@/lib/types'
import { questionCategories, questionTypeInfo } from '@/components/QuestionEditor'
import { createMockQuestion, formatAnswerDisplay } from '@/lib/playground'
import { MechanicRenderer } from '@/components/MechanicRenderer'
import { PhoneFrame } from '@/components/PhoneFrame'

// Resolve a question type to its category name
function findCategoryForType(type: QuestionType): string | null {
  for (const [categoryName, category] of Object.entries(questionCategories)) {
    if (category.types.some(t => t.type === type)) return categoryName
  }
  return null
}

// Emoji representing each category
const categoryEmojis: Record<string, string> = {
  'Yes/No': '👆',
  'Single-Select': '🎯',
  'Multi-Select': '💥',
  'Scale/Rating': '⭐',
  'Open Response': '💬',
}

function PlaygroundContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') as QuestionType | null

  const [selectedType, setSelectedType] = useState<QuestionType | null>(initialType)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialType ? findCategoryForType(initialType) : null
  )
  const [previewKey, setPreviewKey] = useState(0)
  const [lastAnswer, setLastAnswer] = useState<string | null>(null)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(!!initialType)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  const clearPendingReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [])

  const handleSelectType = useCallback((type: QuestionType) => {
    clearPendingReset()
    setSelectedType(type)
    setPreviewKey(prev => prev + 1)
    setLastAnswer(null)
    setMobilePreviewOpen(true)
    router.push(`/admin/playground?type=${type}`, { scroll: false })
  }, [router, clearPendingReset])

  const handleAnswer = useCallback((value: unknown) => {
    if (!selectedType) return
    clearPendingReset()
    const display = formatAnswerDisplay(selectedType, value as never)
    setLastAnswer(display)

    // Auto-reset after 2s
    resetTimeoutRef.current = setTimeout(() => {
      setPreviewKey(prev => prev + 1)
      setLastAnswer(null)
      resetTimeoutRef.current = null
    }, 2000)
  }, [selectedType, clearPendingReset])

  const handleReset = useCallback(() => {
    clearPendingReset()
    setPreviewKey(prev => prev + 1)
    setLastAnswer(null)
  }, [clearPendingReset])

  const typeInfo = selectedType ? questionTypeInfo[selectedType] : null

  // Count total mechanics
  const totalTypes = Object.values(questionCategories).reduce(
    (acc, cat) => acc + cat.types.length, 0
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mechanics Playground</h1>
        <p className="text-gray-500 mt-1">
          Test all {totalTypes} interactive mechanics instantly. Click one to try it out.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Type selector */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {selectedCategory === null ? (
              <motion.div
                key="categories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(questionCategories).map(([categoryName, category]) => (
                    <button
                      key={categoryName}
                      onClick={() => setSelectedCategory(categoryName)}
                      className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                    >
                      <span className="text-3xl">{categoryEmojis[categoryName] || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-lg">{categoryName}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                      <span className="text-sm font-semibold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full">
                        {category.types.length}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mechanics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <span>←</span> All categories
                  </button>
                  <span className="text-lg">{categoryEmojis[selectedCategory]}</span>
                  <h3 className="text-lg font-bold text-gray-800">{selectedCategory}</h3>
                  <span className="text-sm text-gray-400">
                    {questionCategories[selectedCategory]?.description}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {questionCategories[selectedCategory]?.types.map((entry) => {
                    const isActive = selectedType === entry.type
                    return (
                      <button
                        key={entry.type}
                        onClick={() => handleSelectType(entry.type)}
                        className={`
                          text-left p-3 rounded-xl border-2 transition-all
                          ${isActive
                            ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="text-xl mb-1">{entry.emoji}</div>
                        <div className={`text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {entry.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{entry.description}</div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Preview panel (desktop only) */}
        <div className="hidden lg:block sticky top-24 self-start">
          {selectedType && typeInfo ? (
            <div>
              {/* Type info header */}
              <div className="text-center mb-4">
                <span className="text-3xl">{typeInfo.emoji}</span>
                <h2 className="text-lg font-bold text-gray-800 mt-1">{typeInfo.label}</h2>
                <p className="text-sm text-gray-500">{typeInfo.description}</p>
              </div>

              {/* Phone frame */}
              <PhoneFrame>
                <MechanicRenderer
                  key={previewKey}
                  question={createMockQuestion(selectedType)}
                  onAnswer={handleAnswer}
                />
              </PhoneFrame>

              {/* Answer toast */}
              <AnimatePresence>
                {lastAnswer && (
                  <motion.div
                    className="mt-4 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium text-sm">
                      Answered: {lastAnswer}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset button */}
              <div className="text-center mt-3">
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Reset mechanic
                </button>
              </div>
            </div>
          ) : (
            <div className="w-[399px] h-[500px] flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-3">👈</div>
                <p className="font-medium">Select a mechanic to preview</p>
                <p className="text-sm mt-1">Click any type from the grid</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile preview overlay */}
      <AnimatePresence>
        {mobilePreviewOpen && selectedType && typeInfo && (
          <motion.div
            className="lg:hidden fixed inset-0 z-50 bg-slate-50"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Mobile header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setMobilePreviewOpen(false)}
                className="text-gray-600 hover:text-gray-800 font-medium text-sm flex items-center gap-1"
              >
                <span>←</span> Back
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeInfo.emoji}</span>
                <span className="font-semibold text-gray-800">{typeInfo.label}</span>
              </div>
              <button
                onClick={handleReset}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                Reset
              </button>
            </div>

            {/* Mobile mechanic preview (no phone frame - they're on a phone) */}
            <div className="h-[calc(100dvh-56px)] flex items-center justify-center overflow-hidden">
              <MechanicRenderer
                key={previewKey}
                question={createMockQuestion(selectedType)}
                onAnswer={handleAnswer}
              />
            </div>

            {/* Answer toast */}
            <AnimatePresence>
              {lastAnswer && (
                <motion.div
                  className="fixed bottom-8 left-0 right-0 text-center z-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-5 py-2.5 rounded-full font-medium shadow-lg">
                    Answered: {lastAnswer}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mechanics Playground</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  )
}
