import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// This utility ensures the wedding-images storage bucket exists
export async function initializeStorageBucket() {
  // Use the service role key for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: 'Missing environment variables' }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Try to create the bucket (will silently fail if it already exists)
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('wedding-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 52428800 // 50MB
    })

    // Bucket already exists is not an error for us
    if (bucketError && !bucketError.message.includes('already exists')) {
      return { success: false, error: bucketError }
    }

    return { success: true, bucket: bucketData }

  } catch (error) {
    return { success: false, error }
  }
}