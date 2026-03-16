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
    description: 'Quick 6-question check-in on team energy, workload, and vibe.',
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
        type: 'bubble_pop',
        text: "What's taking most of your time this week?",
        config: { options: ['Deep work', 'Meetings', 'Admin', 'Firefighting'] },
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
      {
        type: 'tug_of_war',
        text: "How's the team vibe lately?",
        config: { left_label: 'Tense', right_label: 'Harmonious' },
      },
      {
        type: 'word_cloud',
        text: 'One word for how you\'re feeling right now',
        config: {
          words: ['Motivated', 'Overwhelmed', 'Excited', 'Tired', 'Focused', 'Stressed', 'Content', 'Frustrated', 'Optimistic', 'Burned out'],
          max_selections: 1,
        },
      },
    ],
  },
  {
    id: 'event-feedback',
    title: 'Event Feedback',
    description: 'Comprehensive 8-question event evaluation covering experience, content, and logistics.',
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
        type: 'thermometer',
        text: 'How was the event organization?',
        config: { min_label: 'Chaotic', max_label: 'Seamless' },
      },
      {
        type: 'bubble_pop',
        text: 'What was the best part?',
        config: { options: ['Speakers', 'Networking', 'Food & Drinks', 'Venue'] },
      },
      {
        type: 'sticker_board',
        text: 'Which topics resonated most?',
        config: { options: ['Keynote', 'Workshops', 'Panels', 'Lightning talks'] },
      },
      {
        type: 'slider',
        text: 'How likely are you to attend the next one?',
        config: { min_label: 'Unlikely', max_label: '100% yes!' },
      },
      {
        type: 'toggle_switch',
        text: 'Would you recommend this to a colleague?',
        config: { left_label: 'No', right_label: 'Absolutely' },
      },
      {
        type: 'racing_lanes',
        text: 'What should we do more of next time?',
        config: { options: ['Networking time', 'Hands-on workshops', 'Q&A sessions', 'Social activities'] },
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
    description: 'Comprehensive 8-question agile retrospective on velocity, blockers, and team health.',
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
        type: 'thermometer',
        text: 'How was our sprint velocity?',
        config: { min_label: 'Too slow', max_label: 'Unsustainable' },
      },
      {
        type: 'paint_splatter',
        text: 'What went well this sprint?',
        config: { options: ['Collaboration', 'Delivery', 'Quality', 'Communication'] },
      },
      {
        type: 'bubble_pop',
        text: 'Biggest blocker this sprint?',
        config: { options: ['Dependencies', 'Unclear requirements', 'Tech debt', 'Meetings'] },
      },
      {
        type: 'jar_fill',
        text: 'What needs improvement?',
        config: { options: ['Planning', 'Communication', 'Testing', 'Focus'] },
      },
      {
        type: 'slider',
        text: 'How was team collaboration?',
        config: { min_label: 'Siloed', max_label: 'Seamless' },
      },
      {
        type: 'toggle_switch',
        text: 'Ready for next sprint?',
        config: { left_label: 'Need a break', right_label: 'Let\'s go!' },
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
    description: 'Was that meeting worth it? Get actionable feedback in 5 quick questions.',
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
        type: 'slider',
        text: 'How clear were the action items?',
        config: { min_label: 'What action items?', max_label: 'Crystal clear' },
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
      {
        type: 'bubble_pop',
        text: 'What would make the next meeting better?',
        config: { options: ['Better prep', 'Shorter', 'Right people', 'Clear agenda'] },
      },
    ],
  },
  {
    id: 'customer-satisfaction',
    title: 'Customer Satisfaction',
    description: 'Comprehensive 10-question NPS-style survey covering product, support, and value.',
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
        type: 'paint_splatter',
        text: 'Which features do you use most?',
        config: { options: ['Core features', 'Integrations', 'Reporting', 'Mobile app'] },
      },
      {
        type: 'thermometer',
        text: "How's our customer support?",
        config: { min_label: 'Needs work', max_label: 'World-class' },
      },
      {
        type: 'shopping_cart',
        text: 'What do you value most about us?',
        config: { options: ['Quality', 'Speed', 'Support', 'Price'] },
      },
      {
        type: 'slider',
        text: 'Is our pricing fair?',
        config: { min_label: 'Too expensive', max_label: 'Great value' },
      },
      {
        type: 'bubble_pop',
        text: 'How often do you use our product?',
        config: { options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      },
      {
        type: 'press_hold',
        text: 'How likely are you to recommend us?',
        config: { min_label: 'Not likely', max_label: 'Definitely' },
      },
      {
        type: 'word_cloud',
        text: 'Pick words that describe us',
        config: {
          words: ['Reliable', 'Innovative', 'Expensive', 'Helpful', 'Confusing', 'Fast', 'Professional', 'Buggy', 'Essential', 'Complicated'],
          max_selections: 3,
        },
      },
      {
        type: 'toggle_switch',
        text: 'Would you switch to a competitor?',
        config: { left_label: 'Considering it', right_label: 'Never' },
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
    description: 'In-depth 10-question workshop evaluation covering content, delivery, and outcomes.',
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
        type: 'thermometer',
        text: 'How was the content depth?',
        config: { min_label: 'Too basic', max_label: 'Too advanced' },
      },
      {
        type: 'slider',
        text: 'Was the pacing appropriate?',
        config: { min_label: 'Too rushed', max_label: 'Too slow' },
      },
      {
        type: 'sticker_board',
        text: 'Most valuable takeaways?',
        config: { options: ['New skills', 'Networking', 'Resources', 'Inspiration'] },
      },
      {
        type: 'bubble_pop',
        text: 'What format worked best for you?',
        config: { options: ['Lectures', 'Group exercises', 'Discussions', 'Case studies'] },
      },
      {
        type: 'stars',
        text: 'Rate the instructor',
        config: { min_label: 'Poor', max_label: 'Outstanding' },
      },
      {
        type: 'thermometer',
        text: 'How confident do you feel applying what you learned?',
        config: { min_label: 'Not confident', max_label: 'Ready to go' },
      },
      {
        type: 'toggle_switch',
        text: 'Would you attend another session by this instructor?',
        config: { left_label: 'No thanks', right_label: 'Sign me up!' },
      },
      {
        type: 'shopping_cart',
        text: 'What would make this training even better?',
        config: { options: ['More examples', 'Longer session', 'Better materials', 'Smaller group'] },
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
    description: 'Fun 8-question icebreaker with playful mechanics to get to know your team.',
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
        type: 'bubble_pop',
        text: "What's your work personality?",
        config: { options: ['Early bird', 'Night owl', 'Perpetually caffeinated', 'Zen master'] },
      },
      {
        type: 'claw_machine',
        text: 'Grab your ideal Friday perk!',
        config: { options: ['Early finish', 'Free lunch', 'Game time', 'Nap room'] },
      },
      {
        type: 'door_choice',
        text: 'Pick your ideal vacation',
        config: { options: ['Beach paradise', 'Mountain adventure', 'City exploration', 'Staycation'] },
      },
      {
        type: 'flick',
        text: "What's your go-to snack?",
        config: { options: ['Chips', 'Chocolate', 'Fruit', 'Coffee'] },
      },
      {
        type: 'scratch_card',
        text: "Mystery: What's your hidden talent?",
        config: { options: ['Cooking', 'Music', 'Sports', 'Something weird'] },
      },
      {
        type: 'scratch_card',
        text: 'Mystery question: Cats or dogs?',
        config: { options: ['Team Cat', 'Team Dog', 'Both!', 'Neither'] },
      },
      {
        type: 'word_cloud',
        text: 'Describe yourself in one word',
        config: {
          words: ['Creative', 'Analytical', 'Adventurous', 'Chill', 'Ambitious', 'Funny', 'Thoughtful', 'Spontaneous', 'Organized', 'Curious'],
          max_selections: 1,
        },
      },
    ],
  },
  {
    id: 'feature-prioritization',
    title: 'Feature Prioritization',
    description: 'Strategic 8-question survey to prioritize features based on user needs and urgency.',
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
        type: 'thermometer',
        text: 'How urgent is your need for these features?',
        config: { min_label: 'Can wait', max_label: 'Critical' },
      },
      {
        type: 'magnet_board',
        text: 'What should we focus on?',
        config: { options: ['Speed', 'Design', 'Features', 'Stability'] },
      },
      {
        type: 'bubble_pop',
        text: "What's your biggest pain point today?",
        config: { options: ['Missing features', 'Performance', 'UX complexity', 'Integrations'] },
      },
      {
        type: 'slider',
        text: 'Would you pay extra for priority features?',
        config: { min_label: 'No way', max_label: 'Definitely' },
      },
      {
        type: 'sticker_board',
        text: 'Which use case matters most?',
        config: { options: ['Personal use', 'Small team', 'Enterprise', 'Developer tools'] },
      },
      {
        type: 'short_text',
        text: 'Any feature requests?',
        config: { max_length: 140, placeholder: 'Tell us what you need...' },
      },
    ],
  },
]
