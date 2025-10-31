# Wedding Site Modular Component System

This project features a powerful modular component system that allows you to create completely customizable wedding websites using configuration objects instead of hardcoding layouts.

## Overview

The system consists of:
- **Modular Components**: Reusable sections (Hero, Our Story, Event Details, etc.)
- **Theme Configuration**: Colors, fonts, spacing, alignment
- **Component Configuration**: Props, ordering, enable/disable
- **Page Renderer**: Dynamically renders components based on configuration

## Quick Start

```tsx
import { WeddingPageRenderer } from '@/components/wedding-page-renderer'
import { createConfigFromWedding } from '@/lib/wedding-configs'

export default function WeddingPage({ wedding, dateId, weddingNameId }) {
  const config = createConfigFromWedding(wedding, 'classic')
  
  return (
    <WeddingPageRenderer 
      wedding={wedding}
      dateId={dateId}
      weddingNameId={weddingNameId}
      config={config}
    />
  )
}
```

## Available Components

### Core Components
- **Hero Section**: Welcome, names, date, tagline, countdown
- **Our Story**: How we met, proposal, photo timeline
- **Event Details**: Ceremony, reception, venues, dress code
- **RSVP**: Embedded form or CTA button
- **Gallery**: Photo grid with optional videos
- **FAQ**: Expandable question/answer pairs
- **Countdown**: Live timer to wedding date

### Advanced Components (Coming Soon)
- **Wedding Party**: Bridesmaids, groomsmen bios
- **Schedule**: Full weekend itinerary
- **Travel**: Hotels, airports, transportation
- **Registry**: Gift registry links and QR codes
- **Guestbook**: Text and photo entries
- **Contact**: Contact form and info
- **Livestream**: Embedded video streaming
- **Thank You**: Post-wedding message

## Configuration Structure

### Theme Configuration
```typescript
interface ThemeConfig {
  colors: {
    primary: string      // Main brand color
    secondary: string    // Secondary brand color  
    accent: string       // Accent highlights
    background: string   // Page background
    foreground: string   // Main text color
    muted: string        // Secondary text color
  }
  fonts: {
    heading: 'serif' | 'sans-serif' | 'script'
    body: 'serif' | 'sans-serif'
    script: 'cursive'
  }
  spacing: {
    section: string      // Section padding classes
    container: string    // Container width classes
  }
}
```

### Component Configuration
```typescript
interface ComponentConfig {
  id: string                    // Unique identifier
  type: ComponentType           // Component type
  enabled: boolean              // Show/hide component
  order: number                 // Display order
  props: Record<string, any>    // Component-specific props
  theme?: Partial<ThemeConfig>  // Component theme overrides
  alignment?: AlignmentConfig   // Text/content alignment
}
```

### Alignment Configuration
```typescript
interface AlignmentConfig {
  text: 'left' | 'center' | 'right'     // Text alignment
  content: 'left' | 'center' | 'right'  // Content alignment
  image: 'left' | 'center' | 'right'    // Image alignment
}
```

## Pre-Built Styles

### Classic Wedding
- Elegant serif fonts
- Warm color palette
- Traditional layout
- All essential components

### Modern Minimalist
- Clean sans-serif fonts
- Neutral colors
- Spacious layout
- Focused content

### Rustic Bohemian
- Script/handwritten fonts
- Earth tone colors
- Photo-heavy timeline
- Garden party feel

## Customization Examples

### 1. Change Wedding Style
```typescript
// Classic style (default)
const config = createConfigFromWedding(wedding, 'classic')

// Modern minimalist
const config = createConfigFromWedding(wedding, 'modern')

// Rustic bohemian  
const config = createConfigFromWedding(wedding, 'rustic')
```

### 2. Custom Colors
```typescript
const config = {
  ...classicWeddingConfig,
  theme: {
    ...classicWeddingConfig.theme,
    colors: {
      primary: '#8B4F7D',    // Custom purple
      secondary: '#6B8E5A',  // Custom green
      accent: '#D4A574',     // Custom gold
      background: '#FFFFFF',
      foreground: '#2D2D2D',
      muted: '#6B7280'
    }
  }
}
```

### 3. Enable/Disable Components
```typescript
const config = {
  ...classicWeddingConfig,
  components: classicWeddingConfig.components.map(comp => ({
    ...comp,
    enabled: comp.type !== 'countdown' // Disable countdown
  }))
}
```

### 4. Reorder Components
```typescript
const config = {
  ...classicWeddingConfig,
  components: classicWeddingConfig.components.map(comp => ({
    ...comp,
    order: comp.type === 'gallery' ? 1 : comp.order + 1 // Move gallery to top
  }))
}
```

### 5. Customize Component Props
```typescript
const config = {
  ...classicWeddingConfig,
  components: classicWeddingConfig.components.map(comp => 
    comp.type === 'hero' 
      ? { 
          ...comp, 
          props: { 
            ...comp.props, 
            tagline: 'Our custom love story begins!',
            showCountdown: false 
          }
        }
      : comp
  )
}
```

### 6. Add Custom Questions to RSVP
```typescript
const config = {
  ...classicWeddingConfig,
  components: classicWeddingConfig.components.map(comp =>
    comp.type === 'rsvp'
      ? {
          ...comp,
          props: {
            ...comp.props,
            customQuestions: [
              {
                id: 'song-request',
                question: 'Song requests for dancing?',
                type: 'text',
                required: false
              },
              {
                id: 'transportation',
                question: 'Will you need transportation?',
                type: 'select',
                options: ['I have my own transport', 'Yes, please arrange', 'Not sure yet'],
                required: false
              }
            ]
          }
        }
      : comp
  )
}
```

### 7. Timeline Format for Our Story
```typescript
const config = {
  ...classicWeddingConfig,
  components: classicWeddingConfig.components.map(comp =>
    comp.type === 'our-story'
      ? {
          ...comp,
          props: {
            timeline: [
              {
                date: 'Spring 2020',
                title: 'First Meeting',
                description: 'We met at a coffee shop during quarantine...',
                photo: '/timeline-1.jpg'
              },
              {
                date: 'Summer 2022',
                title: 'Moving In Together',
                description: 'We decided to take the next step...',
                photo: '/timeline-2.jpg'
              },
              {
                date: 'Winter 2023',
                title: 'The Proposal',
                description: 'Under the Christmas lights...',
                photo: '/timeline-3.jpg'
              }
            ]
          }
        }
      : comp
  )
}
```

## Component Props Reference

### Hero Section Props
```typescript
{
  showCoverImage?: boolean
  showTagline?: boolean
  tagline?: string
  coverImageUrl?: string
  showCountdown?: boolean
  showRSVPButton?: boolean
}
```

### Our Story Props
```typescript
{
  showHowWeMet?: boolean
  showProposal?: boolean
  showPhotos?: boolean
  howWeMetText?: string
  proposalText?: string
  photos?: Photo[]
  timeline?: TimelineEvent[]
}
```

### RSVP Props
```typescript
{
  embedForm?: boolean              // Show full form vs CTA button
  showMealPreferences?: boolean
  showCustomQuestions?: boolean
  customQuestions?: CustomQuestion[]
}
```

### Gallery Props
```typescript
{
  showEngagementPhotos?: boolean
  showVideoSupport?: boolean
  photos?: Photo[]
  videos?: Video[]
  maxDisplayPhotos?: number
  showViewAllButton?: boolean
}
```

### FAQ Props
```typescript
{
  questions?: FAQItem[]
  allowMultipleOpen?: boolean
}
```

### Event Details Props
```typescript
{
  showCeremony?: boolean
  showReception?: boolean
  showDressCode?: boolean
  showMapLinks?: boolean
  dressCode?: string
  customEvents?: CustomEvent[]
}
```

## File Structure

```
components/
├── wedding-sections/
│   ├── section-wrapper.tsx       # Base wrapper with theming
│   ├── hero-section.tsx          # Hero/welcome component
│   ├── our-story-section.tsx     # Story and timeline
│   ├── event-details-section.tsx # Venue and event info
│   ├── rsvp-section.tsx          # RSVP form/CTA
│   ├── gallery-section.tsx       # Photo gallery
│   ├── faq-section.tsx           # FAQ accordion
│   ├── countdown-section.tsx     # Wedding countdown
│   └── index.ts                  # Export all components
├── wedding-page-renderer.tsx     # Main page renderer
└── ui/                          # Shadcn/ui components

lib/
├── wedding-config.ts            # Type definitions and defaults
├── wedding-configs.ts           # Pre-built configurations
└── wedding-config-examples.ts   # Usage examples
```

## Best Practices

1. **Start with a pre-built style** and customize from there
2. **Use the theme system** for consistent colors and fonts
3. **Test different component orders** to find the best flow
4. **Customize props gradually** rather than all at once
5. **Keep accessibility in mind** when choosing colors and fonts
6. **Test on mobile devices** as components are responsive

## Future Enhancements

- **Visual Config Editor**: GUI for editing configurations
- **Template Gallery**: More pre-built styles and themes
- **Advanced Components**: Registry, travel info, livestream
- **Animation Options**: Scroll animations and transitions
- **Multi-language Support**: Internationalization
- **Custom CSS**: Override styles with custom CSS

This modular system gives you complete control over your wedding website while maintaining consistency and professional design.