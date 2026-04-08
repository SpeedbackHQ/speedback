# Contributing to SpeedBack

Thanks for your interest in contributing! SpeedBack is an open source, community-driven project and we welcome contributions of all kinds.

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- Git

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/SpeedbackHQ/speedback.git
   cd speedback
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database schema (see [Database Setup](#database-setup) below)
   - Copy your project URL and anon key

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials. See `.env.example` for descriptions of each variable.

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

6. **(Optional) Seed demo data**
   ```bash
   npx tsx scripts/seed-demo.ts
   ```

### Database Setup

SpeedBack uses Supabase (PostgreSQL). The schema is not yet managed via migrations — you'll need to create the tables manually in the Supabase SQL editor. The key tables are:

- `organizations` — workspace/team container
- `surveys` — survey definitions with branding config
- `questions` — individual questions linked to surveys
- `responses` — collected survey responses
- `user_profiles` — user settings (linked to Supabase Auth)
- `leads` — email captures from surveys
- `festival_configs` — optional event/festival routing

Refer to `src/lib/supabase.ts` for the full TypeScript interfaces that mirror the database schema. Each interface maps directly to a table.

**RLS (Row Level Security)** policies need to be configured in the Supabase dashboard. At minimum:
- Users can only read/write their own surveys
- Anyone can read surveys and questions (for the public play page)
- Anyone can insert responses
- Only the survey owner can read responses for their surveys

---

## How to Add a New Question Mechanic

SpeedBack's core feature is its 40+ interactive question types. Adding a new one involves three files:

### 1. Create the component

Create `src/components/questions/YourMechanicQuestion.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface YourMechanicQuestionProps {
  question: { id: string; text: string; config: Record<string, unknown> }
  onAnswer: (value: unknown) => void
  primaryColor?: string
}

export function YourMechanicQuestion({ question, onAnswer, primaryColor = '#8B5CF6' }: YourMechanicQuestionProps) {
  // Your interactive UI here
  // Call onAnswer(value) when the user makes their selection

  return (
    <div>
      {/* Your mechanic UI */}
    </div>
  )
}
```

The component receives:
- `question` — the question data (text, config with options/labels)
- `onAnswer(value)` — call this with the answer value when the user responds
- `primaryColor` — the survey's brand color

### 2. Register the type

Add your type to `src/lib/supabase.ts` in the `QuestionType` union:

```typescript
export type QuestionType =
  | 'swipe' | 'slider' | // ... existing types
  | 'your_mechanic'  // Add here
```

Then add metadata in `src/lib/question-types.ts`:

```typescript
// Add to the appropriate category in questionCategories
{
  type: 'your_mechanic',
  label: 'Your Mechanic',
  emoji: '🎮',
  description: 'Brief description of the interaction',
}
```

### 3. Wire it into the SurveyPlayer

Add a case for your type in `src/components/SurveyPlayer.tsx` where the question components are rendered (look for the switch/map on `question.type`).

### Tips
- Keep interactions mobile-first — most respondents are on phones
- Aim for 2-5 seconds per interaction
- The `onAnswer` callback should be called once with the final value
- Use Framer Motion for animations (already a dependency)
- Check the speed-bias warning system in `question-types.ts` — if your mechanic rewards speed over thought, add it to `SPEED_BIASED_MECHANICS`

---

## How to Add a Survey Template

Templates live in `src/lib/templates.ts`. Add a new entry to the `templates` array:

```typescript
{
  id: 'your-template',
  title: 'Your Template Name',
  description: 'What this template is for',
  emoji: '📋',
  category: 'Team' | 'Events' | 'Product' | 'Fun',
  color: '#8B5CF6',
  questions: [
    {
      type: 'swipe',
      text: 'Your question text?',
      config: { left_label: 'No', right_label: 'Yes' },
    },
    // ... more questions
  ],
}
```

---

## Code Style

- **TypeScript** — strict mode, no `any` unless unavoidable
- **React** — functional components with hooks, `'use client'` directive for client components
- **Styling** — Tailwind CSS utility classes. Inline `style={{}}` for brand colors that need to be dynamic.
- **Formatting** — 2-space indentation, single quotes, no semicolons (follow existing patterns)
- **File naming** — PascalCase for components (`SwipeQuestion.tsx`), kebab-case for lib files (`question-types.ts`)
- **No unnecessary abstractions** — prefer simple, readable code over clever patterns

---

## What We Need Help With

- **New question mechanics** — the more creative, the better
- **Design** — UI/UX improvements, accessibility, mobile polish
- **Templates** — pre-built surveys for common use cases
- **Documentation** — guides, tutorials, screenshots
- **Testing** — we currently have zero tests (help!)
- **Accessibility** — screen reader support, keyboard navigation
- **i18n** — internationalization support

---

## Submitting Changes

1. Fork the repo and create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Run `npm run lint` to check for issues
5. Open a pull request with a clear description of what you changed and why

For large changes, please open an issue first to discuss the approach.
