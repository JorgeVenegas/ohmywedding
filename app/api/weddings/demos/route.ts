import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/weddings/demos - Return demo weddings with their page configs
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Fetch all demo weddings that have 'demo-' prefix in their wedding_name_id
    const { data: demos, error } = await supabase
      .from('weddings')
      .select('wedding_name_id, page_config, partner1_first_name, partner2_first_name')
      .like('wedding_name_id', 'demo-%')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching demo weddings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!demos || demos.length === 0) {
      return NextResponse.json({ demos: [] })
    }
    
    // Transform demos into a format matching PAGE_TEMPLATES structure
    const templates = demos.map(demo => {
      // Extract template ID from wedding_name_id (e.g., 'demo-luxury-noir' -> 'luxury-noir')
      const templateId = demo.wedding_name_id.replace('demo-', '')
      
      return {
        id: templateId,
        weddingNameId: demo.wedding_name_id,
        pageConfig: demo.page_config,
        // Include names for preview
        partner1FirstName: demo.partner1_first_name,
        partner2FirstName: demo.partner2_first_name
      }
    })
    
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error in GET /api/weddings/demos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
