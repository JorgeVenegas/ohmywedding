"use client"

import Link from 'next/link'
import Image from 'next/image'
import { PAGE_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/page-templates'
import { COLOR_THEMES, FONT_PAIRINGS } from '@/lib/theme-config'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Eye, ArrowRight, Sparkles, Palette, Type } from 'lucide-react'
import { useState } from 'react'

// Demo images assignment per template
const TEMPLATE_DEMO_IMAGES: Record<string, string> = {
  'classic-elegance': '/images/demo_images/demo-img-1.jpg',
  'modern-minimal': '/images/demo_images/demo-img-10.jpg',
  'romantic-garden': '/images/demo_images/demo-img-20.jpg',
  'rustic-charm': '/images/demo_images/demo-img-30.jpg',
  'luxury-noir': '/images/demo_images/demo-img-40.jpg',
  'simple-love': '/images/demo_images/demo-img-50.jpg',
}

export default function DemoPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const filteredTemplates = categoryFilter
    ? PAGE_TEMPLATES.filter(t => t.category === categoryFilter)
    : PAGE_TEMPLATES

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref="/"
        title="Template Gallery"
        rightContent={
          <Link href="/create-wedding">
            <Button size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Create Your Own
            </Button>
          </Link>
        }
      />

      <div className="page-container">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Beautiful Wedding Templates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our curated collection of wedding website designs. Click on any template to see a live demo with sample content.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              categoryFilter === null
                ? 'bg-primary text-white shadow-md'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            All Templates
          </button>
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                categoryFilter === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map(template => {
            const colorTheme = COLOR_THEMES.find(t => t.id === template.colorThemeId)
            const fontPairing = FONT_PAIRINGS.find(f => f.id === template.fontPairingId)
            const demoImage = TEMPLATE_DEMO_IMAGES[template.id] || '/images/demo_images/demo-img-1.jpg'

            return (
              <Card key={template.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                {/* Preview Area with actual image */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Image
                    src={demoImage}
                    alt={`${template.name} preview`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Overlay with template info */}
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                    style={{
                      background: `linear-gradient(to top, ${colorTheme?.colors.primary}90, ${colorTheme?.colors.primary}40, transparent)`
                    }}
                  >
                    <div className="mt-auto">
                      <div 
                        className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-1"
                        style={{ fontFamily: fontPairing?.displayFamily }}
                      >
                        {template.demoCouple.partner1FirstName} & {template.demoCouple.partner2FirstName}
                      </div>
                      <div 
                        className="text-sm text-white/90"
                        style={{ fontFamily: fontPairing?.bodyFamily }}
                      >
                        {new Date(template.demoCouple.weddingDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link href={`/demo-${template.id}`}>
                      <Button variant="secondary" size="lg" className="gap-2">
                        <Eye className="w-5 h-5" />
                        View Demo
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{template.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  
                  {/* Color palette and fonts - improved layout */}
                  <div className="flex items-center gap-3 mb-4 p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex gap-1">
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: colorTheme?.colors.primary }}
                          title="Primary"
                        />
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: colorTheme?.colors.secondary }}
                          title="Secondary"
                        />
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: colorTheme?.colors.accent }}
                          title="Accent"
                        />
                      </div>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Type className="w-3.5 h-3.5" />
                      <span className="font-medium" style={{ fontFamily: fontPairing?.displayFamily }}>{fontPairing?.display}</span>
                      <span className="text-muted-foreground/50">/</span>
                      <span style={{ fontFamily: fontPairing?.bodyFamily }}>{fontPairing?.body}</span>
                    </div>
                  </div>

                  {/* Enabled sections */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.components.filter(c => c.enabled).map(c => (
                      <span 
                        key={c.id} 
                        className="px-2 py-0.5 text-[10px] rounded-full text-muted-foreground border border-border/50"
                      >
                        {c.type.replace('-', ' ')}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/demo/${template.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                    </Link>
                    <Link href={`/create-wedding?template=${template.id}`} className="flex-1">
                      <Button className="w-full gap-2">
                        Use Template
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#D4AF37]/10 via-[#C9A87C]/10 to-[#B8860B]/10 rounded-2xl p-8 md:p-12 border border-[#D4AF37]/20">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Want something unique?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Use our AI-powered designer to create a custom wedding website based on your vision. Just describe what you want!
            </p>
            <Link href="/create-wedding">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Create with AI
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}