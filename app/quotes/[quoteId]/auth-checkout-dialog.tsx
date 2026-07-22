"use client"

import { useState, useEffect } from "react"
import { Loader2, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { WeddingDatePicker } from "@/components/ui/wedding-date-picker"

type Mode = 'choice' | 'signup' | 'login' | 'create-wedding' | 'pick-wedding'

type WeddingOption = {
  id: string
  wedding_name_id: string
  partner1_first_name: string
  partner2_first_name: string
}

const T = {
  en: {
    choiceTitle: "Ready to continue?",
    choiceBody: "Sign in to apply this plan to your wedding, or create a new account.",
    haveAccount: "Sign in to my account",
    noAccount: "Create new account",
    signUpTitle: "Create your account",
    loginTitle: "Sign in",
    emailLabel: "Email",
    passwordLabel: "Password",
    partner1Label: "Partner 1",
    partner2Label: "Partner 2",
    dateLabel: "Wedding date",
    optional: "optional",
    signUpCta: "Create account and continue",
    loginCta: "Sign in and continue",
    switchToLogin: "Already have an account?",
    switchToLoginCta: "Sign in",
    switchToSignUp: "No account yet?",
    switchToSignUpCta: "Create one",
    emailConfirm: "Check your email to confirm your account, then come back here to complete your purchase.",
    createWeddingTitle: "Almost there",
    createWeddingBody: "Add your wedding details to apply this package.",
    createWeddingCta: "Create wedding and continue",
    fillRequired: "Please fill in all required fields.",
    cancel: "Cancel",
    selectWeddingTitle: "Apply to which wedding?",
    selectWeddingBody: "Choose the wedding for this package.",
    continueBtn: "Continue to checkout",
  },
  es: {
    choiceTitle: "¿Listo para continuar?",
    choiceBody: "Inicia sesión para aplicar este plan a tu boda, o crea una cuenta nueva.",
    haveAccount: "Iniciar sesión",
    noAccount: "Crear cuenta nueva",
    signUpTitle: "Crea tu cuenta",
    loginTitle: "Iniciar sesión",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    partner1Label: "Integrante 1",
    partner2Label: "Integrante 2",
    dateLabel: "Fecha de boda",
    optional: "opcional",
    signUpCta: "Crear cuenta y continuar",
    loginCta: "Iniciar sesión y continuar",
    switchToLogin: "¿Ya tienes cuenta?",
    switchToLoginCta: "Inicia sesión",
    switchToSignUp: "¿Sin cuenta?",
    switchToSignUpCta: "Crear una",
    emailConfirm: "Revisa tu correo para confirmar tu cuenta, luego regresa aquí para completar tu compra.",
    createWeddingTitle: "Un paso más",
    createWeddingBody: "Agrega los datos de tu boda para aplicar este paquete.",
    createWeddingCta: "Crear boda y continuar",
    fillRequired: "Por favor completa los campos requeridos.",
    cancel: "Cancelar",
    selectWeddingTitle: "¿A cuál boda aplicar?",
    selectWeddingBody: "Elige la boda para este paquete.",
    continueBtn: "Continuar al pago",
  },
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] font-medium text-[#420c14]/60 uppercase tracking-wider">{label}</span>
      {hint && <span className="text-[10px] text-[#420c14]/35 italic">{hint}</span>}
    </div>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl border border-[#420c14]/15 bg-white text-sm text-[#420c14] placeholder-[#420c14]/30 focus:outline-none focus:ring-2 focus:ring-[#420c14]/15 focus:border-[#420c14]/30 transition-all"
    />
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
      {msg}
    </div>
  )
}

function PrimaryBtn({ loading, onClick, children }: { loading?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full py-3.5 rounded-2xl bg-[#420c14] text-[#f5f2eb] text-sm font-medium hover:bg-[#5a1a22] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

function OutlineBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3.5 rounded-2xl border border-[#420c14]/15 text-[#420c14] text-sm font-medium hover:bg-[#420c14]/5 hover:border-[#420c14]/25 transition-colors"
    >
      {children}
    </button>
  )
}

function ScreenHeader({ lang, title, onBack }: { lang: "en" | "es"; title: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {onBack && (
        <button type="button" onClick={onBack} className="text-[#420c14]/40 hover:text-[#420c14] transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <div>
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#DDA46F] mb-0.5">OhMyWedding</p>
        <h2 className="font-serif text-xl text-[#420c14] leading-tight">{title}</h2>
      </div>
    </div>
  )
}

interface Props {
  lang: "en" | "es"
  initialMode?: 'choice' | 'create-wedding'
  onClose: () => void
  onReady: (weddingId: string) => void
}

export function AuthCheckoutDialog({ lang, initialMode = 'choice', onClose, onReady }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [partner1, setPartner1] = useState("")
  const [partner2, setPartner2] = useState("")
  const [weddingDate, setWeddingDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weddings, setWeddings] = useState<WeddingOption[]>([])
  const [selectedWeddingId, setSelectedWeddingId] = useState<string | null>(null)

  const t = T[lang]

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const goTo = (m: Mode) => { setError(null); setMode(m) }

  const handleSignUp = async () => {
    if (!email || !password || !partner1 || !partner2) { setError(t.fillRequired); return }
    setLoading(true); setError(null)
    try {
      // Create user server-side (email_confirm: true) — no verification email
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const signupData = await signupRes.json()
      if (!signupRes.ok) { setError(signupData.error || "Failed to create account"); return }

      // Sign in immediately — user is already confirmed
      const supabase = createClient()
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) { setError(authErr.message); return }

      const wRes = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner1FirstName: partner1, partner2FirstName: partner2, weddingDate: weddingDate || undefined, locale: lang }),
      })
      const wData = await wRes.json()
      if (!wRes.ok) { setError(wData.error || "Failed to create wedding"); return }

      onClose()
      onReady(wData.weddingId)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) { setError(t.fillRequired); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) { setError(authErr.message); return }

      const res = await fetch("/api/weddings")
      const data = await res.json()
      const list: WeddingOption[] = data.weddings || []

      if (list.length === 0) { setMode("create-wedding"); return }
      if (list.length === 1) { onClose(); onReady(list[0].id); return }

      setWeddings(list)
      setSelectedWeddingId(list[0].id)
      setMode("pick-wedding")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWedding = async () => {
    if (!partner1 || !partner2) { setError(t.fillRequired); return }
    setLoading(true); setError(null)
    try {
      const wRes = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner1FirstName: partner1, partner2FirstName: partner2, weddingDate: weddingDate || undefined, locale: lang }),
      })
      const wData = await wRes.json()
      if (!wRes.ok) { setError(wData.error || "Failed to create wedding"); return }
      onClose()
      onReady(wData.weddingId)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#420c14]/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#f5f2eb] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#DDA46F] via-[#c99560] to-[#DDA46F]" />

        <div className="p-8">

          {/* ── Choice ── */}
          {mode === "choice" && (
            <div className="space-y-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#DDA46F] mb-1">OhMyWedding</p>
                <h2 className="font-serif text-2xl text-[#420c14] leading-snug">{t.choiceTitle}</h2>
                <p className="text-sm text-[#420c14]/50 mt-1.5">{t.choiceBody}</p>
              </div>

              <div className="space-y-2.5">
                <PrimaryBtn onClick={() => goTo("login")}>{t.haveAccount}</PrimaryBtn>
                <OutlineBtn onClick={() => goTo("signup")}>{t.noAccount}</OutlineBtn>
              </div>

              <button type="button" onClick={onClose} className="w-full text-center text-xs text-[#420c14]/35 hover:text-[#420c14]/60 transition-colors pt-1">
                {t.cancel}
              </button>
            </div>
          )}

          {/* ── Sign up ── */}
          {mode === "signup" && (
            <div className="space-y-4">
              <ScreenHeader lang={lang} title={t.signUpTitle} onBack={() => goTo("choice")} />

              {error && <ErrorBanner msg={error} />}

              <div className="space-y-3">
                <div>
                  <FieldLabel label={t.emailLabel} />
                  <TextInput type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div>
                  <FieldLabel label={t.passwordLabel} />
                  <TextInput type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <FieldLabel label={t.partner1Label} />
                    <TextInput type="text" placeholder="Ana" value={partner1} onChange={e => setPartner1(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label={t.partner2Label} />
                    <TextInput type="text" placeholder="Carlos" value={partner2} onChange={e => setPartner2(e.target.value)} />
                  </div>
                </div>
                <div>
                  <FieldLabel label={t.dateLabel} hint={t.optional} />
                  <WeddingDatePicker value={weddingDate} onChange={setWeddingDate} locale={lang} />
                </div>
              </div>

              <PrimaryBtn loading={loading} onClick={handleSignUp}>{t.signUpCta}</PrimaryBtn>

              <p className="text-center text-xs text-[#420c14]/40 pt-1">
                {t.switchToLogin}{" "}
                <button type="button" onClick={() => goTo("login")} className="text-[#DDA46F] hover:text-[#c99560] font-medium transition-colors">
                  {t.switchToLoginCta}
                </button>
              </p>
            </div>
          )}

          {/* ── Login ── */}
          {mode === "login" && (
            <div className="space-y-4">
              <ScreenHeader lang={lang} title={t.loginTitle} onBack={() => goTo("choice")} />

              {error && <ErrorBanner msg={error} />}

              <div className="space-y-3">
                <div>
                  <FieldLabel label={t.emailLabel} />
                  <TextInput
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <FieldLabel label={t.passwordLabel} />
                  <TextInput
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <PrimaryBtn loading={loading} onClick={handleLogin}>{t.loginCta}</PrimaryBtn>

              <p className="text-center text-xs text-[#420c14]/40 pt-1">
                {t.switchToSignUp}{" "}
                <button type="button" onClick={() => goTo("signup")} className="text-[#DDA46F] hover:text-[#c99560] font-medium transition-colors">
                  {t.switchToSignUpCta}
                </button>
              </p>
            </div>
          )}

          {/* ── Create wedding (after login with no weddings) ── */}
          {mode === "create-wedding" && (
            <div className="space-y-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#DDA46F] mb-1">OhMyWedding</p>
                <h2 className="font-serif text-xl text-[#420c14]">{t.createWeddingTitle}</h2>
                <p className="text-sm text-[#420c14]/50 mt-1">{t.createWeddingBody}</p>
              </div>

              {error && <ErrorBanner msg={error} />}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <FieldLabel label={t.partner1Label} />
                    <TextInput type="text" placeholder="Ana" value={partner1} onChange={e => setPartner1(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label={t.partner2Label} />
                    <TextInput type="text" placeholder="Carlos" value={partner2} onChange={e => setPartner2(e.target.value)} />
                  </div>
                </div>
                <div>
                  <FieldLabel label={t.dateLabel} hint={t.optional} />
                  <WeddingDatePicker value={weddingDate} onChange={setWeddingDate} locale={lang} />
                </div>
              </div>

              <PrimaryBtn loading={loading} onClick={handleCreateWedding}>{t.createWeddingCta}</PrimaryBtn>
            </div>
          )}

          {/* ── Pick wedding (after login with 2+ weddings) ── */}
          {mode === "pick-wedding" && (
            <div className="space-y-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#DDA46F] mb-1">OhMyWedding</p>
                <h2 className="font-serif text-xl text-[#420c14]">{t.selectWeddingTitle}</h2>
                <p className="text-sm text-[#420c14]/50 mt-1">{t.selectWeddingBody}</p>
              </div>

              <div className="space-y-2">
                {weddings.map(w => {
                  const selected = selectedWeddingId === w.id
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWeddingId(w.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                        selected ? "border-[#420c14] bg-[#420c14]/5" : "border-[#420c14]/15 hover:border-[#420c14]/30"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? "border-[#420c14]" : "border-[#420c14]/30"}`}>
                        {selected && <span className="w-2 h-2 rounded-full bg-[#420c14]" />}
                      </span>
                      <span className="font-medium text-[#420c14] text-sm">
                        {w.partner1_first_name} &amp; {w.partner2_first_name}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-[#420c14]/15 text-sm text-[#420c14]/60 hover:text-[#420c14] transition-colors">
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => { if (selectedWeddingId) { onClose(); onReady(selectedWeddingId) } }}
                  disabled={!selectedWeddingId}
                  className="flex-1 py-3 rounded-2xl bg-[#420c14] text-[#f5f2eb] text-sm font-medium hover:bg-[#5a1a22] transition-colors disabled:opacity-50"
                >
                  {t.continueBtn}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
