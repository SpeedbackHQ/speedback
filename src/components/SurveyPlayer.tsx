'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CountdownIntro } from './CountdownIntro'
import { Celebration } from './Celebration'
import { StreakCounter } from './StreakCounter'
import { SwipeQuestion, SliderQuestion, TapQuestion, TapMeterQuestion, RolodexQuestion, StarsQuestion, ThermometerQuestion, FannedCardsQuestion, FannedSwipeQuestion, StackedCardsQuestion, TiltMazeQuestion, RacingLanesQuestion, SlotMachineQuestion, GravityDropQuestion, BubblePopQuestion, BullseyeQuestion, SlingshotQuestion, ScratchCardQuestion } from './questions'
import { supabase } from '@/lib/supabase'
import { Question, AnswerValue, SurveyWithQuestions } from '@/lib/types'

interface SurveyPlayerProps {
  survey: SurveyWithQuestions
}

type GameState = 'intro' | 'playing' | 'complete'

export function SurveyPlayer({ survey }: SurveyPlayerProps) {
  const [gameState, setGameState] = useState<GameState>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<{ question_id: string; value: AnswerValue }>>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Streak tracking for swipe questions
  const [swipeStreak, setSwipeStreak] = useState(0)
  const [isSpeedBonus, setIsSpeedBonus] = useState(false)
  const lastAnswerTime = useRef<number>(0)

  // Create a sorted copy to avoid mutating the original array
  const questions = useMemo(
    () => [...survey.questions].sort((a, b) => a.order_index - b.order_index),
    [survey.questions]
  )
  const currentQuestion = questions[currentIndex]

  // Debug: Log questions received and current state
  console.log('[SurveyPlayer] Questions received:', survey.questions.length)
  console.log('[SurveyPlayer] Questions:', questions.map(q => ({ type: q.type, text: q.text?.substring(0, 20), order: q.order_index })))
  console.log('[SurveyPlayer] Current index:', currentIndex, 'Current question:', currentQuestion?.type, currentQuestion?.text?.substring(0, 20))

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
    setGameState('playing')
  }

  const handleAnswer = (value: AnswerValue) => {
    console.log('[SurveyPlayer] Answer received for question', currentIndex, ':', value)
    const now = Date.now()
    const newAnswer = { question_id: currentQuestion.id, value }
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

    if (currentIndex < questions.length - 1) {
      // Next question - faster transition during streaks
      const transitionDelay = swipeStreak >= 2 && isNextSwipe ? 250 : 400
      console.log('[SurveyPlayer] Moving to next question:', currentIndex + 1, 'of', questions.length)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, transitionDelay)
    } else {
      console.log('[SurveyPlayer] Survey complete - was at question', currentIndex, 'of', questions.length)
      // Complete - capture final elapsed time and save response
      const finalElapsed = startTime ? Date.now() - startTime : 0
      setElapsedTime(finalElapsed)
      saveResponse(newAnswers, finalElapsed)
      setGameState('complete')
    }
  }

  const saveResponse = async (answers: Array<{ question_id: string; value: AnswerValue }>, duration: number | null) => {
    try {
      await supabase.from('responses').insert({
        survey_id: survey.id,
        answers,
        duration_ms: duration,
      })
    } catch (error) {
      console.error('Failed to save response:', error)
    }
  }

  const renderQuestion = (question: Question) => {
    console.log('[SurveyPlayer] Rendering question:', question.type, question.text?.substring(0, 20), 'config:', question.config)
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
      case 'slot_machine':
        return <SlotMachineQuestion {...props} onAnswer={(v) => handleAnswer(v)} />
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
    return <Celebration message={survey.thank_you_message} elapsedTime={elapsedTime} />
  }

  const primaryColor = survey.branding_config?.primary_color || '#6366F1'

  return (
    <div className="h-screen h-[100dvh] bg-slate-50 flex flex-col overflow-hidden">
      {/* Streak counter */}
      <StreakCounter streak={swipeStreak} isSpeedBonus={isSpeedBonus} />

      {/* Segmented progress bar */}
      <div className="flex gap-1.5 px-4 py-3 flex-shrink-0">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? 'bg-indigo-500'
                : i === currentIndex
                ? 'bg-indigo-300'
                : 'bg-slate-200'
            }`}
            style={i < currentIndex ? { backgroundColor: primaryColor } : i === currentIndex ? { backgroundColor: `${primaryColor}66` } : {}}
          />
        ))}
      </div>

      {/* Question area - full height */}
      <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            className="w-full h-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{
              type: 'spring',
              stiffness: swipeStreak >= 2 ? 400 : 300,
              damping: swipeStreak >= 2 ? 35 : 30,
            }}
          >
            {renderQuestion(currentQuestion)}
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
