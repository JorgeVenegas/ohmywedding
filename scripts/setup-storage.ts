import { config } from 'dotenv'
import { initializeStorageBucket } from '../lib/storage-setup'

// Get environment from command line argument
const env = process.argv[2] || 'local'
const envFile = env === 'prod' ? '.env.prod' : '.env.local'

// Load environment variables - override: true ensures the specified file takes precedence
config({ path: envFile, override: true })

// Setup script to create the Supabase storage bucket
// Run with: 
//   npm run setup:storage (local)
//   npm run setup:storage:prod (production)

async function main() {
  const envLabel = env === 'prod' ? 'PRODUCTION' : 'LOCAL'
  
  console.log('🚀 Setting up Supabase storage bucket...')
  console.log(`📋 Environment: ${envLabel}`)
  console.log(`📄 Using: ${envFile}`)
  console.log(`🔗 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log('')
  
  const result = await initializeStorageBucket()
  
  if (result.success) {
    console.log('✅ Storage bucket setup complete!')
    console.log('📁 Bucket: wedding-images')
    console.log('🔗 Public access: enabled') 
    console.log('📏 File size limit: 50MB')
    console.log('🖼️  Allowed types: JPEG, JPG, PNG, WEBP, GIF')
    console.log('')
    console.log(`💡 ${envLabel} storage is now ready for image uploads!`)
  } else {
    console.error('❌ Failed to setup storage bucket:', result.error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})