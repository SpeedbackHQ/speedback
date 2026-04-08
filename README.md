# SpeedBack ⚡

**Feedback forms that feel like games.** Swipe, tap, drag, and play through surveys — way faster than a boring form.

SpeedBack is an open source survey platform with 40+ interactive question mechanics. Built for events, teams, workshops, and anywhere you need fast, honest feedback.

## Features

- **40+ game mechanics** — swipe cards, bubble pop, scratch cards, claw machines, star ratings, sliders, and more
- **QR code + poster sharing** — generate branded QR codes and print-ready posters
- **Conditional logic** — show/hide questions based on previous answers
- **Real-time analytics** — completion rates, response times, per-question breakdowns
- **CSV export** — download all response data
- **Custom branding** — colors, logos, thank-you messages
- **Festival/event mode** — multi-survey routing for conferences and festivals
- **Templates** — 8 pre-built survey templates for common use cases
- **Mobile-first** — designed for phones, works everywhere
- **Self-hostable** — run it on your own infrastructure

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS 4**
- **Framer Motion** (animations)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/SpeedbackHQ/speedback.git
cd speedback
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Create the database tables (see [Database Setup](CONTRIBUTING.md#database-setup) in CONTRIBUTING.md)
3. Configure Row Level Security policies

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials. See `.env.example` for all available options.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and create your first survey.

### 5. (Optional) Seed demo data

```bash
npx tsx scripts/seed-demo.ts
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of your deployment |
| `SUPABASE_SERVICE_ROLE_KEY` | For scripts | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog host URL |
| `NEXT_PUBLIC_OWNER_EMAIL` | No | Admin email for /admin access |
| `NEXT_PUBLIC_GITHUB_ISSUES_URL` | No | GitHub Issues URL for feedback button |
| `NEXT_PUBLIC_DONATION_URL` | No | Donation link (Buy Me a Coffee, etc.) |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Setup instructions
- How to add a new question mechanic
- How to add a survey template
- Code style guide

**We especially need help with:** new question mechanics, design/UX, accessibility, testing, and documentation.

## Support the Project

SpeedBack is free and open source. If it's useful to you, consider supporting development:

- Star the repo
- [Report bugs or request features](../../issues)
- Contribute code, design, or docs
- Share SpeedBack with your community

## License

MIT
