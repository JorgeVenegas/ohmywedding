#!/usr/bin/env tsx
/**
 * Export Demo Weddings Script
 * 
 * This script exports demo wedding data from the local Supabase database
 * and creates SQL migration files that can be applied to production.
 * 
 * Usage:
 *   npx tsx scripts/export-demos.ts
 * 
 * Output:
 *   - Creates a migration file in supabase/migrations/
 *   - Downloads demo images and provides instructions for uploading to prod
 * 
 * Prerequisites:
 *   - Local Supabase must be running (supabase start)
 *   - Demo weddings must exist in local database with is_demo = true
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

// Local Supabase configuration
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'
const LOCAL_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Production Supabase URL (for image URL replacement)
// Pass as argument: npx tsx scripts/export-demos.ts https://your-project.supabase.co
// Or set PROD_SUPABASE_URL environment variable
const PROD_SUPABASE_URL = process.argv[2] || process.env.PROD_SUPABASE_URL || ''

if (!PROD_SUPABASE_URL) {
  process.exit(1)
}

// Create Supabase client for local database
const supabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY)

// Helper to escape SQL strings
function escapeSql(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
  }
  // String value - escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`
}

// Helper to format array for SQL
function formatArrayForSql(arr: string[] | null): string {
  if (!arr || arr.length === 0) {
    return "'{}'::text[]"
  }
  const escaped = arr.map(s => `"${String(s).replace(/"/g, '\\"')}"`)
  return `'{${escaped.join(',')}}'::text[]`
}

// Generate timestamp for migration filename
function generateMigrationTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

// Find all image URLs in a JSON object recursively
function findImageUrls(obj: any, urls: Set<string> = new Set()): Set<string> {
  if (!obj) return urls
  
  if (typeof obj === 'string') {
    // Check if it's a URL (http or storage URL)
    if (obj.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i) || 
        obj.includes('/storage/v1/object/public/')) {
      urls.add(obj)
    }
    return urls
  }
  
  if (Array.isArray(obj)) {
    obj.forEach(item => findImageUrls(item, urls))
    return urls
  }
  
  if (typeof obj === 'object') {
    Object.values(obj).forEach(value => findImageUrls(value, urls))
  }
  
  return urls
}

// Replace local URLs with production URLs in an object
function replaceLocalUrls(obj: any, prodUrl: string): any {
  if (!obj) return obj
  
  if (typeof obj === 'string') {
    // Replace local supabase URL with production URL
    return obj.replace(/http:\/\/127\.0\.0\.1:54321/g, prodUrl)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceLocalUrls(item, prodUrl))
  }
  
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceLocalUrls(value, prodUrl)
    }
    return result
  }
  
  return obj
}

// Download an image from URL
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(true)
        })
      } else {
        file.close()
        fs.unlink(destPath, () => {})
        resolve(false)
      }
    }).on('error', () => {
      file.close()
      fs.unlink(destPath, () => {})
      resolve(false)
    })
  })
}

async function exportDemos() {
  const { data: weddings, error: weddingsError } = await supabase
    .from('weddings')
    .select('*')
    .eq('is_demo', true)
    .order('wedding_name_id')
  
  if (weddingsError) {
    process.exit(1)
  }
  
  if (!weddings || weddings.length === 0) {
    process.exit(0)
  }
  weddings.forEach(w => {
  })
  
  // Get wedding IDs for related data
  const weddingIds = weddings.map(w => w.id)
  
  // Wedding schedule
  const { data: schedules } = await supabase
    .from('wedding_schedule')
    .select('*')
    .in('wedding_id', weddingIds)
  
  // Gallery images
  const { data: galleryImages } = await supabase
    .from('gallery_images')
    .select('*')
    .in('wedding_id', weddingIds)
  
  // Wedding settings
  const { data: settings } = await supabase
    .from('wedding_settings')
    .select('*')
    .in('wedding_id', weddingIds)
  
  // Registry items
  const { data: registryItems } = await supabase
    .from('registry_items')
    .select('*')
    .in('wedding_id', weddingIds)
  const allImageUrls = new Set<string>()
  
  weddings.forEach(w => {
    findImageUrls(w.page_config, allImageUrls)
    if (w.og_image_url) allImageUrls.add(w.og_image_url)
  })
  
  galleryImages?.forEach(img => {
    if (img.image_url) allImageUrls.add(img.image_url)
    if (img.thumbnail_url) allImageUrls.add(img.thumbnail_url)
  })
  
  registryItems?.forEach(item => {
    if (item.image_url) allImageUrls.add(item.image_url)
  })
  
  // Filter to only local storage URLs
  const localImageUrls = Array.from(allImageUrls).filter(url => 
    url.includes('127.0.0.1:54321') || url.includes('localhost:54321')
  )
  
  // 4. Download images
  if (localImageUrls.length > 0) {
    const imagesDir = path.join(process.cwd(), 'scripts', 'demo-images')
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }
    const imageMapping: { localUrl: string; filename: string }[] = []
    
    for (const url of localImageUrls) {
      // Extract filename from URL
      const urlPath = new URL(url).pathname
      const filename = urlPath.split('/').pop() || 'unknown.jpg'
      const destPath = path.join(imagesDir, filename)
      
      const success = await downloadImage(url, destPath)
      if (success) {
        imageMapping.push({ localUrl: url, filename })
      } else {
      }
    }
    
    // Save image mapping for reference
    const mappingPath = path.join(imagesDir, 'image-mapping.json')
    fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2))
  }
  
  const timestamp = generateMigrationTimestamp()
  const migrationFilename = `${timestamp}_seed_demo_weddings.sql`
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFilename)
  
  let sql = `-- Demo Weddings Seed Data
-- Generated: ${new Date().toISOString()}
-- 
-- This migration seeds demo wedding data for production
-- Make sure to upload images to the production storage bucket before running this migration
-- 
-- Image files are in: scripts/demo-images/
-- Upload them to: Storage > wedding-assets bucket in production

-- Use a DO block to handle potential conflicts gracefully
DO $$
DECLARE
  wedding_record RECORD;
BEGIN
  -- Temporarily disable RLS for seeding
  -- (This runs as postgres user which bypasses RLS anyway)
  
`

  // Generate wedding inserts with conflict handling
  for (const wedding of weddings) {
    // Replace local URLs with production URLs in page_config
    const updatedPageConfig = replaceLocalUrls(wedding.page_config, PROD_SUPABASE_URL)
    const updatedOgImage = wedding.og_image_url ? 
      wedding.og_image_url.replace(/http:\/\/127\.0\.0\.1:54321/g, PROD_SUPABASE_URL) : null
    
    sql += `  -- Wedding: ${wedding.wedding_name_id}
  INSERT INTO weddings (
    id, date_id, wedding_name_id, partner1_first_name, partner1_last_name,
    partner2_first_name, partner2_last_name, wedding_date, wedding_time,
    reception_time, primary_color, secondary_color, accent_color,
    ceremony_venue_name, ceremony_venue_address, reception_venue_name,
    reception_venue_address, page_config, owner_id, collaborator_emails,
    og_title, og_description, og_image_url, is_demo, created_at, updated_at
  ) VALUES (
    ${escapeSql(wedding.id)},
    ${escapeSql(wedding.date_id)},
    ${escapeSql(wedding.wedding_name_id)},
    ${escapeSql(wedding.partner1_first_name)},
    ${escapeSql(wedding.partner1_last_name)},
    ${escapeSql(wedding.partner2_first_name)},
    ${escapeSql(wedding.partner2_last_name)},
    ${wedding.wedding_date ? escapeSql(wedding.wedding_date) : 'NULL'},
    ${wedding.wedding_time ? escapeSql(wedding.wedding_time) : 'NULL'},
    ${wedding.reception_time ? escapeSql(wedding.reception_time) : 'NULL'},
    ${escapeSql(wedding.primary_color)},
    ${escapeSql(wedding.secondary_color)},
    ${escapeSql(wedding.accent_color)},
    ${escapeSql(wedding.ceremony_venue_name)},
    ${escapeSql(wedding.ceremony_venue_address)},
    ${escapeSql(wedding.reception_venue_name)},
    ${escapeSql(wedding.reception_venue_address)},
    ${escapeSql(updatedPageConfig)},
    NULL, -- owner_id is null for demos
    ${formatArrayForSql(wedding.collaborator_emails)},
    ${escapeSql(wedding.og_title)},
    ${escapeSql(wedding.og_description)},
    ${escapeSql(updatedOgImage)},
    true,
    ${escapeSql(wedding.created_at)},
    ${escapeSql(wedding.updated_at)}
  )
  ON CONFLICT (wedding_name_id) DO UPDATE SET
    page_config = EXCLUDED.page_config,
    partner1_first_name = EXCLUDED.partner1_first_name,
    partner1_last_name = EXCLUDED.partner1_last_name,
    partner2_first_name = EXCLUDED.partner2_first_name,
    partner2_last_name = EXCLUDED.partner2_last_name,
    wedding_date = EXCLUDED.wedding_date,
    wedding_time = EXCLUDED.wedding_time,
    reception_time = EXCLUDED.reception_time,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    ceremony_venue_name = EXCLUDED.ceremony_venue_name,
    ceremony_venue_address = EXCLUDED.ceremony_venue_address,
    reception_venue_name = EXCLUDED.reception_venue_name,
    reception_venue_address = EXCLUDED.reception_venue_address,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url,
    updated_at = now();

`
  }
  
  // Generate schedule inserts
  if (schedules && schedules.length > 0) {
    sql += `  -- Wedding Schedule Events\n`
    for (const schedule of schedules) {
      sql += `  INSERT INTO wedding_schedule (id, wedding_id, event_name, event_time, event_description, display_order, created_at)
  VALUES (
    ${escapeSql(schedule.id)},
    ${escapeSql(schedule.wedding_id)},
    ${escapeSql(schedule.event_name)},
    ${escapeSql(schedule.event_time)},
    ${escapeSql(schedule.event_description)},
    ${schedule.display_order || 0},
    ${escapeSql(schedule.created_at)}
  )
  ON CONFLICT (id) DO UPDATE SET
    event_name = EXCLUDED.event_name,
    event_time = EXCLUDED.event_time,
    event_description = EXCLUDED.event_description,
    display_order = EXCLUDED.display_order;

`
    }
  }
  
  // Generate gallery image inserts
  if (galleryImages && galleryImages.length > 0) {
    sql += `  -- Gallery Images\n`
    for (const img of galleryImages) {
      const updatedImageUrl = img.image_url?.replace(/http:\/\/127\.0\.0\.1:54321/g, PROD_SUPABASE_URL)
      const updatedThumbnailUrl = img.thumbnail_url?.replace(/http:\/\/127\.0\.0\.1:54321/g, PROD_SUPABASE_URL)
      
      sql += `  INSERT INTO gallery_images (id, wedding_id, image_url, thumbnail_url, caption, display_order, created_at)
  VALUES (
    ${escapeSql(img.id)},
    ${escapeSql(img.wedding_id)},
    ${escapeSql(updatedImageUrl)},
    ${escapeSql(updatedThumbnailUrl)},
    ${escapeSql(img.caption)},
    ${img.display_order || 0},
    ${escapeSql(img.created_at)}
  )
  ON CONFLICT (id) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    caption = EXCLUDED.caption,
    display_order = EXCLUDED.display_order;

`
    }
  }
  
  // Generate settings inserts
  if (settings && settings.length > 0) {
    sql += `  -- Wedding Settings\n`
    for (const setting of settings) {
      sql += `  INSERT INTO wedding_settings (id, wedding_id, language, timezone, date_format, created_at, updated_at)
  VALUES (
    ${escapeSql(setting.id)},
    ${escapeSql(setting.wedding_id)},
    ${escapeSql(setting.language)},
    ${escapeSql(setting.timezone)},
    ${escapeSql(setting.date_format)},
    ${escapeSql(setting.created_at)},
    ${escapeSql(setting.updated_at)}
  )
  ON CONFLICT (wedding_id) DO UPDATE SET
    language = EXCLUDED.language,
    timezone = EXCLUDED.timezone,
    date_format = EXCLUDED.date_format,
    updated_at = now();

`
    }
  }
  
  // Generate registry items inserts
  if (registryItems && registryItems.length > 0) {
    sql += `  -- Registry Items\n`
    for (const item of registryItems) {
      const updatedImageUrl = item.image_url?.replace(/http:\/\/127\.0\.0\.1:54321/g, PROD_SUPABASE_URL)
      
      sql += `  INSERT INTO registry_items (id, wedding_id, name, description, price, image_url, external_url, is_custom, funded_amount, display_order, created_at, updated_at)
  VALUES (
    ${escapeSql(item.id)},
    ${escapeSql(item.wedding_id)},
    ${escapeSql(item.name)},
    ${escapeSql(item.description)},
    ${item.price || 0},
    ${escapeSql(updatedImageUrl)},
    ${escapeSql(item.external_url)},
    ${item.is_custom || false},
    ${item.funded_amount || 0},
    ${item.display_order || 0},
    ${escapeSql(item.created_at)},
    ${escapeSql(item.updated_at)}
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    external_url = EXCLUDED.external_url,
    is_custom = EXCLUDED.is_custom,
    display_order = EXCLUDED.display_order,
    updated_at = now();

`
    }
  }
  
  sql += `  RAISE NOTICE 'Demo weddings seeded successfully';
END $$;

-- Verification query (you can run this to verify the data)
-- SELECT wedding_name_id, partner1_first_name, partner2_first_name FROM weddings WHERE is_demo = true;
`

  // Write migration file
  fs.writeFileSync(migrationPath, sql)
  if (localImageUrls.length > 0) {
  }
}

// Run the export
exportDemos().catch(error => {
  const message = error instanceof Error ? error.stack || error.message : String(error)
  process.stderr.write(`exportDemos failed: ${message}\n`)
  process.exitCode = 1
})
