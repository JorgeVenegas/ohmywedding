import { Resend } from 'resend'

export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'OhMyWedding <noreply@ohmy.wedding>'
export const TEAM_EMAIL = process.env.NOTIFICATION_TO_EMAIL ?? 'hola@ohmy.wedding'

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping send:', subject)
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
  } catch (err) {
    console.error('[email] Failed to send:', subject, err)
  }
}
