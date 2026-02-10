import { QuestionType } from './types'

export interface TemplateQuestion {
  type: QuestionType
  text: string
  config: Record<string, unknown>
}

export interface SurveyTemplate {
  id: string
  title: string
  description: string
  emoji: string
  category: 'Team' | 'Events' | 'Product' | 'Fun'
  color: string
  questions: TemplateQuestion[]
}

export const surveyTemplates: SurveyTemplate[] = [
  {
    id: 'team-pulse',
    title: 'Team Pulse Check',
    description: 'Quick 3-question check-in on team energy, support, and workload.',
    emoji: '🫀',
    category: 'Team',
    color: '#EC4899',
    questions: [
      {
        type: 'thermometer',
        text: "How's your energy level this week?",
        config: { min_label: 'Running on fumes', max_label: 'Fully charged' },
      },
      {
        type: 'toggle_switch',
        text: 'Do you feel supported by your team?',
        config: { left_label: 'Not really', right_label: 'Absolutely' },
      },
      {
        type: 'emoji_reaction',
        text: 'How do you feel about your current workload?',
        config: { emojis: ['😍', '🙂', '😐', '🙁', '😡'], show_reason: true },
      },
    ],
  },
  {
    id: 'event-feedback',
    title: 'Event Feedback',
    description: 'Get instant reactions after any event, talk, or meetup.',
    emoji: '🎪',
    category: 'Events',
    color: '#8B5CF6',
    questions: [
      {
        type: 'stars',
        text: 'How would you rate the event overall?',
        config: { min_label: 'Meh', max_label: 'Mind-blowing' },
      },
      {
        type: 'bubble_pop',
        text: 'What was the best part?',
        config: { options: ['Speakers', 'Networking', 'Food & Drinks', 'Venue'] },
      },
      {
        type: 'slider',
        text: 'How likely are you to attend the next one?',
        config: { min_label: 'Unlikely', max_label: '100% yes!' },
      },
      {
        type: 'short_text',
        text: 'One thing we could improve?',
        config: { max_length: 140, placeholder: 'Share your thought...' },
      },
    ],
  },
  {
    id: 'sprint-retro',
    title: 'Sprint Retro',
    description: 'Quick agile retrospective — what went well, what to improve.',
    emoji: '🔄',
    category: 'Team',
    color: '#06B6D4',
    questions: [
      {
        type: 'tug_of_war',
        text: 'Was this sprint a success?',
        config: { left_label: 'Not really', right_label: 'Nailed it' },
      },
      {
        type: 'paint_splatter',
        text: 'What went well this sprint?',
        config: { options: ['Collaboration', 'Delivery', 'Quality', 'Communication'] },
      },
      {
        type: 'jar_fill',
        text: 'What needs improvement?',
        config: { options: ['Planning', 'Communication', 'Testing', 'Focus'] },
      },
      {
        type: 'mad_libs',
        text: 'Next sprint, we should focus on ___',
        config: { template: 'Next sprint, we should focus on ___', max_length: 80 },
      },
    ],
  },
  {
    id: 'meeting-rating',
    title: 'Meeting Rating',
    description: 'Was that meeting worth it? Find out in 30 seconds.',
    emoji: '⚡',
    category: 'Team',
    color: '#F59E0B',
    questions: [
      {
        type: 'swipe',
        text: 'Was this meeting a good use of time?',
        config: { left_label: 'Nope', right_label: 'Yes!', up_label: 'Meh', show_meh: true },
      },
      {
        type: 'dial',
        text: 'How engaged were you?',
        config: { min_label: 'Zoned out', max_label: 'Laser focused' },
      },
      {
        type: 'word_cloud',
        text: 'Pick a word that describes this meeting',
        config: {
          words: ['Productive', 'Boring', 'Inspiring', 'Long', 'Focused', 'Confusing', 'Fun', 'Necessary', 'Pointless', 'Energizing'],
          max_selections: 3,
        },
      },
    ],
  },
  {
    id: 'customer-satisfaction',
    title: 'Customer Satisfaction',
    description: 'Quick NPS-style survey with a SpeedBack twist.',
    emoji: '💎',
    category: 'Product',
    color: '#6366F1',
    questions: [
      {
        type: 'bullseye',
        text: 'How satisfied are you with our product?',
        config: { min_label: 'Not at all', max_label: 'Love it' },
      },
      {
        type: 'shopping_cart',
        text: 'What do you value most about us?',
        config: { options: ['Quality', 'Speed', 'Support', 'Price'] },
      },
      {
        type: 'press_hold',
        text: 'How likely are you to recommend us?',
        config: { min_label: 'Not likely', max_label: 'Definitely' },
      },
      {
        type: 'short_text',
        text: 'What could we do better?',
        config: { max_length: 140, placeholder: 'Your feedback matters...' },
      },
    ],
  },
  {
    id: 'workshop-evaluation',
    title: 'Workshop Evaluation',
    description: 'Get feedback on your training session or workshop.',
    emoji: '📚',
    category: 'Events',
    color: '#10B981',
    questions: [
      {
        type: 'stars',
        text: 'Rate the overall session',
        config: { min_label: 'Poor', max_label: 'Excellent' },
      },
      {
        type: 'sticker_board',
        text: 'Most valuable takeaways?',
        config: { options: ['New skills', 'Networking', 'Resources', 'Inspiration'] },
      },
      {
        type: 'thermometer',
        text: 'How confident do you feel applying what you learned?',
        config: { min_label: 'Not confident', max_label: 'Ready to go' },
      },
      {
        type: 'emoji_reaction',
        text: 'How did the session make you feel?',
        config: { emojis: ['🤩', '😊', '🤔', '😴', '😕'], show_reason: true },
      },
    ],
  },
  {
    id: 'icebreaker',
    title: 'Icebreaker',
    description: 'Fun team-building questions with playful mechanics.',
    emoji: '🎲',
    category: 'Fun',
    color: '#F43F5E',
    questions: [
      {
        type: 'door_choice',
        text: 'Pick a superpower!',
        config: { options: ['Flying', 'Invisibility', 'Time Travel', 'Mind Reading'] },
      },
      {
        type: 'claw_machine',
        text: 'Grab your ideal Friday perk!',
        config: { options: ['Early finish', 'Free lunch', 'Game time', 'Nap room'] },
      },
      {
        type: 'flick',
        text: "What's your go-to snack?",
        config: { options: ['Chips', 'Chocolate', 'Fruit', 'Coffee'] },
      },
      {
        type: 'scratch_card',
        text: 'Mystery question: Cats or dogs?',
        config: { options: ['Team Cat', 'Team Dog', 'Both!', 'Neither'] },
      },
    ],
  },
  {
    id: 'feature-prioritization',
    title: 'Feature Prioritization',
    description: 'Let your users vote on what to build next.',
    emoji: '🗳️',
    category: 'Product',
    color: '#7C3AED',
    questions: [
      {
        type: 'racing_lanes',
        text: 'Which feature excites you most?',
        config: { options: ['Dark mode', 'Mobile app', 'AI assistant', 'Integrations'] },
      },
      {
        type: 'magnet_board',
        text: 'What should we focus on?',
        config: { options: ['Speed', 'Design', 'Features', 'Stability'] },
      },
      {
        type: 'countdown_tap',
        text: 'How urgently do you need improvements?',
        config: { min_label: 'No rush', max_label: 'Yesterday!' },
      },
      {
        type: 'short_text',
        text: 'Any feature requests?',
        config: { max_length: 140, placeholder: 'Tell us what you need...' },
      },
    ],
  },
]
