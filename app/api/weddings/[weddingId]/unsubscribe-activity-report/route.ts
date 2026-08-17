import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  const { weddingId } = await params
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse('Missing token', { status: 400 })
  }

  const expected = createHmac('sha256', process.env.CRON_SECRET ?? 'omw-unsub')
    .update(weddingId)
    .digest('hex')

  if (token !== expected) {
    return new NextResponse('Invalid token', { status: 403 })
  }

  const admin = createAdminSupabaseClient()

  const { data: current } = await admin
    .from('wedding_settings')
    .select('activity_reports')
    .eq('wedding_id', weddingId)
    .single()

  const updated = {
    ...(current?.activity_reports as object ?? {}),
    enabled: false,
  }

  await admin
    .from('wedding_settings')
    .update({ activity_reports: updated })
    .eq('wedding_id', weddingId)

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding:60px;color:#420c14;">
      <h2>Suscripción cancelada</h2>
      <p style="color:#7a3a42;">Ya no recibirás reportes de actividad para esta boda.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
