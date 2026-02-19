# Supabase Setup Instructions for SpeedBack SaaS

Complete these steps in your Supabase dashboard to enable authentication and multi-tenancy.

---

## Step 1: Enable Authentication Providers

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider:
   - Toggle "Enable Email provider" to ON
   - Enable "Confirm email" (required for email verification)
   - Save changes

4. Enable **Google** OAuth provider:
   - Toggle "Enable Google provider" to ON
   - You'll need to create a Google OAuth app:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select existing
     - Enable Google+ API
     - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
     - Application type: Web application
     - Authorized redirect URIs: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     - Copy Client ID and Client Secret
   - Paste Client ID and Client Secret into Supabase
   - Save changes

---

## Step 2: Configure Email Templates

1. Navigate to **Authentication** → **Email Templates**
2. Customize the following templates (optional but recommended):
   - **Confirm signup**: Email sent when users sign up
   - **Reset password**: Email sent for password resets
   - **Change email address**: Email sent when users change their email

Suggested customizations:
- Replace "{{ .SiteURL }}" references with your actual domain
- Add SpeedBack branding
- Customize subject lines

---

## Step 3: Run Database Migrations

Go to **SQL Editor** in Supabase and run these migrations in order:

### Migration 1: Add user ownership to surveys

```sql
-- Add user_id column to surveys table
ALTER TABLE surveys ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Optional: Backfill existing surveys to a demo user (replace with your user ID)
-- UPDATE surveys SET user_id = 'YOUR-USER-UUID-HERE';

-- Enable Row Level Security on surveys
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for surveys
CREATE POLICY "Users can only see their own surveys"
  ON surveys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only create their own surveys"
  ON surveys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own surveys"
  ON surveys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own surveys"
  ON surveys FOR DELETE
  USING (auth.uid() = user_id);

-- Also enable RLS on responses table (responses are public for survey access)
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit responses"
  ON responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Survey owners can view responses"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = responses.survey_id
      AND surveys.user_id = auth.uid()
    )
  );

-- Enable RLS on questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Survey owners can manage questions"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = questions.survey_id
      AND surveys.user_id = auth.uid()
    )
  );
```

### Migration 2: Create user_profiles table

```sql
-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'per-event')),
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow profile creation on signup (via auth callback)
CREATE POLICY "Allow profile creation"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_stripe_customer
  ON user_profiles(stripe_customer_id);
```

### Migration 3: Create subscriptions table

```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT CHECK (plan_type IN ('free', 'starter', 'per-event')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_subscriptions_user_id
  ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription
  ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status
  ON subscriptions(status);
```

### Migration 4: Add user_id to organizations (if not already present)

```sql
-- Add user_id to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own organizations
CREATE POLICY "Users can view own organizations"
  ON organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Step 4: Set Up Stripe Webhooks

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Endpoint URL: `https://speedback.app/api/stripe/webhook`
5. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to your Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 5: Environment Variables

Make sure these are set in your Vercel project settings:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Get from Supabase Settings → API
```

### Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_STARTER_LINK=https://buy.stripe.com/...  # Your Starter Monthly payment link
NEXT_PUBLIC_STRIPE_EVENT_LINK=https://buy.stripe.com/...    # Your Per-Event payment link
```

### Resend (Email)
```
RESEND_API_KEY=re_...
```

### PostHog (Analytics)
```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_...  # For server-side analytics queries
```

### Other
```
NEXT_PUBLIC_APP_URL=https://speedback.app
```

---

## Step 6: Test Authentication Flow

1. **Sign up with email:**
   - Go to `/signup`
   - Enter email and password
   - Check email for verification link
   - Click link → should redirect to `/admin`

2. **Sign up with Google:**
   - Go to `/signup`
   - Click "Continue with Google"
   - Authorize → should redirect to `/admin`

3. **Log in:**
   - Go to `/login`
   - Sign in with email/password or Google
   - Should redirect to `/admin`

4. **Create a survey:**
   - Click "Create Survey" in dashboard
   - Survey should have `user_id` set to your user
   - Verify in Supabase: `SELECT user_id FROM surveys;`

5. **Multi-tenancy test:**
   - Create second user account (different email)
   - Log in as second user
   - Should NOT see first user's surveys

---

## Step 7: Verify RLS Policies

Test that Row Level Security is working:

1. Open Supabase SQL Editor
2. Run this query:
   ```sql
   -- Should only return surveys for the current authenticated user
   SELECT * FROM surveys;
   ```
3. If you see all surveys, RLS is not working correctly
4. Check that RLS is enabled: `ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;`
5. Check policies exist: `SELECT * FROM pg_policies WHERE tablename = 'surveys';`

---

## Troubleshooting

### Issue: "No rows returned" when querying surveys
- **Cause:** RLS is enabled but user is not authenticated in SQL editor
- **Fix:** Queries in SQL Editor run as anon user. To test as authenticated user, disable RLS temporarily or use the app

### Issue: Google OAuth redirect fails
- **Cause:** Redirect URI mismatch
- **Fix:** Ensure Google OAuth redirect URI matches exactly: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

### Issue: Email verification emails not sending
- **Cause:** Resend domain not verified
- **Fix:** Add DNS records in Resend dashboard for `speedback.app`

### Issue: Stripe webhook not firing
- **Cause:** Webhook URL incorrect or signing secret wrong
- **Fix:**
  1. Verify webhook URL is `https://speedback.app/api/stripe/webhook` (not localhost)
  2. Copy signing secret again from Stripe dashboard
  3. Check Vercel logs for webhook errors

### Issue: User profile not created after signup
- **Cause:** Auth callback not running
- **Fix:** Check browser network tab for `/auth/callback` request, verify it completes successfully

---

## Next Steps

After completing setup:

1. ✅ Test full auth flow (signup, login, logout)
2. ✅ Create a test survey and verify user_id is set
3. ✅ Test Stripe payment (use test mode)
4. ✅ Verify webhook updates user profile and subscription
5. ✅ Test account pages (/account/profile, /account/billing)
6. ✅ Deploy to production!

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs (Authentication → Logs)
3. Check Stripe webhook logs (Developers → Webhooks → [endpoint] → Events)
4. Check browser console for client-side errors
