import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const amount = searchParams.get('amount')
    
    if (!itemId || !amount) {
      return NextResponse.json({ error: 'Missing itemId or amount' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    console.log('Testing RPC with:', { itemId, amount })
    
    const { data, error } = await supabase.rpc('update_registry_item_amount', {
      p_item_id: itemId,
      p_amount_to_add: parseFloat(amount)
    })
    
    if (error) {
      console.error('RPC Error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }
    
    console.log('RPC Success:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
