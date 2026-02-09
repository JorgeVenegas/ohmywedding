"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  Calendar, 
  Users, 
  Gift, 
  ImageIcon, 
  MapPin, 
  MessageSquare, 
  Star, 
  ArrowRight, 
  ArrowDown,
  User, 
  ChevronDown, 
  Edit3,
  Check,
  Sparkles,
  Crown,
  Bell,
  Globe,
  Palette,
  Send,
  FileText,
  Music,
  Camera,
  Clock,
  Mail,
  Eye,
  CheckCircle2,
  Play,
  X,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getWeddingUrl, type WeddingPlan } from "@/lib/wedding-url"
import { PLAN_CARDS, COMPARISON_FEATURES } from "@/lib/subscription-shared"
import { Suspense } from "react"
import { motion, useScroll, useTransform, useInView, AnimatePresence, useSpring } from "framer-motion"

// ============================================
// COLOR PALETTE
// ============================================
// Primary: #420c14 - Deep Burgundy/Wine
// Secondary: #172815 - Dark Forest Green
// Tertiary: #424b1e - Olive Green
// Accent: #732c2c - Wine Red
// Gold: #DDA46F - Gold accent (main brand gold)
// Light: #f5f2eb - Cream/Ivory

// ============================================
// SMOOTH SCROLL HOOK
// ============================================

function useSmoothScroll() {
  useEffect(() => {
    // Add smooth scroll CSS for luxury feel
    const style = document.createElement('style')
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      
      @supports (scroll-behavior: smooth) {
        html {
          scroll-behavior: smooth;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
}

// ============================================
// AUTH & UTILITY COMPONENTS
// ============================================

function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  useEffect(() => {
    if (code) {
      const callbackUrl = `/auth/callback?code=${code}&redirect=/`
      window.location.href = callbackUrl
    }
  }, [code, router])
  
  return null
}

type UserWedding = {
  id: string
  wedding_name_id: string
  partner1_first_name: string
  partner2_first_name: string
  wedding_date: string | null
  plan?: WeddingPlan
}

function AuthButtons({ isMobile = false }: { isMobile?: boolean }) {
  const { user, loading, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userWeddings, setUserWeddings] = useState<UserWedding[]>([])
  const [weddingsLoading, setWeddingsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      setWeddingsLoading(true)
      fetch('/api/weddings')
        .then(res => res.json())
        .then(data => {
          setUserWeddings(data.weddings || [])
        })
        .finally(() => setWeddingsLoading(false))
    } else {
      setUserWeddings([])
    }
  }, [user])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="h-10 w-20 bg-[#420c14]/20 animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-[#420c14]/20 animate-pulse rounded-md" />
      </div>
    )
  }

  if (user) {
    const hasWedding = userWeddings.length > 0
    const firstWedding = userWeddings[0]

    // Mobile: show everything inline, no dropdown
    if (isMobile) {
      return (
        <div className="flex flex-col gap-4 w-full">
          {/* User info */}
          <div className="pb-4 border-b border-[#DDA46F]/20">
            <p className="text-xs text-[#f5f2eb]/50 mb-1">Signed in as</p>
            <p className="text-sm font-medium text-[#f5f2eb]/90 truncate">{user.email}</p>
          </div>
          
          {/* Weddings list - scrollable with all weddings accessible */}
          {userWeddings.length > 0 && (
            <div className="pb-4 border-b border-[#DDA46F]/20">
              <p className="text-xs text-[#f5f2eb]/50 font-semibold mb-2">Your Weddings ({userWeddings.length})</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {userWeddings.map(wedding => (
                  <a
                    key={wedding.id}
                    href={getWeddingUrl(wedding.wedding_name_id, '', wedding.plan || 'free')}
                    className="block px-3 py-2 text-sm text-[#f5f2eb]/80 hover:text-[#f5f2eb] bg-[#f5f2eb]/5 hover:bg-[#f5f2eb]/10 rounded-md transition-colors duration-150"
                  >
                    <div className="font-medium truncate">{wedding.partner1_first_name} & {wedding.partner2_first_name}</div>
                    {wedding.wedding_date && <div className="text-xs text-[#f5f2eb]/50 mt-0.5">{new Date(wedding.wedding_date).toLocaleDateString()}</div>}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {weddingsLoading ? (
              <div className="h-12 w-full bg-[#420c14]/20 animate-pulse rounded-md" />
            ) : hasWedding ? (
              <a href={getWeddingUrl(firstWedding.wedding_name_id, '', firstWedding.plan || 'free')} className="w-full">
                <Button className="w-full bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Wedding
                </Button>
              </a>
            ) : (
              <Link href="/create-wedding" className="w-full">
                <Button className="w-full bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
                  Create Wedding
                </Button>
              </Link>
            )}
            
            <button
              onClick={() => signOut()}
              className="w-full text-left px-4 py-3 text-sm text-[#DDA46F] hover:bg-[#DDA46F]/10 rounded-md transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      )
    }

    // Desktop: show dropdown
    return (
      <div className="flex gap-3 items-center">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[#f5f2eb]/90 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-colors duration-200"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline max-w-[150px] truncate">{user.email}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full right-0 mt-2 bg-[#420c14]/98 backdrop-blur-xl rounded-lg shadow-2xl border border-[#DDA46F]/20 py-2 z-50 min-w-[280px] max-h-[60vh] overflow-y-auto"
            >
              <div className="px-4 py-3 border-b border-[#DDA46F]/10">
                <p className="text-xs text-[#f5f2eb]/50 mb-1">Signed in as</p>
                <p className="text-sm font-medium text-[#f5f2eb]/90 truncate" title={user.email}>{user.email}</p>
              </div>
              {userWeddings.length > 0 && (
                <div className="border-b border-[#DDA46F]/10 max-h-[280px] overflow-y-auto">
                  <p className="px-4 py-2 text-xs text-[#f5f2eb]/50 font-semibold sticky top-0 bg-[#420c14]/98">Your Weddings</p>
                  {userWeddings.map(wedding => (
                    <a
                      key={wedding.id}
                      href={getWeddingUrl(wedding.wedding_name_id, '', wedding.plan || 'free')}
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm text-[#f5f2eb]/80 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-colors duration-150 border-l-2 border-transparent hover:border-[#DDA46F]"
                    >
                      <div className="font-medium">{wedding.partner1_first_name} & {wedding.partner2_first_name}</div>
                      {wedding.wedding_date && <div className="text-xs text-[#f5f2eb]/50 mt-0.5">{new Date(wedding.wedding_date).toLocaleDateString()}</div>}
                    </a>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  signOut()
                }}
                className="w-full text-left px-4 py-3 text-sm text-[#DDA46F] hover:bg-[#DDA46F]/10 transition-colors duration-200 border-t border-[#DDA46F]/10"
              >
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
        {weddingsLoading ? (
          <div className="h-10 w-32 bg-[#420c14]/20 animate-pulse rounded-md" />
        ) : hasWedding ? (
          <a href={getWeddingUrl(firstWedding.wedding_name_id, '', firstWedding.plan || 'free')}>
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Wedding
            </Button>
          </a>
        ) : (
          <Link href="/create-wedding">
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
              Create Wedding
            </Button>
          </Link>
        )}
      </div>
    )
  }

  // Not logged in
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Link href="/login" className="w-full">
          <Button variant="ghost" className="w-full text-[#f5f2eb]/80 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-all duration-200">
            Sign In
          </Button>
        </Link>
        <Link href="/create-wedding" className="w-full">
          <Button className="w-full bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
            Get Started
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <Link href="/login">
        <Button variant="ghost" className="text-[#f5f2eb]/80 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/10 transition-all duration-200">
          Sign In
        </Button>
      </Link>
      <Link href="/create-wedding">
        <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-medium transition-all duration-200">
          Get Started
        </Button>
      </Link>
    </div>
  )
}

// ============================================
// CUSTOM CURSOR
// ============================================

function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  const springConfig = { damping: 25, stiffness: 200 }
  const cursorX = useSpring(0, springConfig)
  const cursorY = useSpring(0, springConfig)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return

    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      setPosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, [role="button"]')) {
        setIsHovering(true)
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, [role="button"]')) {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', updatePosition)
    document.addEventListener('mouseover', handleMouseEnter)
    document.addEventListener('mouseout', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', updatePosition)
      document.removeEventListener('mouseover', handleMouseEnter)
      document.removeEventListener('mouseout', handleMouseLeave)
    }
  }, [cursorX, cursorY])

  if (!isVisible) return null

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-[#DDA46F] rounded-full pointer-events-none z-[9999] mix-blend-difference hidden lg:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 0.5 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 border-2 border-[#DDA46F]/50 rounded-full pointer-events-none z-[9999] hidden lg:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.8 : 1,
          borderColor: isHovering ? 'rgba(221, 164, 111, 0.8)' : 'rgba(221, 164, 111, 0.5)',
        }}
        transition={{ duration: 0.4 }}
      />
    </>
  )
}

// ============================================
// LUXURY HEADER
// ============================================

function LuxuryHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let lastScrollTime = 0
    const handleScroll = () => {
      const now = Date.now()
      // Debounce: only update state every 100ms
      if (now - lastScrollTime > 100) {
        setIsScrolled(window.scrollY > 50)
        lastScrollTime = now
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when escape is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${window.scrollY}px`
    } else {
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
  }, [isMobileMenuOpen])

  return (
    <>
    <motion.header
      className={`fixed top-0 left-0 right-0 z-[105] transition-all duration-1000 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-[#420c14] backdrop-blur-xl border-b border-[#DDA46F]/10' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/images/logos/OMW Logo Gold.png"
              alt="OhMyWedding"
              width={44}
              height={44}
              className="h-11 w-auto transition-transform duration-700 group-hover:scale-110"
              priority
            />
            <span className="font-serif text-xl text-[#f5f2eb] tracking-[0.15em] hidden sm:block">
              OhMyWedding
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Experience', href: '#experience' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Templates', href: '#demos' },
            ].map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="text-[#f5f2eb]/70 hover:text-[#DDA46F] transition-colors duration-500 text-sm tracking-[0.25em] uppercase"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <AuthButtons />
          </div>

          <button
            className="lg:hidden text-[#f5f2eb] p-2 z-[110] relative"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <motion.span 
                className="w-full h-0.5 bg-[#f5f2eb] origin-center"
                animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 9 : 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span 
                className="w-full h-0.5 bg-[#f5f2eb]"
                animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span 
                className="w-full h-0.5 bg-[#f5f2eb] origin-center"
                animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -9 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </button>
        </div>
      </div>
    </motion.header>
    
    {/* Mobile Menu - Rendered outside header for proper full-screen coverage */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 lg:hidden"
          style={{ zIndex: 9999 }}
        >
          {/* Full screen opaque background - multiple layers to ensure opacity */}
          <div className="absolute inset-0 bg-[#420c14]" style={{ zIndex: 1 }} />
          <div className="absolute inset-0 bg-[#420c14]" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#420c14] to-[#2a080d]" style={{ zIndex: 3 }} />
          
          {/* Close button */}
          <button
            className="absolute top-8 right-4 text-[#f5f2eb] p-2"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{ zIndex: 10 }}
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Logo */}
          <div className="absolute top-6 left-4" style={{ zIndex: 10 }}>
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logos/OMW Logo Gold.png"
                alt="OhMyWedding"
                width={44}
                height={44}
                className="h-11 w-auto"
              />
            </Link>
          </div>
          
          {/* Content container */}
          <div className="relative h-full flex flex-col pt-24 px-6 pb-8" style={{ zIndex: 5 }}>
            {/* Navigation links */}
            <nav className="flex-1 flex flex-col justify-center space-y-4">
              {[
                { label: 'Features', href: '#features' },
                { label: 'Experience', href: '#experience' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Templates', href: '#demos' },
              ].map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-[#f5f2eb] hover:text-[#DDA46F] transition-colors duration-200 text-2xl tracking-[0.2em] uppercase py-3"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            
            {/* Auth buttons at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="pt-6 border-t border-[#DDA46F]/20"
            >
              <AuthButtons isMobile />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

// ============================================
// VIDEO HERO SECTION
// ============================================

const heroVideos = [
  "/videos/vid1.mp4",
  "/videos/vid5.mp4",
  "/videos/vid9.mp4",
  "/videos/vid15.mp4",
  "/videos/vid3.mp4",
  "/videos/vid12.mp4",
]

function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const rotatingWords = ["Displayed", "Celebrated", "Immortalized", "Unveiled"]
  
  // Auto-rotate through words
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 4000) // Change word every 4 seconds
    return () => clearInterval(interval)
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 300])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  // Handle video end to switch to next video
  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length)
  }, [])

  return (
    <section ref={containerRef} className="relative min-h-[110vh] flex items-center justify-center overflow-hidden">
      {/* Video Background with Carousel */}
      <motion.div className="absolute inset-0 z-0" style={{ scale }}>
        <AnimatePresence mode="sync">
          <motion.video
            key={currentVideoIndex}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnd}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <source src={heroVideos[currentVideoIndex]} type="video/mp4" />
          </motion.video>
        </AnimatePresence>
        {/* Darker overlay for better text contrast */}
        <div className="absolute inset-0 bg-[#420c14]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#420c14]/30 via-transparent to-[#420c14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#172815]/20 via-transparent to-[#172815]/20" />
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-1/3 left-[10%] w-64 h-64 rounded-full bg-[#DDA46F]/5 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-[10%] w-80 h-80 rounded-full bg-[#424b1e]/20 blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          y: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#732c2c]/10 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Content */}
      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-3 sm:mb-8"
        >
          <span className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 rounded-full bg-[#f5f2eb]/5 backdrop-blur-md border border-[#DDA46F]/20 text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.4em] uppercase">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            The Digital Suite for Weddings
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl text-[#f5f2eb] mb-4 sm:mb-8 leading-[0.95] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.3)' }}
        >
          <span className="block font-serif font-light text-[1.4em] sm:text-[1.5em] my-0 sm:my-1" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>Your</span>
          <span className="block font-serif font-light text-[1.4em] sm:text-[1.5em] my-0 sm:my-1" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
            Love Story
          </span>
          <div className="relative h-[1.2em] sm:h-[1.4em] md:h-[1.6em] lg:h-[1.8em] xl:h-[2em] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentWordIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="block font-['Elegant',cursive] text-[#DDA46F] text-[2.4em] sm:text-[2.4em]"
                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
              >
                {rotatingWords[currentWordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm sm:text-lg md:text-xl text-[#f5f2eb]/60 max-w-2xl mx-auto mb-5 sm:mb-10 leading-relaxed font-light tracking-wide px-2"
        >
          Create your luxury wedding website, manage RSVPs, share photos, and celebrate your love story with elegance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center items-center"
        >
          <Link href="/create-wedding">
            <Button 
              size="lg" 
              className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-base tracking-[0.1em] sm:tracking-[0.15em] font-medium group transition-all duration-700 w-full sm:w-auto"
            >
              Create Your Website
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 transition-transform duration-500 group-hover:translate-x-2" />
            </Button>
          </Link>
          <Link href="#demos">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-[#f5f2eb]/30 text-[#f5f2eb] hover:bg-[#f5f2eb]/10 hover:border-[#f5f2eb]/50 h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-base tracking-[0.1em] sm:tracking-[0.15em] backdrop-blur-sm transition-all duration-700 w-full sm:w-auto"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              View Gallery
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
          className="mt-8 sm:mt-16 flex justify-center gap-8 sm:gap-16 md:gap-24"
        >
          {[
            { value: '10K+', label: 'Happy Couples' },
            { value: '50+', label: 'Countries' },
            { value: '4.9', label: 'Rating', icon: <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-[#DDA46F] text-[#DDA46F] inline ml-1" /> },
          ].map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.7 + index * 0.2 }}
            >
              <div className="text-xl sm:text-3xl md:text-4xl font-serif text-[#DDA46F] flex items-center justify-center">
                {stat.value}
                {stat.icon}
              </div>
              <div className="text-[10px] sm:text-xs text-[#f5f2eb]/40 tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-1 sm:mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="hidden lg:flex absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-3 text-[#f5f2eb]/40"
        >
          <span className="text-xs tracking-[0.4em] uppercase">Scroll to Explore</span>
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ============================================
// ABOUT SECTION WITH VIDEO
// ============================================

function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 sm:py-40 bg-[#f5f2eb] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#DDA46F]/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content - Animated from left */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span 
              className="text-[#424b1e] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.2 }}
            >
              About OhMyWedding
            </motion.span>
            
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#420c14] mb-6 sm:mb-10 leading-[1.1]"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              <span className="font-serif font-light block">Where Love Meets</span>
              <span className="font-['Elegant',cursive] text-[#732c2c] text-[1.5em] block mt-1 sm:mt-2">Exquisite Design</span>
            </motion.h2>
            
            <motion.div 
              className="space-y-4 sm:space-y-6 text-[#420c14]/60 text-sm sm:text-lg leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <p>
                We believe your wedding website should be as extraordinary as your love story. 
                Every detail, every moment, every emotion deserves to be captured with elegance.
              </p>
              <p>
                From the first save-the-date to the final thank you, OhMyWedding provides an unparalleled 
                digital experience that reflects the beauty of your celebration.
              </p>
            </motion.div>
            
            {/* Feature highlights */}
            <motion.div 
              className="mt-8 sm:mt-12 grid grid-cols-2 gap-4 sm:gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.7 }}
            >
              {[
                { icon: <Crown className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Luxury Templates' },
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Your Own Domain' },
                { icon: <Bell className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Smart Notifications' },
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Full Customization' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.15 }}
                  className="flex items-center gap-2 sm:gap-4 text-[#420c14]"
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#DDA46F]/10 flex items-center justify-center text-[#DDA46F] flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs sm:text-sm font-medium tracking-wide">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Video/Image Grid - Animated from right */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                poster="/images/demo_images/demo-img-3.jpg"
              >
                <source src="/videos/vid8.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/30 to-transparent" />
            </div>
            
            {/* Floating card - centered on mobile/tablet, bottom-left on desktop */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:bottom-[-2rem] lg:left-[-2rem] lg:translate-x-0 bg-[#420c14] p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-2xl w-[85%] sm:w-auto sm:max-w-[280px]"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 1 }}
            >
              <div className="flex gap-1 mb-2 sm:mb-3 justify-center lg:justify-start">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-[#DDA46F] text-[#DDA46F]" />
                ))}
              </div>
              <p className="text-[#f5f2eb]/80 text-xs sm:text-sm italic leading-relaxed text-center lg:text-left">
                &ldquo;The most beautiful wedding website we&apos;ve ever seen...&rdquo;
              </p>
              <p className="text-[#DDA46F] text-[10px] sm:text-xs mt-2 sm:mt-3 tracking-wider text-center lg:text-left">— Sarah & Michael</p>
            </motion.div>
            
            {/* Decorative frame */}
            <div className="absolute -inset-4 sm:-inset-6 border border-[#DDA46F]/20 rounded-[1.5rem] sm:rounded-[2rem] pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// FEATURES SECTION
// ============================================

const features = [
  {
    icon: <Eye className="w-7 h-7" />,
    title: "Invitation Tracking",
    description: "Know exactly when guests view your invitation with real-time open notifications.",
    color: "#DDA46F",
    image: "/images/demo_images/demo-img-40.jpg"
  },
  {
    icon: <CheckCircle2 className="w-7 h-7" />,
    title: "RSVP Dashboard",
    description: "Comprehensive guest management with attendance, meal preferences, and confirmations.",
    color: "#424b1e",
    image: "/images/demo_images/demo-img-41.jpg"
  },
  {
    icon: <Globe className="w-7 h-7" />,
    title: "Your Own Subdomain",
    description: "Personalized yournames.ohmy.wedding domain - elegantly branded for your special day.",
    color: "#732c2c",
    image: "/images/demo_images/demo-img-42.jpg"
  },
  {
    icon: <Send className="w-7 h-7" />,
    title: "Message Templates",
    description: "Pre-designed templates for save-the-dates, reminders, and thank you notes.",
    color: "#172815",
    image: "/images/demo_images/demo-img-43.jpg"
  },
  {
    icon: <Bell className="w-7 h-7" />,
    title: "Smart Notifications",
    description: "Instant alerts when guests RSVP or view invitations. Stay connected effortlessly.",
    color: "#DDA46F",
    image: "/images/demo_images/demo-img-44.jpg"
  },
  {
    icon: <Crown className="w-7 h-7" />,
    title: "Luxury Experience",
    description: "Premium designs, smooth animations, and elegant typography throughout.",
    color: "#420c14",
    image: "/images/demo_images/demo-img-45.jpg"
  },
]

function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-100px" })

  return (
    <section id="features" ref={ref} className="py-20 sm:py-40 bg-[#420c14] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(221,164,111,1) 1px, transparent 0)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1.2 }}
          className="text-center mb-12 sm:mb-24"
        >
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#f5f2eb] mb-6 sm:mb-8 leading-tight">
            <span className="font-serif font-light block">Powerful Tools for</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-1 sm:mt-2">Your Perfect Day</span>
          </h2>
          <p className="text-[#f5f2eb]/50 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed px-2">
            Everything you need to create, manage, and share your wedding website with elegance.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="group"
            >
              <div className="relative p-8 rounded-3xl bg-[#f5f2eb]/5 backdrop-blur-sm border border-[#f5f2eb]/10 hover:border-[#DDA46F]/40 transition-all duration-700 h-full overflow-hidden">
                {/* Image Placeholder */}
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 bg-[#f5f2eb]/5">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/80 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <motion.div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-700 group-hover:scale-110"
                      style={{ backgroundColor: `${feature.color}40`, color: feature.color }}
                    >
                      {feature.icon}
                    </motion.div>
                  </div>
                </div>
                
                <h3 className="text-xl font-serif text-[#f5f2eb] mb-3">{feature.title}</h3>
                <p className="text-[#f5f2eb]/50 leading-relaxed text-sm">{feature.description}</p>
                
                {/* Hover glow */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ 
                    background: `radial-gradient(circle at 50% 0%, ${feature.color}15 0%, transparent 60%)` 
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// EXPERIENCE SECTION - AWARD-WINNING DESIGN
// ============================================

const experiences = [
  { 
    id: 'hero',
    title: "Hero", 
    subtitle: "First Impressions",
    description: "A captivating entrance with video backgrounds and elegant typography",
    video: "/videos/vid11.mp4",
    image: "/images/demo_images/demo-img-2.jpg",
    carouselImage: "/images/demo_images/demo-img-35.jpg"
  },
  { 
    id: 'countdown',
    title: "Countdown", 
    subtitle: "The Anticipation",
    description: "Elegant countdown timers building excitement for your special day",
    video: "/videos/vid13.mp4",
    image: "/images/demo_images/demo-img-5.jpg",
    carouselImage: "/images/demo_images/demo-img-40.jpg"
  },
  { 
    id: 'story',
    title: "Our Story", 
    subtitle: "Your Journey",
    description: "Beautiful timeline of your love story from first meeting to engagement",
    video: "/videos/vid16.mp4",
    image: "/images/demo_images/demo-img-7.jpg",
    carouselImage: "/images/demo_images/demo-img-42.jpg"
  },
  { 
    id: 'venue',
    title: "Event Details", 
    subtitle: "The Venue",
    description: "Showcase your ceremony and reception locations with maps",
    video: "/videos/vid18.mp4",
    image: "/images/demo_images/demo-img-10.jpg",
    carouselImage: "/images/demo_images/demo-img-44.jpg"
  },
  { 
    id: 'rsvp',
    title: "RSVP", 
    subtitle: "The Response",
    description: "Smart RSVP system with guest management and meal preferences",
    video: "/videos/vid19.mp4",
    image: "/images/demo_images/demo-img-15.jpg",
    carouselImage: "/images/demo_images/demo-img-46.jpg"
  },
  { 
    id: 'gallery',
    title: "Gallery", 
    subtitle: "Your Moments",
    description: "Stunning photo galleries with elegant layouts and lightbox views",
    video: "/videos/vid21.mp4",
    image: "/images/demo_images/demo-img-20.jpg",
    carouselImage: "/images/demo_images/demo-img-48.jpg"
  },
]

function ExperienceSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-50px" })
  const [activeIndex, setActiveIndex] = useState(0)

  // Auto-rotate through experiences
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % experiences.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="experience" ref={ref} className="py-20 sm:py-32 bg-[#172815] relative overflow-hidden min-h-[700px] sm:min-h-[800px]">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster={experiences[activeIndex].image}
            >
              <source src={experiences[activeIndex].video} type="video/mp4" />
            </video>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#172815] via-[#172815]/80 to-[#172815]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#172815] via-transparent to-[#172815]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.5em] uppercase mb-4 sm:mb-8 block">
              Website Sections
            </span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#f5f2eb] mb-8 sm:mb-12 leading-[1.05]">
              <span className="font-serif font-light block">Every Detail</span>
              <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-1 sm:mt-2">Beautifully Crafted</span>
            </h2>

            {/* Experience List - All items visible without scrolling */}
            <div className="space-y-1 sm:space-y-1.5">
              {experiences.map((exp, index) => (
                <motion.button
                  key={exp.id}
                  onClick={() => setActiveIndex(index)}
                  className={`w-full text-left rounded-lg sm:rounded-xl transition-all duration-500 overflow-hidden ${
                    activeIndex === index 
                      ? 'bg-[#DDA46F]/15 border border-[#DDA46F]/30' 
                      : 'bg-[#f5f2eb]/5 border border-transparent hover:bg-[#f5f2eb]/10'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.06 }}
                >
                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-sm sm:text-base text-[#f5f2eb] truncate">{exp.title}</h3>
                      </div>
                      <motion.div
                        animate={{ scale: activeIndex === index ? 1 : 0.6, opacity: activeIndex === index ? 1 : 0.3 }}
                        transition={{ duration: 0.4 }}
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#DDA46F] flex-shrink-0"
                      />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Right - Large number and preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="hidden lg:block relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={experiences[activeIndex].carouselImage}
                    alt={experiences[activeIndex].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#172815]/60 to-transparent" />
                </motion.div>
              </AnimatePresence>
              
              {/* Progress indicator */}
              <div className="absolute bottom-6 left-6 right-6 flex gap-2">
                {experiences.map((_, index) => (
                  <motion.div
                    key={index}
                    className="h-1 rounded-full flex-1 bg-[#f5f2eb]/20 overflow-hidden cursor-pointer"
                    onClick={() => setActiveIndex(index)}
                  >
                    <motion.div
                      className="h-full bg-[#DDA46F]"
                      initial={{ width: 0 }}
                      animate={{ width: activeIndex === index ? '100%' : '0%' }}
                      transition={{ duration: activeIndex === index ? 5 : 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Large number overlay */}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute -top-10 -right-10 text-[12rem] font-serif text-[#DDA46F]/10 leading-none pointer-events-none select-none"
            >
              {String(activeIndex + 1).padStart(2, '0')}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// PRICING SECTION
// ============================================

function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-100px" })

  const plans = [
    {
      name: PLAN_CARDS.free.name,
      price: PLAN_CARDS.free.price,
      period: PLAN_CARDS.free.period,
      description: PLAN_CARDS.free.description,
      features: PLAN_CARDS.free.features.map(text => ({ text, included: true })),
      cta: PLAN_CARDS.free.cta,
      href: PLAN_CARDS.free.href,
      featured: false,
    },
    {
      name: PLAN_CARDS.premium.name,
      price: PLAN_CARDS.premium.price,
      period: PLAN_CARDS.premium.period,
      tagline: PLAN_CARDS.premium.tagline,
      description: PLAN_CARDS.premium.description,
      features: PLAN_CARDS.premium.features.map(text => ({ text, included: true })),
      cta: PLAN_CARDS.premium.cta,
      href: `/upgrade?source=landing_pricing_premium`,
      featured: true,
    },
    {
      name: PLAN_CARDS.deluxe.name,
      price: PLAN_CARDS.deluxe.price,
      period: PLAN_CARDS.deluxe.period,
      tagline: PLAN_CARDS.deluxe.tagline,
      description: PLAN_CARDS.deluxe.description,
      features: PLAN_CARDS.deluxe.features.map(text => ({ text, included: true })),
      cta: PLAN_CARDS.deluxe.cta,
      href: `/upgrade?plan=deluxe&source=landing_pricing_deluxe`,
      featured: false,
      isDeluxe: true,
    },
  ]

  // Comparison table data
  const comparisonFeatures = COMPARISON_FEATURES.map(cat => ({
    ...cat,
    features: cat.features.map(f => ({ ...f })),
  }))

  return (
    <section id="pricing" ref={ref} className="py-20 sm:py-40 bg-[#f5f2eb] relative overflow-hidden">
      {/* Decorative elements */}
      <motion.div
        className="absolute top-1/4 left-[10%] w-40 sm:w-80 h-40 sm:h-80 rounded-full bg-[#DDA46F]/10 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-[10%] w-48 sm:w-96 h-48 sm:h-96 rounded-full bg-[#172815]/10 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1.2 }}
          className="text-center mb-12 sm:mb-24"
        >
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#420c14] mb-6 sm:mb-8 leading-tight">
            <span className="font-serif font-light">Simple &</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] ml-2 sm:ml-4">Transparent</span>
          </h2>
          <p className="text-[#420c14]/60 text-sm sm:text-lg max-w-2xl mx-auto px-2">
            Start for free, upgrade when you&apos;re ready. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={{ duration: 1, delay: index * 0.15 }}
              className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 ${
                plan.featured 
                  ? 'bg-[#420c14] border-2 border-[#420c14] md:-mt-4 md:mb-4' 
                  : (plan as { isDeluxe?: boolean }).isDeluxe
                    ? 'bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F]'
                    : 'bg-white border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5'
              }`}
            >
              {plan.featured && (
                <motion.div 
                  className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#f5f2eb] text-[#420c14] text-xs sm:text-sm font-medium tracking-wider">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    Most Popular
                  </span>
                </motion.div>
              )}

              {(plan as { isDeluxe?: boolean }).isDeluxe && (
                <motion.div 
                  className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#420c14] text-[#f5f2eb] text-xs sm:text-sm font-medium tracking-wider">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    Luxury
                  </span>
                </motion.div>
              )}

              <div className={plan.featured || (plan as { isDeluxe?: boolean }).isDeluxe ? 'pt-2 sm:pt-4' : ''}>
                <h3 className={`text-2xl sm:text-3xl font-serif mb-2 ${
                  plan.featured ? 'text-[#f5f2eb]' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'text-[#420c14]' : 'text-[#420c14]'
                }`}>{plan.name}</h3>
                <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${
                  plan.featured ? 'text-[#f5f2eb]/60' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'text-[#420c14]/80' : 'text-[#420c14]/60'
                }`}>{plan.description}</p>
                
                <div className="mb-8 sm:mb-10">
                  <span className={`text-4xl sm:text-6xl font-serif ${
                    plan.featured ? 'text-[#f5f2eb]' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'text-[#420c14]' : 'text-[#420c14]'
                  }`}>{plan.price}</span>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${
                    plan.featured ? 'text-[#f5f2eb]/60' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'text-[#420c14]/70' : 'text-[#420c14]/60'
                  }`}>{plan.period}</span>
                </div>

                <div className="space-y-3">
                  <Link href={plan.href}>
                    <Button 
                      className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
                        plan.featured 
                          ? 'bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]' 
                          : (plan as { isDeluxe?: boolean }).isDeluxe
                            ? 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
                            : 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                  
                  <div className="text-center">
                    <Link 
                      href={plan.name === 'Premium' ? '/premium' : plan.name === 'Deluxe' ? '/deluxe' : '#'}
                      className={`text-xs sm:text-sm hover:underline transition-colors ${
                        plan.featured
                          ? 'text-[#f5f2eb]/60 hover:text-[#f5f2eb]'
                          : (plan as { isDeluxe?: boolean }).isDeluxe
                            ? 'text-[#420c14]/50 hover:text-[#420c14]'
                            : 'text-[#420c14]/50 hover:text-[#420c14]'
                      }`}
                    >
                      {plan.name !== 'Free' && `Learn more about ${plan.name}`}
                    </Link>
                  </div>
                </div>

                <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-5">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div 
                      key={featureIndex} 
                      className="flex items-center gap-3 sm:gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, delay: 0.3 + featureIndex * 0.08 }}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        feature.included 
                          ? plan.featured ? 'bg-[#DDA46F]/30 text-[#DDA46F]' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'bg-[#420c14]/20 text-[#420c14]' : 'bg-[#420c14]/10 text-[#420c14]'
                          : plan.featured ? 'bg-[#f5f2eb]/10 text-[#f5f2eb]/30' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'bg-[#420c14]/10 text-[#420c14]/30' : 'bg-[#420c14]/5 text-[#420c14]/30'
                      }`}>
                        {feature.included ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <span className="w-2 h-0.5 bg-current" />}
                      </div>
                      <span className={`text-sm sm:text-base ${feature.included 
                        ? plan.featured ? 'text-[#f5f2eb]/80' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'text-[#420c14]/90' : 'text-[#420c14]/80'
                        : plan.featured ? 'text-[#f5f2eb]/40' : (plan as { isDeluxe?: boolean }).isDeluxe ? 'text-[#420c14]/40' : 'text-[#420c14]/40'
                      }`}>
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 sm:mt-24 bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5 overflow-hidden"
        >
          <h3 className="text-2xl sm:text-3xl font-serif text-[#420c14] mb-8 sm:mb-12 text-center">
            Compare Plans
          </h3>
          
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-6 sm:px-0">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[23.33%]" />
                  <col className="w-[23.33%]" />
                  <col className="w-[23.33%]" />
                </colgroup>
                <thead>
                  <tr className="border-b-2 border-[#420c14]/10">
                    <th className="text-left py-4 sm:py-6 pr-4 sm:pr-8 text-sm sm:text-base font-medium text-[#420c14]/60">
                      Features
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6">
                      <div className="text-base sm:text-lg font-serif text-[#420c14]">Free</div>
                      <div className="text-xs sm:text-sm text-[#420c14]/50 mt-1">$0</div>
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6 relative">
                      <div className="absolute inset-0 bg-[#420c14]/5 -mx-3 sm:-mx-6" />
                      <div className="relative">
                        <div className="text-base sm:text-lg font-serif text-[#420c14]">Premium</div>
                        <div className="text-xs sm:text-sm text-[#420c14]/50 mt-1">$250</div>
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#DDA46F] mx-auto mt-1" />
                      </div>
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6">
                      <div className="text-base sm:text-lg font-serif text-[#420c14]">Deluxe</div>
                      <div className="text-xs sm:text-sm text-[#420c14]/50 mt-1">$500</div>
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-[#DDA46F] mx-auto mt-1" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <tr>
                        <td colSpan={4} className="pt-6 sm:pt-8 pb-3 sm:pb-4">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#420c14] tracking-wider uppercase">
                            {category.category}
                          </h4>
                        </td>
                      </tr>
                      {category.features.map((feature, featIndex) => (
                        <motion.tr
                          key={featIndex}
                          className="border-b border-[#420c14]/5 hover:bg-[#420c14]/[0.02] transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, delay: 0.7 + (catIndex * 0.1) + (featIndex * 0.05) }}
                        >
                          <td className="py-3 sm:py-4 pr-4 sm:pr-8 text-xs sm:text-sm text-[#420c14]/70">
                            {feature.name}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                            {typeof feature.free === 'boolean' ? (
                              feature.free ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#420c14] mx-auto" />
                              ) : (
                                <span className="text-[#420c14]/20 text-lg">—</span>
                              )
                            ) : (
                              <span className="text-xs sm:text-sm text-[#420c14]/70">{feature.free}</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center bg-[#420c14]/[0.02]">
                            {typeof feature.premium === 'boolean' ? (
                              feature.premium ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#420c14] mx-auto" />
                              ) : (
                                <span className="text-[#420c14]/20 text-lg">—</span>
                              )
                            ) : (
                              <span className="text-xs sm:text-sm text-[#420c14]/70 font-medium">{feature.premium}</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                            {typeof feature.deluxe === 'boolean' ? (
                              feature.deluxe ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#DDA46F] mx-auto" />
                              ) : (
                                <span className="text-[#420c14]/20 text-lg">—</span>
                              )
                            ) : (
                              <span className="text-xs sm:text-sm text-[#DDA46F] font-medium">{feature.deluxe}</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA buttons in table */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[#420c14]/10">
            <Link href="/create-wedding" className="block">
              <Button className="w-full bg-[#420c14]/5 hover:bg-[#420c14]/10 text-[#420c14] text-xs sm:text-sm h-10 sm:h-12">
                Get Started
              </Button>
            </Link>
            <Link href="/upgrade?source=landing_comparison_premium" className="block">
              <Button className="w-full bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] text-xs sm:text-sm h-10 sm:h-12">
                Upgrade
              </Button>
            </Link>
            <Link href="/upgrade?plan=deluxe&source=landing_comparison_deluxe" className="block">
              <Button className="w-full bg-gradient-to-r from-[#DDA46F] to-[#c99560] hover:from-[#c99560] hover:to-[#b88550] text-[#420c14] text-xs sm:text-sm h-10 sm:h-12">
                Go Deluxe
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 text-center text-[#420c14]/50 text-sm tracking-wide"
        >
          💳 Secure payment via Stripe • 🔒 30-day money-back guarantee
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// GOLDEN BANNER SECTION
// ============================================

function GoldenBannerSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-100px" })

  return (
    <section ref={ref} className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] min-h-[350px] sm:min-h-[500px] lg:min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/demo_images/demo-img-13.jpg"
          alt="Wedding moment"
          fill
          className="object-cover"
        />
        {/* Golden gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#DDA46F]/85 via-[#DDA46F]/70 to-[#DDA46F]/85" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1.2 }}
          className="text-center max-w-7xl"
        >
          <motion.p
            className="text-[#420c14] leading-[1.2] text-[8em]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, delay: 0.3 }}
            style={{ 
              textShadow: '0 2px 20px rgba(221,164,111,0.3)'
            }}
          >
            <span className="font-serif text-[2.15em] md:text-[3.15em]">&ldquo;Every </span>
            <span className="font-['Elegant',cursive] text-[3.6em] md:text-[5.9em]">love story</span>
            <span className="font-serif text-[2.15em] md:text-[3.15em]"> is beautiful, but yours deserves to be told with </span>
            <span className="font-['Elegant',cursive] text-[3.6em] md:text-[5.9em]">elegance</span>
            <span className="font-serif text-[2.15em] md:text-[3.15em]">&rdquo;</span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// TEMPLATES SECTION
// ============================================

function TemplatesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-100px" })

  const templates = [
    { image: "/images/demo_images/demo-img-10.jpg", title: "Classic Elegance", style: "Timeless" },
    { image: "/images/demo_images/demo-img-15.jpg", title: "Modern Romance", style: "Contemporary" },
    { image: "/images/demo_images/demo-img-20.jpg", title: "Garden Party", style: "Natural" },
    { image: "/images/demo_images/demo-img-25.jpg", title: "Rustic Charm", style: "Intimate" },
    { image: "/images/demo_images/demo-img-30.jpg", title: "Coastal Dreams", style: "Serene" },
    { image: "/images/demo_images/demo-img-35.jpg", title: "Urban Chic", style: "Modern" },
  ]

  // Duplicate templates for infinite scroll effect
  const infiniteTemplates = [...templates, ...templates, ...templates]

  return (
    <section id="demos" ref={ref} className="py-20 sm:py-40 bg-[#f5f2eb] relative overflow-hidden">
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 1.2 }}
            className="text-center"
          >
            <span className="text-[#424b1e] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
              Templates
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#420c14] mb-6 sm:mb-8 leading-tight">
              <span className="font-serif font-light">Stunning Designs</span>
              <span className="font-['Elegant',cursive] text-[#732c2c] text-[1.5em] block mt-1 sm:mt-2">For Every Style</span>
            </h2>
          </motion.div>
        </div>

        {/* Infinite horizontal scrolling gallery */}
        <div className="relative">
          <motion.div 
            className="flex gap-4 sm:gap-6 lg:gap-8 pb-4 animate-scroll-left"
            style={{ width: 'max-content' }}
          >
          {infiniteTemplates.map((template, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, delay: (index % templates.length) * 0.1 }}
              className="flex-shrink-0 w-[200px] sm:w-[280px] md:w-[320px] lg:w-[380px] group cursor-pointer"
            >
              <div className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden mb-3 sm:mb-6">
                <Image
                  src={template.image}
                  alt={template.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/80 via-[#420c14]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="px-8 py-4 bg-[#f5f2eb]/95 backdrop-blur-sm rounded-full text-[#420c14] text-sm font-medium tracking-wider">
                    Preview Template
                  </span>
                </motion.div>
              </div>
              <h3 className="font-serif text-base sm:text-lg lg:text-xl text-[#420c14]">{template.title}</h3>
              <p className="text-xs sm:text-sm text-[#420c14]/50 tracking-wider uppercase">{template.style}</p>
            </motion.div>
          ))}
        </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 sm:mt-20 text-center"
        >
          <Link href="/demo">
            <Button 
              size="lg"
              variant="outline"
              className="border-[#420c14]/20 text-[#420c14] hover:border-[#DDA46F] hover:bg-[#DDA46F]/5 h-12 sm:h-16 px-8 sm:px-12 text-sm sm:text-base tracking-wider transition-all duration-700"
            >
              View All Templates
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// TESTIMONIALS SECTION
// ============================================

const testimonials = [
  {
    quote: "The RSVP system saved us so much time! We could track everything in one place. Absolutely elegant and sophisticated.",
    author: "Sarah & Michael",
    role: "Married June 2025",
    image: "/images/demo_images/demo-img-46.jpg"
  },
  {
    quote: "Our guests loved how easy it was to RSVP. The design was beautiful and matched our vision perfectly.",
    author: "Emma & James",
    role: "Married August 2025",
    image: "/images/demo_images/demo-img-47.jpg"
  },
  {
    quote: "Best investment for our wedding! The invitation tracking feature is incredibly useful.",
    author: "Jessica & David",
    role: "Married October 2025",
    image: "/images/demo_images/demo-img-48.jpg"
  },
]

function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 sm:py-40 bg-[#172815] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#DDA46F]/30 to-transparent" />
      
      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-1/4 right-[5%] w-32 sm:w-64 h-32 sm:h-64 rounded-full bg-[#DDA46F]/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1.2 }}
          className="text-center mb-12 sm:mb-24"
        >
          <motion.span 
            className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Testimonials
          </motion.span>
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#f5f2eb] mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className="font-serif font-light">Loved by Couples</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-1 sm:mt-2">Worldwide</span>
          </motion.h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-10">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              {/* Background image with overlay */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden">
                <Image
                  src={testimonial.image}
                  alt={testimonial.author}
                  fill
                  className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#172815]/80 via-[#172815]/90 to-[#172815]" />
              </div>
              
              <div className="relative p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-[#f5f2eb]/5 backdrop-blur-sm border border-[#f5f2eb]/10 h-full">
                <motion.div 
                  className="absolute -top-4 sm:-top-6 left-6 sm:left-10 text-5xl sm:text-8xl text-[#DDA46F]/20 font-serif"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
                >
                  &ldquo;
                </motion.div>
                
                <motion.div 
                  className="flex gap-1 mb-4 sm:mb-8 relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                >
                  {[1,2,3,4,5].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.15 + i * 0.05 }}
                    >
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-[#DDA46F] text-[#DDA46F]" />
                    </motion.div>
                  ))}
                </motion.div>
                
                <motion.blockquote 
                  className="text-[#f5f2eb]/80 mb-6 sm:mb-10 leading-relaxed text-sm sm:text-lg relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.15 }}
                >
                  {testimonial.quote}
                </motion.blockquote>
                
                <motion.div 
                  className="flex items-center gap-3 sm:gap-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.15 }}
                >
                  <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.author}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#DDA46F]/20 to-[#732c2c]/20" />
                  </div>
                  <div>
                    <p className="font-serif text-base sm:text-lg text-[#f5f2eb]">{testimonial.author}</p>
                    <p className="text-xs sm:text-sm text-[#f5f2eb]/50">{testimonial.role}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FINAL CTA SECTION
// ============================================

const ctaVideos = [
  "/videos/vid2.mp4",
  "/videos/vid10.mp4",
  "/videos/vid4.mp4",
  "/videos/vid17.mp4",
  "/videos/vid6.mp4",
  "/videos/vid20.mp4",
  "/videos/vid8.mp4",
]

function FinalCTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-100px" })
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  // Handle video end to switch to next video
  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % ctaVideos.length)
  }, [])

  return (
    <section ref={ref} className="relative py-40 overflow-hidden">
      {/* Background Video Carousel */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.video
            key={currentVideoIndex}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <source src={ctaVideos[currentVideoIndex]} type="video/mp4" />
          </motion.video>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#420c14]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/80 via-transparent to-[#420c14]/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 1.5 }}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <motion.span 
          className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 rounded-full bg-[#f5f2eb]/5 backdrop-blur-md border border-[#DDA46F]/20 text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.4em] uppercase mb-8 sm:mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
          Begin Your Journey
        </motion.span>
        
        <motion.h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-8xl text-[#f5f2eb] mb-6 sm:mb-10 leading-[1.05] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] px-2"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.3)' }}
        >
          <span className="font-serif font-light block">Ready to Create Your</span>
          <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-2 sm:mt-4" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>Dream Wedding Site?</span>
        </motion.h2>
        
        <motion.p 
          className="text-sm sm:text-lg md:text-xl text-[#f5f2eb]/70 max-w-2xl mx-auto mb-8 sm:mb-14 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          Join thousands of couples who&apos;ve created beautiful wedding websites.
          Start your journey in minutes.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <Link href="/create-wedding">
            <Button 
              size="lg" 
              className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] h-12 sm:h-16 px-8 sm:px-14 text-sm sm:text-base tracking-[0.1em] sm:tracking-[0.15em] font-medium transition-all duration-700"
            >
              Create Your Free Website
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
            </Button>
          </Link>
        </motion.div>
        
        <motion.p 
          className="text-[#f5f2eb]/40 text-xs sm:text-sm mt-6 sm:mt-10 tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          No credit card required • Takes less than 5 minutes
        </motion.p>
      </motion.div>
    </section>
  )
}

// ============================================
// FOOTER
// ============================================

function LuxuryFooter() {
  return (
    <footer className="bg-[#420c14] border-t border-[#DDA46F]/10 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-16 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <Image
                src="/images/logos/OMW Logo Gold.png"
                alt="OhMyWedding"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
              <span className="font-serif text-2xl text-[#f5f2eb] tracking-[0.1em]">OhMyWedding</span>
            </div>
            <p className="text-[#f5f2eb]/50 leading-relaxed max-w-md">
              Creating beautiful wedding websites that help couples celebrate their love story 
              with elegance and sophistication.
            </p>
          </div>

          <div>
            <h4 className="text-[#f5f2eb] font-medium mb-6 tracking-[0.2em] text-sm uppercase">Product</h4>
            <ul className="space-y-4">
              {['Features', 'Pricing', 'Templates', 'FAQ'].map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item.toLowerCase()}`}
                    className="text-[#f5f2eb]/50 hover:text-[#DDA46F] transition-colors duration-500 text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#f5f2eb] font-medium mb-6 tracking-[0.2em] text-sm uppercase">Support</h4>
            <ul className="space-y-4">
              {[
                { label: 'Contact Us', href: 'mailto:support@ohmy.wedding' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href}
                    className="text-[#f5f2eb]/50 hover:text-[#DDA46F] transition-colors duration-500 text-sm"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#DDA46F]/10 pt-10 text-center space-y-4">
          <p className="text-[#f5f2eb]/30 text-sm tracking-wide">
            © {new Date().getFullYear()} OhMyWedding. Made with{' '}
            <Heart className="w-4 h-4 inline text-[#DDA46F] fill-[#DDA46F] mx-1" />{' '}
            for couples in love.
          </p>
          <p className="text-[#f5f2eb]/20 text-[11px] leading-relaxed max-w-2xl mx-auto">
            OhMyWedding collects basic account information (name, email, wedding date), content you create (photos, guest lists, details), and guest interactions (RSVPs, messages) to provide your wedding website. We use this data solely to deliver the service, enable notifications, improve features, and maintain security. We never sell your information. See our <Link href="/privacy" className="text-[#DDA46F] hover:underline">Privacy Policy</Link> for details.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function LandingPage() {
  useSmoothScroll()

  return (
    <>
      <CustomCursor />
      
      <style jsx global>{`
        @media (min-width: 1024px) {
          body,
          body * {
            cursor: none !important;
          }
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        /* Smooth/heavy scroll feel */
        @supports (scroll-behavior: smooth) {
          html {
            scroll-behavior: smooth;
          }
        }
        
        /* Custom selection color */
        ::selection {
          background: rgba(221, 164, 111, 0.3);
          color: #f5f2eb;
        }
        
        /* Glass effect utilities */
        .glass {
          background: rgba(245, 242, 235, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
      
      <main className="min-h-screen bg-[#420c14] overflow-x-hidden">
        <Suspense fallback={null}>
          <AuthCodeHandler />
        </Suspense>
        
        <LuxuryHeader />
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <ExperienceSection />
        <PricingSection />
        <GoldenBannerSection />
        <TemplatesSection />
        <TestimonialsSection />
        <FinalCTASection />
        <LuxuryFooter />
      </main>
    </>
  )
}
