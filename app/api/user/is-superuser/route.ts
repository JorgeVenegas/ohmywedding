import { createServerSupabaseClient } from '@/lib/supabase-server'
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

    // Check if user is a superuser
    const { data: superuserData } = await supabase
      .from('superusers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    return NextResponse.json({ isSuperuser: !!superuserData })
  } catch (error) {
    return NextResponse.json({ isSuperuser: false })
  }
}
