// Server-side feature flags read from the `platform_settings` Supabase table.
// Use `getFeatureFlags()` in server components/API routes; never call from the client directly.
// The superadmin can toggle flags at /superadmin/settings without a redeploy.

import { createClient } from '@supabase/supabase-js'

export interface FeatureFlags {
  msiEnabled: boolean
}

const DEFAULTS: FeatureFlags = {
  msiEnabled: false,
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value')
    if (error || !data) return DEFAULTS

    const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]))
    return {
      msiEnabled: map['msi_enabled'] === 'true',
    }
  } catch {
    return DEFAULTS
  }
}
