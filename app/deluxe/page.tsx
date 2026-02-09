"use client"

import React, { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion, useInView } from "framer-motion"
import {
  Check,
  ArrowRight,
  Heart,
  Users,
  Gift,
  Globe,
  Send,
  Eye,
  MessageSquare,
  Shield,
  Sparkles,
  ChevronDown,
  Star,
  Crown,
  Palette,
  Clock,
  Headphones,
  Gem,
  Layers,
  Calendar,
  FileText,
  BarChart3,
  Infinity,
} from "lucide-react"
import { PRICING, PLAN_CARDS, COMPARISON_FEATURES } from "@/lib/subscription-shared"

// ============================================
// HERO SECTION
// ============================================

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0a0d] via-[#420c14] to-[#1a0a0d]">
      {/* Decorative gold elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-[5%] w-[500px] h-[500px] rounded-full bg-[#DDA46F]/3 blur-[120px]" />
        <div className="absolute bottom-1/4 right-[10%] w-[400px] h-[400px] rounded-full bg-[#DDA46F]/4 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#DDA46F]/2 blur-[200px]" />
      </div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('/images/pattern-subtle.png')] opacity-5" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-[#DDA46F]" />
            <p className="text-[10px] sm:text-xs tracking-[0.5em] text-[#DDA46F] uppercase font-medium">
              Deluxe Experience
            </p>
            <Crown className="w-5 h-5 text-[#DDA46F]" />
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif text-[#f5f2eb] leading-[1.05] mb-8">
            We Take Care of{" "}
            <span className="block text-[#DDA46F] italic">Everything</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#f5f2eb]/50 max-w-2xl mx-auto leading-relaxed mb-4">
            A fully bespoke wedding page, designed and built by our team with exceptional attention to detail. Every element custom-made, every pixel personalized to tell your unique love story.
          </p>

          <p className="text-4xl sm:text-5xl font-serif text-[#DDA46F] mb-2">
            {PRICING.deluxe.priceDisplayMXN}
          </p>
          <p className="text-sm text-[#f5f2eb]/30 mb-12">One-time payment • Completely personalized • Yours forever</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upgrade?plan=deluxe&source=deluxe_page_hero">
              <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-base px-12 py-7 rounded-full font-medium shadow-xl shadow-[#DDA46F]/20 border border-[#DDA46F]/50">
                Get Deluxe
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#experience" className="text-[#f5f2eb]/40 hover:text-[#DDA46F] transition-colors text-sm flex items-center gap-2">
              Discover the experience
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#f5f2eb] to-transparent" />
    </section>
  )
}

// ============================================
// THE DELUXE DIFFERENCE
// ============================================

function DifferenceSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="experience" ref={ref} className="py-24 sm:py-36 bg-[#f5f2eb] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">The Deluxe Difference</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-6">
            Not a Template.<br />
            <span className="text-[#DDA46F]">A Masterpiece.</span>
          </h2>
          <p className="text-lg text-[#420c14]/50 max-w-2xl mx-auto leading-relaxed">
            While other plans use pre-built components, Deluxe is entirely different. We interview you, understand your vision, and hand-craft every section of your wedding page from scratch.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Palette,
              title: "Bespoke Design",
              description: "Every component is custom-designed to match your style, colors, and personality. No templates — everything is made just for you.",
              accent: true,
            },
            {
              icon: Layers,
              title: "Custom Components",
              description: "We build unique sections that don't exist in any template library. A timeline of your story, interactive galleries, animated elements — whatever you dream, we build.",
              accent: false,
            },
            {
              icon: Headphones,
              title: "Dedicated Agent",
              description: "You get a dedicated personal support agent who knows your wedding inside and out. Direct communication, quick turnaround, and personalized attention.",
              accent: false,
            },
            {
              icon: Gem,
              title: "Exceptional Detail",
              description: "From micro-animations to typography pairing, every detail is polished to perfection. Your wedding page will feel like a luxury brand experience.",
              accent: true,
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className={`p-8 sm:p-10 rounded-2xl border ${
                item.accent
                  ? "bg-[#420c14] border-[#DDA46F]/20"
                  : "bg-white border-[#420c14]/5"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${
                item.accent
                  ? "bg-[#DDA46F]/10 border border-[#DDA46F]/30"
                  : "bg-[#DDA46F]/10 border border-[#DDA46F]/20"
              }`}>
                <item.icon className={`w-5 h-5 ${item.accent ? "text-[#DDA46F]" : "text-[#DDA46F]"}`} />
              </div>
              <h3 className={`text-xl font-serif mb-3 ${item.accent ? "text-[#f5f2eb]" : "text-[#420c14]"}`}>
                {item.title}
              </h3>
              <p className={`text-sm leading-relaxed ${item.accent ? "text-[#f5f2eb]/60" : "text-[#420c14]/50"}`}>
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// EVERYTHING INCLUDED
// ============================================

const deluxeFeatures = [
  {
    icon: Palette,
    title: "Completely Personalized Design",
    description: "Your wedding page is designed from scratch. We match your style, your colors, your vibe — down to the last detail.",
  },
  {
    icon: Layers,
    title: "Bespoke Custom Components",
    description: "Unique sections built just for you. Interactive timelines, custom galleries, animated love stories — beyond any template.",
  },
  {
    icon: Headphones,
    title: "Dedicated Personal Agent",
    description: "A dedicated support agent who manages your entire project. Direct communication, fast responses, and someone who truly knows your wedding.",
  },
  {
    icon: Users,
    title: "Unlimited Guests",
    description: "No guest limits. Manage unlimited guests and groups with the most advanced RSVP and tracking system available.",
  },
  {
    icon: Send,
    title: "Personalized Invitations",
    description: "Beautiful digital invitations with full open and engagement tracking. Know exactly who received, opened, and responded.",
  },
  {
    icon: Gift,
    title: "Premium Registry",
    description: "Accept gifts and contributions securely through Stripe. Professional payouts directly to your verified account.",
  },
  {
    icon: Globe,
    title: "Custom Domain",
    description: "Your personalized subdomain or connect your own custom domain. Your website, your address, your brand.",
  },
  {
    icon: Eye,
    title: "1 Month Activity Tracking",
    description: "30 days of detailed activity retention. Track every interaction with comprehensive analytics and insights.",
  },
  {
    icon: BarChart3,
    title: "Daily Reports",
    description: "Receive daily activity reports with detailed breakdowns of RSVPs, invitation opens, contributions, and more.",
  },
  {
    icon: Shield,
    title: "Priority Support",
    description: "You're never waiting. Get priority responses and direct access to our design and support team throughout your journey.",
  },
  {
    icon: Calendar,
    title: "Website Forever",
    description: "Your bespoke wedding page stays online forever. A digital heirloom that preserves your love story for generations.",
  },
  {
    icon: Sparkles,
    title: "We Build Everything",
    description: "You don't lift a finger. Tell us your vision and we handle the design, development, content, and launch. You just approve.",
  },
]

function EverythingIncludedSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">Everything Included</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-4">
            The Complete Package
          </h2>
          <p className="text-[#420c14]/50 max-w-xl mx-auto">
            Every feature we offer, plus exclusive bespoke services that go far beyond any template
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deluxeFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.06 }}
              className="p-6 rounded-2xl border border-[#420c14]/5 hover:border-[#DDA46F]/30 hover:shadow-lg transition-all duration-500 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#DDA46F]/10 flex items-center justify-center mb-4 group-hover:bg-[#DDA46F]/20 transition-colors border border-[#DDA46F]/20">
                <feature.icon className="w-4 h-4 text-[#DDA46F]" />
              </div>
              <h3 className="font-medium text-[#420c14] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#420c14]/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// THE PROCESS
// ============================================

function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const steps = [
    {
      number: "01",
      title: "Discovery",
      description: "We start with a conversation. Tell us about your love story, your style, your vision. We listen to every detail.",
    },
    {
      number: "02",
      title: "Design",
      description: "Our team creates a bespoke design concept based on your vision. We iterate until every detail is exactly right.",
    },
    {
      number: "03",
      title: "Build",
      description: "We hand-build your wedding page with custom components, animations, and interactions. Every pixel is crafted with care.",
    },
    {
      number: "04",
      title: "Review",
      description: "You review the final result. We refine anything you'd like adjusted — your satisfaction is our priority.",
    },
    {
      number: "05",
      title: "Launch",
      description: "We launch your website, set up invitations, and make sure everything is perfect. Then we stay available until your big day and beyond.",
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">The Journey</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-4">
            How We Work Together
          </h2>
          <p className="text-[#420c14]/50 max-w-xl mx-auto">
            From first conversation to the big day — here&apos;s what the Deluxe experience looks like
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-[#DDA46F]/20 hidden sm:block" />

          <div className="space-y-8 sm:space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="flex gap-4 sm:gap-8"
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#420c14] border-2 border-[#DDA46F]/30 flex items-center justify-center relative z-10">
                  <span className="text-sm sm:text-lg font-serif text-[#DDA46F]">{step.number}</span>
                </div>
                <div className="pt-1 sm:pt-3">
                  <h3 className="text-xl font-serif text-[#420c14] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#420c14]/50 leading-relaxed max-w-md">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// PREMIUM VS DELUXE COMPARISON
// ============================================

function PlanComparisonSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const differences = [
    { aspect: "Who builds the page", premium: "You, with our guidance", deluxe: "We build everything for you" },
    { aspect: "Design approach", premium: "Pre-built premium templates", deluxe: "Completely bespoke, designed from scratch" },
    { aspect: "Components", premium: "Existing premium components", deluxe: "Custom-made, unique components" },
    { aspect: "Support", premium: "Expert guidance & advice", deluxe: "Dedicated personal agent" },
    { aspect: "Guest limit", premium: "Up to 250", deluxe: "Unlimited" },
    { aspect: "Activity tracking", premium: "1 week retention", deluxe: "1 month retention" },
    { aspect: "Reports", premium: "Weekly reports", deluxe: "Daily reports" },
    { aspect: "Price", premium: PRICING.premium.priceDisplayMXN, deluxe: PRICING.deluxe.priceDisplayMXN },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">Compare</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14] mb-4">Premium vs Deluxe</h2>
          <p className="text-[#420c14]/50 max-w-md mx-auto">
            Both are excellent. The question is: do you want to build it, or do you want us to handle everything?
          </p>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#420c14]/10">
                <th className="text-left py-4 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider" />
                <th className="text-center py-4 px-4 font-medium text-[#420c14]/50 text-xs uppercase tracking-wider w-40">Premium</th>
                <th className="text-center py-4 px-4 font-medium text-[#DDA46F] text-xs uppercase tracking-wider w-40 bg-[#DDA46F]/5 rounded-t-xl">
                  <Crown className="w-3 h-3 mx-auto mb-1" />
                  Deluxe
                </th>
              </tr>
            </thead>
            <tbody>
              {differences.map((d, i) => (
                <motion.tr
                  key={d.aspect}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                  className="border-b border-[#420c14]/5"
                >
                  <td className="py-4 px-4 text-[#420c14]/70 font-medium">{d.aspect}</td>
                  <td className="py-4 px-4 text-center text-[#420c14]/50 text-xs">{d.premium}</td>
                  <td className="py-4 px-4 text-center text-[#420c14] font-medium text-xs bg-[#DDA46F]/5">{d.deluxe}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/upgrade?plan=deluxe&source=deluxe_page_comparison">
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] px-8 py-5 rounded-full font-medium">
              Get Deluxe
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/premium" className="text-sm text-[#420c14]/40 hover:text-[#DDA46F] transition-colors">
            Learn about Premium
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================
// TESTIMONIALS
// ============================================

function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const testimonials = [
    {
      quote: "We didn't want a template — we wanted something that felt truly ours. The Deluxe team created a wedding page that brought tears to our eyes. Every detail was perfect.",
      name: "Valentina & Mateo",
      detail: "Destination Wedding in Tulum",
    },
    {
      quote: "Having a dedicated agent made everything so easy. We told them our vision and they brought it to life beyond what we imagined. Our guests are still talking about the website.",
      name: "Isabella & Santiago",
      detail: "Wedding in San Miguel de Allende",
    },
    {
      quote: "The custom animations and interactive timeline of our love story were absolutely stunning. It wasn't just a website — it was a work of art. Worth every centavo.",
      name: "Camila & Sebastián",
      detail: "Wedding in Valle de Bravo",
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">Stories</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14]">Loved by Couples</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="p-8 rounded-2xl bg-white border border-[#420c14]/5 shadow-sm"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-[#DDA46F] fill-[#DDA46F]" />
                ))}
              </div>
              <p className="text-[#420c14]/70 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-medium text-[#420c14] text-sm">{t.name}</p>
                <p className="text-xs text-[#420c14]/40">{t.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FOR WHO
// ============================================

function ForWhoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const profiles = [
    {
      title: "Busy Couples",
      description: "You have a million things to plan. Let us handle the website entirely — one less thing to worry about.",
    },
    {
      title: "Design Lovers",
      description: "You appreciate fine design and want something truly unique. Templates just won't do for your special day.",
    },
    {
      title: "Destination Weddings",
      description: "Your guests need travel info, accommodation details, and logistics in a beautiful, organized way.",
    },
    {
      title: "Large Celebrations",
      description: "500+ guests? Unlimited capacity, advanced group management, and detailed tracking make it seamless.",
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">Perfect For</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight">
            Is Deluxe Right for You?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {profiles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="flex gap-4 p-6 rounded-2xl bg-[#f5f2eb] border border-[#420c14]/5"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#DDA46F]/10 flex items-center justify-center border border-[#DDA46F]/20">
                <Check className="w-4 h-4 text-[#DDA46F]" />
              </div>
              <div>
                <h3 className="font-medium text-[#420c14] mb-1">{p.title}</h3>
                <p className="text-sm text-[#420c14]/50 leading-relaxed">{p.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FAQ
// ============================================

function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const faqs = [
    {
      q: "What exactly do I get with Deluxe?",
      a: `Everything. We design and build a completely bespoke wedding page from scratch — custom components, unique design, personalized content, and a dedicated personal agent. All for a one-time payment of ${PRICING.deluxe.priceDisplayMXN}.`,
    },
    {
      q: "How is this different from Premium?",
      a: "With Premium, you build your website using our premium templates and components, and we provide guidance. With Deluxe, you don't build anything — we handle the entire process. We design bespoke components that don't exist anywhere else, completely personalized to your wedding.",
    },
    {
      q: "Do I need to know anything about web design?",
      a: "Absolutely not. You just need to tell us about your wedding and your vision. We handle everything — design, development, content, setup, and launch. You review, give feedback, and approve.",
    },
    {
      q: "How long does the process take?",
      a: "Typically 2-3 weeks from discovery to launch, depending on complexity and revisions. We work on your timeline and can expedite for urgent weddings.",
    },
    {
      q: "How many revisions do I get?",
      a: "We iterate until you're completely satisfied. Our goal is perfection, and we don't launch until you love every detail of your wedding page.",
    },
    {
      q: "What does 'dedicated personal agent' mean?",
      a: "You get assigned a specific team member who manages your entire project. They're your single point of contact — you can message them directly, and they'll know every detail about your wedding and preferences.",
    },
    {
      q: "Can I still make changes after launch?",
      a: "Of course! Your dedicated agent remains available to make adjustments. Need to update RSVPs, add details, or tweak the design? We've got you covered.",
    },
    {
      q: "Is there a guest limit?",
      a: "No. Deluxe includes unlimited guests and unlimited groups. Whether you're having 50 guests or 1,000, we handle it seamlessly.",
    },
    {
      q: "What if I already have a Premium plan?",
      a: "You can upgrade to Deluxe and only pay the difference. All your existing content and data carries over — we just redesign and rebuild everything to the Deluxe standard.",
    },
    {
      q: "Is the payment secure?",
      a: "Yes. We use Stripe for all transactions. For Mexican bank transfers, you'll receive secure SPEI/CLABE details during checkout. Your payment information is never stored on our servers.",
    },
  ]

  return (
    <section id="faq" ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">Questions</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14]">Frequently Asked Questions</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.04 }}
              className="group bg-white rounded-xl border border-[#420c14]/5 overflow-hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 text-[#420c14] font-medium text-sm hover:bg-[#DDA46F]/5 transition-colors list-none">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-[#420c14]/40 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
              </summary>
              <div className="px-5 pb-5 text-sm text-[#420c14]/60 leading-relaxed">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FINAL CTA
// ============================================

function FinalCTASection() {
  return (
    <section className="py-24 sm:py-36 bg-gradient-to-b from-[#1a0a0d] via-[#420c14] to-[#1a0a0d] relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#DDA46F]/5 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Crown className="w-10 h-10 text-[#DDA46F] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#f5f2eb] mb-6 leading-tight">
            Your Love Story{" "}
            <span className="text-[#DDA46F] italic">Deserves</span>{" "}
            the Best
          </h2>
          <p className="text-lg text-[#f5f2eb]/40 mb-4 max-w-xl mx-auto">
            A completely bespoke wedding page, designed and built by our team with exceptional attention to every detail.
          </p>
          <p className="text-3xl sm:text-4xl font-serif text-[#DDA46F] mb-2">
            {PRICING.deluxe.priceDisplayMXN}
          </p>
          <p className="text-sm text-[#f5f2eb]/30 mb-12">One-time payment • Completely personalized • Yours forever</p>
          <Link href="/upgrade?plan=deluxe&source=deluxe_page_cta">
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-lg px-14 py-7 rounded-full font-medium shadow-xl shadow-[#DDA46F]/20 border border-[#DDA46F]/50">
              Get Deluxe
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  return (
    <footer className="bg-[#1a0a0d] border-t border-[#DDA46F]/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image src="/images/logos/OMW Logo Gold.png" alt="OhMyWedding" width={32} height={32} className="h-8 w-auto" />
          <span className="font-serif text-xl text-[#f5f2eb]">OhMyWedding</span>
        </div>
        <p className="text-[#f5f2eb]/30 text-sm">
          © {new Date().getFullYear()} OhMyWedding. Made with{" "}
          <Heart className="w-3 h-3 inline text-[#DDA46F] fill-[#DDA46F] mx-0.5" />{" "}
          for couples in love.
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#f5f2eb]/20">
          <Link href="/privacy" className="hover:text-[#DDA46F] transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-[#DDA46F] transition-colors">Terms</Link>
          <Link href="/" className="hover:text-[#DDA46F] transition-colors">Home</Link>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// HEADER
// ============================================

function SimpleHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a0a0d]/90 backdrop-blur-xl border-b border-[#DDA46F]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logos/OMW Logo Gold.png" alt="OhMyWedding" width={28} height={28} className="h-7 w-auto" />
          <span className="font-serif text-lg text-[#f5f2eb]">OhMyWedding</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/premium" className="text-xs text-[#f5f2eb]/50 hover:text-[#DDA46F] transition-colors hidden sm:block">
            Premium Plan
          </Link>
          <Link href="/upgrade?plan=deluxe&source=deluxe_page_nav">
            <Button size="sm" className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] rounded-full text-xs px-5 border border-[#DDA46F]/50">
              <Crown className="w-3 h-3 mr-1" />
              Get Deluxe
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function DeluxePlanPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb]">
      <SimpleHeader />
      <HeroSection />
      <DifferenceSection />
      <EverythingIncludedSection />
      <ProcessSection />
      <ForWhoSection />
      <PlanComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}
