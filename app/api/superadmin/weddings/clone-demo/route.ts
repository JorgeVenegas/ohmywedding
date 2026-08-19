import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { copyObject, getPublicUrl, keyFromUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function generateDateId(date?: string | null): string {
  const d = date ? (() => {
    const [y, m, day] = date.split('-').map(Number)
    return new Date(y, m - 1, day)
  })() : new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2)
  return `${month}${day}${year}`
}

async function generateUniqueWeddingNameId(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  p1: string,
  p2: string,
  lastName1?: string | null,
  lastName2?: string | null,
): Promise<string> {
  const base = `${p1.toLowerCase().replace(/\s+/g, '')}-${p2.toLowerCase().replace(/\s+/g, '')}`

  const { data: existing } = await adminClient.from('weddings').select('wedding_name_id')
  const names = (existing || []).map((w: { wedding_name_id: string }) => w.wedding_name_id)

  if (!names.includes(base)) return base

  const i1 = lastName1 ? lastName1[0].toLowerCase() : ''
  const i2 = lastName2 ? lastName2[0].toLowerCase() : ''
  const withInitials = `${p1.toLowerCase().replace(/\s+/g, '')}${i1}-${p2.toLowerCase().replace(/\s+/g, '')}${i2}`

  if (!names.includes(withInitials)) return withInitials

  let counter = 1
  while (names.includes(`${withInitials}-${counter}`)) counter++
  return `${withInitials}-${counter}`
}

// POST /api/superadmin/weddings/clone-demo
// Body: { sourceWeddingId, partner1FirstName, partner2FirstName, partner1LastName?, partner2LastName?, weddingDate?, location? }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    if (!(await isSuperUser(adminClient, { email: user.email }))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      sourceWeddingId,
      partner1FirstName,
      partner2FirstName,
      partner1LastName,
      partner2LastName,
      weddingDate,
      location,
    } = body

    if (!sourceWeddingId || !partner1FirstName || !partner2FirstName) {
      return NextResponse.json({ error: 'sourceWeddingId, partner1FirstName, and partner2FirstName are required' }, { status: 400 })
    }

    // 1. Fetch source wedding
    const { data: source, error: srcErr } = await adminClient
      .from('weddings')
      .select('id, date_id, wedding_name_id, partner1_first_name, partner2_first_name')
      .eq('id', sourceWeddingId)
      .single()

    if (srcErr || !source) {
      return NextResponse.json({ error: 'Source wedding not found' }, { status: 404 })
    }

    // 2. Fetch source page_config from wedding_websites
    const { data: srcWebsite } = await adminClient
      .from('wedding_websites')
      .select('page_config')
      .eq('wedding_id', sourceWeddingId)
      .single()

    // 3. Fetch source FAQs
    const { data: srcFaqs } = await adminClient
      .from('wedding_faqs')
      .select('question, answer, display_order, is_visible, images')
      .eq('wedding_name_id', source.wedding_name_id)
      .order('display_order', { ascending: true })

    // 4. Fetch source wedding_pages
    const { data: srcPages } = await adminClient
      .from('wedding_pages')
      .select('page_type, title, content, is_enabled, display_order')
      .eq('wedding_name_id', source.wedding_name_id)
      .order('display_order', { ascending: true })

    // 5. Fetch source wedding_schedule
    const { data: srcSchedule } = await adminClient
      .from('wedding_schedule')
      .select('event_name, event_time, event_description, display_order')
      .eq('wedding_name_id', source.wedding_name_id)
      .order('display_order', { ascending: true })

    // 5b. Fetch source images
    const { data: srcImages } = await adminClient
      .from('images')
      .select('id, url, storage_path, filename, size, mime_type, caption')
      .eq('wedding_id', sourceWeddingId)

    // 6. Generate new IDs for the demo wedding
    const newDateId = generateDateId(weddingDate)
    const newWeddingNameId = await generateUniqueWeddingNameId(
      adminClient,
      partner1FirstName,
      partner2FirstName,
      partner1LastName,
      partner2LastName,
    )

    // 7. Create the new wedding record
    const { data: newWedding, error: insertErr } = await adminClient
      .from('weddings')
      .insert({
        date_id: newDateId,
        wedding_name_id: newWeddingNameId,
        partner1_first_name: partner1FirstName,
        partner1_last_name: partner1LastName || null,
        partner2_first_name: partner2FirstName,
        partner2_last_name: partner2LastName || null,
        wedding_date: weddingDate || null,
        ceremony_venue_name: location || null,
        owner_id: user.id,
        has_website: true,
      })
      .select('id, wedding_name_id')
      .single()

    if (insertErr || !newWedding) {
      return NextResponse.json({ error: insertErr?.message || 'Failed to create wedding' }, { status: 500 })
    }

    const newId = newWedding.id

    // 8. Copy images — S3 copy each file to a new key, insert new DB rows,
    //    and build a URL replacement map so page_config can be rewritten.
    const urlMap: Record<string, string> = {}

    if (srcImages && srcImages.length > 0) {
      const newImageRows: Array<{
        wedding_id: string
        url: string
        storage_path: string
        filename: string | null
        size: number | null
        mime_type: string | null
        caption: string | null
      }> = []

      await Promise.all(
        srcImages.map(async (img) => {
          try {
            const srcKey = img.storage_path || keyFromUrl(img.url)
            if (!srcKey) return

            const ext = img.filename?.split('.').pop() ?? 'jpg'
            const destKey = `${newId}/wedding-images/${crypto.randomUUID()}.${ext}`
            const newUrl = await copyObject(srcKey, destKey)

            urlMap[img.url] = newUrl
            newImageRows.push({
              wedding_id: newId,
              url: newUrl,
              storage_path: destKey,
              filename: img.filename,
              size: img.size,
              mime_type: img.mime_type,
              caption: img.caption,
            })
          } catch (e) {
            console.warn('[clone-demo] failed to copy image', img.url, e)
          }
        })
      )

      if (newImageRows.length > 0) {
        await adminClient.from('images').insert(newImageRows)
      }
    }

    // Rewrite all old image URLs in page_config to new ones
    let pageConfig = srcWebsite?.page_config || {}
    if (Object.keys(urlMap).length > 0) {
      let configJson = JSON.stringify(pageConfig)
      for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
        configJson = configJson.replaceAll(oldUrl, newUrl)
      }
      pageConfig = JSON.parse(configJson)
    }

    // 9. Copy page_config to new wedding_websites row
    await adminClient
      .from('wedding_websites')
      .upsert(
        { wedding_id: newId, page_config: pageConfig },
        { onConflict: 'wedding_id' },
      )

    // 9. Create wedding_subscriptions (deluxe for demo purposes)
    await adminClient
      .from('wedding_subscriptions')
      .upsert(
        { wedding_id: newId, plan: 'deluxe', invitation_tier: null, management_tier: null },
        { onConflict: 'wedding_id', ignoreDuplicates: true },
      )

    // 10. Create wedding_settings
    await adminClient
      .from('wedding_settings')
      .upsert(
        { wedding_id: newId },
        { onConflict: 'wedding_id', ignoreDuplicates: true },
      )

    // 11. Copy FAQs
    if (srcFaqs && srcFaqs.length > 0) {
      await adminClient.from('wedding_faqs').insert(
        srcFaqs.map(faq => ({
          date_id: newDateId,
          wedding_name_id: newWeddingNameId,
          question: faq.question,
          answer: faq.answer,
          display_order: faq.display_order,
          is_visible: faq.is_visible,
          images: faq.images,
        })),
      )
    }

    // 12. Copy wedding_pages
    if (srcPages && srcPages.length > 0) {
      await adminClient.from('wedding_pages').insert(
        srcPages.map(page => ({
          date_id: newDateId,
          wedding_name_id: newWeddingNameId,
          page_type: page.page_type,
          title: page.title,
          content: page.content,
          is_enabled: page.is_enabled,
          display_order: page.display_order,
        })),
      )
    }

    // 13. Copy wedding_schedule
    if (srcSchedule && srcSchedule.length > 0) {
      await adminClient.from('wedding_schedule').insert(
        srcSchedule.map(s => ({
          date_id: newDateId,
          wedding_name_id: newWeddingNameId,
          event_name: s.event_name,
          event_time: s.event_time,
          event_description: s.event_description,
          display_order: s.display_order,
        })),
      )
    }

    return NextResponse.json({
      success: true,
      weddingId: newId,
      weddingNameId: newWeddingNameId,
      sourceWeddingNameId: source.wedding_name_id,
    })
  } catch (err) {
    console.error('[clone-demo]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
