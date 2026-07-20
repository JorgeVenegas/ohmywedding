'use client'

import { useEffect, useState } from 'react'
import { Loader2, ToggleLeft, ToggleRight, Save } from 'lucide-react'

interface Flag {
  key: string
  label: string
  description: string
  value: boolean
}

const FLAG_META: Record<string, { label: string; description: string }> = {
  msi_enabled: {
    label: 'MSI (Meses Sin Intereses)',
    description: 'Show the "3 o 6 MSI" payment option on the pricing page checkout. Toggle off to hide it sitewide.',
  },
}

export default function SettingsPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/settings')
      .then(r => r.json())
      .then(data => {
        const parsed: Flag[] = (data.settings ?? []).map((s: { key: string; value: string }) => ({
          key: s.key,
          label: FLAG_META[s.key]?.label ?? s.key,
          description: FLAG_META[s.key]?.description ?? '',
          value: s.value === 'true',
        }))
        setFlags(parsed)
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (key: string) => {
    const current = flags.find(f => f.key === key)
    if (!current) return
    const next = !current.value
    setSaving(key)
    setError(null)
    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(next) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setFlags(prev => prev.map(f => f.key === key ? { ...f, value: next } : f))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Superadmin</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Platform Settings</h1>
        <p className="text-[#420c14]/60 mt-2 text-sm">Feature flags and sitewide toggles. Changes take effect immediately.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[#420c14]/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map(flag => (
            <div
              key={flag.key}
              className="flex items-start justify-between gap-6 p-5 bg-white rounded-2xl border border-[#420c14]/10 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#420c14]">{flag.label}</p>
                {flag.description && (
                  <p className="text-xs text-[#420c14]/50 mt-1">{flag.description}</p>
                )}
                <span className={`inline-block mt-2 text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full ${
                  flag.value ? 'bg-green-100 text-green-700' : 'bg-[#420c14]/8 text-[#420c14]/50'
                }`}>
                  {flag.value ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <button
                onClick={() => toggle(flag.key)}
                disabled={saving === flag.key}
                className="flex-shrink-0 mt-0.5 text-[#420c14]/40 hover:text-[#420c14] transition-colors disabled:opacity-40"
                aria-label={flag.value ? 'Disable' : 'Enable'}
              >
                {saving === flag.key ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : flag.value ? (
                  <ToggleRight className="w-8 h-8 text-[#DDA46F]" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
          ))}
          {flags.length === 0 && (
            <p className="text-sm text-[#420c14]/40">No settings found. Run the latest migration to seed defaults.</p>
          )}
        </div>
      )}
    </div>
  )
}
