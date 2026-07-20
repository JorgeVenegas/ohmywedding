import { NextResponse } from 'next/server'
import { getFeatureFlags } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

// Public endpoint — returns non-sensitive UI feature flags.
export async function GET() {
  const flags = await getFeatureFlags()
  return NextResponse.json(flags)
}
