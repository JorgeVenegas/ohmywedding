"use client"

import { useState, useEffect } from 'react'
import { Sparkles, Zap, ArrowRight } from 'lucide-react'
import { AI_CREDIT_PACKAGES } from '@/lib/ai/credit-packages'

interface BudgetStatus {
  budgetCents:    number | null
  usedCents:      number
  remainingCents: number | null
  isExhausted:    boolean
  usagePct:       number | null
}

interface AIUsageWidgetProps {
  weddingId: string
}

const KEYFRAMES = `
  @keyframes aria-sparkle {
    0%, 100% { opacity: 0.65; transform: scale(1);    }
    50%       { opacity: 1;    transform: scale(1.12); }
  }
`

export function AIUsageWidget({ weddingId }: AIUsageWidgetProps) {
  const [status, setStatus]         = useState<BudgetStatus | null>(null)
  const [loading, setLoading]       = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetch(`/api/ai/credits/usage?weddingId=${weddingId}`)
      .then(r => r.json())
      .then(setStatus)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [weddingId])

  const handleBuyMore = async (packageId: string) => {
    setPurchasing(true)
    try {
      const res = await fetch('/api/ai/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, weddingId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setPurchasing(false)
    }
  }

  if (loading || !status) return null

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const isUnlimited = status.budgetCents === null
  const pct = Math.min(status.usagePct ?? 0, 100)
  const isWarning = pct > 75

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div style={{
        borderRadius: 20,
        background:   '#ffffff',
        border:       '1px solid rgba(66,12,20,0.08)',
        boxShadow:    '0 1px 4px rgba(66,12,20,0.05), 0 4px 16px rgba(66,12,20,0.04)',
        padding:      '20px 24px',
        maxWidth:     340,
        width:        '100%',
      }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Icon — same format as other dashboard cards */}
              <div style={{
                width:          38,
                height:         38,
                borderRadius:   11,
                background:     'rgba(66,12,20,0.06)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}>
                <Sparkles
                  size={16}
                  color="#DDA46F"
                  style={{ animation: 'aria-sparkle 3s ease-in-out infinite' }}
                />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#420c14', lineHeight: 1.3 }}>
                  Créditos de Aria
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(66,12,20,0.45)', marginTop: 1 }}>
                  Asistente IA
                </p>
              </div>
            </div>
            <ArrowRight size={16} color="rgba(66,12,20,0.20)" />
          </div>

          {/* Budget content */}
          {isUnlimited ? (
            <div style={{
              padding:      '10px 14px',
              borderRadius: 10,
              background:   'rgba(221,164,111,0.09)',
              border:       '1px solid rgba(221,164,111,0.22)',
              marginBottom: 18,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: '#420c14' }}>
                <span style={{ fontWeight: 600 }}>Sin límite</span>
                <span style={{ color: 'rgba(66,12,20,0.45)', marginLeft: 6 }}>
                  · {fmt(status.usedCents)} usados
                </span>
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 18 }}>
              {/* Large balance number */}
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'baseline',
                marginBottom:   10,
              }}>
                <span style={{
                  fontSize:      24,
                  fontWeight:    700,
                  letterSpacing: '-0.03em',
                  color:         status.isExhausted ? '#dc2626' : '#420c14',
                }}>
                  {status.isExhausted ? 'Agotado' : fmt(status.remainingCents!)}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(66,12,20,0.40)' }}>
                  de {fmt(status.budgetCents!)}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                height:       5,
                borderRadius: 999,
                background:   'rgba(66,12,20,0.07)',
                overflow:     'hidden',
              }}>
                <div style={{
                  height:     '100%',
                  width:      `${pct}%`,
                  borderRadius: 999,
                  background:   status.isExhausted
                    ? '#dc2626'
                    : isWarning
                      ? '#f59e0b'
                      : 'linear-gradient(90deg, #DDA46F, #c8864f)',
                  boxShadow:   status.isExhausted || isWarning
                    ? 'none'
                    : '0 0 8px rgba(221,164,111,0.6)',
                  transition:  'width 700ms cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>

              {status.isExhausted && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                  Recarga para seguir usando Aria
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(66,12,20,0.06)', margin: '0 0 14px' }} />

          {/* Recharge packages */}
          <div>
            <p style={{
              margin:        '0 0 8px',
              fontSize:      10,
              color:         'rgba(66,12,20,0.38)',
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.20em',
            }}>
              Recargar
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AI_CREDIT_PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  disabled={purchasing}
                  onClick={() => handleBuyMore(pkg.id)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:           4,
                    padding:      '5px 12px',
                    borderRadius:  999,
                    border:       '1px solid rgba(66,12,20,0.12)',
                    background:   'rgba(66,12,20,0.03)',
                    color:        '#420c14',
                    fontSize:      12,
                    fontWeight:    600,
                    cursor:        purchasing ? 'not-allowed' : 'pointer',
                    opacity:       purchasing ? 0.5 : 1,
                    transition:   'all 150ms ease',
                  }}
                  onMouseEnter={e => {
                    if (purchasing) return
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(221,164,111,0.55)'
                    el.style.background  = 'rgba(221,164,111,0.10)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(66,12,20,0.12)'
                    el.style.background  = 'rgba(66,12,20,0.03)'
                  }}
                >
                  <Zap size={10} color="#DDA46F" />
                  {pkg.label}
                </button>
              ))}
            </div>
          </div>

      </div>
    </>
  )
}
