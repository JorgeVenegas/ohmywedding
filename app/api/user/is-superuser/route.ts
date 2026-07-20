import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ isSuperuser: false })
    }

    const isSuperuser = await isSuperUser(supabase, { userId: user.id })

    return NextResponse.json({ isSuperuser })
  } catch (error) {
    return NextResponse.json({ isSuperuser: false })
  }
}
