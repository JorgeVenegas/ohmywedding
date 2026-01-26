"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Heart, 
  Calendar, 
  Users, 
  Gift, 
  ImageIcon, 
  MessageSquare, 
  Star, 
  ArrowRight, 
  User, 
  ChevronDown, 
  Edit3,
  Check,
  Sparkles,
  Crown,
  Zap,
  Globe,
  Palette,
  Send
} from "lucide-react"
import { Header } from "@/components/header"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase-client"
import { getWeddingUrl } from "@/lib/wedding-url"
import { Suspense } from "react"

// Component to handle auth code in URL (fallback for OAuth flows that redirect to root)
function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  useEffect(() => {
    if (code) {
      // Redirect to the proper server-side callback handler
      // This ensures cookies are set correctly on the server, especially for Safari
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
}

function AuthButtons() {
  const { user, loading, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userWeddings, setUserWeddings] = useState<UserWedding[]>([])
  const [weddingsLoading, setWeddingsLoading] = useState(false)

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

  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="h-10 w-20 bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  if (user) {
    const hasWedding = userWeddings.length > 0
    const firstWedding = userWeddings[0]

    return (
      <div className="flex gap-3 items-center">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline max-w-[150px] truncate">{user.email}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-700 truncate">{user.email}</p>
                </div>
                {userWeddings.length > 0 && (
                  <div className="border-b border-gray-100">
                    <p className="px-4 py-1 text-xs text-gray-500">Your Weddings</p>
                    {userWeddings.map(wedding => (
                      <a
                        key={wedding.id}
                        href={getWeddingUrl(wedding.wedding_name_id)}
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {wedding.partner1_first_name} & {wedding.partner2_first_name}
                      </a>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    signOut()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
        {weddingsLoading ? (
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
        ) : hasWedding ? (
          <a href={getWeddingUrl(firstWedding.wedding_name_id)}>
            <Button className="bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Wedding
            </Button>
          </a>
        ) : (
          <Link href="/create-wedding">
            <Button className="bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20">Create Wedding</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <Link href="/login">
        <Button variant="ghost" className="text-foreground hover:bg-muted">
          Sign In
        </Button>
      </Link>
      <Link href="/create-wedding">
        <Button className="bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20">Get Started</Button>
      </Link>
    </div>
  )
}

// Animated counter component
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(target * easeOut))
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [target, duration, hasAnimated])

  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-bold text-foreground">
      {count.toLocaleString()}{suffix}
    </div>
  )
}

// Fade in on scroll component
function FadeInOnScroll({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

// Feature showcase with hover effect
function FeatureCard({
  icon,
  title,
  description,
  isPremium = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isPremium?: boolean
}) {
  return (
    <Card className="group relative p-8 border border-[#D4AF37]/10 dark:border-[#D4AF37]/20 bg-gradient-to-br from-white to-[#FAF7F0]/30 dark:from-gray-900 dark:to-[#2A2520]/20 hover:shadow-xl hover:shadow-[#B8860B]/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
      {isPremium && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-white">
            <Crown className="w-3 h-3" />
            Premium
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/5 to-[#D4AF37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/50 dark:to-[#252018]/50 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-[#D4AF37]/10">
          <div className="text-[#B8860B]">{icon}</div>
        </div>
        <h3 className="font-semibold text-xl text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Card>
  )
}

// Pricing card component
function PricingCard({
  name,
  price,
  period,
  description,
  features,
  isPopular = false,
  ctaText = "Get Started",
  ctaHref = "/create-wedding",
}: {
  name: string
  price: string
  period: string
  description: string
  features: { text: string; included: boolean }[]
  isPopular?: boolean
  ctaText?: string
  ctaHref?: string
}) {
  return (
    <Card className={`relative p-8 ${isPopular ? 'border-2 border-[#D4AF37] shadow-xl shadow-[#B8860B]/15' : 'border border-border'} bg-card overflow-hidden`}>
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C9A87C]" />
      )}
      {isPopular && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-white shadow-lg">
            <Sparkles className="w-4 h-4" />
            Most Popular
          </span>
        </div>
      )}
      <div className={isPopular ? 'pt-6' : ''}>
        <h3 className="text-2xl font-bold text-foreground mb-2">{name}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="mb-6">
          <span className="text-5xl font-bold text-foreground">{price}</span>
          <span className="text-muted-foreground ml-2">{period}</span>
        </div>
        <Link href={ctaHref}>
          <Button 
            className={`w-full h-12 text-lg ${isPopular ? 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20' : ''}`}
            variant={isPopular ? 'default' : 'outline'}
          >
            {ctaText}
          </Button>
        </Link>
        <div className="mt-8 space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${feature.included ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {feature.included ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <span className="w-2 h-0.5 bg-gray-400 rounded" />
                )}
              </div>
              <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// FAQ component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-lg text-foreground pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
        <p className="text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

// Testimonial card
function TestimonialCard({
  quote,
  author,
  role,
  rating,
}: {
  quote: string
  author: string
  role: string
  rating: number
}) {
  return (
    <Card className="p-8 border border-[#D4AF37]/10 dark:border-[#D4AF37]/20 bg-gradient-to-br from-white to-[#FAF7F0]/30 dark:from-gray-900 dark:to-[#2A2520]/20 hover:shadow-lg transition-all duration-300">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
        ))}
      </div>
      <blockquote className="text-foreground mb-6 leading-relaxed text-lg">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/50 dark:to-[#252018]/50 flex items-center justify-center border border-[#D4AF37]/10">
          <Heart className="w-6 h-6 text-[#B8860B]" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </Card>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Suspense fallback={null}>
        <AuthCodeHandler />
      </Suspense>
      
      <Header rightContent={<AuthButtons />} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5EFE6]/60 via-background to-[#F8F3E9]/40 dark:from-[#2A2520]/40 dark:via-background dark:to-[#252018]/30" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#C9A87C]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInOnScroll>
              <div className="space-y-8 text-center lg:text-left">
                {/* Logo */}
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <Image
                    src="/images/logos/OMW Logo Gold.png"
                    alt="OhMyWedding"
                    width={48}
                    height={48}
                    className="h-12 w-auto"
                    priority
                  />
                  <span className="font-serif text-2xl font-light text-foreground">OhMyWedding</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] text-sm font-medium border border-[#D4AF37]/20">
                  <Sparkles className="w-4 h-4" />
                  Trusted by 10,000+ couples worldwide
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                  The Wedding Website
                  <span className="block mt-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C9A87C] bg-clip-text text-transparent">
                    Your Love Deserves
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Create a stunning wedding website in minutes. Effortlessly manage guests, track RSVPs, and share your love story — all in one beautiful, easy-to-use platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/create-wedding">
                    <Button size="lg" className="bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white h-14 px-8 text-lg w-full sm:w-auto shadow-lg shadow-[#B8860B]/25">
                      Create Your Free Website
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="#pricing">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50 w-full sm:w-auto">
                      View Pricing
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-8 pt-4 justify-center lg:justify-start">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#C9A87C]/30 dark:from-[#D4AF37]/30 dark:to-[#C9A87C]/20 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-[#B8860B]" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">4.9/5 from 2,000+ reviews</p>
                  </div>
                </div>
              </div>
            </FadeInOnScroll>
            
            <FadeInOnScroll delay={200} className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#C9A87C]/20 rounded-3xl transform rotate-3 scale-105" />
                <div className="relative bg-gradient-to-br from-[#FAF7F0] to-[#F5EFE6] dark:from-[#2A2520]/50 dark:to-[#252018]/50 rounded-3xl border border-[#D4AF37]/20 dark:border-[#D4AF37]/30 overflow-hidden aspect-[4/5] shadow-2xl shadow-[#B8860B]/10">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37]" />
                        <div>
                          <div className="h-4 w-32 bg-[#D4AF37]/30 dark:bg-[#D4AF37]/20 rounded" />
                          <div className="h-3 w-24 bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 rounded mt-1" />
                        </div>
                      </div>
                      <div className="h-32 bg-gradient-to-br from-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/50 dark:to-[#252018]/50 rounded-xl flex items-center justify-center">
                        <Heart className="w-12 h-12 text-[#D4AF37]/60" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 rounded" />
                        <div className="h-4 w-3/4 bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 rounded" />
                      </div>
                      <div className="pt-2">
                        <div className="h-10 w-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] rounded-lg" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      [Your wedding website mockup here]
                    </p>
                  </div>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-[#FAF7F0] via-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/30 dark:via-[#252018]/20 dark:to-[#2A2520]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <FadeInOnScroll className="text-center">
              <AnimatedCounter target={10000} suffix="+" />
              <p className="text-muted-foreground mt-2">Happy Couples</p>
            </FadeInOnScroll>
            <FadeInOnScroll delay={100} className="text-center">
              <AnimatedCounter target={500000} suffix="+" />
              <p className="text-muted-foreground mt-2">RSVPs Collected</p>
            </FadeInOnScroll>
            <FadeInOnScroll delay={200} className="text-center">
              <AnimatedCounter target={50} suffix="+" />
              <p className="text-muted-foreground mt-2">Countries</p>
            </FadeInOnScroll>
            <FadeInOnScroll delay={300} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-foreground flex items-center justify-center gap-1">
                4.9 <Star className="w-8 h-8 fill-[#D4AF37] text-[#D4AF37]" />
              </div>
              <p className="text-muted-foreground mt-2">Average Rating</p>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] text-sm font-medium mb-6 border border-[#D4AF37]/20">
                <Zap className="w-4 h-4" />
                Powerful Features
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Everything You Need for Your
                <span className="block mt-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C9A87C] bg-clip-text text-transparent">Perfect Wedding</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                From beautiful websites to seamless guest management, we&apos;ve got every detail covered
              </p>
            </div>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FadeInOnScroll delay={0}>
              <FeatureCard
                icon={<Globe className="w-7 h-7" />}
                title="Beautiful Website"
                description="Create a stunning, mobile-friendly wedding website with our elegant templates and customization options."
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={100}>
              <FeatureCard
                icon={<ImageIcon className="w-7 h-7" />}
                title="Photo Gallery"
                description="Showcase your engagement photos and create memories with beautiful gallery layouts."
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={200}>
              <FeatureCard
                icon={<Calendar className="w-7 h-7" />}
                title="Event Schedule"
                description="Display your wedding day timeline so guests know exactly where to be and when."
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={300}>
              <FeatureCard
                icon={<Gift className="w-7 h-7" />}
                title="Gift Registry"
                description="Link your favorite registries and wishlists for easy gift giving."
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={400}>
              <FeatureCard
                icon={<Users className="w-7 h-7" />}
                title="Guest Management"
                description="Easily manage your guest list, track RSVPs, and organize seating arrangements."
                isPremium
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={500}>
              <FeatureCard
                icon={<Send className="w-7 h-7" />}
                title="Digital Invitations"
                description="Send beautiful digital invitations via WhatsApp or email with one click."
                isPremium
              />
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* App Showcase Section */}
      <section className="py-32 bg-gradient-to-b from-[#FAF7F0]/50 to-background dark:from-[#2A2520]/20 dark:to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInOnScroll>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] text-sm font-medium border border-[#D4AF37]/20">
                  <Palette className="w-4 h-4" />
                  Customization
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                  Make It Uniquely
                  <span className="block mt-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C9A87C] bg-clip-text text-transparent">Yours</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Choose from multiple design variants for each section. Switch between elegant, modern, or minimalist styles with just one click.
                </p>
                <ul className="space-y-4">
                  {[
                    'Multiple theme variants per section',
                    'Custom colors to match your wedding palette',
                    'Real-time preview as you customize',
                    'Mobile-optimized designs',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInOnScroll>
            
            <FadeInOnScroll delay={200}>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/30 dark:to-[#252018]/30 rounded-3xl p-8 border border-[#D4AF37]/20 dark:border-[#D4AF37]/30">
                  <div className="aspect-[4/3] bg-white dark:bg-gray-900 rounded-2xl shadow-lg flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] flex items-center justify-center">
                        <Palette className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-muted-foreground">[App customization screenshot]</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] text-sm font-medium mb-6 border border-[#D4AF37]/20">
                <Crown className="w-4 h-4" />
                Simple Pricing
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Choose Your Plan
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Start for free, upgrade when you&apos;re ready. No hidden fees, no surprises.
              </p>
            </div>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FadeInOnScroll delay={0}>
              <PricingCard
                name="Free"
                price="$0"
                period="forever"
                description="Perfect for getting started"
                features={[
                  { text: 'Beautiful wedding website', included: true },
                  { text: 'Photo gallery', included: true },
                  { text: 'Event schedule', included: true },
                  { text: 'Gift registry links', included: true },
                  { text: 'Basic customization', included: true },
                  { text: 'Guest management', included: false },
                  { text: 'RSVP tracking', included: false },
                  { text: 'Digital invitations', included: false },
                  { text: 'Priority support', included: false },
                ]}
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={100}>
              <PricingCard
                name="Premium"
                price="$29"
                period="one-time payment"
                description="Everything for your big day"
                isPopular
                ctaText="Upgrade to Premium"
                ctaHref="/upgrade"
                features={[
                  { text: 'Everything in Free', included: true },
                  { text: 'Unlimited guests', included: true },
                  { text: 'Advanced RSVP system', included: true },
                  { text: 'Digital invitations via WhatsApp', included: true },
                  { text: 'Guest travel tracking', included: true },
                  { text: 'Dietary preferences tracking', included: true },
                  { text: 'CSV import/export', included: true },
                  { text: 'Priority support', included: true },
                  { text: 'Lifetime access', included: true },
                ]}
              />
            </FadeInOnScroll>
          </div>

          <FadeInOnScroll delay={200}>
            <div className="text-center mt-12">
              <p className="text-muted-foreground">
                💳 Secure payment via Stripe • 🔒 30-day money-back guarantee
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-gradient-to-b from-background to-[#FAF7F0]/50 dark:to-[#2A2520]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] text-sm font-medium mb-6 border border-[#D4AF37]/20">
                <Heart className="w-4 h-4" />
                Love Stories
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                What Couples Say
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Join thousands of happy couples who chose OhMyWedding for their special day
              </p>
            </div>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            <FadeInOnScroll delay={0}>
              <TestimonialCard
                quote="The RSVP system saved us so much time! We could track everything in one place and send reminders with just a click."
                author="Sarah & Michael"
                role="Married June 2025"
                rating={5}
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={100}>
              <TestimonialCard
                quote="Our guests loved how easy it was to RSVP and find all the wedding details. The design was absolutely beautiful!"
                author="Emma & James"
                role="Married August 2025"
                rating={5}
              />
            </FadeInOnScroll>
            <FadeInOnScroll delay={200}>
              <TestimonialCard
                quote="Best investment for our wedding! The guest management features alone saved us countless hours of spreadsheet work."
                author="Jessica & David"
                role="Married October 2025"
                rating={5}
              />
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] text-sm font-medium mb-6 border border-[#D4AF37]/20">
                <MessageSquare className="w-4 h-4" />
                FAQ
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={100}>
            <div className="bg-card rounded-2xl border border-border p-8">
              <FAQItem
                question="How long does my website stay active?"
                answer="Your wedding website stays active forever! We believe your memories should last a lifetime, so we don't take down your site after the wedding. You can keep it as a digital keepsake."
              />
              <FAQItem
                question="Can I upgrade from Free to Premium later?"
                answer="Absolutely! You can upgrade to Premium at any time. Your existing website content and settings will be preserved, and you'll instantly get access to all premium features."
              />
              <FAQItem
                question="How does the RSVP system work?"
                answer="Guests receive a personalized invitation link that takes them to your RSVP page. They verify their identity via phone, then can respond for their entire group. You'll see all responses in real-time in your dashboard."
              />
              <FAQItem
                question="Can I customize the design to match my wedding colors?"
                answer="Yes! You can customize colors throughout your website to match your wedding palette. Premium users get access to additional customization options and multiple design variants for each section."
              />
              <FAQItem
                question="What payment methods do you accept?"
                answer="We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment system. All transactions are encrypted and secure."
              />
              <FAQItem
                question="Do you offer refunds?"
                answer="Yes, we offer a 30-day money-back guarantee. If you're not satisfied with Premium for any reason, contact our support team within 30 days of purchase for a full refund."
              />
              <FAQItem
                question="Can multiple people manage the wedding website?"
                answer="Yes! You can add collaborators to help manage your wedding website. Collaborators can help with guest management, content updates, and more."
              />
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#B8860B] via-[#C9A226] to-[#D4AF37]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <FadeInOnScroll>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
                <Heart className="w-4 h-4 fill-current" />
                Start your journey today
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                Ready to Create Your
                <span className="block mt-2">Wedding Website?</span>
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of couples who&apos;ve created beautiful wedding websites with OhMyWedding. Get started in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/create-wedding">
                  <Button size="lg" className="bg-white text-[#B8860B] hover:bg-white/90 h-14 px-8 text-lg w-full sm:w-auto shadow-lg">
                    Create Your Free Website
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-white/70 text-sm">No credit card required • Takes less than 5 minutes</p>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-muted/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src="/images/logos/OMW Logo Gold.png"
                  alt="OhMyWedding"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="font-serif text-2xl font-light text-foreground">OhMyWedding</span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Creating beautiful wedding websites that help couples celebrate their love story with style.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li>
                  <a
                    href="mailto:support@ohmy.wedding"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8 text-center">
            <p className="text-muted-foreground">
              &copy; {new Date().getFullYear()} OhMyWedding. Made with{' '}
              <Heart className="w-4 h-4 inline text-[#D4AF37] fill-[#D4AF37] mx-1" />{' '}
              for couples in love.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
