'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/components/contexts/i18n-context'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { AuthButtons, type UserWedding } from './auth-buttons'

export function LuxuryHeader() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userWeddings, setUserWeddings] = useState<UserWedding[]>([])
  const [weddingsLoading, setWeddingsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setWeddingsLoading(true)
      fetch('/api/weddings')
        .then(res => res.json())
        .then(data => setUserWeddings(data.weddings || []))
        .finally(() => setWeddingsLoading(false))
    } else {
      setUserWeddings([])
    }
  }, [user])

  useEffect(() => {
    let lastScrollTime = 0
    const handleScroll = () => {
      const now = Date.now()
      if (now - lastScrollTime > 100) {
        setIsScrolled(window.scrollY > 50)
        lastScrollTime = now
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${scrollY}px`
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

  const navItems = [
    { label: t('landing.nav.features'), href: '#features' },
    { label: t('landing.nav.experience'), href: '#experience' },
    { label: t('landing.nav.pricing'), href: '#pricing' },
    { label: t('landing.nav.templates'), href: '#demos' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[105] transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-[#420c14] border-b border-[#DDA46F]/10' 
            : 'bg-transparent'
        }`}
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

            <nav className="hidden md:flex items-center gap-3 lg:gap-6 xl:gap-10">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[#f5f2eb]/70 hover:text-[#DDA46F] transition-colors duration-300 text-[10px] lg:text-[11px] xl:text-sm tracking-[0.1em] lg:tracking-[0.15em] xl:tracking-[0.25em] uppercase whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <LanguageSwitcher variant="pill" />
              <AuthButtons userWeddings={userWeddings} weddingsLoading={weddingsLoading} />
            </div>

            <button
              className="md:hidden text-[#f5f2eb] p-2 z-[110] relative"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span 
                  className="w-full h-0.5 bg-[#f5f2eb] origin-center transition-transform duration-300"
                  style={{ transform: isMobileMenuOpen ? 'rotate(45deg) translateY(9px)' : 'none' }}
                />
                <span 
                  className="w-full h-0.5 bg-[#f5f2eb] transition-opacity duration-200"
                  style={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                />
                <span 
                  className="w-full h-0.5 bg-[#f5f2eb] origin-center transition-transform duration-300"
                  style={{ transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-9px)' : 'none' }}
                />
              </div>
            </button>
          </div>
        </div>
      </header>
    
      {/* Mobile Menu - CSS transitions instead of framer-motion for instant response */}
      <div
        className={`fixed inset-0 md:hidden transition-opacity duration-200 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Single background layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#420c14] to-[#2a080d]" />
        
        {/* Close button */}
        <button
          className="absolute top-8 right-4 text-[#f5f2eb] p-2 z-10"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-8 h-8" />
        </button>
        
        {/* Logo */}
        <div className="absolute top-6 left-4 z-10">
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
        <div className="relative h-full flex flex-col pt-24 px-6 pb-8 z-[5]">
          <nav className="flex-1 flex flex-col justify-center space-y-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[#f5f2eb] hover:text-[#DDA46F] transition-colors duration-200 text-2xl tracking-[0.2em] uppercase py-3"
              >
                {item.label}
              </a>
            ))}
          </nav>
          
          <div className="pt-6 border-t border-[#DDA46F]/20 space-y-4">
            <div className="flex items-center justify-center">
              <LanguageSwitcher variant="pill" />
            </div>
            <AuthButtons isMobile userWeddings={userWeddings} weddingsLoading={weddingsLoading} />
          </div>
        </div>
      </div>
    </>
  )
}
