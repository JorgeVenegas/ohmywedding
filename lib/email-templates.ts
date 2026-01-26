// Email templates for wedding activity notifications

export interface EmailTemplateData {
  weddingName: string
  coupleNames: string
  recipientName?: string
  activityType: string
  activityDescription: string
  timestamp: Date
  additionalDetails?: Record<string, string>
}

// Base HTML template with styling
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #eee;
    }
    .logo {
      font-size: 24px;
      font-weight: 600;
      color: #d4a574;
    }
    .content {
      margin-bottom: 24px;
    }
    .activity-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    .activity-icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      text-align: center;
      line-height: 40px;
      margin-right: 12px;
    }
    .activity-icon.confirmed {
      background-color: #dcfce7;
      color: #16a34a;
    }
    .activity-icon.declined {
      background-color: #fee2e2;
      color: #dc2626;
    }
    .activity-icon.opened {
      background-color: #dbeafe;
      color: #2563eb;
    }
    .activity-icon.updated {
      background-color: #fef3c7;
      color: #d97706;
    }
    .activity-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .activity-time {
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #d4a574;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 16px;
    }
    .button:hover {
      background-color: #c49564;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `.trim()
}

// Activity notification email template
export function getActivityNotificationEmail(data: EmailTemplateData, dashboardUrl: string): string {
  const iconClass = getActivityIconClass(data.activityType)
  const iconEmoji = getActivityEmoji(data.activityType)
  const formattedTime = data.timestamp.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const content = `
    <div class="header">
      <div class="logo">💒 OhMyWedding</div>
    </div>
    <div class="content">
      <p>Hi ${data.recipientName || 'there'},</p>
      <p>There's new activity on your wedding website:</p>
      
      <div class="activity-card">
        <div style="display: flex; align-items: flex-start;">
          <div class="activity-icon ${iconClass}">${iconEmoji}</div>
          <div>
            <div class="activity-title">${data.activityDescription}</div>
            <div class="activity-time">${formattedTime}</div>
          </div>
        </div>
      </div>
      
      <p>
        <a href="${dashboardUrl}" class="button">View Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>You're receiving this email because you're managing a wedding on OhMyWedding.</p>
      <p>© ${new Date().getFullYear()} OhMyWedding. All rights reserved.</p>
    </div>
  `

  return getBaseTemplate(content)
}

// RSVP confirmation email template
export function getRsvpNotificationEmail(
  data: {
    coupleNames: string
    guestName: string
    groupName: string
    status: 'confirmed' | 'declined'
    guestCount: number
    message?: string
  },
  dashboardUrl: string
): string {
  const isConfirmed = data.status === 'confirmed'
  const emoji = isConfirmed ? '🎉' : '😢'
  const statusText = isConfirmed ? 'confirmed attendance' : 'declined'
  const bgColor = isConfirmed ? '#dcfce7' : '#fee2e2'
  const textColor = isConfirmed ? '#16a34a' : '#dc2626'

  const content = `
    <div class="header">
      <div class="logo">💒 OhMyWedding</div>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>Great news! Someone has responded to your wedding invitation.</p>
      
      <div class="activity-card" style="background-color: ${bgColor};">
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">${emoji}</div>
          <div class="activity-title" style="color: ${textColor};">
            ${data.groupName} has ${statusText}!
          </div>
          ${isConfirmed && data.guestCount > 0 ? `<p style="margin: 8px 0 0 0;">Party of ${data.guestCount} guest${data.guestCount > 1 ? 's' : ''}</p>` : ''}
          ${data.message ? `<p style="margin-top: 12px; font-style: italic; color: #666;">"${data.message}"</p>` : ''}
        </div>
      </div>
      
      <p>
        <a href="${dashboardUrl}" class="button">View All RSVPs</a>
      </p>
    </div>
    <div class="footer">
      <p>You're receiving this email because you're managing a wedding on OhMyWedding.</p>
      <p>© ${new Date().getFullYear()} OhMyWedding. All rights reserved.</p>
    </div>
  `

  return getBaseTemplate(content)
}

// Daily summary email template
export function getDailySummaryEmail(
  data: {
    coupleNames: string
    recipientName?: string
    newOpens: number
    newConfirmed: number
    newDeclined: number
    totalConfirmed: number
    totalPending: number
    totalDeclined: number
  },
  dashboardUrl: string
): string {
  const hasActivity = data.newOpens > 0 || data.newConfirmed > 0 || data.newDeclined > 0

  const content = `
    <div class="header">
      <div class="logo">💒 OhMyWedding</div>
    </div>
    <div class="content">
      <p>Hi ${data.recipientName || 'there'},</p>
      <p>Here's your daily summary for <strong>${data.coupleNames}'s Wedding</strong>:</p>
      
      ${hasActivity ? `
      <div class="activity-card">
        <div class="activity-title">Today's Activity</div>
        <ul style="padding-left: 20px; margin: 12px 0;">
          ${data.newOpens > 0 ? `<li>👁️ <strong>${data.newOpens}</strong> invitation${data.newOpens > 1 ? 's' : ''} opened</li>` : ''}
          ${data.newConfirmed > 0 ? `<li>✅ <strong>${data.newConfirmed}</strong> guest${data.newConfirmed > 1 ? 's' : ''} confirmed</li>` : ''}
          ${data.newDeclined > 0 ? `<li>❌ <strong>${data.newDeclined}</strong> guest${data.newDeclined > 1 ? 's' : ''} declined</li>` : ''}
        </ul>
      </div>
      ` : `
      <div class="activity-card">
        <p style="margin: 0; text-align: center;">No new activity today.</p>
      </div>
      `}
      
      <div class="activity-card" style="background-color: #f0f9ff;">
        <div class="activity-title">Overall Progress</div>
        <div style="display: flex; justify-content: space-around; margin-top: 16px; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${data.totalConfirmed}</div>
            <div style="font-size: 12px; color: #666;">Confirmed</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #d97706;">${data.totalPending}</div>
            <div style="font-size: 12px; color: #666;">Pending</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${data.totalDeclined}</div>
            <div style="font-size: 12px; color: #666;">Declined</div>
          </div>
        </div>
      </div>
      
      <p>
        <a href="${dashboardUrl}" class="button">View Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>You're receiving this email because you have email notifications enabled.</p>
      <p>© ${new Date().getFullYear()} OhMyWedding. All rights reserved.</p>
    </div>
  `

  return getBaseTemplate(content)
}

// Helper functions
function getActivityIconClass(type: string): string {
  switch (type) {
    case 'rsvp_confirmed':
      return 'confirmed'
    case 'rsvp_declined':
      return 'declined'
    case 'invitation_opened':
      return 'opened'
    default:
      return 'updated'
  }
}

function getActivityEmoji(type: string): string {
  switch (type) {
    case 'rsvp_confirmed':
      return '✓'
    case 'rsvp_declined':
      return '✗'
    case 'invitation_opened':
      return '👁'
    case 'travel_info_updated':
      return '✈'
    case 'guest_added':
      return '+'
    case 'registry_contribution':
      return '🎁'
    default:
      return '•'
  }
}

// Plain text versions for email clients that don't support HTML
export function getPlainTextActivityNotification(data: EmailTemplateData, dashboardUrl: string): string {
  const formattedTime = data.timestamp.toLocaleString()
  
  return `
OhMyWedding - New Activity

Hi ${data.recipientName || 'there'},

There's new activity on your wedding website:

${data.activityDescription}
Time: ${formattedTime}

View your dashboard: ${dashboardUrl}

---
You're receiving this email because you're managing a wedding on OhMyWedding.
© ${new Date().getFullYear()} OhMyWedding
  `.trim()
}
