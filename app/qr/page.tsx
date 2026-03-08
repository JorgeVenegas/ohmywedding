"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { QRCodeCanvas } from "qrcode.react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Download, ExternalLink, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const SITE_URL = "https://ohmy.wedding"

// ─── Corner bracket decorations ─────────────────────────────────────────────
function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const rotate = { tl: 0, tr: 90, br: 180, bl: 270 }[position]
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className="absolute"
      style={{
        top: position.startsWith("t") ? -2 : "auto",
        bottom: position.startsWith("b") ? -2 : "auto",
        left: position.endsWith("l") ? -2 : "auto",
        right: position.endsWith("r") ? -2 : "auto",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <path d="M2 14 L2 2 L14 2" stroke="#DDA46F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Floating ambient particle ───────────────────────────────────────────────
function AmbientParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-[#DDA46F] pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, opacity: 0 }}
      animate={{ opacity: [0, 0.35, 0], y: [-10, -40, -70], scale: [0.8, 1, 0.4] }}
      transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: "easeOut" }}
    />
  )
}

const PARTICLES = [
  { delay: 0, x: "15%", y: "70%", size: 4 },
  { delay: 0.8, x: "25%", y: "60%", size: 3 },
  { delay: 1.5, x: "75%", y: "65%", size: 5 },
  { delay: 0.4, x: "85%", y: "72%", size: 3 },
  { delay: 2.2, x: "10%", y: "40%", size: 4 },
  { delay: 1.0, x: "90%", y: "45%", size: 3 },
  { delay: 3.0, x: "50%", y: "80%", size: 4 },
  { delay: 1.8, x: "40%", y: "20%", size: 3 },
  { delay: 0.6, x: "60%", y: "15%", size: 5 },
]

// ─── Main page ───────────────────────────────────────────────────────────────
export default function QRPage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [qrVisible, setQrVisible] = useState(false)
  const [qrSize, setQrSize] = useState(320)

  useEffect(() => {
    const compute = () => {
      // Fill most of the screen: min of 88vw and 58vh, clamped between 280–700px
      const size = Math.min(
        Math.round(window.innerWidth * 0.88),
        Math.round(window.innerHeight * 0.58),
        700
      )
      setQrSize(Math.max(size, 280))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setQrVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas")
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "ohmywedding-qr.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#420c14]">
      {/* Background radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#DDA46F]/6 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#DDA46F]/4 blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#DDA46F]/4 blur-[80px]" />
      </div>

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <AmbientParticle key={i} {...p} />
      ))}

      {/* Back link */}
      <motion.div
        className="absolute top-6 left-6 z-10"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-[#DDA46F]/60 hover:text-[#DDA46F] transition-colors duration-200 text-sm tracking-[0.1em]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ohmy.wedding</span>
        </Link>
      </motion.div>

      {/* Content */}
      <div ref={wrapperRef} className="relative z-10 flex flex-col items-center px-4 py-8 w-full text-center">

        {/* Logo + tag compact row */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-5"
        >
          <Image
            src="/images/logos/OMW Logo Gold.png"
            alt="OhMyWedding"
            width={36}
            height={36}
            className="w-9 h-auto"
            priority
          />
          <span className="font-serif text-xl font-light text-[#f5f2eb] tracking-[0.18em]">OhMyWedding</span>
          <div className="w-px h-5 bg-[#DDA46F]/30" />
          <span className="text-[#DDA46F]/70 text-[10px] tracking-[0.3em] uppercase">Escanea para visitar</span>
        </motion.div>

        {/* QR Code card */}
        <AnimatePresence>
          {qrVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-5"
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute -inset-6 rounded-3xl bg-[#DDA46F]/8 blur-xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Card */}
              <div
                className="relative p-5 rounded-2xl border border-[#DDA46F]/20 bg-[#f5f2eb]"
                style={{ boxShadow: "0 0 80px rgba(221,164,111,0.18), 0 20px 80px rgba(0,0,0,0.6)" }}
              >
                {/* Corner brackets */}
                <div className="relative">
                  <CornerBracket position="tl" />
                  <CornerBracket position="tr" />
                  <CornerBracket position="bl" />
                  <CornerBracket position="br" />

                  {/* QR code */}
                  <div ref={canvasRef}>
                    <QRCodeCanvas
                      value={SITE_URL}
                      size={qrSize - 48}
                      fgColor="#420c14"
                      bgColor="transparent"
                      level="H"
                      imageSettings={{
                        src: "/images/logos/OMW Logo Gold.png",
                        width: Math.round((qrSize - 48) * 0.18),
                        height: Math.round((qrSize - 48) * 0.18),
                        excavate: true,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* URL display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5f2eb]/5 border border-[#DDA46F]/15 mb-5"
        >
          <span className="text-[#DDA46F]/80 text-sm tracking-[0.05em] font-light">{SITE_URL}</span>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#DDA46F]/40 hover:text-[#DDA46F] transition-colors duration-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="flex gap-3 w-full max-w-sm mx-auto"
        >
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 h-12 border-[#DDA46F]/25 bg-[#DDA46F]/5 text-[#DDA46F] hover:bg-[#DDA46F]/15 hover:border-[#DDA46F]/50 transition-all duration-300 tracking-[0.08em] text-sm"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="w-4 h-4" />
                  Copiado
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Copy className="w-4 h-4" />
                  Copiar URL
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          <Button
            onClick={handleDownload}
            className="flex-1 h-12 bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-300 tracking-[0.08em] text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar QR
          </Button>
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="mt-10 text-[#f5f2eb]/20 text-[10px] tracking-[0.3em] uppercase"
        >
          Tu boda, perfectamente digital
        </motion.p>
      </div>
    </div>
  )
}
