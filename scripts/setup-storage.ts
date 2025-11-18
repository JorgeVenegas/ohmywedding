import { config } from 'dotenv'
import { initializeStorageBucket } from '../lib/storage-setup'

// Load environment variables first
config({ path: '.env.local' })

// Setup script to create the Supabase storage bucket
// Run with: npx tsx scripts/setup-storage.ts
// Or add to package.json scripts

async function main() {
  console.log('🚀 Setting up Supabase storage bucket...')
  
  const result = await initializeStorageBucket()
  
  if (result.success) {
    console.log('✅ Storage bucket setup complete!')
    console.log('📁 Bucket: wedding-images')
    console.log('🔗 Public access: enabled') 
    console.log('📏 File size limit: 50MB')
    console.log('🖼️  Allowed types: JPEG, JPG, PNG, WEBP, GIF')
    console.log('')
    console.log('💡 Your app is now ready for image uploads!')
  } else {
    console.error('❌ Failed to setup storage bucket:', result.error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})