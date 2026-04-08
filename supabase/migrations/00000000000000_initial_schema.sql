-- SpeedBack initial schema
-- This recreates the full database from scratch for new installations.
-- Existing Supabase projects already have this via incremental migrations.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Tables
-- =============================================================================

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  org_id uuid REFERENCES public.organizations(id),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  branding_config jsonb DEFAULT '{}'::jsonb,
  thank_you_message text DEFAULT 'Thanks for your feedback!'::text,
  is_active boolean DEFAULT true,
  max_responses integer DEFAULT NULL,
  slug text UNIQUE,
  folder text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  survey_id uuid REFERENCES public.surveys(id),
  type text NOT NULL CHECK (type = ANY (ARRAY[
    'swipe', 'this_or_that', 'slider', 'tap', 'rank', 'counter',
    'tap_meter', 'rolodex', 'wheel', 'stars', 'thermometer',
    'fanned', 'fanned_swipe', 'stacked',
    'tilt_maze', 'racing_lanes', 'slot_machine', 'gravity_drop',
    'bubble_pop', 'bullseye', 'slingshot', 'scratch_card',
    'treasure_chest', 'pinata',
    'dial', 'press_hold', 'toggle_switch', 'spin_stop', 'countdown_tap',
    'door_choice', 'whack_a_mole', 'tug_of_war', 'tilt', 'flick',
    'short_text', 'mad_libs', 'emoji_reaction', 'word_cloud', 'voice_note',
    'paint_splatter', 'bingo_card', 'shopping_cart', 'sticker_board',
    'jar_fill', 'conveyor_belt', 'magnet_board', 'claw_machine',
    'email_capture'
  ])),
  text text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  survey_id uuid REFERENCES public.surveys(id),
  answers jsonb DEFAULT '[]'::jsonb NOT NULL,
  completed_at timestamptz DEFAULT now(),
  duration_ms integer,
  initials varchar,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  is_organizer boolean DEFAULT false,
  source_survey_slug text,
  survey_id uuid REFERENCES public.surveys(id),
  response_session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.festival_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_slug text UNIQUE NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_configs ENABLE ROW LEVEL SECURITY;

-- Surveys: anyone can view active surveys, owners manage their own
CREATE POLICY "Anyone can view active surveys" ON public.surveys
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Users see own surveys" ON public.surveys
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users create own surveys" ON public.surveys
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own surveys" ON public.surveys
  FOR UPDATE TO public USING (auth.uid() = user_id);

CREATE POLICY "Users delete own surveys" ON public.surveys
  FOR DELETE TO public USING (auth.uid() = user_id);

-- User profiles: users manage their own
CREATE POLICY "Users see own profile" ON public.user_profiles
  FOR SELECT TO public USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.user_profiles
  FOR INSERT TO public WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE TO public USING (auth.uid() = id);

-- Leads: anyone can submit, survey owners can view
CREATE POLICY "Anyone can submit leads" ON public.leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Owner can view leads" ON public.leads
  FOR SELECT TO authenticated
  USING (survey_id IN (SELECT id FROM surveys WHERE user_id = auth.uid()));

-- Festival configs: anyone can read, authenticated users can manage
CREATE POLICY "Anyone can read festival configs" ON public.festival_configs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Owner can manage festival configs" ON public.festival_configs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
