"use client"

import { useState, useRef, useEffect, useCallback, Fragment, type KeyboardEvent } from 'react'
import { Sparkles, X, RotateCcw, ArrowUp, Maximize2, PanelRight, Clock } from 'lucide-react'

/* ─── types ─────────────────────────────────────────────────────────────── */

type ViewMode = 'sidebar' | 'fullscreen'

interface MessageUsage {
  model:  string
  input:  number
  output: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  currentTool?: string    // tool being called right now (while streaming)
  suggestions?: string[]  // AI-generated follow-up questions
  isError?: boolean       // true when the request failed
  isBudgetExhausted?: boolean
  usage?: MessageUsage    // token/model info from the stream trailing marker
}

/* ─── tool status map ────────────────────────────────────────────────────── */

const TOOL_STATUS: Record<string, string> = {
  get_guest_list:       'Consultando lista de invitados…',
  get_guest_summary:    'Contando invitados…',
  find_guest:           'Buscando invitado…',
  get_vendor_summary:   'Consultando proveedores…',
  get_payments:         'Revisando pagos…',
  get_budget:           'Consultando presupuesto…',
  get_timeline:         'Revisando el itinerario…',
  get_wedding_info:     'Consultando información del evento…',
  get_hotels:           'Buscando opciones de hospedaje…',
  get_faq:              'Revisando preguntas frecuentes…',
  get_menu:             'Consultando menús…',
  get_seating:          'Revisando distribución de mesas…',
  get_registry:         'Consultando mesa de regalos…',
  get_invitation_stats: 'Revisando estado de invitaciones…',
  update_guest_note:    'Guardando nota del invitado…',
  create_faq:           'Agregando pregunta frecuente…',
}

// Control-char markers injected by the stream route: \x02ARIA:tool_name\x03
const ARIA_MARKER_RE = /\x02ARIA:([^\x03]+)\x03/g

interface ChatPanelProps {
  weddingId: string
  currentPage?: string
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const SUGGESTIONS = [
  '¿Cuántos invitados han confirmado?',
  'Resumen del presupuesto',
  'Próximos eventos del itinerario',
  '¿Hay pagos pendientes?',
]

/* ─── keyframes injected once ─────────────────────────────────────────────── */

const CSS = `
  @keyframes omw-ai-glow {
    0%,100% {
      box-shadow: 0 4px 20px rgba(66,12,20,0.38), 0 0 0 0 rgba(221,164,111,0), 0 0 0px rgba(221,164,111,0);
    }
    50% {
      box-shadow: 0 6px 32px rgba(66,12,20,0.48), 0 0 0 8px rgba(221,164,111,0.18), 0 0 56px rgba(221,164,111,0.28);
    }
  }
  @keyframes omw-ai-panel-glow {
    0%, 100% {
      box-shadow: 0 32px 80px rgba(66,12,20,0.14), 0 0 0 0.5px rgba(212,165,116,0.3), 0 2px 1px rgba(255,255,255,0.8) inset;
    }
    50% {
      box-shadow: 0 32px 80px rgba(66,12,20,0.20), 0 0 0 1.5px rgba(221,164,111,0.55), 0 2px 1px rgba(255,255,255,0.8) inset, 0 0 80px rgba(221,164,111,0.20), 0 0 140px rgba(221,164,111,0.08);
    }
  }
  @keyframes omw-ai-sidebar-glow {
    0%, 100% {
      box-shadow: -8px 0 40px rgba(66,12,20,0.08), -1px 0 0 rgba(212,165,116,0.2);
    }
    50% {
      box-shadow: -8px 0 60px rgba(66,12,20,0.13), -1.5px 0 0 rgba(221,164,111,0.45), -24px 0 60px rgba(221,164,111,0.15);
    }
  }
  @keyframes omw-ai-ring {
    0%   { transform: scale(1);   opacity: 0.7; }
    100% { transform: scale(1.55); opacity: 0; }
  }
  @keyframes omw-ai-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes omw-ai-panel-up {
    from { opacity: 0; transform: scale(0.96) translateY(12px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes omw-ai-slide-right {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes omw-ai-msg {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes omw-ai-cursor {
    0%,100% { opacity: 1; }
    50%     { opacity: 0; }
  }
  @keyframes omw-ai-dot {
    0%,60%,100% { transform: translateY(0);    opacity: 0.35; }
    30%          { transform: translateY(-4px); opacity: 1; }
  }
  @keyframes omw-ai-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes omw-ai-spin-slow {
    to { transform: rotate(360deg); }
  }
  @keyframes omw-ai-word-in {
    from { opacity: 0; transform: translateY(4px); filter: blur(3px); }
    to   { opacity: 1; transform: translateY(0);   filter: blur(0);   }
  }
  @keyframes omw-ai-suggestions-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes omw-ai-status-in {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

/* ─── component ──────────────────────────────────────────────────────────── */

export function AIChatPanel({ weddingId, currentPage }: ChatPanelProps) {
  const [isOpen, setIsOpen]               = useState(false)
  const [mode, setMode]                   = useState<ViewMode>('fullscreen')
  const [messages, setMessages]           = useState<Message[]>([])
  const [input, setInput]                 = useState('')
  const [isStreaming, setIsStreaming]      = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [animKey, setAnimKey]             = useState(0)   // forces re-animation on mode change
  const [debugModel, setDebugModel]       = useState<string | null>(null)
  const [showHistory, setShowHistory]     = useState(false)
  const [conversations, setConversations] = useState<{ id: string; updated_at: string }[]>([])

  const messagesEndRef    = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /* scroll ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* focus input on open ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350)
  }, [isOpen])

  /* body scroll lock ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* escape key ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  /* open ────────────────────────────────────────────────────────────────── */
  const open = () => {
    setIsOpen(true)
    setAnimKey(k => k + 1)
  }

  /* mode toggle ─────────────────────────────────────────────────────────── */
  const toggleMode = () => {
    setMode(m => m === 'fullscreen' ? 'sidebar' : 'fullscreen')
    setAnimKey(k => k + 1)
  }

  /* send ────────────────────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isStreaming) return

    setInput('')

    const userMsg: Message  = { id: uid(), role: 'user',      content: msg }
    const assistMsg: Message = { id: uid(), role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMsg, assistMsg])
    setIsStreaming(true)

    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          weddingSlug: weddingId,
          channel: 'planner_dashboard',
          conversationId: conversationId ?? undefined,
          currentPage,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) {
        if (res.status === 402) {
          setMessages(prev => prev.map(m =>
            m.id === assistMsg.id
              ? { ...m, content: '', streaming: false, isBudgetExhausted: true }
              : m
          ))
          setIsStreaming(false)
          abortControllerRef.current = null
          return
        }
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(err.error ?? 'Error al conectar con el asistente')
      }

      const cid = res.headers.get('x-conversation-id')
      if (cid && !conversationId) setConversationId(cid)
      const model = res.headers.get('x-ai-model')
      if (model) setDebugModel(model)

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let rawAccumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        rawAccumulated += decoder.decode(value, { stream: true })

        // Find the last non-usage tool marker for real-time status
        const toolMarkers = [...rawAccumulated.matchAll(ARIA_MARKER_RE)]
          .filter(m => !m[1].startsWith('usage:'))
        const currentTool = toolMarkers.length > 0
          ? toolMarkers[toolMarkers.length - 1][1]
          : undefined

        // Strip ALL markers from visible content
        const visibleContent = rawAccumulated.replace(ARIA_MARKER_RE, '')

        setMessages(prev => prev.map(m =>
          m.id === assistMsg.id
            ? { ...m, content: visibleContent, currentTool, streaming: true }
            : m
        ))
      }

      // Extract usage from trailing marker
      let usage: MessageUsage | undefined
      const usageMatch = rawAccumulated.match(/\x02ARIA:usage:([^\x03]+)\x03/)
      if (usageMatch) {
        try { usage = JSON.parse(usageMatch[1]) } catch { /* ignore */ }
      }

      const finalContent = rawAccumulated.replace(ARIA_MARKER_RE, '')

      setMessages(prev => prev.map(m =>
        m.id === assistMsg.id
          ? { ...m, content: finalContent, streaming: false, currentTool: undefined, usage }
          : m
      ))

      // Fetch AI-generated follow-up suggestions asynchronously
      fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, response: finalContent }),
      })
        .then(r => r.json())
        .then(({ suggestions }) => {
          if (suggestions?.length > 0) {
            setMessages(prev => prev.map(m =>
              m.id === assistMsg.id ? { ...m, suggestions } : m
            ))
          }
        })
        .catch(() => {/* suggestions are optional */})
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setMessages(prev => prev.map(m =>
        m.id === assistMsg.id
          ? { ...m, content: '', streaming: false, isError: true }
          : m
      ))
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [input, isStreaming, weddingId, conversationId, currentPage])

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const reset = () => {
    abortControllerRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setInput('')
    setIsStreaming(false)
    setDebugModel(null)
    setShowHistory(false)
  }

  const openHistory = async () => {
    if (showHistory) { setShowHistory(false); return }
    const res = await fetch(`/api/ai/conversations?weddingSlug=${encodeURIComponent(weddingId)}`).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setConversations(data.conversations ?? [])
    }
    setShowHistory(true)
  }

  const switchConversation = (id: string) => {
    abortControllerRef.current?.abort()
    setMessages([])
    setConversationId(id)
    setIsStreaming(false)
    setDebugModel(null)
    setShowHistory(false)
  }

  /* ─── derived layout values ──────────────────────────────────────────── */
  const isFullscreen = mode === 'fullscreen'

  const panelStyle: React.CSSProperties = isFullscreen ? {
    position:        'fixed',
    inset:           0,
    zIndex:          9999,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    pointerEvents:   'none',
  } : {
    position:  'fixed',
    top:       0,
    right:     0,
    bottom:    0,
    zIndex:    9999,
    width:     420,
    display:   'flex',
    flexDirection: 'column',
  }

  const cardStyle: React.CSSProperties = isFullscreen ? {
    width:         '100%',
    maxWidth:      740,
    height:        '82vh',
    maxHeight:     820,
    borderRadius:  28,
    pointerEvents: 'all',
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    animation:     `omw-ai-panel-up-${animKey} 420ms cubic-bezier(0.22,1,0.36,1) both, omw-ai-panel-glow 4.5s 700ms ease-in-out infinite`,
    background:    'rgba(254,253,251,0.88)',
    backdropFilter:'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    boxShadow:     '0 32px 80px rgba(66,12,20,0.14), 0 0 0 0.5px rgba(212,165,116,0.3), 0 2px 1px rgba(255,255,255,0.8) inset',
    border:        '1px solid rgba(212,165,116,0.18)',
    margin:        '0 16px',
  } : {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    animation:     `omw-ai-slide-right 360ms cubic-bezier(0.22,1,0.36,1) both, omw-ai-sidebar-glow 4.5s 500ms ease-in-out infinite`,
    background:    'rgba(254,253,251,0.94)',
    backdropFilter:'blur(30px) saturate(160%)',
    WebkitBackdropFilter: 'blur(30px) saturate(160%)',
    boxShadow:     '-8px 0 40px rgba(66,12,20,0.08), -1px 0 0 rgba(212,165,116,0.2)',
    borderLeft:    '1px solid rgba(212,165,116,0.2)',
  }

  /* ─── render ─────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── injected keyframes ── */}
      <style>{CSS + `
        @keyframes omw-ai-panel-up-${animKey}  { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes omw-ai-slide-right { from { opacity:0; transform:translateX(28px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* ── floating trigger ── */}
      {!isOpen && (
        <button
          onClick={open}
          aria-label="Abrir asistente AI"
          style={{
            position:     'fixed',
            bottom:        24,
            right:         24,
            zIndex:        9990,
            display:       'flex',
            alignItems:    'center',
            gap:           10,
            height:        48,
            paddingLeft:   18,
            paddingRight:  20,
            borderRadius:  999,
            border:        'none',
            cursor:        'pointer',
            background:    'linear-gradient(135deg, #420c14 0%, #6b1820 100%)',
            color:         '#DDA46F',
            fontSize:      14,
            fontWeight:    600,
            fontFamily:    'var(--font-sans)',
            letterSpacing: '0.01em',
            boxShadow:     '0 4px 20px rgba(66,12,20,0.35), 0 1px 0 rgba(255,255,255,0.08) inset',
            animation:     'omw-ai-glow 3s ease-in-out infinite',
            transition:    'transform 180ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 200ms ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
          }}
        >
          {/* pulsing ring */}
          <span style={{
            position:     'absolute',
            inset:        -1,
            borderRadius: 999,
            border:       '1.5px solid rgba(221,164,111,0.6)',
            animation:    'omw-ai-ring 2.2s cubic-bezier(0,0,0.2,1) infinite',
            pointerEvents:'none',
          }} />

          <SparkleIcon />
          <span>Aria</span>
        </button>
      )}

      {/* ── backdrop — both modes; sits above sticky z-50 header ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position:   'fixed',
            inset:       0,
            zIndex:      9998,
            background:  isFullscreen ? 'rgba(26,23,21,0.55)' : 'rgba(26,23,21,0.35)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation:  'omw-ai-fade-in 280ms ease both',
            cursor:      'default',
          }}
        />
      )}

      {/* ── panel wrapper ── */}
      {isOpen && (
        <div style={panelStyle}>
          <div key={`${mode}-${animKey}`} style={cardStyle}>

            {/* ── header ── */}
            <header style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '16px 20px',
              borderBottom:   '1px solid rgba(212,165,116,0.15)',
              flexShrink:     0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* avatar orb */}
                <div style={{
                  width:         38,
                  height:        38,
                  borderRadius:  12,
                  background:    'linear-gradient(135deg, #420c14 0%, #7a1f2a 60%, #DDA46F 130%)',
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent:'center',
                  boxShadow:     '0 2px 12px rgba(66,12,20,0.25), 0 1px 0 rgba(255,255,255,0.1) inset',
                  flexShrink:    0,
                }}>
                  <SparkleIcon size={16} color="#DDA46F" />
                </div>

                <div>
                  <p style={{
                    margin:        0,
                    fontSize:      16,
                    fontWeight:    500,
                    fontFamily:    '"Cormorant Garamond", serif',
                    letterSpacing: '0.02em',
                    color:         '#2c2c2c',
                    lineHeight:    1.2,
                  }}>
                    Aria
                  </p>
                  <p style={{
                    margin:     0,
                    fontSize:   11,
                    color:      '#9a8a7a',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.4,
                  }}>
                    Asistente de Boda · IA
                  </p>
                  {debugModel && (
                    <p style={{
                      margin:        0,
                      fontSize:      9.5,
                      color:         debugModel.includes('ollama') || debugModel.includes('llama')
                        ? '#b5732a'
                        : '#7a9a7a',
                      fontFamily:    'ui-monospace, monospace',
                      letterSpacing: '0.03em',
                      lineHeight:    1.4,
                      marginTop:     1,
                    }}>
                      {debugModel}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconButton onClick={openHistory} title="Historial de conversaciones">
                  <Clock size={14} />
                </IconButton>
                <IconButton onClick={reset} title="Nueva conversación">
                  <RotateCcw size={14} />
                </IconButton>
                <IconButton onClick={toggleMode} title={isFullscreen ? 'Modo panel' : 'Pantalla completa'}>
                  {isFullscreen ? <PanelRight size={14} /> : <Maximize2 size={14} />}
                </IconButton>
                <IconButton onClick={() => setIsOpen(false)} title="Cerrar">
                  <X size={15} />
                </IconButton>
              </div>
            </header>

            {/* ── messages area ── */}
            <div style={{
              flex:       1,
              overflowY:  'auto',
              padding:    messages.length === 0 && !showHistory ? 0 : '20px 20px 8px',
              minHeight:  0,
              scrollbarWidth: 'none',
              position:   'relative',
            }}>
              {showHistory ? (
                <div style={{ padding: '4px 0' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#DDA46F', marginBottom: 12 }}>
                    Conversaciones anteriores
                  </p>
                  {conversations.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#420c1480', textAlign: 'center', padding: '32px 0' }}>
                      Sin conversaciones previas
                    </p>
                  ) : conversations.map(c => (
                    <button
                      key={c.id}
                      onClick={() => switchConversation(c.id)}
                      style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                        gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                        border: '1px solid rgba(66,12,20,0.08)', background: c.id === conversationId ? 'rgba(221,164,111,0.1)' : 'transparent',
                        cursor: 'pointer', transition: 'background 150ms',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(66,12,20,0.04)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.id === conversationId ? 'rgba(221,164,111,0.1)' : 'transparent' }}
                    >
                      <Clock size={13} style={{ color: '#DDA46F', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#420c14', flex: 1 }}>
                        {new Date(c.updated_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {c.id === conversationId && (
                        <span style={{ fontSize: 10, color: '#DDA46F', fontWeight: 600, letterSpacing: '0.06em' }}>ACTUAL</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <EmptyState onSuggest={s => sendMessage(s)} />
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageRow key={msg.id} msg={msg} index={i} onSuggest={s => sendMessage(s)} weddingId={weddingId} />
                  ))}
                  <div ref={messagesEndRef} style={{ height: 1 }} />
                </>
              )}
            </div>

            {/* ── input ── */}
            <div style={{
              padding:     '12px 16px 16px',
              flexShrink:  0,
              borderTop:   messages.length === 0 ? 'none' : '1px solid rgba(212,165,116,0.12)',
            }}>
              <div style={{
                display:      'flex',
                alignItems:   'flex-end',
                gap:          10,
                background:   'rgba(255,255,255,0.7)',
                border:       '1px solid rgba(212,165,116,0.25)',
                borderRadius: 20,
                padding:      '8px 8px 8px 16px',
                boxShadow:    '0 2px 12px rgba(66,12,20,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
                transition:   'border-color 200ms ease, box-shadow 200ms ease',
              }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = 'rgba(212,165,116,0.5)'
                e.currentTarget.style.boxShadow   = '0 2px 16px rgba(212,165,116,0.12), 0 1px 0 rgba(255,255,255,0.9) inset'
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = 'rgba(212,165,116,0.25)'
                e.currentTarget.style.boxShadow   = '0 2px 12px rgba(66,12,20,0.06), 0 1px 0 rgba(255,255,255,0.9) inset'
              }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Pregúntale a Aria…"
                  rows={1}
                  disabled={isStreaming}
                  style={{
                    flex:       1,
                    resize:     'none',
                    border:     'none',
                    outline:    'none',
                    background: 'transparent',
                    fontSize:   14,
                    lineHeight: 1.6,
                    color:      '#2c2c2c',
                    fontFamily: 'var(--font-sans)',
                    minHeight:  26,
                    maxHeight:  120,
                    paddingTop: 3,
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming}
                  style={{
                    flexShrink:     0,
                    width:          36,
                    height:         36,
                    borderRadius:   12,
                    border:         'none',
                    cursor:         input.trim() && !isStreaming ? 'pointer' : 'default',
                    background:     input.trim() && !isStreaming
                      ? 'linear-gradient(135deg, #420c14 0%, #6b1820 100%)'
                      : 'rgba(200,195,190,0.5)',
                    color:          input.trim() && !isStreaming ? '#DDA46F' : '#aaa',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    transition:     'all 200ms cubic-bezier(0.34,1.56,0.64,1)',
                    transform:      input.trim() && !isStreaming ? 'scale(1)' : 'scale(0.92)',
                    boxShadow:      input.trim() && !isStreaming
                      ? '0 2px 8px rgba(66,12,20,0.25)'
                      : 'none',
                  }}
                >
                  {isStreaming
                    ? <StreamingDot />
                    : <ArrowUp size={15} strokeWidth={2.5} />
                  }
                </button>
              </div>

              <p style={{
                margin:      '8px 0 0',
                fontSize:    11,
                color:       '#b8a898',
                textAlign:   'center',
                letterSpacing: '0.01em',
              }}>
                Enter para enviar · Shift+Enter para nueva línea · Esc para cerrar
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

/* ─── sub-components ─────────────────────────────────────────────────────── */

function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
  return (
    <div style={{
      flex:           1,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '32px 24px 24px',
      gap:            28,
      animation:      'omw-ai-fade-in 500ms ease both',
    }}>
      {/* identity mark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width:         64,
          height:        64,
          borderRadius:  20,
          background:    'linear-gradient(135deg, #420c14 0%, #7a1f2a 60%, #DDA46F 130%)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          boxShadow:     '0 8px 32px rgba(66,12,20,0.22), 0 1px 0 rgba(255,255,255,0.15) inset',
        }}>
          <SparkleIcon size={26} color="#DDA46F" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            margin:        0,
            fontSize:      28,
            fontWeight:    400,
            fontFamily:    '"Cormorant Garamond", serif',
            color:         '#2c2c2c',
            letterSpacing: '-0.01em',
            lineHeight:    1.2,
          }}>
            ¿En qué puedo ayudarte?
          </h2>
          <p style={{
            margin:     '6px 0 0',
            fontSize:   13,
            color:      '#9a8a7a',
            lineHeight: 1.5,
          }}>
            Soy Aria, tu asistente de boda con IA
          </p>
        </div>
      </div>

      {/* suggestions */}
      <div style={{
        display:   'flex',
        flexWrap:  'wrap',
        gap:        8,
        justifyContent: 'center',
        maxWidth:   520,
      }}>
        {SUGGESTIONS.map((s, i) => (
          <SuggestionPill key={i} text={s} delay={i * 60} onClick={() => onSuggest(s)} />
        ))}
      </div>
    </div>
  )
}

function SuggestionPill({ text, delay, onClick }: { text: string; delay: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:       '9px 16px',
        borderRadius:  999,
        border:        '1px solid rgba(212,165,116,0.3)',
        background:    'rgba(255,255,255,0.7)',
        color:         '#4a3a2a',
        fontSize:      13,
        fontFamily:    'var(--font-sans)',
        cursor:        'pointer',
        transition:    'all 180ms cubic-bezier(0.34,1.56,0.64,1)',
        animation:     `omw-ai-fade-in 400ms ${delay}ms ease both`,
        lineHeight:    1.4,
        boxShadow:     '0 1px 4px rgba(66,12,20,0.06)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background    = 'rgba(255,255,255,0.95)'
        el.style.borderColor   = 'rgba(212,165,116,0.6)'
        el.style.transform     = 'scale(1.03) translateY(-1px)'
        el.style.boxShadow     = '0 4px 12px rgba(66,12,20,0.1)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background  = 'rgba(255,255,255,0.7)'
        el.style.borderColor = 'rgba(212,165,116,0.3)'
        el.style.transform   = 'scale(1) translateY(0)'
        el.style.boxShadow   = '0 1px 4px rgba(66,12,20,0.06)'
      }}
    >
      {text}
    </button>
  )
}

/* ─── suggested follow-ups ───────────────────────────────────────────────── */

function getSuggestions(content: string): string[] {
  const t = content.toLowerCase()

  if (/presupuest|budget|pago|payment|pagar|paid|cobr/.test(t))
    return ['¿Qué proveedores tienen pagos pendientes?', '¿Cuánto hemos pagado en total?', '¿Hay algún pago urgente?']

  if (/invitad|guest|confirmad|rsvp|asistente|pendiente/.test(t))
    return ['¿Quiénes aún no han confirmado?', '¿Cuántos invitados tienen restricciones alimentarias?', '¿Cuántos invitados asistirán en total?']

  if (/proveedor|vendor|supplier|caterin|fotograf|florist|música|dj/.test(t))
    return ['¿Qué proveedores faltan por pagar?', '¿Tenemos todos los contratos firmados?', '¿Cuál es el total contratado con proveedores?']

  if (/itinerar|horario|timeline|ceremoni|coctel|cena|evento/.test(t))
    return ['¿A qué hora empieza la ceremonia?', '¿Cuánto tiempo dura el cóctel?', '¿Hay algo que revisar en el itinerario?']

  if (/hotel|hospedaj|alojamient|accommodation/.test(t))
    return ['¿Cuántos hoteles tenemos recomendados?', '¿Hay opciones para invitados con presupuesto limitado?', '¿Qué información tienen los invitados sobre hospedaje?']

  // Default — general wedding planning prompts
  return ['¿Cómo vamos con el presupuesto?', '¿Cuántos invitados han confirmado?', '¿Hay proveedores con pagos pendientes?']
}

function SuggestedFollowUps({ content, aiSuggestions, onSuggest }: { content: string; aiSuggestions?: string[]; onSuggest: (s: string) => void }) {
  const [open, setOpen] = useState(false)
  // Prefer AI-generated suggestions; fall back to regex-based while they load
  const suggestions = (aiSuggestions && aiSuggestions.length > 0) ? aiSuggestions : getSuggestions(content)

  return (
    <div style={{ marginTop: 6 }}>
      {/* Toggle row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:            5,
          padding:        '3px 0',
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          color:          '#b8a898',
          fontSize:       11.5,
          letterSpacing:  '0.02em',
          transition:     'color 150ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#DDA46F' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#b8a898' }}
      >
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        Preguntas relacionadas
      </button>

      {/* Collapsible pill list */}
      <div style={{
        overflow:   'hidden',
        maxHeight:  open ? 200 : 0,
        opacity:    open ? 1 : 0,
        transition: 'max-height 300ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease',
      }}>
        <div style={{
          display:        'flex',
          flexWrap:       'wrap',
          gap:             6,
          paddingTop:      8,
          paddingBottom:   2,
          animation:       open ? 'omw-ai-suggestions-in 280ms cubic-bezier(0.22,1,0.36,1) both' : 'none',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggest(s)}
              style={{
                padding:        '6px 13px',
                borderRadius:    999,
                border:          '1px solid rgba(212,165,116,0.28)',
                background:      'rgba(255,255,255,0.6)',
                color:           '#5a4a3a',
                fontSize:        12.5,
                fontFamily:      'var(--font-sans)',
                cursor:          'pointer',
                lineHeight:      1.4,
                transition:      'all 160ms cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow:       '0 1px 3px rgba(66,12,20,0.05)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = 'rgba(255,255,255,0.95)'
                el.style.borderColor  = 'rgba(212,165,116,0.55)'
                el.style.color        = '#420c14'
                el.style.transform    = 'scale(1.03) translateY(-1px)'
                el.style.boxShadow    = '0 3px 10px rgba(66,12,20,0.09)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = 'rgba(255,255,255,0.6)'
                el.style.borderColor  = 'rgba(212,165,116,0.28)'
                el.style.color        = '#5a4a3a'
                el.style.transform    = 'scale(1) translateY(0)'
                el.style.boxShadow    = '0 1px 3px rgba(66,12,20,0.05)'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageRow({ msg, index, onSuggest, weddingId }: { msg: Message; index: number; onSuggest: (s: string) => void; weddingId: string }) {
  const isUser    = msg.role === 'user'
  const isDone    = !isUser && !msg.streaming && msg.content.length > 0 && !msg.isError && !msg.isBudgetExhausted
  const avatarCol = 28 + 8 // avatar width + gap

  const isBudget = msg.isBudgetExhausted

  return (
    <div style={{
      marginBottom: 12,
      animation:    `omw-ai-msg 280ms ${Math.min(index * 30, 120)}ms cubic-bezier(0.22,1,0.36,1) both`,
    }}>
      <div style={{
        display:        'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems:     'flex-end',
        gap:             8,
      }}>
        {/* AI avatar */}
        {!isUser && (
          <div style={{
            width:         28,
            height:        28,
            borderRadius:  9,
            background:    (msg.isError || isBudget)
              ? 'rgba(220,38,38,0.12)'
              : 'linear-gradient(135deg, #420c14 0%, #7a1f2a 60%, #DDA46F 130%)',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            flexShrink:    0,
            boxShadow:     '0 1px 6px rgba(66,12,20,0.2)',
          }}>
            {(msg.isError || isBudget)
              ? <span style={{ fontSize: 13 }}>⚠</span>
              : <SparkleIcon size={13} color="#DDA46F" />
            }
          </div>
        )}

        <div style={{
          maxWidth:     '80%',
          padding:      '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          fontSize:     14,
          lineHeight:   1.65,
          fontFamily:   'var(--font-sans)',
          ...(isUser ? {
            background: 'linear-gradient(135deg, #420c14 0%, #5c1520 100%)',
            color:      '#faf3ec',
            boxShadow:  '0 2px 10px rgba(66,12,20,0.22)',
          } : (msg.isError || isBudget) ? {
            background: 'rgba(254,242,242,0.9)',
            color:      '#991b1b',
            border:     '1px solid rgba(220,38,38,0.2)',
            boxShadow:  '0 1px 6px rgba(220,38,38,0.06)',
          } : {
            background: 'rgba(255,255,255,0.85)',
            color:      '#2c2c2c',
            border:     '1px solid rgba(212,165,116,0.18)',
            boxShadow:  '0 1px 6px rgba(66,12,20,0.05)',
            backdropFilter: 'blur(8px)',
          }),
        }}>
          {isBudget ? (
            <BudgetExhaustedMessage weddingId={weddingId} />
          ) : msg.isError ? (
            <span>
              Ocurrió un error al procesar tu solicitud.{' '}
              <span style={{ opacity: 0.75 }}>Por favor, intenta nuevamente en unos momentos.</span>
            </span>
          ) : (
            <MessageText content={msg.content} streaming={msg.streaming} currentTool={msg.currentTool} />
          )}
        </div>
      </div>

      {/* Token/model footer — only on completed AI messages with usage data */}
      {isDone && msg.usage && (
        <div style={{ paddingLeft: avatarCol, marginTop: 3 }}>
          <UsageFooter usage={msg.usage} />
        </div>
      )}

      {/* Suggested follow-up questions — only on completed AI messages */}
      {isDone && (
        <div style={{ paddingLeft: avatarCol }}>
          <SuggestedFollowUps content={msg.content} aiSuggestions={msg.suggestions} onSuggest={onSuggest} />
        </div>
      )}
    </div>
  )
}

function UsageFooter({ usage }: { usage: MessageUsage }) {
  const total = usage.input + usage.output
  const shortModel = usage.model
    .replace('claude-', '')
    .replace('gpt-', '')
    .replace('-20251001', '')
  return (
    <p style={{
      margin:        0,
      fontSize:      10,
      color:         '#c4b4a4',
      fontFamily:    'ui-monospace, monospace',
      letterSpacing: '0.02em',
      lineHeight:    1.4,
    }}>
      {shortModel} · {total.toLocaleString()} tokens ({usage.input.toLocaleString()} in / {usage.output.toLocaleString()} out)
    </p>
  )
}

function BudgetExhaustedMessage({ weddingId }: { weddingId: string }) {
  const [loading, setLoading] = useState(false)

  const handleBuyMore = async (packageId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, weddingId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 8px', fontWeight: 500 }}>
        Tu presupuesto de Aria se ha agotado.
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.8 }}>
        Recarga créditos para continuar usando el asistente.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[
          { id: 'ai_500',  label: '$5 USD' },
          { id: 'ai_1000', label: '$10 USD' },
          { id: 'ai_2500', label: '$25 USD' },
        ].map(pkg => (
          <button
            key={pkg.id}
            disabled={loading}
            onClick={() => handleBuyMore(pkg.id)}
            style={{
              padding:      '6px 14px',
              borderRadius:  8,
              border:        '1.5px solid rgba(220,38,38,0.35)',
              background:    'rgba(254,242,242,0.6)',
              color:         '#991b1b',
              fontSize:      12,
              fontFamily:    'var(--font-sans)',
              fontWeight:    600,
              cursor:        loading ? 'default' : 'pointer',
              opacity:       loading ? 0.6 : 1,
              transition:    'all 160ms ease',
            }}
          >
            {pkg.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ThinkingIndicator({ currentTool }: { currentTool?: string }) {
  const label = currentTool
    ? (TOOL_STATUS[currentTool] ?? `Ejecutando ${currentTool}…`)
    : 'Pensando…'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 20 }}>
      <span style={{
        display:        'inline-block',
        width:          13,
        height:         13,
        borderRadius:   '50%',
        border:         '1.5px solid rgba(212,165,116,0.22)',
        borderTopColor: '#DDA46F',
        animation:      'omw-ai-spin-slow 800ms linear infinite',
        flexShrink:     0,
      }} />
      <span
        key={currentTool ?? 'thinking'}
        style={{
          color:      '#b8a898',
          fontSize:   13,
          fontFamily: 'var(--font-sans)',
          animation:  'omw-ai-status-in 320ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {label}
      </span>
    </span>
  )
}

/* ── Markdown renderer (used on completed messages only) ─────────────────── */

function inlineFormat(raw: string): string {
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(66,12,20,0.07);padding:1px 5px;border-radius:4px;font-size:0.88em;font-family:ui-monospace,monospace">$1</code>')
}

function MarkdownContent({ content }: { content: string }) {
  const blocks: React.ReactNode[] = []
  const lines = content.split('\n')
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  const flushList = () => {
    if (!listItems.length) return
    const isOl = listType === 'ol'
    const Tag = isOl ? 'ol' : 'ul'
    blocks.push(
      <Tag key={key++} style={{
        margin:        '4px 0 4px 4px',
        paddingLeft:    20,
        lineHeight:     1.7,
        listStyleType:  isOl ? 'decimal' : 'disc',
        listStylePosition: 'outside',
      }}>
        {listItems.map((item, i) => (
          <li key={i} style={{ paddingLeft: 2 }} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))}
      </Tag>
    )
    listItems = []
    listType = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const ulM = line.match(/^[ \t]*[-*]\s+(.+)/)
    const olM = line.match(/^[ \t]*\d+\.\s+(.+)/)

    if (ulM) {
      if (listType === 'ol') flushList()
      listType = 'ul'
      listItems.push(ulM[1])
    } else if (olM) {
      if (listType === 'ul') flushList()
      listType = 'ol'
      listItems.push(olM[1])
    } else {
      flushList()
      if (line.trim() === '') {
        // Only emit a gap if there's a following non-empty line
        if (i < lines.length - 1 && lines.slice(i + 1).some(l => l.trim())) {
          blocks.push(<div key={key++} style={{ height: 6 }} />)
        }
      } else {
        blocks.push(
          <span key={key++} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
        )
        // Line break between adjacent text lines (not before a list or blank)
        const next = lines[i + 1]
        if (next !== undefined && next.trim() && !next.match(/^[ \t]*[-*\d]/)) {
          blocks.push(<br key={key++} />)
        }
      }
    }
  }
  flushList()

  return <>{blocks}</>
}

/* ── MessageText ─────────────────────────────────────────────────────────── */

function MessageText({ content, streaming, currentTool }: { content: string; streaming?: boolean; currentTool?: string }) {
  const prevWordCountRef = useRef(0)
  const prevWordCount = prevWordCountRef.current

  useEffect(() => {
    const total = content.split(/\s+/).filter(Boolean).length
    prevWordCountRef.current = streaming ? total : 0
  })

  // Thinking — no content yet
  if (!content && streaming) {
    return <ThinkingIndicator currentTool={currentTool} />
  }

  // Completed message — render proper markdown
  if (!streaming) {
    return <MarkdownContent content={content} />
  }

  // Still streaming — word-level materialization (raw text, markdown not yet complete)
  let wordIdx = 0
  return (
    <>
      {content.split('\n').map((line, lineIdx) => (
        <Fragment key={lineIdx}>
          {lineIdx > 0 && <br />}
          {line.split(/(\s+)/).map((token, tokenIdx) => {
            if (!token.trim()) return <span key={`sp-${tokenIdx}`}>{token}</span>
            const thisIdx = wordIdx++
            const isNew = thisIdx >= prevWordCount
            const delay = isNew ? Math.min((thisIdx - prevWordCount) * 28, 200) : 0
            return (
              <span
                key={`w-${tokenIdx}`}
                style={isNew ? {
                  display: 'inline',
                  animation: `omw-ai-word-in 260ms ${delay}ms cubic-bezier(0.22,1,0.36,1) both`,
                  willChange: 'opacity, transform, filter',
                } : undefined}
              >
                {token}
              </span>
            )
          })}
        </Fragment>
      ))}
    </>
  )
}

function IconButton({ onClick, title, children }: {
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width:          32,
        height:         32,
        borderRadius:   10,
        border:         'none',
        background:     'transparent',
        color:          '#9a8a7a',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         'pointer',
        transition:     'all 150ms ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(66,12,20,0.07)'
        el.style.color      = '#420c14'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.color      = '#9a8a7a'
      }}
    >
      {children}
    </button>
  )
}

function SparkleIcon({ size = 18, color = '#DDA46F' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z"
        fill={color}
      />
      <path
        d="M19 2 L19.8 5.2 L23 6 L19.8 6.8 L19 10 L18.2 6.8 L15 6 L18.2 5.2 Z"
        fill={color}
        opacity={0.6}
      />
    </svg>
  )
}

function StreamingDot() {
  return (
    <span style={{
      width:        8,
      height:       8,
      borderRadius: '50%',
      background:   '#DDA46F',
      animation:    'omw-ai-dot 1s 0ms ease-in-out infinite',
      display:      'block',
    }} />
  )
}
