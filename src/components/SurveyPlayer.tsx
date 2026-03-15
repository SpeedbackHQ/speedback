'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CountdownIntro } from './CountdownIntro'
import { Celebration } from './Celebration'
import { StreakCounter } from './StreakCounter'
import { GestureHint, getGestureType } from './GestureHint'
import { SwipeQuestion, ThisOrThatQuestion, SliderQuestion, TapQuestion, TapMeterQuestion, RolodexQuestion, StarsQuestion, ThermometerQuestion, FannedCardsQuestion, FannedSwipeQuestion, StackedCardsQuestion, TiltMazeQuestion, RacingLanesQuestion, GravityDropQuestion, BubblePopQuestion, BullseyeQuestion, SlingshotQuestion, ScratchCardQuestion, TreasureChestQuestion, PinataQuestion, ToggleSwitchQuestion, PressHoldQuestion, DialQuestion, SpinStopQuestion, CountdownTapQuestion, DoorChoiceQuestion, WhackAMoleQuestion, TugOfWarQuestion, TiltQuestion, FlickQuestion, ShortTextQuestion, MadLibsQuestion, EmojiReactionQuestion, WordCloudQuestion, VoiceNoteQuestion, PaintSplatterQuestion, BingoCardQuestion, ShoppingCartQuestion, StickerBoardQuestion, JarFillQuestion, ConveyorBeltQuestion, MagnetBoardQuestion, ClawMachineQuestion, WheelQuestion } from './questions'
import { supabase } from '@/lib/supabase'
import { Question, AnswerValue, SurveyWithQuestions, InlineFollowUp, QuestionConfig } from '@/lib/types'
import { track } from '@/lib/analytics'
import { getQuestionCategory } from '@/lib/question-types'

interface SurveyPlayerProps {
  survey: SurveyWithQuestions
  showSpeedbackBranding?: boolean
}

type GameState = 'intro' | 'playing' | 'complete'

export function SurveyPlayer({ survey, showSpeedbackBranding = false }: SurveyPlayerProps) {
  const [gameState, setGameState] = useState<GameState>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<{ question_id: string; value: AnswerValue; time_spent_ms?: number }>>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [percentile, setPercentile] = useState<number | null>(null)
  const [responseId, setResponseId] = useState<string | null>(null)

  // Streak tracking for swipe questions
  const [swipeStreak, setSwipeStreak] = useState(0)
  const [isSpeedBonus, setIsSpeedBonus] = useState(false)
  const lastAnswerTime = useRef<number>(0)

  // Per-question timing for analytics
  const questionStartTime = useRef<number>(Date.now())

  // Stable response ID generated once at mount, used as join key between PostHog events and Supabase
  const responseSessionId = useRef<string>(crypto.randomUUID())

  // Gesture hint overlay — track which gesture types have already been shown this session
  const seenGestureTypes = useRef<Set<string>>(new Set())
  const [showHint, setShowHint] = useState(false)
  const dismissHint = useCallback(() => setShowHint(false), [])

  // Conditional follow-up state
  const [pendingFollowUp, setPendingFollowUp] = useState<InlineFollowUp | null>(null)
  const pendingFollowUpParentId = useRef<string>('')

  function shouldShowFollowUp(config: QuestionConfig, value: AnswerValue): boolean {
    const fu = config.follow_up
    if (!fu) return false
    const { type, threshold, value: condValue } = fu.condition
    if (type === 'above_threshold') return (value as number) >= (threshold ?? 75)
    if (type === 'below_threshold') return (value as number) < (threshold ?? 25)
    if (type === 'equals') return value === condValue
    return false
  }

  // Create a sorted copy to avoid mutating the original array
  const questions = useMemo(
    () => [...survey.questions].sort((a, b) => a.order_index - b.order_index),
    [survey.questions]
  )
  const currentQuestion = questions[currentIndex]

  // Reset hint and question timer when question changes
  useEffect(() => {
    questionStartTime.current = Date.now()
    const gestureType = currentQuestion && getGestureType(currentQuestion.type)
    if (gestureType && !seenGestureTypes.current.has(gestureType)) {
      seenGestureTypes.current.add(gestureType)
      setShowHint(true)
    } else {
      setShowHint(false)
    }
  }, [currentIndex, currentQuestion])

  // Reset hint and question timer when follow-up appears
  useEffect(() => {
    if (pendingFollowUp) {
      questionStartTime.current = Date.now()
      const gestureType = getGestureType(pendingFollowUp.question.type)
      if (gestureType && !seenGestureTypes.current.has(gestureType)) {
        seenGestureTypes.current.add(gestureType)
        setShowHint(true)
      } else {
        setShowHint(false)
      }
    }
  }, [pendingFollowUp])

  // Track survey_abandoned when user leaves mid-survey
  useEffect(() => {
    if (gameState !== 'playing') return
    const handleBeforeUnload = () => {
      track('survey_abandoned', {
        survey_id: survey.id,
        last_question_index: currentIndex,
        last_question_type: currentQuestion?.type,
        last_question_category: currentQuestion ? getQuestionCategory(currentQuestion.type) : null,
        last_question_position_pct: questions.length > 0 ? currentIndex / questions.length : 0,
        previous_question_type: currentIndex > 0 ? questions[currentIndex - 1]?.type : null,
        questions_completed: answers.length,
        questions_total: questions.length,
      })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [gameState, currentIndex, answers.length, survey.id, currentQuestion?.type, questions.length])

  // Start timer when playing begins
  useEffect(() => {
    if (gameState === 'playing' && !startTime) {
      setStartTime(Date.now())
    }
  }, [gameState, startTime])

  // Update elapsed time every 100ms during play
  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [gameState, startTime])

  const handleStart = () => {
    track('survey_started', {
      survey_id: survey.id,
      response_id: responseSessionId.current,
      question_count: questions.length,
      question_types: questions.map(q => q.type),
      question_categories: [...new Set(questions.map(q => getQuestionCategory(q.type)))],
    })
    questionStartTime.current = Date.now()
    setGameState('playing')
  }

  const handleAnswer = (value: AnswerValue) => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is valid in event handlers
    const now = Date.now()
    const timeOnQuestion = now - questionStartTime.current

    // --- Answering an inline follow-up question ---
    if (pendingFollowUp) {
      track('question_answered', {
        survey_id: survey.id,
        response_id: responseSessionId.current,
        question_index: currentIndex,
        question_type: pendingFollowUp.question.type,
        question_category: getQuestionCategory(pendingFollowUp.question.type),
        question_position_pct: questions.length > 0 ? currentIndex / questions.length : 0,
        previous_question_type: currentQuestion?.type ?? null,
        previous_question_category: currentQuestion ? getQuestionCategory(currentQuestion.type) : null,
        time_spent_ms: timeOnQuestion,
        questions_total: questions.length,
        is_follow_up: true,
      })
      // Attach the follow-up value to the parent answer (Option A: no orphan question_ids)
      const newAnswers = answers.map(a =>
        a.question_id === pendingFollowUpParentId.current
          ? { ...a, follow_up_value: value }
          : a
      )
      setAnswers(newAnswers)
      setSwipeStreak(0)
      setIsSpeedBonus(false)
      lastAnswerTime.current = now
      setPendingFollowUp(null)

      if (currentIndex < questions.length - 1) {
        setTimeout(() => setCurrentIndex(prev => prev + 1), 400)
      } else {
        // eslint-disable-next-line react-hooks/purity -- Date.now() is valid in event handlers
        const finalElapsed = startTime ? Date.now() - startTime : 0
        setElapsedTime(finalElapsed)
        track('survey_completed', {
          survey_id: survey.id,
          response_id: responseSessionId.current,
          question_count: questions.length,
          total_time_ms: finalElapsed,
          question_types: questions.map(q => q.type),
        })
        saveResponse(newAnswers, finalElapsed).then((id) => {
          if (id) setResponseId(id)
          calculatePercentile(survey.id, finalElapsed).then((p) => {
            setPercentile(p)
            if (p !== null) {
              track('speed_percentile_shown', { survey_id: survey.id, percentile: p, duration_ms: finalElapsed })
            }
          })
        })
        setGameState('complete')
      }
      return
    }

    // --- Regular question answer ---
    track('question_answered', {
      survey_id: survey.id,
      response_id: responseSessionId.current,
      question_index: currentIndex,
      question_type: currentQuestion.type,
      question_category: getQuestionCategory(currentQuestion.type),
      question_position_pct: questions.length > 0 ? currentIndex / questions.length : 0,
      previous_question_type: currentIndex > 0 ? questions[currentIndex - 1]?.type : null,
      previous_question_category: currentIndex > 0 ? getQuestionCategory(questions[currentIndex - 1].type) : null,
      time_spent_ms: timeOnQuestion,
      questions_total: questions.length,
    })
    const newAnswer = { question_id: currentQuestion.id, value, time_spent_ms: timeOnQuestion }
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    // Track swipe streaks
    const isSwipe = currentQuestion.type === 'swipe'
    const nextQuestion = questions[currentIndex + 1]
    const isNextSwipe = nextQuestion?.type === 'swipe'

    if (isSwipe) {
      if (isNextSwipe) {
        // Continuing a swipe streak
        setSwipeStreak(prev => prev + 1)

        // Speed bonus if answered in < 1.5 seconds
        const timeSinceLastAnswer = now - lastAnswerTime.current
        if (lastAnswerTime.current > 0 && timeSinceLastAnswer < 1500) {
          setIsSpeedBonus(true)
          setTimeout(() => setIsSpeedBonus(false), 800)
        }
      } else {
        // End of swipe sequence (last swipe or next is different type)
        // Keep the streak showing briefly, then reset
        setTimeout(() => {
          setSwipeStreak(0)
          setIsSpeedBonus(false)
        }, 500)
      }
    } else {
      // Non-swipe question, reset streak
      setSwipeStreak(0)
      setIsSpeedBonus(false)
    }

    lastAnswerTime.current = now

    // Check for conditional follow-up
    const qConfig = currentQuestion.config as QuestionConfig
    if (qConfig?.follow_up && shouldShowFollowUp(qConfig, value)) {
      pendingFollowUpParentId.current = currentQuestion.id
      setTimeout(() => setPendingFollowUp(qConfig.follow_up!), 400)
      return
    }

    if (currentIndex < questions.length - 1) {
      // Next question - faster transition during streaks
      const transitionDelay = swipeStreak >= 2 && isNextSwipe ? 250 : 400
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, transitionDelay)
    } else {
      // Complete - capture final elapsed time and save response
      // eslint-disable-next-line react-hooks/purity -- Date.now() is valid in event handlers
      const finalElapsed = startTime ? Date.now() - startTime : 0
      setElapsedTime(finalElapsed)
      track('survey_completed', {
        survey_id: survey.id,
        response_id: responseSessionId.current,
        question_count: questions.length,
        total_time_ms: finalElapsed,
      })
      saveResponse(newAnswers, finalElapsed).then((id) => {
        if (id) setResponseId(id)
        calculatePercentile(survey.id, finalElapsed).then((p) => {
          setPercentile(p)
          if (p !== null) {
            track('speed_percentile_shown', { survey_id: survey.id, percentile: p, duration_ms: finalElapsed })
          }
        })
      })
      setGameState('complete')
    }
  }

  const saveResponse = async (answers: Array<{ question_id: string; value: AnswerValue; time_spent_ms?: number }>, duration: number | null): Promise<string | null> => {
    try {
      const id = responseSessionId.current
      const { data } = await supabase.from('responses').insert({
        id,
        survey_id: survey.id,
        answers,
        duration_ms: duration,
      }).select('id').single()
      return data?.id ?? null
    } catch (error) {
      console.error('Failed to save response:', error)
      return null
    }
  }

  const calculatePercentile = async (surveyId: string, durationMs: number) => {
    try {
      const { count: totalCount } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', surveyId)
        .not('duration_ms', 'is', null)

      // Don't show percentile with fewer than 10 responses (avoids meaningless data from test runs)
      if (!totalCount || totalCount < 10) return null

      const { count: slowerCount } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('survey_id', surveyId)
        .not('duration_ms', 'is', null)
        .gt('duration_ms', durationMs)

      return Math.round(((slowerCount ?? 0) / totalCount) * 100)
    } catch (error) {
      console.error('Failed to calculate percentile:', error)
      return null
    }
  }

  const renderQuestion = (question: Question) => {
    const props = { question, onAnswer: handleAnswer }

    // Check if next question is also a swipe (for rapid-fire mode)
    const nextQuestion = questions[currentIndex + 1]
    const hasNextSwipe = nextQuestion?.type === 'swipe'

    switch (question.type) {
      case 'swipe':
        return (
          <SwipeQuestion
            {...props}
            streak={swipeStreak}
            isSpeedBonus={isSpeedBonus}
            hasNextSwipe={hasNextSwipe}
          />
        )
      case 'this_or_that':
        return <ThisOrThatQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'slider':
        return <SliderQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'tap':
        return <TapQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'tap_meter':
        return <TapMeterQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'rolodex':
        return <RolodexQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'stars':
        return <StarsQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'thermometer':
        return <ThermometerQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'fanned':
        return <FannedCardsQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'fanned_swipe':
        return <FannedSwipeQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'stacked':
        return <StackedCardsQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'tilt_maze':
        return <TiltMazeQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'racing_lanes':
        return <RacingLanesQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'gravity_drop':
        return <GravityDropQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'bubble_pop':
        return <BubblePopQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'bullseye':
        return <BullseyeQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'slingshot':
        return <SlingshotQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'scratch_card':
        return <ScratchCardQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'treasure_chest':
        return <TreasureChestQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'pinata':
        return <PinataQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'toggle_switch':
        return <ToggleSwitchQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'press_hold':
        return <PressHoldQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'dial':
        return <DialQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'spin_stop':
        return <SpinStopQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'countdown_tap':
        return <CountdownTapQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'door_choice':
        return <DoorChoiceQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'whack_a_mole':
        return <WhackAMoleQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'tug_of_war':
        return <TugOfWarQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'tilt':
        return <TiltQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'flick':
        return <FlickQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'short_text':
        return <ShortTextQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'mad_libs':
        return <MadLibsQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'emoji_reaction':
        return <EmojiReactionQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'word_cloud':
        return <WordCloudQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'voice_note':
        return <VoiceNoteQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'paint_splatter':
        return <PaintSplatterQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'bingo_card':
        return <BingoCardQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'shopping_cart':
        return <ShoppingCartQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'sticker_board':
        return <StickerBoardQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'jar_fill':
        return <JarFillQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'conveyor_belt':
        return <ConveyorBeltQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'magnet_board':
        return <MagnetBoardQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'claw_machine':
        return <ClawMachineQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'wheel':
        return <WheelQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      case 'slot_machine':
        return <SpinStopQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
      default:
        return <div>Unknown question type: {question.type}</div>
    }
  }

  if (gameState === 'intro') {
    return (
      <CountdownIntro
        survey={survey}
        questionCount={questions.length}
        onComplete={handleStart}
      />
    )
  }

  if (gameState === 'complete') {
    return (
      <Celebration
        message={survey.thank_you_message}
        elapsedTime={elapsedTime}
        percentile={percentile}
        surveyId={survey.id}
        responseId={responseId}
        showSpeedbackBranding={showSpeedbackBranding}
        demoLeaderboard={survey.branding_config?.demo_leaderboard}
      />
    )
  }

  const primaryColor = survey.branding_config?.primary_color || '#8B5CF6'

  // When a follow-up is pending, synthesize a Question object from its config
  const followUpQuestion: Question | null = pendingFollowUp
    ? {
        id: `${pendingFollowUpParentId.current}_follow_up`,
        survey_id: survey.id,
        type: pendingFollowUp.question.type as Question['type'],
        text: pendingFollowUp.question.text,
        config: pendingFollowUp.question.config,
        order_index: -1,
        created_at: '',
      }
    : null

  const displayQuestion = followUpQuestion ?? currentQuestion
  const displayKey = followUpQuestion ? `${currentQuestion?.id}_follow_up` : currentQuestion?.id

  return (
    <div className="h-screen h-[100dvh] bg-slate-50 flex flex-col overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
      {/* Streak counter */}
      <StreakCounter streak={swipeStreak} isSpeedBonus={isSpeedBonus} />

      {/* Segmented progress bar */}
      <div className="flex gap-1.5 px-4 py-3 flex-shrink-0">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? 'bg-violet-500'
                : i === currentIndex
                ? 'bg-violet-300'
                : 'bg-slate-200'
            }`}
            style={i < currentIndex ? { backgroundColor: primaryColor } : i === currentIndex ? { backgroundColor: `${primaryColor}66` } : {}}
          />
        ))}
      </div>

      {/* Question area - full height */}
      <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {displayQuestion && (
          <motion.div
            key={displayKey}
            className="w-full h-full relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{
              type: 'spring',
              stiffness: swipeStreak >= 2 ? 400 : 300,
              damping: swipeStreak >= 2 ? 35 : 30,
            }}
          >
            {renderQuestion(displayQuestion)}
            {showHint && (
              <GestureHint
                questionType={displayQuestion.type}
                onDismiss={dismissHint}
              />
            )}
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
