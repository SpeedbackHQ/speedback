'use client'

// Standalone question type renderer for the Playground.
// Keep in sync with SurveyPlayer.renderQuestion() when adding new question types.

import { useState, useEffect, useCallback } from 'react'
import { Question, AnswerValue } from '@/lib/types'
import { GestureHint, getGestureType } from './GestureHint'
import {
  SwipeQuestion,
  ThisOrThatQuestion,
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
  ToggleSwitchQuestion,
  PressHoldQuestion,
  DialQuestion,
  SpinStopQuestion,
  DoorChoiceQuestion,
  WhackAMoleQuestion,
  TugOfWarQuestion,
  TiltQuestion,
  FlickQuestion,
  ShortTextQuestion,
  MadLibsQuestion,
  EmojiReactionQuestion,
  WordCloudQuestion,
  VoiceNoteQuestion,
  PaintSplatterQuestion,
  BingoCardQuestion,
  ShoppingCartQuestion,
  StickerBoardQuestion,
  JarFillQuestion,
  ConveyorBeltQuestion,
  MagnetBoardQuestion,
  ClawMachineQuestion,
} from './questions'

interface MechanicRendererProps {
  question: Question
  onAnswer: (value: AnswerValue) => void
}

export function MechanicRenderer({ question, onAnswer }: MechanicRendererProps) {
  const [showHint, setShowHint] = useState(() => !!getGestureType(question.type))
  const dismissHint = useCallback(() => setShowHint(false), [])

  // Reset hint when question changes
  useEffect(() => {
    setShowHint(!!getGestureType(question.type))
  }, [question.type])

  const props = { question, onAnswer }

  let content: React.ReactNode
  switch (question.type) {
    case 'swipe':
      content = <SwipeQuestion {...props} />; break
    case 'this_or_that':
      content = <ThisOrThatQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'slider':
      content = <SliderQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'tap':
      content = <TapQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'tap_meter':
      content = <TapMeterQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'rolodex':
      content = <RolodexQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'stars':
      content = <StarsQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'thermometer':
      content = <ThermometerQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'fanned':
      content = <FannedCardsQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'fanned_swipe':
      content = <FannedSwipeQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'stacked':
      content = <StackedCardsQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'tilt_maze':
      content = <TiltMazeQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'racing_lanes':
      content = <RacingLanesQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'gravity_drop':
      content = <GravityDropQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'bubble_pop':
      content = <BubblePopQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'bullseye':
      content = <BullseyeQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'slingshot':
      content = <SlingshotQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'scratch_card':
      content = <ScratchCardQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'treasure_chest':
      content = <TreasureChestQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'pinata':
      content = <PinataQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'toggle_switch':
      content = <ToggleSwitchQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'press_hold':
      content = <PressHoldQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'dial':
      content = <DialQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'spin_stop':
      content = <SpinStopQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'door_choice':
      content = <DoorChoiceQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'whack_a_mole':
      content = <WhackAMoleQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'tug_of_war':
      content = <TugOfWarQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'tilt':
      content = <TiltQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'flick':
      content = <FlickQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'short_text':
      content = <ShortTextQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'mad_libs':
      content = <MadLibsQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'emoji_reaction':
      content = <EmojiReactionQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'word_cloud':
      content = <WordCloudQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'voice_note':
      content = <VoiceNoteQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'paint_splatter':
      content = <PaintSplatterQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'bingo_card':
      content = <BingoCardQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'shopping_cart':
      content = <ShoppingCartQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'sticker_board':
      content = <StickerBoardQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'jar_fill':
      content = <JarFillQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'conveyor_belt':
      content = <ConveyorBeltQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'magnet_board':
      content = <MagnetBoardQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    case 'claw_machine':
      content = <ClawMachineQuestion {...props} onAnswer={(v) => onAnswer(v)} />; break
    default:
      content = <div className="p-8 text-center text-gray-400">Unknown question type: {question.type}</div>
  }

  return (
    <div className="relative w-full h-full">
      {content}
      {showHint && (
        <GestureHint questionType={question.type} onDismiss={dismissHint} />
      )}
    </div>
  )
}
