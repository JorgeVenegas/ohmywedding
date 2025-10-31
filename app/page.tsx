"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Calendar, Users, Gift, ImageIcon, MessageSquare, Star, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <Header
        rightContent={
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground hover:bg-muted">
                Sign In
              </Button>
            </Link>
            <Link href="/create-wedding">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Create Wedding</Button>
            </Link>
          </div>
        }
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-accent/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 text-center lg:text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Heart className="w-4 h-4 fill-current" />
                  Trusted by 5,000+ couples
                </div>
                <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-light text-foreground leading-none">
                  Your Love Story
                  <span className="block text-primary italic">Beautifully Told</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed font-light">
                  Create an elegant wedding website that captures your unique journey. Share your story, celebrate with loved ones, and treasure every moment.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/create-wedding">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto h-14 px-8 text-lg">
                    Begin Your Story
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/variant-demo">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-primary/20 hover:bg-primary/5 w-full sm:w-auto h-14 px-8 text-lg"
                  >
                    🎨 Try Demo
                  </Button>
                </Link>
              </div>
              
              {/* Demo Links */}
              <div className="flex flex-col sm:flex-row gap-2 text-sm justify-center lg:justify-start mt-4">
                <Link href="/variant-demo" className="text-primary hover:text-primary/80 font-medium">
                  🎨 Interactive Variant Demo
                </Link>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <Link href="/showcase" className="text-primary hover:text-primary/80 font-medium">
                  📋 Design Showcase
                </Link>
              </div>
              
              {/* Demo Instructions */}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <h4 className="font-semibold text-sm text-primary mb-2">🎯 Try Variant Switching:</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Add <code className="bg-background/50 px-1 rounded">?demo=true</code> to any wedding URL to see variant toggles!
                </p>
                <p className="text-xs text-muted-foreground">
                  Or visit our dedicated demo pages above to explore all design options.
                </p>
              </div>
              <div className="flex items-center gap-8 pt-6 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-3xl font-serif font-light text-foreground">5,000+</div>
                  <div className="text-sm text-muted-foreground font-light">Happy Couples</div>
                </div>
                <div className="w-px h-16 bg-border/50" />
                <div className="text-center">
                  <div className="text-3xl font-serif font-light text-foreground flex items-center gap-1">
                    4.9
                    <Star className="w-5 h-5 text-primary fill-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground font-light">Perfect Rating</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-3" />
                <div className="relative bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                    <div className="text-center p-12">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="w-16 h-16 text-primary/40" />
                      </div>
                      <h3 className="font-serif text-2xl text-foreground mb-2">Madison & Lenox</h3>
                      <p className="text-muted-foreground font-light">are tying the knot</p>
                      <div className="mt-8 p-4 bg-background/50 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Save the Date</div>
                        <div className="font-serif text-lg text-foreground">June 15, 2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Everything you need for your perfect day
            </div>
            <h2 className="font-serif text-5xl sm:text-6xl font-light text-foreground mb-6 text-balance">
              Crafted with <span className="text-primary italic">Love</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance font-light leading-relaxed">
              Every detail thoughtfully designed to help you create a wedding website as unique and beautiful as your love story
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Event Timeline"
              description="Share your ceremony, reception, and special moments with guests"
              accent="primary"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="RSVP Management"
              description="Easily track guest responses and dietary preferences"
              accent="secondary"
            />
            <FeatureCard
              icon={<Gift className="w-8 h-8" />}
              title="Gift Registry"
              description="Link to your favorite registries and wishlists"
              accent="accent"
            />
            <FeatureCard
              icon={<ImageIcon className="w-8 h-8" />}
              title="Photo Gallery"
              description="Showcase engagement photos and let guests share moments"
              accent="primary"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Guest Messages"
              description="Collect wishes and well-wishes from your loved ones"
              accent="secondary"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Custom Design"
              description="Choose colors and themes that match your style"
              accent="accent"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              Trusted by couples worldwide
            </div>
            <h2 className="font-serif text-5xl sm:text-6xl font-light text-foreground mb-6 text-balance">
              Stories of <span className="text-primary italic">Love</span>
            </h2>
            <p className="text-xl text-muted-foreground text-balance font-light leading-relaxed max-w-3xl mx-auto">
              Discover how couples around the world have brought their love stories to life with our elegant wedding websites
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <TestimonialCard
              quote="WedSite made planning our wedding website so easy. Our guests loved it!"
              author="Sarah & Michael"
              rating={5}
            />
            <TestimonialCard
              quote="The RSVP management feature saved us so much time. Highly recommend!"
              author="Emma & James"
              rating={5}
            />
            <TestimonialCard
              quote="Beautiful design, easy to use, and amazing customer support. Perfect!"
              author="Jessica & David"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
              <Heart className="w-4 h-4 fill-current" />
              Start your journey today
            </div>
            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-6 text-balance">
              Your Love Story
              <span className="block italic">Awaits</span>
            </h2>
            <p className="text-xl text-white/90 mb-10 text-balance font-light leading-relaxed max-w-3xl mx-auto">
              Join thousands of couples who have created their perfect wedding website. Your beautiful love story deserves a beautiful beginning.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/create-wedding">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto h-16 px-10 text-lg font-medium">
                  Begin Your Story
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto h-16 px-10 text-lg"
                >
                  View Examples
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-muted/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-8 h-8 text-primary fill-primary" />
                <span className="font-serif text-2xl font-light text-foreground">OhMyWedding</span>
              </div>
              <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-md">
                Creating beautiful, elegant wedding websites that capture your unique love story and help you celebrate with those who matter most.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Templates
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8 text-center">
            <p className="text-muted-foreground font-light">&copy; 2025 OhMyWedding. Made with <Heart className="w-4 h-4 inline text-primary fill-primary mx-1" /> for couples in love.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  accent = "primary",
}: {
  icon: React.ReactNode
  title: string
  description: string
  accent?: "primary" | "secondary" | "accent"
}) {
  const accentColors = {
    primary: "text-primary bg-primary/5",
    secondary: "text-secondary bg-secondary/5",
    accent: "text-accent bg-accent/5",
  }

  return (
    <Card className="p-10 border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-500 group hover:shadow-xl hover:-translate-y-1">
      <div className={`w-16 h-16 rounded-2xl ${accentColors[accent]} mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="font-serif text-2xl font-light text-foreground mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed font-light text-lg">{description}</p>
    </Card>
  )
}

function TestimonialCard({
  quote,
  author,
  rating,
}: {
  quote: string
  author: string
  rating: number
}) {
  return (
    <Card className="p-10 border-0 bg-card/70 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-lg">
      <div className="flex gap-1 mb-6">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
        ))}
      </div>
      <blockquote className="text-foreground mb-8 leading-relaxed text-lg font-light">
        "{quote}"
      </blockquote>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary fill-primary" />
        </div>
        <div>
          <p className="font-serif text-lg text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground font-light">Happy Couple</p>
        </div>
      </div>
    </Card>
  )
}
