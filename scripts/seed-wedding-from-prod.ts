#!/usr/bin/env tsx
/**
 * Pull a wedding from production into the local Supabase for testing.
 *
 * Usage:
 *   npx tsx scripts/seed-wedding-from-prod.ts <wedding_name_id>
 *   npx tsx scripts/seed-wedding-from-prod.ts <wedding_uuid>
 *
 * Prerequisites:
 *   - Local Supabase must be running (supabase start)
 *   - .env.production and .env.local must exist
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT = path.join(__dirname, '..')
const prodEnv  = dotenv.parse(fs.readFileSync(path.join(ROOT, '.env.production')))
const localEnv = dotenv.parse(fs.readFileSync(path.join(ROOT, '.env.local')))

function getSupabaseProjectUrl(anonKey: string): string {
  const payload = anonKey.split('.')[1]
  const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
  return `https://${decoded.ref}.supabase.co`
}

const PROD_URL  = getSupabaseProjectUrl(prodEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const PROD_KEY  = prodEnv.SUPABASE_SERVICE_ROLE_KEY
const LOCAL_URL = localEnv.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const LOCAL_KEY = localEnv.SUPABASE_SERVICE_ROLE_KEY

const prod  = createClient(PROD_URL,  PROD_KEY,  { auth: { autoRefreshToken: false, persistSession: false } })
const local = createClient(LOCAL_URL, LOCAL_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = (msg: string) => console.log(`  ✓ ${msg}`)
const warn = (msg: string) => console.warn(`  ⚠ ${msg}`)
const step = (msg: string) => console.log(`\n→ ${msg}`)

async function pullByWeddingId(table: string, weddingId: string): Promise<unknown[]> {
  const { data, error } = await prod.from(table).select('*').eq('wedding_id', weddingId)
  if (error) { warn(`fetch ${table}: ${error.message}`); return [] }
  return data ?? []
}

async function upsert(table: string, rows: unknown[]): Promise<void> {
  if (rows.length === 0) { log(`${table}: nothing to insert`); return }
  const { error } = await local.from(table).upsert(rows as object[], { onConflict: 'id', ignoreDuplicates: false })
  if (error) warn(`${table}: ${error.message}`)
  else log(`${table}: ${rows.length} row(s)`)
}

async function upsertOn(table: string, rows: unknown[], onConflict: string): Promise<void> {
  if (rows.length === 0) { log(`${table}: nothing to insert`); return }
  const { error } = await local.from(table).upsert(rows as object[], { onConflict, ignoreDuplicates: true })
  if (error) warn(`${table}: ${error.message}`)
  else log(`${table}: ${rows.length} row(s)`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Usage: npx tsx scripts/seed-wedding-from-prod.ts <wedding_name_id | wedding_uuid>')
    process.exit(1)
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(arg)

  // ── 1. Fetch wedding ───────────────────────────────────────────────────────
  step('Fetching wedding from production')

  const { data: wedding, error: weddingError } = await (isUuid
    ? prod.from('weddings').select('*').eq('id', arg).single()
    : prod.from('weddings').select('*').eq('wedding_name_id', arg).single())

  if (weddingError || !wedding) {
    console.error(`Wedding not found: ${weddingError?.message}`)
    process.exit(1)
  }

  const weddingId = (wedding as { id: string }).id
  const ownerId   = (wedding as { owner_id: string }).owner_id
  const label     = (wedding as { name?: string; wedding_name_id?: string }).name
                 || (wedding as { wedding_name_id?: string }).wedding_name_id
                 || weddingId

  log(`Wedding "${label}" → ${weddingId}`)
  log(`Owner: ${ownerId}`)

  // ── 2. Create auth user locally with the same UUID ─────────────────────────
  step('Syncing auth user')

  const { data: prodUser } = await (prod.auth.admin as unknown as {
    getUserById: (id: string) => Promise<{ data: { user: { id: string; email?: string } | null } }>
  }).getUserById(ownerId)

  // Use a seed-specific email to avoid colliding with an existing local user
  // who may have the same email but a different UUID.
  const seedEmail = `seed-${ownerId.slice(0, 8)}@local.test`
  const prodEmail = prodUser?.user?.email ?? seedEmail

  const { data: existingUser } = await (local.auth.admin as unknown as {
    getUserById: (id: string) => Promise<{ data: { user: unknown | null } }>
  }).getUserById(ownerId)

  if (existingUser?.user) {
    log(`Auth user already exists locally (${ownerId})`)
  } else {
    const { error: createErr } = await (local.auth.admin as unknown as {
      createUser: (opts: object) => Promise<{ error: { message: string } | null }>
    }).createUser({
      id:            ownerId,
      email:         seedEmail,
      password:      'Password123!',
      email_confirm: true,
    })
    if (createErr) {
      warn(`Could not create local user: ${createErr.message}`)
    } else {
      log(`Auth user created — email: ${seedEmail}  /  prod email was: ${prodEmail}`)
    }
  }

  // ── 3. Wedding record ──────────────────────────────────────────────────────
  step('Inserting wedding')
  await upsert('weddings', [wedding])

  // ── 4. Tables with a direct wedding_id FK ────────────────────────────────
  step('Inserting wedding data')

  // Ordered so each table's dependencies are inserted before it
  const directTables = [
    // Level 1 — depend only on weddings
    'wedding_websites',
    'wedding_subscriptions',
    'wedding_events',
    'wedding_schedule',
    'wedding_faqs',
    'wedding_versions',
    'collaborator_permissions',
    'subscription_orders',
    // Level 2 — depend on weddings; children fetched separately
    'guest_groups',
    'itinerary_events',
    'gallery_albums',
    'suppliers',
    'seating_tables',
    'menus',
    'custom_registry_items',
    // Level 3 — have wedding_id but also FK into level-2 tables
    'guests',              // guest_group_id + wedding_id
    'invitation_opens',   // guest_group_id + wedding_id
    'gallery_photos',     // album_id        + wedding_id
    'supplier_payments',  // supplier_id     + wedding_id (if exists)
    'seating_assignments',// table_id        + wedding_id
    // menu_courses is fetched separately below via menu_id
    'dishes',             // wedding_id
    // Level 4 — depend on level-3 (guests must exist)
    'activity_logs',          // wedding_id + guest_id
    'registry_contributions', // wedding_id + item_id
    'guest_dish_assignments', // wedding_id + guest_id + dish_id
    'guest_menu_assignments', // wedding_id + guest_id + menu_id
  ]

  // De-duplicate (guest_groups was listed twice intentionally to show order; remove extra)
  const seen = new Set<string>()
  for (const table of directTables) {
    if (seen.has(table)) continue
    seen.add(table)
    const rows = await pullByWeddingId(table, weddingId)
    await upsert(table, rows)
  }

  // ── menu_courses: no wedding_id, must join via menus ──────────────────────
  const { data: menuRows } = await prod.from('menus').select('id').eq('wedding_id', weddingId)
  if (menuRows && menuRows.length > 0) {
    const menuIds = menuRows.map((m: { id: string }) => m.id)
    const { data: courses, error: coursesErr } = await prod.from('menu_courses').select('*').in('menu_id', menuIds)
    if (coursesErr) warn(`menu_courses: ${coursesErr.message}`)
    else await upsert('menu_courses', courses ?? [])
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log(`\n✅ Done! Wedding "${label}" is now available locally.`)
  console.log(`   Admin:  http://localhost:3000/admin/${weddingId}/dashboard`)
  console.log(`   Login:  ${seedEmail}  /  Password123!  (prod email: ${prodEmail})`)
}

main().catch(err => {
  console.error('\n❌ Fatal:', err)
  process.exit(1)
})
