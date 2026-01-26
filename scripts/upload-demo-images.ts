#!/usr/bin/env tsx
/**
 * Upload Demo Images to Production Storage
 * 
 * This script uploads the demo images from scripts/demo-images/ 
 * to the production Supabase storage bucket.
 * 
 * Usage:
 *   npx tsx scripts/upload-demo-images.ts --prod
 *   npx tsx scripts/upload-demo-images.ts --prod --supabase-url https://xxx.supabase.co
 * 
 * Prerequisites:
 *   - Run export-demos.ts first to download images
 *   - Set SUPABASE_PROJECT_URL (actual supabase.co URL) and SUPABASE_SERVICE_ROLE_KEY in .env.production
 *     OR pass --supabase-url argument
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
const envFile = process.argv.includes('--prod') ? '.env.production' : '.env.local'
dotenv.config({ path: path.join(process.cwd(), envFile) })

// Parse command line arguments for supabase URL
const supabaseUrlArgIndex = process.argv.indexOf('--supabase-url')
const supabaseUrlArg = supabaseUrlArgIndex !== -1 ? process.argv[supabaseUrlArgIndex + 1] : null

// For production, we need the actual Supabase project URL (not custom domain) and service role key
// Priority: CLI arg > SUPABASE_PROJECT_URL env var > NEXT_PUBLIC_SUPABASE_URL env var
let SUPABASE_URL = supabaseUrlArg || process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Extract actual Supabase URL from the anon key if we have a custom domain
if (SUPABASE_URL && !SUPABASE_URL.includes('supabase.co') && !SUPABASE_URL.includes('127.0.0.1')) {
  // Try to extract the project ref from the anon key
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (anonKey) {
    try {
      const payload = JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64').toString())
      if (payload.ref) {
        SUPABASE_URL = `https://${payload.ref}.supabase.co`
      }
    } catch (e) {
      // Could not parse, continue with original URL
    }
  }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  process.exit(1)
}

if (!SUPABASE_URL.includes('supabase.co') && !SUPABASE_URL.includes('127.0.0.1')) {
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
}

async function uploadDemoImages() {
  
  const imagesDir = path.join(process.cwd(), 'scripts', 'demo-images')
  
  if (!fs.existsSync(imagesDir)) {
    process.exit(1)
  }
  
  // Read image mapping if it exists
  const mappingPath = path.join(imagesDir, 'image-mapping.json')
  let imageMapping: { localUrl: string; filename: string }[] = []
  
  if (fs.existsSync(mappingPath)) {
    imageMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'))
  }
  
  // Get all image files
  const files = fs.readdirSync(imagesDir).filter(f => 
    !f.endsWith('.json') && !f.startsWith('.')
  )
  
  if (files.length === 0) {
    process.exit(0)
  }
  
  let successCount = 0
  let failCount = 0
  
  for (const filename of files) {
    const filePath = path.join(imagesDir, filename)
    const ext = path.extname(filename).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    
    // Find the original path from mapping
    const mapping = imageMapping.find(m => m.filename === filename)
    let storagePath = filename
    let bucketName = 'wedding-images' // Default bucket name
    
    if (mapping) {
      // Extract the bucket name and path from /storage/v1/object/public/<bucket>/<path>
      const match = mapping.localUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)
      if (match) {
        bucketName = match[1]
        storagePath = match[2]
      }
    }
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath)
    
    // Upload to storage
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true // Overwrite if exists
      })
    
    if (error) {
      failCount++
    } else {
      successCount++
    }
  }
  
  if (failCount > 0) {
  }
}

uploadDemoImages().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`uploadDemoImages failed: ${message}\n`)
  process.exitCode = 1
})
