'use client'

// Standalone question type renderer for the Playground.
// Keep in sync with SurveyPlayer.renderQuestion() when adding new question types.

import { Question, AnswerValue } from '@/lib/types'
import {
  SwipeQuestion,
  SliderQuestion,
  TapQuestion,
  TapMeterQuestion,
  RolodexQuestion,
  StarsQuestion,
  ThermometerQuestion,
  FannedCardsQuestion,
  FannedSwipeQuestion,
  StackedCardsQuestion,
  TiltMazeQuestion,
  RacingLanesQuestion,
  GravityDropQuestion,
  BubblePopQuestion,
  BullseyeQuestion,
  SlingshotQuestion,
  ScratchCardQuestion,
  TreasureChestQuestion,
  PinataQuestion,
} from './questions'

interface MechanicRendererProps {
  question: Question
  onAnswer: (value: AnswerValue) => void
}

export function MechanicRenderer({ question, onAnswer }: MechanicRendererProps) {
  const props = { question, onAnswer }

  switch (question.type) {
    case 'swipe':
      return <SwipeQuestion {...props} />
    case 'slider':
      return <SliderQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'tap':
      return <TapQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'tap_meter':
      return <TapMeterQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'rolodex':
      return <RolodexQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'stars':
      return <StarsQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'thermometer':
      return <ThermometerQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'fanned':
      return <FannedCardsQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'fanned_swipe':
      return <FannedSwipeQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'stacked':
      return <StackedCardsQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'tilt_maze':
      return <TiltMazeQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'racing_lanes':
      return <RacingLanesQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'gravity_drop':
      return <GravityDropQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'bubble_pop':
      return <BubblePopQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'bullseye':
      return <BullseyeQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'slingshot':
      return <SlingshotQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'scratch_card':
      return <ScratchCardQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'treasure_chest':
      return <TreasureChestQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    case 'pinata':
      return <PinataQuestion {...props} onAnswer={(v) => onAnswer(v)} />
    default:
      return <div className="p-8 text-center text-gray-400">Unknown question type: {question.type}</div>
  }
}
