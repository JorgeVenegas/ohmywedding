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
  
  const result = await initializeStorageBucket()
  
  if (result.success) {
  } else {
    process.exit(1)
  }
}

main().catch((error) => {
  process.exit(1)
})