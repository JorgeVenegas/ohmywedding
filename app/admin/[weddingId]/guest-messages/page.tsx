"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import { ArrowLeft, Heart, MessageSquare } from "lucide-react"

interface GuestMessage {
  id: string
  name: string
  message: string
  rsvp_submitted_at: string | null
}

interface Props {
  params: Promise<{ weddingId: string }>
}

// Deterministic "random" tilt based on index so it's stable across renders
function getTilt(index: number): string {
  const tilts = ['-1.5deg', '1.2deg', '-0.8deg', '2deg', '-1.8deg', '0.6deg', '-2.2deg', '1.6deg', '-0.4deg', '1.9deg']
  return tilts[index % tilts.length]
}

// Cream shades for cards
function getCardBg(index: number): string {
  const bgs = [
    '#fffdf7', '#fdf8f0', '#fff9f5', '#faf6ee', '#fffef9',
    '#fdf9f3', '#fffaf6', '#f9f5ed', '#fffcf7', '#fdf7f1',
  ]
  return bgs[index % bgs.length]
}

export default function GuestMessagesPage({ params }: Props) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t, locale } = useTranslation()
  const es = locale === 'es'

  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/weddings/${encodeURIComponent(decodedWeddingId)}/guest-messages`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setMessages(data.messages || []))
      .catch(() => setError(es ? 'No se pudieron cargar los mensajes.' : 'Could not load messages.'))
      .finally(() => setLoading(false))
  }, [decodedWeddingId])

  return (
    <main className="min-h-screen" style={{ background: '#f5f2eb' }}>
      <Header
        rightContent={
          <Link href={getCleanAdminUrl(weddingId, 'dashboard')}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[#420c14]/60 hover:text-[#420c14]">
              <ArrowLeft className="w-4 h-4" />
              {es ? 'Dashboard' : 'Dashboard'}
            </Button>
          </Link>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Page header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to right, transparent, #DDA46F)' }} />
            <Heart className="w-4 h-4" style={{ color: '#DDA46F' }} fill="#DDA46F" />
            <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to left, transparent, #DDA46F)' }} />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-serif mb-2"
            style={{ color: '#420c14', fontStyle: 'italic', letterSpacing: '-0.01em' }}
          >
            {es ? 'Mensajes de tus invitados' : 'Notes from your guests'}
          </h1>
          <p className="text-sm" style={{ color: '#420c14', opacity: 0.5 }}>
            {es
              ? 'Los mensajes que tus invitados dejaron al confirmar su asistencia'
              : 'Messages your guests left when confirming their attendance'}
          </p>
          {!loading && messages.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <MessageSquare className="w-3.5 h-3.5" style={{ color: '#DDA46F' }} />
              <span className="text-xs font-medium" style={{ color: '#DDA46F' }}>
                {messages.length} {es
                  ? messages.length === 1 ? 'mensaje' : 'mensajes'
                  : messages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
          )}
        </div>

        {/* States */}
        {loading && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="break-inside-avoid mb-5 rounded-xl animate-pulse"
                style={{ background: '#fffdf7', height: i % 3 === 0 ? 160 : i % 2 === 0 ? 120 : 140, border: '1px solid #e8dfd4' }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: '#420c14', opacity: 0.5 }}>{error}</p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="text-center py-24">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(221,164,111,0.12)' }}
            >
              <Heart className="w-9 h-9" style={{ color: '#DDA46F', opacity: 0.7 }} />
            </div>
            <h2 className="text-xl font-serif mb-2" style={{ color: '#420c14', opacity: 0.7, fontStyle: 'italic' }}>
              {es ? 'Aún no hay mensajes' : 'No messages yet'}
            </h2>
            <p className="text-sm max-w-xs mx-auto" style={{ color: '#420c14', opacity: 0.45, lineHeight: '1.6' }}>
              {es
                ? 'Los mensajes de tus invitados aparecerán aquí una vez que confirmen su asistencia.'
                : 'Guest messages will appear here once they confirm their attendance.'}
            </p>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className="break-inside-avoid mb-5 group"
                style={{
                  transform: `rotate(${getTilt(i)})`,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'rotate(0deg) scale(1.02)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(66,12,20,0.13)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.transform = `rotate(${getTilt(i)})`
                  ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                }}
              >
                <div
                  className="rounded-xl p-6"
                  style={{
                    background: getCardBg(i),
                    border: '1px solid',
                    borderColor: 'rgba(221,164,111,0.25)',
                    boxShadow: '0 2px 16px rgba(66,12,20,0.06), 0 1px 3px rgba(66,12,20,0.04)',
                  }}
                >
                  {/* Decorative quote mark */}
                  <div
                    className="text-5xl leading-none mb-2 font-serif select-none"
                    style={{ color: '#DDA46F', opacity: 0.35, lineHeight: 1 }}
                    aria-hidden
                  >
                    &ldquo;
                  </div>

                  {/* Message text */}
                  <p
                    className="text-sm sm:text-base leading-relaxed font-serif"
                    style={{ color: '#420c14', opacity: 0.85, fontStyle: 'italic', wordBreak: 'break-word' }}
                  >
                    {msg.message}
                  </p>

                  {/* Divider */}
                  <div
                    className="my-4 h-px"
                    style={{ background: 'linear-gradient(to right, transparent, rgba(221,164,111,0.4), transparent)' }}
                  />

                  {/* Attribution */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-medium tracking-wide"
                      style={{ color: '#DDA46F' }}
                    >
                      — {msg.name}
                    </span>
                    {msg.rsvp_submitted_at && (
                      <span
                        className="text-[10px]"
                        style={{ color: '#420c14', opacity: 0.35 }}
                      >
                        {new Date(msg.rsvp_submitted_at).toLocaleDateString(
                          es ? 'es-MX' : 'en-US',
                          { month: 'short', day: 'numeric' }
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
