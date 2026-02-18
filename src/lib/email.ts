import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'SpeedBack <hello@speedback.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://speedback.app'

export async function sendWelcomeEmail(to: string, customerName?: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to SpeedBack ⚡',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
        <div style="font-size: 32px; font-weight: 800; margin-bottom: 8px;">
          Speed<span style="color: #8B5CF6;">Back</span> ⚡
        </div>

        <h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 12px;">
          You're in${customerName ? `, ${customerName}` : ''}!
        </h1>

        <p style="color: #475569; line-height: 1.6; margin-bottom: 16px;">
          Your SpeedBack Starter plan is now active. Here's how to get started in the next 5 minutes:
        </p>

        <ol style="color: #475569; line-height: 2; padding-left: 20px; margin-bottom: 24px;">
          <li>Go to your dashboard and create a survey</li>
          <li>Choose a template or build from scratch with 40+ mechanics</li>
          <li>Download the QR code poster and display it at your event</li>
          <li>Watch responses roll in live from the Responses tab</li>
        </ol>

        <a href="${APP_URL}/admin" style="display: inline-block; background: #8B5CF6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 16px; margin-bottom: 32px;">
          Go to Dashboard →
        </a>

        <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
          Questions? Just reply to this email — we respond fast.<br/>
          You're locked in at $19/month forever as an early customer.
        </p>
      </div>
    `,
  })
}

export async function sendPaymentConfirmationEmail(to: string, plan: string, amount: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Payment confirmed — SpeedBack ${plan}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
        <div style="font-size: 32px; font-weight: 800; margin-bottom: 8px;">
          Speed<span style="color: #8B5CF6;">Back</span> ⚡
        </div>

        <h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 12px;">
          Payment confirmed ✓
        </h1>

        <div style="background: #F8F7FF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748B;">Plan</span>
            <span style="font-weight: 600;">SpeedBack ${plan}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B;">Amount</span>
            <span style="font-weight: 600;">${amount}</span>
          </div>
        </div>

        <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
          Your plan is active. Head to your dashboard to start creating surveys.
        </p>

        <a href="${APP_URL}/admin" style="display: inline-block; background: #8B5CF6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 16px;">
          Go to Dashboard →
        </a>
      </div>
    `,
  })
}

export async function sendUpgradePromptEmail(to: string, surveyTitle: string, responsesUsed: number) {
  const starterLink = process.env.NEXT_PUBLIC_STRIPE_STARTER_LINK || `${APP_URL}/pricing`
  const eventLink = process.env.NEXT_PUBLIC_STRIPE_EVENT_LINK || `${APP_URL}/pricing`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your survey "${surveyTitle}" has reached its limit`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
        <div style="font-size: 32px; font-weight: 800; margin-bottom: 8px;">
          Speed<span style="color: #8B5CF6;">Back</span> ⚡
        </div>

        <h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 12px;">
          Your survey is full 🎉
        </h1>

        <p style="color: #475569; line-height: 1.6; margin-bottom: 16px;">
          <strong>${surveyTitle}</strong> has collected <strong>${responsesUsed} responses</strong> —
          you've hit the free tier limit. New respondents will see an upgrade message.
        </p>

        <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
          Upgrade now to keep collecting:
        </p>

        <div style="display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap;">
          <a href="${starterLink}" style="display: inline-block; background: #8B5CF6; color: white; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600;">
            Starter — $19/month →
          </a>
          <a href="${eventLink}" style="display: inline-block; border: 2px solid #E2E8F0; color: #475569; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600;">
            Per Event — $15
          </a>
        </div>

        <p style="color: #94A3B8; font-size: 14px;">
          Early customers lock in $19/month forever.
        </p>
      </div>
    `,
  })
}
