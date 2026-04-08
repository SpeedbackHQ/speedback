-- Remove commercial/SaaS columns from user_profiles
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS plan_type;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS premium_credits;

-- Set all existing surveys to unlimited responses (community edition)
UPDATE public.surveys SET max_responses = NULL WHERE max_responses IS NOT NULL;

-- Change the default for new surveys from 25 to NULL (unlimited)
ALTER TABLE public.surveys ALTER COLUMN max_responses = NULL;
