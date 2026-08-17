const BRAND = '#420c14'
const GOLD = '#DDA46F'
const CREAM = '#f5f2eb'
const MUTED = '#7a3a42'

function base(content: string, locale: 'en' | 'es', unsubscribeUrl?: string): string {
  const settingsNote = locale === 'es'
    ? 'Puedes ajustar la frecuencia de estos reportes en la configuración de tu boda.'
    : 'You can adjust the frequency of these reports in your wedding settings.'
  const unsubscribeLabel = locale === 'es' ? 'Cancelar suscripción' : 'Unsubscribe'
  const unsubscribeHtml = unsubscribeUrl
    ? `<br/><a href="${unsubscribeUrl}" style="color:${MUTED};opacity:0.6;font-size:10px;">${unsubscribeLabel}</a>`
    : ''
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OhMyWedding</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:${BRAND};border-radius:16px 16px 0 0;padding:28px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${GOLD};opacity:0.8;">OhMyWedding</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:36px 32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(66,12,20,0.08);">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 0 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:${MUTED};opacity:0.55;line-height:1.6;">${settingsNote}<br/>OhMyWedding · ohmy.wedding${unsubscribeHtml}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function sectionBlock(title: string, content: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td style="padding-bottom:10px;border-bottom:2px solid ${CREAM};">
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTED};opacity:0.7;">${title}</span>
      </td>
    </tr>
    <tr><td style="padding-top:14px;">${content}</td></tr>
  </table>`
}

function statRow(label: string, value: string, highlight = false): string {
  return `<tr>
    <td style="padding:7px 0;border-bottom:1px solid #f5ede8;">
      <span style="font-size:13px;color:${MUTED};">${label}</span>
    </td>
    <td style="padding:7px 0;border-bottom:1px solid #f5ede8;text-align:right;">
      <span style="font-size:13px;font-weight:600;color:${highlight ? GOLD : BRAND};">${value}</span>
    </td>
  </tr>`
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RsvpSummary {
  confirmed: number
  declined: number
  pending: number
  newSinceLastReport: Array<{ name: string; status: 'confirmed' | 'declined' }>
}

export interface UpcomingMeeting {
  title: string
  scheduled_at: string
  meeting_url: string | null
}

export interface BudgetSummary {
  totalBudget: number
  totalPaid: number
  pendingPayments: Array<{ supplier: string; amount: number; dueDate: string | null }>
}

export interface MessageSummary {
  count: number
  recent: Array<{ name: string; message: string }>
}

export interface ActivityReportData {
  coupleNames: string
  weddingDate: string | null
  locale: 'en' | 'es'
  periodLabel: string
  rsvp?: RsvpSummary
  meetings?: UpcomingMeeting[]
  budget?: BudgetSummary
  messages?: MessageSummary
  dashboardUrl: string
  unsubscribeUrl?: string
}

// ─── Build the email ──────────────────────────────────────────────────────────

export function activityReportEmail(data: ActivityReportData): string {
  const isEs = data.locale === 'es'
  const sections: string[] = []

  // ── Greeting ──
  const greeting = isEs
    ? `Hola, ${data.coupleNames} 👋`
    : `Hi, ${data.coupleNames} 👋`
  const subheading = isEs
    ? `Tu resumen de actividad · ${data.periodLabel}`
    : `Your activity summary · ${data.periodLabel}`

  // ── RSVP section ──
  if (data.rsvp) {
    const r = data.rsvp
    let rows = `<table width="100%" cellpadding="0" cellspacing="0">`
    rows += statRow(isEs ? 'Confirmados' : 'Confirmed', String(r.confirmed))
    rows += statRow(isEs ? 'Declinados' : 'Declined', String(r.declined))
    rows += statRow(isEs ? 'Pendientes' : 'Pending', String(r.pending))
    rows += `</table>`

    if (r.newSinceLastReport.length > 0) {
      rows += `<p style="margin:14px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:${MUTED};opacity:0.6;">${isEs ? 'Recientes' : 'Recent'}</p>`
      rows += `<ul style="margin:0;padding:0 0 0 16px;">`
      for (const g of r.newSinceLastReport.slice(0, 8)) {
        const badge = g.status === 'confirmed'
          ? `<span style="background:#dcfce7;color:#16a34a;font-size:10px;padding:1px 7px;border-radius:100px;font-weight:600;">${isEs ? 'Confirmó' : 'Confirmed'}</span>`
          : `<span style="background:#fee2e2;color:#dc2626;font-size:10px;padding:1px 7px;border-radius:100px;font-weight:600;">${isEs ? 'Declinó' : 'Declined'}</span>`
        rows += `<li style="font-size:13px;color:${BRAND};padding:4px 0;">${g.name} ${badge}</li>`
      }
      if (r.newSinceLastReport.length > 8) {
        rows += `<li style="font-size:12px;color:${MUTED};opacity:0.6;padding:4px 0;">+${r.newSinceLastReport.length - 8} ${isEs ? 'más' : 'more'}</li>`
      }
      rows += `</ul>`
    }
    sections.push(sectionBlock(isEs ? 'Confirmaciones de asistencia' : 'RSVP Status', rows))
  }

  // ── Upcoming meetings ──
  if (data.meetings && data.meetings.length > 0) {
    let rows = ''
    for (const m of data.meetings) {
      const date = new Date(m.scheduled_at).toLocaleString(isEs ? 'es-MX' : 'en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      const link = m.meeting_url
        ? ` · <a href="${m.meeting_url}" style="color:${GOLD};text-decoration:none;font-size:12px;">Google Meet</a>`
        : ''
      rows += `<p style="margin:0 0 10px;font-size:13px;color:${BRAND};"><strong>${m.title}</strong><br/><span style="color:${MUTED};font-size:12px;">${date}${link}</span></p>`
    }
    sections.push(sectionBlock(isEs ? 'Próximas reuniones' : 'Upcoming Meetings', rows))
  }

  // ── Budget ──
  if (data.budget) {
    const b = data.budget
    const pct = b.totalBudget > 0 ? Math.round((b.totalPaid / b.totalBudget) * 100) : 0
    let rows = `<table width="100%" cellpadding="0" cellspacing="0">`
    rows += statRow(isEs ? 'Presupuesto total' : 'Total budget', `$${b.totalBudget.toLocaleString()}`)
    rows += statRow(isEs ? 'Pagado' : 'Paid', `$${b.totalPaid.toLocaleString()} (${pct}%)`, true)
    rows += `</table>`

    if (b.pendingPayments.length > 0) {
      rows += `<p style="margin:14px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:${MUTED};opacity:0.6;">${isEs ? 'Pagos pendientes' : 'Pending payments'}</p>`
      for (const p of b.pendingPayments.slice(0, 5)) {
        const due = p.dueDate ? ` · ${isEs ? 'Vence' : 'Due'} ${new Date(p.dueDate).toLocaleDateString(isEs ? 'es-MX' : 'en-US')}` : ''
        rows += `<p style="margin:0 0 6px;font-size:13px;color:${BRAND};">${p.supplier}<span style="color:${MUTED};"> — $${p.amount.toLocaleString()}${due}</span></p>`
      }
    }
    sections.push(sectionBlock(isEs ? 'Presupuesto' : 'Budget', rows))
  }

  // ── Messages ──
  if (data.messages && data.messages.count > 0) {
    let rows = `<p style="margin:0 0 10px;font-size:13px;color:${BRAND};">${data.messages.count} ${isEs ? 'mensaje(s) recibido(s)' : 'message(s) received'}</p>`
    for (const msg of data.messages.recent.slice(0, 3)) {
      rows += `<p style="margin:0 0 10px;padding:10px 14px;background:${CREAM};border-radius:8px;font-size:13px;color:${BRAND};"><strong>${msg.name}</strong><br/><span style="color:${MUTED};">${msg.message.slice(0, 120)}${msg.message.length > 120 ? '…' : ''}</span></p>`
    }
    sections.push(sectionBlock(isEs ? 'Mensajes de invitados' : 'Guest Messages', rows))
  }

  const ctaLabel = isEs ? 'Ver mi panel' : 'View my dashboard'
  const cta = `<a href="${data.dashboardUrl}" style="display:inline-block;margin-top:8px;padding:13px 28px;background:${BRAND};color:${CREAM};text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;letter-spacing:0.05em;">${ctaLabel}</a>`

  const content = `
    <h1 style="margin:0 0 4px;font-size:22px;color:${BRAND};font-weight:300;">${greeting}</h1>
    <p style="margin:0 0 32px;font-size:14px;color:${MUTED};">${subheading}</p>
    ${sections.join('')}
    ${cta}
  `

  return base(content, data.locale, data.unsubscribeUrl)
}
