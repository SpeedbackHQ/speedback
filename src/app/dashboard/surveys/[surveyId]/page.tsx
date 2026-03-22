'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import QRCodeStyling from 'qr-code-styling'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import { Survey, Question, Response, QuestionType, QuestionConfig } from '@/lib/types'
import Link from 'next/link'
import { QuestionEditor, QuestionTypeSelector, QuestionDraft, questionTypeInfo, getDefaultConfig } from '@/components/QuestionEditor'
import { getDisplayQRConfig, getDownloadQRConfig } from '@/components/qr/qrConfig'
import { useToast } from '@/components/ui/ToastProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PosterModal } from '@/components/poster/PosterModal'

type TabType = 'questions' | 'share' | 'responses' | 'analytics'

interface SurveyData extends Survey {
  questions: Question[]
  responses: Response[]
}

interface AnalyticsData {
  started: number
  completed: number
  completionRate: number | null
  avgTimeSec: number | null
  dropoff: number[]
}

type SaveStatus = 'saving' | 'saved' | 'error'

export default function SurveyEditorPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const surveyId = params.surveyId as string
  const supabase = createBrowserSupabaseClient()
  const toast = useToast()

  // Confirm dialog state for question deletion
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)

  // Tab state from URL
  const currentTab = (searchParams.get('tab') as TabType) || 'questions'

  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isTestAccount, setIsTestAccount] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Edit state
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  // Save status (Google Docs style)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Toggle state
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Poster modal
  const [posterModalOpen, setPosterModalOpen] = useState(false)

  // Warning banner dismissed
  const [warningDismissed, setWarningDismissed] = useState(false)

  // Copy link state
  const [copied, setCopied] = useState(false)

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Prevent useEffect from resetting questions/title after initial load
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  // Fetch PostHog analytics when Analytics tab is opened
  useEffect(() => {
    if (currentTab === 'analytics' && survey && !analyticsData && !analyticsLoading) {
      setAnalyticsLoading(true)
      fetch(`/api/analytics/${surveyId}?questions=${survey.questions.length}`)
        .then(r => r.json())
        .then(data => setAnalyticsData(data))
        .catch(() => setAnalyticsData(null))
        .finally(() => setAnalyticsLoading(false))
    }
  }, [currentTab, survey, surveyId, analyticsData, analyticsLoading])

  useEffect(() => {
    if (survey) {
      generateQRCode()
      if (!hasInitializedRef.current) {
        setTitle(survey.title)
        setQuestions(survey.questions.map(q => ({
          id: q.id,
          type: q.type,
          text: q.text,
          config: q.config || {},
        })))
        hasInitializedRef.current = true
      }
    }
  }, [survey])

  const loadSurvey = async () => {
    const { data: surveyData } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index')

    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('completed_at', { ascending: false })

    // Load user profile to check plan type
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Check if test account
      setIsTestAccount(user.email === 'millerdjonathan@proton.me')

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      setUserProfile(profile)
    }

    if (surveyData) {
      setSurvey({
        ...surveyData,
        questions: questions || [],
        responses: responses || [],
      })
    }
    setLoading(false)
  }

  const generateQRCode = async () => {
    const playUrl = `${window.location.origin}/play/${surveyId}`
    const brandColor = survey?.branding_config?.primary_color
    const config = getDisplayQRConfig(playUrl, brandColor)

    const qrCode = new QRCodeStyling(config)
    const data = await qrCode.getRawData('png')
    if (data && data instanceof Blob) {
      const url = URL.createObjectURL(data)
      setQrCodeUrl(url)
    }
  }

  const downloadQRCode = async () => {
    const playUrl = `${window.location.origin}/play/${surveyId}`
    const brandColor = survey?.branding_config?.primary_color
    const config = getDownloadQRConfig(playUrl, brandColor)

    const qrCode = new QRCodeStyling(config)
    await qrCode.download({
      name: `${survey?.title || 'survey'}-qr`,
      extension: 'png',
    })
  }

  const copyLink = () => {
    const playUrl = `${window.location.origin}/play/${surveyId}`
    navigator.clipboard.writeText(playUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Check if user can export CSV (paid feature)
  const canExportCSV = () => {
    if (!survey) return false
    // Test account bypass
    if (isTestAccount) return true
    // Regular plan checks
    if (!userProfile) return false
    // Starter plan: unlimited for all surveys
    if (userProfile.plan_type === 'starter') return true
    // Per-event or free with premium credit: only for unlimited surveys
    if ((userProfile.plan_type === 'per-event' || userProfile.plan_type === 'free') && survey.max_responses === null) return true
    return false
  }

  // Check if user can view full analytics (paid feature)
  const canViewFullAnalytics = () => {
    if (!survey) return false
    // Test account bypass
    if (isTestAccount) return true
    // Regular plan checks
    if (!userProfile) return false
    // Starter plan: full analytics for all surveys
    if (userProfile.plan_type === 'starter') return true
    // Per-event or free with premium credit: only for unlimited surveys
    if ((userProfile.plan_type === 'per-event' || userProfile.plan_type === 'free') && survey.max_responses === null) return true
    return false
  }

  // Auto-save with debounce
  const saveWithFeedback = useCallback(async (saveFn: () => Promise<void>) => {
    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaveStatus('saving')

    try {
      await saveFn()
      setSaveStatus('saved')
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
    }
  }, [])

  // Debounced save for title
  const debouncedSaveTitle = useCallback((newTitle: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveWithFeedback(async () => {
        const { error } = await supabase
          .from('surveys')
          .update({ title: newTitle.trim() || 'Untitled Survey' })
          .eq('id', surveyId)
        if (error) throw error
        setSurvey(prev => prev ? { ...prev, title: newTitle.trim() || 'Untitled Survey' } : null)
      })
    }, 500)
  }, [surveyId, saveWithFeedback])

  // Debounced save for questions
  const debouncedSaveQuestions = useCallback((updatedQuestions: QuestionDraft[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveWithFeedback(async () => {
        // Find new questions (those not in original survey)
        const existingIds = new Set(survey?.questions.map(q => q.id) || [])
        const newQuestions = updatedQuestions.filter(q => !existingIds.has(q.id))
        const existingQuestions = updatedQuestions.filter(q => existingIds.has(q.id))

        // Insert new questions
        if (newQuestions.length > 0) {
          const toInsert = newQuestions.map((q, i) => ({
            id: q.id,
            survey_id: surveyId,
            type: q.type,
            text: q.text,
            config: q.config,
            order_index: existingQuestions.length + i,
          }))
          const { error } = await supabase.from('questions').insert(toInsert)
          if (error) throw error
        }

        // Update existing questions
        for (let i = 0; i < existingQuestions.length; i++) {
          const q = existingQuestions[i]
          const { error } = await supabase
            .from('questions')
            .update({
              text: q.text,
              config: q.config,
              order_index: i,
            })
            .eq('id', q.id)
          if (error) throw error
        }

        // Update local survey state
        setSurvey(prev => {
          if (!prev) return null
          return {
            ...prev,
            questions: updatedQuestions.map((q, i) => ({
              ...q,
              survey_id: surveyId,
              order_index: i,
            })) as Question[],
          }
        })
      })
    }, 500)
  }, [surveyId, survey, saveWithFeedback])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    debouncedSaveTitle(newTitle)
  }

  const handleQuestionsChange = (newQuestions: QuestionDraft[]) => {
    setQuestions(newQuestions)
    debouncedSaveQuestions(newQuestions)
  }

  const handleQuestionUpdate = (id: string, updates: Partial<QuestionDraft>) => {
    const newQuestions = questions.map(q => q.id === id ? { ...q, ...updates } : q)
    setQuestions(newQuestions)
    debouncedSaveQuestions(newQuestions)
  }

  const handleQuestionDelete = async (id: string) => {
    setQuestionToDelete(id)
  }

  const executeQuestionDelete = async () => {
    if (!questionToDelete) return
    const id = questionToDelete
    setQuestionToDelete(null)

    const newQuestions = questions.filter(q => q.id !== id)
    setQuestions(newQuestions)

    // Delete immediately from DB
    await supabase.from('questions').delete().eq('id', id)

    // Update survey state
    setSurvey(prev => {
      if (!prev) return null
      return {
        ...prev,
        questions: prev.questions.filter(q => q.id !== id),
      }
    })
  }

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuestionDraft = {
      id: crypto.randomUUID(),
      type,
      text: '',
      config: getDefaultConfig(type),
      isNew: true,
    }
    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    setIsAddingQuestion(false)
    debouncedSaveQuestions(newQuestions)
  }

  const handleToggleStatus = async () => {
    if (!survey) return

    setIsTogglingStatus(true)
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ is_active: !survey.is_active })
        .eq('id', surveyId)

      if (error) throw error

      setSurvey(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update survey status')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setIsDeleting(true)
    try {
      // Delete responses first (foreign key constraint)
      await supabase
        .from('responses')
        .delete()
        .eq('survey_id', surveyId)

      // Delete questions
      await supabase
        .from('questions')
        .delete()
        .eq('survey_id', surveyId)

      // Delete survey
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting survey:', error)
      toast.error('Failed to delete survey')
      setIsDeleting(false)
    }
  }

  const setTab = (tab: TabType) => {
    router.push(`/dashboard/surveys/${surveyId}?tab=${tab}`, { scroll: false })
  }

  const calculateStats = () => {
    if (!survey?.responses.length || !survey?.questions.length) {
      return null
    }

    const stats: Record<string, unknown> = {}

    survey.questions.forEach((question) => {
      const answers = survey.responses
        .map(r => r.answers.find((a: { question_id: string }) => a.question_id === question.id)?.value)
        .filter(Boolean)

      // Binary types: answer is 'left' | 'right' (| 'up' for swipe)
      const binaryTypes = ['swipe', 'toggle_switch', 'tug_of_war']
      // Scale types: answer is a number 0-100
      const scaleTypes = ['slider', 'thermometer', 'bullseye', 'stars', 'dial', 'press_hold', 'tilt']
      // Single-select types: answer is a string (one of the options)
      const singleSelectTypes = [
        'tap_meter', 'rolodex', 'fanned', 'fanned_swipe', 'stacked',
        'tilt_maze', 'racing_lanes', 'gravity_drop', 'bubble_pop',
        'slingshot', 'scratch_card', 'treasure_chest', 'pinata',
        'spin_stop', 'door_choice', 'whack_a_mole', 'flick',
      ]

      if (binaryTypes.includes(question.type)) {
        const counts = { left: 0, right: 0, up: 0 }
        answers.forEach((a) => {
          if (a === 'left' || a === 'right' || a === 'up') counts[a]++
        })
        stats[question.id] = {
          type: 'swipe',
          total: answers.length,
          left: counts.left,
          right: counts.right,
          up: counts.up,
          labels: question.config,
        }
      } else if (scaleTypes.includes(question.type)) {
        const values = answers.filter((a): a is number => typeof a === 'number')
        const avg = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
        stats[question.id] = {
          type: 'slider',
          total: values.length,
          average: Math.round(avg),
          distribution: [
            values.filter(v => v <= 20).length,
            values.filter(v => v > 20 && v <= 40).length,
            values.filter(v => v > 40 && v <= 60).length,
            values.filter(v => v > 60 && v <= 80).length,
            values.filter(v => v > 80).length,
          ],
          labels: question.config,
        }
      } else if (['tap', 'sticker_board', 'conveyor_belt', 'magnet_board', 'bingo_card', 'shopping_cart', 'jar_fill', 'paint_splatter', 'claw_machine'].includes(question.type)) {
        // Multi-select: answer is string[]
        const optionCounts: Record<string, number> = {}
        answers.forEach((a) => {
          if (Array.isArray(a)) {
            a.forEach((opt: string) => {
              optionCounts[opt] = (optionCounts[opt] || 0) + 1
            })
          }
        })
        stats[question.id] = {
          type: 'tap',
          total: answers.length,
          options: optionCounts,
        }
      } else if (singleSelectTypes.includes(question.type)) {
        // Single-select: answer is a string
        const optionCounts: Record<string, number> = {}
        answers.forEach((a) => {
          if (typeof a === 'string') {
            optionCounts[a] = (optionCounts[a] || 0) + 1
          }
        })
        stats[question.id] = {
          type: 'tap',
          total: answers.length,
          options: optionCounts,
        }
      } else if (question.type === 'word_cloud') {
        // Word cloud: multi-select word frequency (same as tap)
        const wordCounts: Record<string, number> = {}
        answers.forEach((a) => {
          if (Array.isArray(a)) {
            a.forEach((word: string) => {
              wordCounts[word] = (wordCounts[word] || 0) + 1
            })
          }
        })
        stats[question.id] = {
          type: 'tap',
          total: answers.length,
          options: wordCounts,
        }
      } else if (question.type === 'emoji_reaction') {
        // Emoji reaction: parse emoji|reason format
        const emojiCounts: Record<string, number> = {}
        const reasons: string[] = []
        answers.forEach((a) => {
          if (typeof a === 'string') {
            const pipeIndex = a.indexOf('|')
            if (pipeIndex > 0) {
              const emoji = a.substring(0, pipeIndex)
              const reason = a.substring(pipeIndex + 1)
              emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1
              if (reason.trim()) reasons.push(`${emoji} ${reason}`)
            } else {
              emojiCounts[a] = (emojiCounts[a] || 0) + 1
            }
          }
        })
        stats[question.id] = {
          type: 'emoji_reaction',
          total: answers.length,
          emojiCounts,
          reasons,
        }
      } else if (['short_text', 'mad_libs', 'voice_note'].includes(question.type)) {
        // Text/voice: collect as list
        const textResponses: string[] = []
        answers.forEach((a) => {
          if (typeof a === 'string') textResponses.push(a)
        })
        stats[question.id] = {
          type: 'text',
          total: textResponses.length,
          responses: textResponses,
          isVoice: question.type === 'voice_note',
        }
      }

      // If this question has a follow-up config, aggregate follow_up_value from each answer
      const followUpConfig = (question.config as QuestionConfig).follow_up
      if (followUpConfig) {
        const followUpValues = survey.responses
          .map(r => (r.answers.find((a: { question_id: string; follow_up_value?: unknown }) => a.question_id === question.id) as { follow_up_value?: unknown } | undefined)?.follow_up_value)
          .filter(v => v !== undefined && v !== null)

        if (followUpValues.length > 0) {
          const fuType = followUpConfig.question.type
          if (fuType === 'bubble_pop' || fuType === 'swipe') {
            const optionCounts: Record<string, number> = {}
            followUpValues.forEach(v => {
              if (typeof v === 'string') optionCounts[v] = (optionCounts[v] || 0) + 1
            })
            stats[`${question.id}_follow_up`] = {
              type: 'follow_up_tap',
              total: followUpValues.length,
              options: optionCounts,
              question: followUpConfig.question,
            }
          } else if (fuType === 'slider') {
            const nums = followUpValues.filter((v): v is number => typeof v === 'number')
            const avg = nums.length > 0 ? Math.round(nums.reduce((s, v) => s + v, 0) / nums.length) : 0
            stats[`${question.id}_follow_up`] = {
              type: 'follow_up_scale',
              total: nums.length,
              average: avg,
              question: followUpConfig.question,
            }
          } else if (fuType === 'short_text') {
            stats[`${question.id}_follow_up`] = {
              type: 'follow_up_text',
              total: followUpValues.length,
              responses: followUpValues.filter((v): v is string => typeof v === 'string'),
              question: followUpConfig.question,
            }
          }
        }
      }
    })

    return stats
  }

  const downloadCSV = () => {
    if (!survey) return
    const sortedQuestions = [...survey.questions].sort((a, b) => a.order_index - b.order_index)

    // Build headers: each question gets a column; questions with follow-ups get an extra column
    const headers: string[] = ['Response #', 'Completed At', 'Duration (s)']
    sortedQuestions.forEach(q => {
      headers.push(q.text || 'Untitled')
      const followUpConfig = (q.config as QuestionConfig).follow_up
      if (followUpConfig) {
        headers.push(`${q.text || 'Untitled'} → Follow-up: ${followUpConfig.question.text || 'Follow-up'}`)
      }
    })

    const formatAnswer = (question: { type: string; config: Record<string, unknown> }, value: unknown): string => {
      if (value == null) return ''
      if (['swipe', 'toggle_switch', 'tug_of_war'].includes(question.type)) {
        const config = question.config as Record<string, string>
        if (value === 'right') return config.right_label || 'Yes'
        if (value === 'left') return config.left_label || 'No'
        if (value === 'up') return config.up_label || 'Meh'
        return String(value)
      }
      // Voice note: data URLs are too large for CSV
      if (question.type === 'voice_note') {
        return typeof value === 'string' && value.startsWith('data:audio') ? '[Audio response]' : String(value)
      }
      if (Array.isArray(value)) return value.join(', ')
      return String(value)
    }

    const rows = survey.responses.map((response, i) => {
      const duration = response.duration_ms ? (response.duration_ms / 1000).toFixed(1) : ''
      const completedAt = new Date(response.completed_at).toLocaleString()
      const answerCells: string[] = []
      sortedQuestions.forEach(q => {
        const answer = response.answers.find((a: { question_id: string; follow_up_value?: unknown }) => a.question_id === q.id)
        answerCells.push(formatAnswer(q, answer?.value))
        const followUpConfig = (q.config as QuestionConfig).follow_up
        if (followUpConfig) {
          const fuValue = answer?.follow_up_value
          answerCells.push(fuValue != null ? String(fuValue) : '')
        }
      })
      return [String(i + 1), completedAt, duration, ...answerCells]
    })

    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsvField).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${survey.title || 'survey'}-responses.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadLeads = async () => {
    if (!survey) return
    const { data: leads } = await supabase
      .from('leads')
      .select('email, is_organizer, created_at')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false })

    if (!leads || leads.length === 0) return

    const headers = ['Email', 'Organizer', 'Captured At']
    const rows = leads.map((l: { email: string; is_organizer: boolean; created_at: string }) => [
      l.email,
      l.is_organizer ? 'Yes' : 'No',
      new Date(l.created_at).toLocaleString(),
    ])

    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsvField).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${survey.title || 'survey'}-leads.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Survey not found</h2>
        <Link href="/dashboard" className="text-violet-500 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const stats = calculateStats()
  const playUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${surveyId}` : ''
  const hasResponses = survey.responses.length > 0

  return (
    <div className="animate-fade-in overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: survey.title || 'Untitled Survey' },
          ]} />

          {/* Editable title */}
          <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 mt-2 min-w-0">
            <textarea
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Survey title..."
              rows={2}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 bg-transparent border-0 border-b-2 border-transparent hover:border-slate-200 focus:border-violet-500 focus:outline-none px-1 py-1 transition-colors resize-none overflow-hidden leading-tight w-full min-w-0"
              style={{ minHeight: '3.5rem' }}
            />
            {/* Save status indicator */}
            <div className="text-xs sm:text-sm font-medium flex-shrink-0">
              {saveStatus === 'saving' && (
                <span className="text-slate-400 flex items-center gap-1 whitespace-nowrap">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <motion.span
                  className="text-emerald-500 whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ✓ Saved
                </motion.span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-500 flex items-center gap-1 whitespace-nowrap">
                  ⚠️ Unable to save
                  <button
                    onClick={() => debouncedSaveQuestions(questions)}
                    className="underline hover:no-underline"
                  >
                    Retry
                  </button>
                </span>
              )}
            </div>
          </div>

          <p className="text-slate-500 mt-1 font-medium">
            {questions.length} questions • {survey.responses.length} responses
          </p>
        </div>

        {/* Status and actions */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Status toggle */}
          <button
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              survey.is_active
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            } ${isTogglingStatus ? 'opacity-50' : ''}`}
          >
            {isTogglingStatus ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${survey.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            )}
            {survey.is_active ? 'Active' : 'Paused'}
          </button>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs sm:text-sm font-medium transition-colors border border-red-200 whitespace-nowrap"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Warning banner for surveys with responses */}
      {hasResponses && !warningDismissed && (
        <motion.div
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">This survey has {survey.responses.length} response{survey.responses.length !== 1 ? 's' : ''}</p>
            <p className="text-amber-700 text-sm">
              Editing questions may affect how results are displayed. Changes are saved automatically.
            </p>
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-amber-600 hover:text-amber-800 p-1"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Tab navigation */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 mb-6 sm:bg-slate-100 sm:p-1 sm:rounded-xl">
        {(['questions', 'share', 'responses', 'analytics'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
              currentTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 bg-slate-50 sm:bg-transparent'
            }`}
          >
            {tab === 'questions' && '📝 Questions'}
            {tab === 'share' && '🔗 Share'}
            {tab === 'responses' && `📊 Responses ${hasResponses ? `(${survey.responses.length})` : ''}`}
            {tab === 'analytics' && '⚡ Analytics'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {currentTab === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            {questions.length === 0 && !isAddingQuestion ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No questions yet</h3>
                <p className="text-slate-500 mb-4">Add your first question to get started!</p>
                <button
                  onClick={() => setIsAddingQuestion(true)}
                  className="bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-600 transition-colors"
                >
                  + Add Question
                </button>
              </div>
            ) : (
              <>
                <QuestionEditor
                  questions={questions}
                  onQuestionsChange={handleQuestionsChange}
                  onQuestionUpdate={handleQuestionUpdate}
                  onQuestionDelete={handleQuestionDelete}
                />

                {/* Add question button */}
                {!isAddingQuestion ? (
                  <button
                    onClick={() => setIsAddingQuestion(true)}
                    className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-violet-500 hover:text-violet-500 transition-colors"
                  >
                    + Add Question
                  </button>
                ) : (
                  <div className="mt-4">
                    <QuestionTypeSelector
                      onSelect={addQuestion}
                      onCancel={() => setIsAddingQuestion(false)}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {currentTab === 'share' && (
          <motion.div
            key="share"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <h2 className="text-lg font-bold text-slate-800 mb-4">Share Survey</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="text-center">
                {qrCodeUrl && (
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-md mb-4">
                    <img src={qrCodeUrl} alt="QR Code" className="rounded-xl" />
                  </div>
                )}
                <button
                  onClick={downloadQRCode}
                  className="w-full py-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors font-semibold"
                >
                  Download QR Code
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Make scanning feel like starting a game
                </p>
                {/* Poster button hidden — use Canva for physical materials */}
              </div>

              {/* Link and embed */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Survey Link</label>
                  <div className="flex gap-2 min-w-0">
                    <input
                      type="text"
                      value={playUrl}
                      readOnly
                      className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium"
                    />
                    <button
                      onClick={copyLink}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all font-medium whitespace-nowrap ${
                        copied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {copied ? 'Copied! ✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
                  <Link
                    href={`/play/${surveyId}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-violet-500 hover:text-violet-600 font-medium"
                  >
                    Open survey in new tab →
                  </Link>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Survey Status</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {survey.is_active
                      ? 'Survey is active and accepting responses.'
                      : 'Survey is paused. Visitors will see a "survey closed" message.'}
                  </p>
                  <button
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      survey.is_active
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {survey.is_active ? 'Pause Survey' : 'Activate Survey'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentTab === 'responses' && (
          <motion.div
            key="responses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Responses</h2>
              {survey.responses.length > 0 && (
                canExportCSV() ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download CSV
                    </button>
                    {survey.questions.some(q => q.type === 'email_capture') && (
                      <button
                        onClick={downloadLeads}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Download Leads
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed" title="CSV export available on Starter plan or with per-event purchase">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="whitespace-nowrap">CSV Export (Premium)</span>
                    <a href="/pricing" className="text-violet-600 hover:text-violet-700 underline whitespace-nowrap">
                      Upgrade
                    </a>
                  </div>
                )
              )}
            </div>

            {/* Response limit banner (free tier) */}
            {survey.max_responses != null && (() => {
              const limit = survey.max_responses as number
              const used = survey.responses.length
              const isFull = used >= limit
              const isNearFull = used >= limit * 0.8
              return (
                <div className={`flex items-center justify-between rounded-xl px-4 py-3 mb-4 text-sm font-medium ${
                  isFull
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : isNearFull
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-violet-50 border border-violet-100 text-violet-700'
                }`}>
                  <span>
                    <strong>{used} / {limit}</strong> responses used
                    {isFull && ' — survey is full'}
                  </span>
                  <a
                    href="/pricing"
                    className="underline underline-offset-2 hover:opacity-80 font-semibold"
                  >
                    Upgrade to remove limit →
                  </a>
                </div>
              )
            })()}

            {survey.responses.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-medium mb-2">No responses yet</p>
                <p className="text-sm">Share the QR code to start collecting feedback!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-violet-500">{survey.responses.length}</div>
                    <div className="text-sm text-slate-500 font-medium">Total Responses</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600">
                      {survey.responses.length > 0
                        ? Math.round(
                            survey.responses.reduce((sum, r) => sum + (r.duration_ms || 0), 0) /
                              survey.responses.length /
                              1000
                          )
                        : 0}s
                    </div>
                    <div className="text-sm text-slate-500 font-medium">Avg. Duration</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600">{questions.length}</div>
                    <div className="text-sm text-slate-500 font-medium">Questions</div>
                  </div>
                </div>

                {/* Question-by-question breakdown */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Results by Question</h3>
                  {survey.questions.map((question) => {
                    const questionStats = stats?.[question.id] as Record<string, unknown> | undefined
                    const typeInfo = questionTypeInfo[question.type]
                    const total = Number(questionStats?.total || 0)

                    const followUpStats = stats?.[`${question.id}_follow_up`] as Record<string, unknown> | undefined

                    return (
                      <div key={question.id}>
                      <div className="border border-slate-100 rounded-xl p-5">
                        {/* Question header with response count badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{typeInfo?.emoji || '❓'}</span>
                            <div>
                              <p className="font-semibold text-slate-800">{question.text || 'Untitled question'}</p>
                              <p className="text-xs text-slate-500">{typeInfo?.label || question.type}</p>
                            </div>
                          </div>
                          {total > 0 && (
                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                              {total} response{total !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Swipe: Stacked segment bar */}
                        {questionStats?.type === 'swipe' && (() => {
                          const labels = questionStats.labels as Record<string, string> || {}
                          const rightPct = total > 0 ? Math.round((Number(questionStats.right) / total) * 100) : 0
                          const leftPct = total > 0 ? Math.round((Number(questionStats.left) / total) * 100) : 0
                          const upPct = total > 0 ? Math.round((Number(questionStats.up) / total) * 100) : 0
                          const segments = [
                            { label: labels.right_label || 'Yes', count: Number(questionStats.right), pct: rightPct, color: 'bg-emerald-500', dot: 'bg-emerald-500' },
                            { label: labels.left_label || 'No', count: Number(questionStats.left), pct: leftPct, color: 'bg-red-400', dot: 'bg-red-400' },
                            ...(Number(questionStats.up) > 0 ? [{ label: labels.up_label || 'Meh', count: Number(questionStats.up), pct: upPct, color: 'bg-amber-400', dot: 'bg-amber-400' }] : []),
                          ]
                          return (
                            <div>
                              {/* Stacked bar */}
                              <div className="h-8 rounded-lg overflow-hidden flex">
                                {segments.map((seg, i) => (
                                  <motion.div
                                    key={seg.label}
                                    className={`${seg.color} flex items-center justify-center text-white text-xs font-bold`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${seg.pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                  >
                                    {seg.pct >= 15 ? `${seg.pct}%` : ''}
                                  </motion.div>
                                ))}
                              </div>
                              {/* Legend */}
                              <div className="flex gap-4 mt-3">
                                {segments.map(seg => (
                                  <div key={seg.label} className="flex items-center gap-1.5 text-sm">
                                    <div className={`w-2.5 h-2.5 rounded-full ${seg.dot}`} />
                                    <span className="text-slate-600 font-medium">{seg.label}</span>
                                    <span className="text-slate-400">{seg.count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Scale: Average bar + distribution histogram */}
                        {questionStats?.type === 'slider' && (() => {
                          const avg = Number(questionStats.average)
                          const distribution = (questionStats.distribution as number[]) || [0, 0, 0, 0, 0]
                          const maxBucket = Math.max(...distribution, 1)
                          const labels = questionStats.labels as Record<string, string> || {}
                          const bucketLabels = ['0–20', '21–40', '41–60', '61–80', '81–100']
                          const avgColor = avg >= 70 ? 'text-emerald-600' : avg >= 40 ? 'text-amber-600' : 'text-red-500'

                          return (
                            <div>
                              {/* Average score */}
                              <div className="flex items-center gap-4 mb-3">
                                <span className={`text-3xl font-bold ${avgColor}`}>{avg}%</span>
                                <div className="flex-1">
                                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${avg}%` }}
                                      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                                    />
                                  </div>
                                  {(labels.min_label || labels.max_label) && (
                                    <div className="flex justify-between mt-1">
                                      <span className="text-[10px] text-slate-400">{labels.min_label}</span>
                                      <span className="text-[10px] text-slate-400">{labels.max_label}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Distribution histogram */}
                              {distribution.some(v => v > 0) && (
                                <div className="space-y-1.5 mt-4">
                                  <p className="text-xs font-medium text-slate-500 mb-2">Distribution</p>
                                  {bucketLabels.map((label, i) => (
                                    <div key={label} className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400 w-12 text-right font-mono">{label}</span>
                                      <div className="flex-1 h-5 bg-slate-50 rounded overflow-hidden">
                                        <motion.div
                                          className="h-full bg-violet-400/70 rounded"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(distribution[i] / maxBucket) * 100}%` }}
                                          transition={{ duration: 0.5, delay: i * 0.08 }}
                                        />
                                      </div>
                                      <span className="text-xs text-slate-500 w-6 font-medium">{distribution[i]}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {/* Options: Horizontal bar chart */}
                        {questionStats?.type === 'tap' && (() => {
                          const options = questionStats.options as Record<string, number>
                          const sorted = Object.entries(options).sort(([, a], [, b]) => b - a)
                          const maxCount = Math.max(...Object.values(options), 1)
                          const barColors = ['bg-violet-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500']

                          return (
                            <div className="space-y-2.5">
                              {sorted.map(([opt, count], i) => {
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                                return (
                                  <div key={opt}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-slate-700">{opt}</span>
                                      <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-6 bg-slate-50 rounded-lg overflow-hidden">
                                      <motion.div
                                        className={`h-full ${barColors[i % barColors.length]} rounded-lg`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / maxCount) * 100}%` }}
                                        transition={{ duration: 0.6, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}

                        {/* Text responses: scrollable list */}
                        {questionStats?.type === 'text' && (() => {
                          const responses = questionStats.responses as string[]
                          const isVoice = questionStats.isVoice as boolean
                          return (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {responses.length === 0 && (
                                <p className="text-sm text-slate-400 italic">No responses yet</p>
                              )}
                              {isVoice ? (
                                responses.map((dataUrl, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <span className="text-lg">🎤</span>
                                    {typeof dataUrl === 'string' && dataUrl.startsWith('data:audio') ? (
                                      <audio controls src={dataUrl} className="flex-1 h-8" />
                                    ) : (
                                      <span className="text-sm text-slate-400 italic">Audio response</span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                responses.map((text, i) => (
                                  <motion.div
                                    key={i}
                                    className="p-3 bg-violet-50 rounded-lg text-sm text-slate-700 border border-violet-100"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                  >
                                    &ldquo;{text}&rdquo;
                                  </motion.div>
                                ))
                              )}
                            </div>
                          )
                        })()}

                        {/* Emoji reaction: distribution + reasons */}
                        {questionStats?.type === 'emoji_reaction' && (() => {
                          const emojiCounts = questionStats.emojiCounts as Record<string, number>
                          const reasons = questionStats.reasons as string[]
                          const emojiTotal = Number(questionStats.total)
                          const sorted = Object.entries(emojiCounts).sort(([, a], [, b]) => b - a)
                          const maxCount = Math.max(...Object.values(emojiCounts), 1)

                          return (
                            <div>
                              <div className="space-y-2 mb-4">
                                {sorted.map(([emoji, count], i) => {
                                  const pct = emojiTotal > 0 ? Math.round((count / emojiTotal) * 100) : 0
                                  return (
                                    <div key={emoji}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-2xl">{emoji}</span>
                                        <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                                      </div>
                                      <div className="h-5 bg-slate-50 rounded-lg overflow-hidden">
                                        <motion.div
                                          className="h-full bg-violet-400 rounded-lg"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(count / maxCount) * 100}%` }}
                                          transition={{ duration: 0.6, delay: i * 0.1 }}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              {reasons.length > 0 && (
                                <div className="border-t border-slate-100 pt-3">
                                  <p className="text-xs font-medium text-slate-500 mb-2">Reasons ({reasons.length})</p>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {reasons.map((reason, i) => (
                                      <div key={i} className="text-sm text-slate-600 p-2 bg-slate-50 rounded">
                                        {reason}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {!questionStats && (
                          <p className="text-sm text-slate-400 italic">No responses for this question yet</p>
                        )}
                      </div>

                      {/* Follow-up sub-card */}
                      {followUpStats && (() => {
                        const fuQ = followUpStats.question as { text: string; type: string; config: Record<string, unknown> }
                        const fuTotal = Number(followUpStats.total)
                        return (
                          <div className="ml-6 mt-1 border border-violet-100 bg-violet-50/40 rounded-xl p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <span className="text-xs text-violet-400 font-medium mt-0.5">↳</span>
                              <div>
                                <p className="text-sm font-semibold text-slate-700">{fuQ.text || 'Follow-up question'}</p>
                                <p className="text-xs text-violet-400">{fuTotal} of {total} respondents answered this follow-up</p>
                              </div>
                            </div>

                            {/* Options (bubble_pop / swipe follow-up) */}
                            {followUpStats.type === 'follow_up_tap' && (() => {
                              const options = followUpStats.options as Record<string, number>
                              const sorted = Object.entries(options).sort(([, a], [, b]) => b - a)
                              const maxCount = Math.max(...Object.values(options), 1)
                              return (
                                <div className="space-y-2">
                                  {sorted.map(([opt, count], i) => {
                                    const pct = fuTotal > 0 ? Math.round((count / fuTotal) * 100) : 0
                                    return (
                                      <div key={opt}>
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-slate-700">{opt}</span>
                                          <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                                        </div>
                                        <div className="h-5 bg-white rounded-lg overflow-hidden border border-violet-100">
                                          <motion.div
                                            className="h-full bg-violet-400 rounded-lg"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / maxCount) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                          />
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}

                            {/* Scale (slider follow-up) */}
                            {followUpStats.type === 'follow_up_scale' && (() => {
                              const avg = Number(followUpStats.average)
                              const avgColor = avg >= 70 ? 'text-emerald-600' : avg >= 40 ? 'text-amber-600' : 'text-red-500'
                              return (
                                <div className="flex items-center gap-4">
                                  <span className={`text-2xl font-bold ${avgColor}`}>{avg}%</span>
                                  <div className="flex-1">
                                    <div className="h-3 bg-white rounded-full overflow-hidden border border-violet-100">
                                      <motion.div
                                        className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${avg}%` }}
                                        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}

                            {/* Text (short_text follow-up) */}
                            {followUpStats.type === 'follow_up_text' && (() => {
                              const responses = followUpStats.responses as string[]
                              return (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {responses.map((text, i) => (
                                    <div key={i} className="p-2.5 bg-white rounded-lg text-sm text-slate-700 border border-violet-100">
                                      {text}
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}
                          </div>
                        )
                      })()}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {currentTab === 'analytics' && (
        <motion.div
          key="analytics"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-6">Completion Analytics</h2>

          {analyticsLoading && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">⏳</div>
              <p className="font-medium">Loading analytics…</p>
            </div>
          )}

          {!analyticsLoading && analyticsData === null && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">📡</div>
              <p className="font-medium mb-2">Couldn&apos;t load analytics</p>
              <p className="text-sm">Make sure <code className="bg-slate-100 px-1 rounded">POSTHOG_PERSONAL_API_KEY</code> is set and the survey has received traffic.</p>
            </div>
          )}

          {!analyticsLoading && analyticsData && (
            canViewFullAnalytics() ? (
              <div className="space-y-6">
                {/* Hero metric - Full analytics for paid users */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-violet-50 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-bold mb-1" style={{ color: '#8B5CF6' }}>
                      {analyticsData.completionRate !== null ? `${analyticsData.completionRate}%` : '—'}
                    </div>
                    <div className="text-sm font-semibold text-violet-700">Completion rate</div>
                    <div className="text-xs text-slate-400 mt-1">Industry avg: ~15%</div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-bold text-slate-700 mb-1">
                      {analyticsData.started}
                    </div>
                    <div className="text-sm font-semibold text-slate-500">Started</div>
                    <div className="text-xs text-slate-400 mt-1">{analyticsData.completed} completed</div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-bold text-slate-700 mb-1">
                      {analyticsData.avgTimeSec !== null
                        ? analyticsData.avgTimeSec >= 60
                          ? `${Math.floor(analyticsData.avgTimeSec / 60)}m ${analyticsData.avgTimeSec % 60}s`
                          : `${analyticsData.avgTimeSec}s`
                        : '—'}
                    </div>
                    <div className="text-sm font-semibold text-slate-500">Avg. time</div>
                    <div className="text-xs text-slate-400 mt-1">to complete</div>
                  </div>
                </div>

                {/* Drop-off by question - Only for paid users */}
                {analyticsData.dropoff.length > 0 && analyticsData.started > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Answers by question</h3>
                    <div className="space-y-2">
                      {analyticsData.dropoff.map((count, i) => {
                        const pct = Math.round((count / analyticsData.started) * 100)
                        const q = survey.questions[i]
                        return (
                          <div key={i} className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 flex-shrink-0 text-right text-xs font-medium text-slate-400">Q{i + 1}</div>
                            <div className="flex-1 min-w-0 bg-slate-100 rounded-full h-5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: '#8B5CF6' }}
                              />
                            </div>
                            <div className="w-10 flex-shrink-0 text-xs font-semibold text-slate-500">{pct}%</div>
                            <div className="hidden sm:block w-48 text-xs text-slate-400 truncate">{q?.text || ''}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {analyticsData.started === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <p className="font-medium">No data yet</p>
                    <p className="text-sm">Analytics will appear once respondents start this survey.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic analytics - Free users */}
                <div className="bg-violet-50 rounded-2xl p-8 text-center max-w-md mx-auto">
                  <div className="text-6xl font-bold mb-2" style={{ color: '#8B5CF6' }}>
                    {analyticsData.completionRate !== null ? `${analyticsData.completionRate}%` : '—'}
                  </div>
                  <div className="text-lg font-semibold text-violet-700 mb-1">Completion rate</div>
                  <div className="text-sm text-slate-400">Industry avg: ~15%</div>
                  <div className="mt-4 pt-4 border-t border-violet-200 text-sm text-slate-600">
                    <strong>{analyticsData.started}</strong> started · <strong>{analyticsData.completed}</strong> completed
                  </div>
                </div>

                {/* Upgrade CTA */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-2">Unlock Full Analytics Dashboard</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Upgrade to see average completion time, drop-off by question analysis, and advanced metrics to optimize your survey.
                      </p>
                      <a
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        View Plans
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Question Delete Confirmation */}
      <ConfirmDialog
        open={!!questionToDelete}
        title="Delete this question?"
        message="This question and its responses will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeQuestionDelete}
        onCancel={() => setQuestionToDelete(null)}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Survey?</h3>
                <p className="text-slate-500">
                  This will permanently delete <strong>&quot;{survey.title}&quot;</strong> and all {survey.responses.length} response{survey.responses.length !== 1 ? 's' : ''}.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    deleteConfirmText === 'DELETE'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-100 text-red-300 cursor-not-allowed'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Modal */}
      <AnimatePresence>
        {posterModalOpen && survey && (
          <PosterModal
            survey={survey}
            playUrl={playUrl}
            onClose={() => setPosterModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
