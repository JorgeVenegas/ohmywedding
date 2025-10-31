import { WeddingPageConfig, ComponentType, defaultTheme } from '@/lib/wedding-config'

/**
 * Hero Section Layout Options by Wedding Style
 * 
 * This file demonstrates 3 hero layouts assigned to specific wedding styles:
 * 
 * 🎬 MODERN STYLE → FULLSCREEN BACKGROUND (imagePosition: 'fullscreen')
 *    - Image covers entire viewport as dramatic background
 *    - Centered text overlay with semi-transparent backdrop
 *    - Perfect for cinematic, bold presentations
 *    - Clean, minimalist aesthetic with strong visual impact
 * 
 * 🎩 CLASSIC STYLE → SPLIT RIGHT (imagePosition: 'split-right')
 *    - Traditional split layout: text left, image right
 *    - Text content (40% width) + elegant portrait (60% width)
 *    - Left-aligned text for formal, readable presentation
 *    - Timeless composition with structured balance
 * 
 * 🌿 RUSTIC STYLE → SPLIT LEFT (imagePosition: 'split-left')
 *    - Natural split layout: image left, text right
 *    - Landscape/nature image (60% width) + intimate text (40% width)
 *    - Right-aligned text for cozy, personal feel
 *    - Organic composition emphasizing natural beauty
 * 
 * 📱 Responsive Behavior:
 * - All layouts adapt gracefully to mobile screens
 * - Split layouts stack vertically on smaller devices
 * - Fullscreen maintains dramatic impact across all sizes
 * - Recommended images: 1920x1080 (fullscreen), 1200x800 (split)
 */

// Example 1: Classic Wedding Configuration - Elegant Split Layout
export const classicWeddingConfig: WeddingPageConfig = {
  theme: {
    ...defaultTheme,
    colors: {
      primary: '#8B4F7D',
      secondary: '#6B8E5A',
      accent: '#D4A574',
      background: '#FFFFFF',
      foreground: '#2D2D2D',
      muted: '#6B7280'
    },
    fonts: {
      heading: 'serif',
      body: 'sans-serif',
      script: 'cursive'
    }
  },
  components: [
    {
      id: 'hero-classic',
      type: 'hero',
      enabled: true,
      order: 0,
      props: {
        showCoverImage: false,
        showTagline: true,
        tagline: 'Join us as we tie the knot!',
        showCountdown: true,
        showRSVPButton: true,
        heroImageUrl: 'https://picsum.photos/1200/800?random=10' // Demo couple photo
      },
      alignment: { 
        text: 'left', 
        content: 'left', 
        image: 'right',
        vertical: 'center',
        horizontal: 'left',
        imagePosition: 'split-right' // CLASSIC STYLE: Text left, elegant image right
      }
    },
    {
      id: 'our-story-1',
      type: 'our-story',
      enabled: true,
      order: 1,
      props: {
        showHowWeMet: true,
        showProposal: true,
        showPhotos: true,
        howWeMetText: 'We met at a coffee shop on a rainy Tuesday morning...',
        proposalText: 'Under the stars at our favorite hiking spot...'
      },
      alignment: { text: 'left', content: 'center', image: 'center' }
    },
    {
      id: 'countdown-1',
      type: 'countdown',
      enabled: true,
      order: 2,
      props: {
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
        message: 'Until we say "I do"'
      }
    },
    {
      id: 'event-details-1',
      type: 'event-details',
      enabled: true,
      order: 3,
      props: {
        showCeremony: true,
        showReception: true,
        showDressCode: true,
        showMapLinks: true,
        dressCode: 'Black tie optional'
      }
    },
    {
      id: 'gallery-1',
      type: 'gallery',
      enabled: true,
      order: 4,
      props: {
        showEngagementPhotos: true,
        showVideoSupport: false,
        maxDisplayPhotos: 6,
        showViewAllButton: true,
        showDemoPhotos: true
      }
    },
    {
      id: 'rsvp-1',
      type: 'rsvp',
      enabled: true,
      order: 5,
      props: {
        embedForm: false, // Show CTA instead of full form
        showMealPreferences: true,
        showCustomQuestions: true,
        customQuestions: [
          { id: 'song-request', question: 'Any song requests for the reception?', type: 'text' },
          { id: 'special-message', question: 'Special message for the couple', type: 'textarea' }
        ]
      }
    },
    {
      id: 'faq-1',
      type: 'faq',
      enabled: true,
      order: 6,
      props: {
        allowMultipleOpen: false
      }
    }
  ],
  meta: {
    title: 'Sarah & John - Wedding Day',
    description: 'Join us for our wedding celebration on June 15th, 2024'
  }
}

// Example 2: Modern Minimalist Configuration - Cinematic Fullscreen
export const modernWeddingConfig: WeddingPageConfig = {
  theme: {
    ...defaultTheme,
    colors: {
      primary: '#2D3748',
      secondary: '#4A5568',
      accent: '#E2E8F0',
      background: '#FFFFFF',
      foreground: '#1A202C',
      muted: '#718096'
    },
    fonts: {
      heading: 'sans-serif',
      body: 'sans-serif',
      script: 'serif'
    },
    spacing: {
      section: 'py-20 px-6',
      container: 'max-w-6xl mx-auto'
    }
  },
  components: [
    {
      id: 'hero-modern',
      type: 'hero',
      enabled: true,
      order: 0,
      props: {
        showCoverImage: false,
        showTagline: true,
        tagline: 'Two hearts, one love',
        showCountdown: false,
        showRSVPButton: true,
        heroImageUrl: 'https://picsum.photos/1920/1080?random=11' // Demo couple photo
      },
      alignment: { 
        text: 'center', 
        content: 'center', 
        image: 'center',
        vertical: 'center',
        horizontal: 'center',
        imagePosition: 'fullscreen' // MODERN STYLE: Dramatic fullscreen background with centered overlay
      }
    },
    {
      id: 'event-details-modern',
      type: 'event-details',
      enabled: true,
      order: 1,
      props: {
        showCeremony: true,
        showReception: true,
        showDressCode: true,
        showMapLinks: true,
        dressCode: 'Cocktail attire'
      }
    },
    {
      id: 'rsvp-embedded',
      type: 'rsvp',
      enabled: true,
      order: 2,
      props: {
        embedForm: true, // Show full embedded form
        showMealPreferences: false,
        showCustomQuestions: false
      }
    },
    {
      id: 'gallery-minimal',
      type: 'gallery',
      enabled: true,
      order: 3,
      props: {
        showEngagementPhotos: true,
        showVideoSupport: false,
        maxDisplayPhotos: 4,
        showViewAllButton: false,
        showDemoPhotos: true
      }
    },
    {
      id: 'our-story-modern',
      type: 'our-story',
      enabled: false,
      order: 4,
      props: {
        showHowWeMet: true,
        showProposal: true,
        showPhotos: true,
        howWeMetText: 'We met at a coffee shop on a rainy Tuesday morning...',
        proposalText: 'Under the stars at our favorite hiking spot...'
      },
      alignment: { text: 'center', content: 'center', image: 'center' }
    },
    {
      id: 'countdown-modern',
      type: 'countdown',
      enabled: false,
      order: 5,
      props: {
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
        message: 'Until we say "I do"'
      }
    },
    {
      id: 'faq-modern',
      type: 'faq',
      enabled: false,
      order: 6,
      props: {
        showCommonQuestions: true,
        allowCustomQuestions: false,
        faqs: [
          { 
            question: 'What is the dress code?', 
            answer: 'Cocktail attire is requested. Think dressy but comfortable for an outdoor celebration.' 
          },
          { 
            question: 'Will the ceremony be indoors or outdoors?', 
            answer: 'The ceremony will be held outdoors, weather permitting. We have a backup indoor location ready.' 
          },
          { 
            question: 'Are children welcome?', 
            answer: 'We love your little ones, but we have planned an adults-only celebration.' 
          },
          { 
            question: 'Is there parking available?', 
            answer: 'Yes, complimentary parking is available on-site for all guests.' 
          }
        ]
      }
    }
  ],
  meta: {
    title: 'Emma & David',
    description: 'A celebration of love'
  }
}

// Example 3: Rustic/Bohemian Configuration - Nature-Focused Split
export const rusticWeddingConfig: WeddingPageConfig = {
  theme: {
    ...defaultTheme,
    colors: {
      primary: '#8B4513',
      secondary: '#228B22',
      accent: '#DAA520',
      background: '#FFF8DC',
      foreground: '#654321',
      muted: '#A0522D'
    },
    fonts: {
      heading: 'script',
      body: 'serif',
      script: 'cursive'
    }
  },
  components: [
    {
      id: 'hero-rustic',
      type: 'hero',
      enabled: true,
      order: 0,
      props: {
        showCoverImage: false,
        showTagline: true,
        tagline: 'Love is in bloom',
        showCountdown: true,
        showRSVPButton: true,
        heroImageUrl: 'https://picsum.photos/1200/800?random=12' // Demo couple photo
      },
      alignment: { 
        text: 'right', 
        content: 'right', 
        image: 'left',
        vertical: 'center',
        horizontal: 'right',
        imagePosition: 'split-left' // RUSTIC STYLE: Natural image left, warm text right
      }
    },
    {
      id: 'our-story-timeline',
      type: 'our-story',
      enabled: true,
      order: 1,
      props: {
        showHowWeMet: false,
        showProposal: false,
        showPhotos: false,
        timeline: [
          {
            date: 'Spring 2019',
            title: 'First Meeting',
            description: 'We met at a farmers market on a beautiful spring morning...',
            photo: 'https://picsum.photos/400/300?random=20'
          },
          {
            date: 'Summer 2020',
            title: 'First Date',
            description: 'A picnic under the old oak tree...',
            photo: 'https://picsum.photos/400/300?random=21'
          },
          {
            date: 'Fall 2023',
            title: 'The Proposal',
            description: 'Surrounded by fall foliage, the moment was perfect...',
            photo: 'https://picsum.photos/400/300?random=22'
          }
        ]
      }
    },
    {
      id: 'countdown-rustic',
      type: 'countdown',
      enabled: true,
      order: 2,
      props: {
        showDays: true,
        showHours: false,
        showMinutes: false,
        showSeconds: false,
        message: 'Days until our rustic celebration'
      }
    },
    {
      id: 'event-details-rustic',
      type: 'event-details',
      enabled: true,
      order: 3,
      props: {
        showCeremony: true,
        showReception: true,
        showDressCode: true,
        dressCode: 'Garden party attire - florals and earth tones encouraged!'
      }
    },
    {
      id: 'gallery-rustic',
      type: 'gallery',
      enabled: true,
      order: 4,
      props: {
        showEngagementPhotos: true,
        showVideoSupport: true,
        maxDisplayPhotos: 8,
        showDemoPhotos: true
      }
    },
    {
      id: 'rsvp-cta',
      type: 'rsvp',
      enabled: true,
      order: 5,
      props: {
        embedForm: false
      }
    },
    {
      id: 'faq-rustic',
      type: 'faq',
      enabled: true,
      order: 6,
      props: {
        questions: [
          {
            question: 'What should I wear?',
            answer: 'Garden party attire! Think florals, earth tones, and comfortable shoes for outdoor dancing.'
          },
          {
            question: 'Will the ceremony be outdoors?',
            answer: 'Yes! The ceremony will be held in our beautiful garden. We have a backup indoor location in case of rain.'
          },
          {
            question: 'Can children attend?',
            answer: 'We love kids! Children are welcome at both the ceremony and reception.'
          }
        ]
      }
    }
  ],
  meta: {
    title: 'Lily & James - Garden Wedding',
    description: 'Join us for a rustic celebration in the countryside'
  }
}

// Hero Layout Variations by Wedding Style
export const heroLayoutsByStyle = {
  // MODERN STYLE: Fullscreen Background Hero (Cinematic & Bold)
  modern: {
    id: 'hero-modern-fullscreen',
    type: 'hero' as const,
    enabled: true,
    order: 0,
    props: {
      showCoverImage: false,
      showTagline: true,
      tagline: 'Our love story begins here',
      showCountdown: false, // Modern style focuses on clean aesthetics
      showRSVPButton: true,
      heroImageUrl: 'https://picsum.photos/1920/1080?random=20'
    },
    alignment: { 
      text: 'center', 
      content: 'center', 
      image: 'center',
      vertical: 'center',
      horizontal: 'center',
      imagePosition: 'fullscreen' // Dramatic fullscreen background with overlay text
    }
  },

  // CLASSIC STYLE: Split Layout - Text Left, Image Right (Traditional & Elegant)
  classic: {
    id: 'hero-classic-split',
    type: 'hero' as const,
    enabled: true,
    order: 0,
    props: {
      showCoverImage: false,
      showTagline: true,
      tagline: 'Together forever starts now',
      showCountdown: true, // Classic style includes traditional countdown
      showRSVPButton: true,
      heroImageUrl: 'https://picsum.photos/1200/800?random=21'
    },
    alignment: { 
      text: 'left', 
      content: 'left', 
      image: 'right',
      vertical: 'center',
      horizontal: 'left',
      imagePosition: 'split-right' // Elegant composition: text left, portrait right
    }
  },

  // RUSTIC STYLE: Split Layout - Image Left, Text Right (Natural & Warm)
  rustic: {
    id: 'hero-rustic-split',
    type: 'hero' as const,
    enabled: true,
    order: 0,
    props: {
      showCoverImage: false,
      showTagline: true,
      tagline: 'A celebration of love awaits',
      showCountdown: true, // Rustic style embraces anticipation
      showRSVPButton: true,
      heroImageUrl: 'https://picsum.photos/1200/800?random=22'
    },
    alignment: { 
      text: 'right', 
      content: 'right', 
      image: 'left',
      vertical: 'center',
      horizontal: 'right',
      imagePosition: 'split-left' // Natural focus: landscape/nature image left, intimate text right
    }
  }
}

// Helper function to create a config from a wedding object
export function createConfigFromWedding(wedding: any, style: 'classic' | 'modern' | 'rustic' = 'classic') {
  const baseConfig = style === 'modern' ? modernWeddingConfig : 
                    style === 'rustic' ? rusticWeddingConfig : 
                    classicWeddingConfig

  return {
    ...baseConfig,
    theme: {
      ...baseConfig.theme,
      colors: {
        ...baseConfig.theme.colors,
        primary: wedding.primary_color || baseConfig.theme.colors.primary,
        secondary: wedding.secondary_color || baseConfig.theme.colors.secondary,
        accent: wedding.accent_color || baseConfig.theme.colors.accent
      }
    },
    meta: {
      title: `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`,
      description: `Join us for our wedding celebration!`
    }
  }
}

// Helper function to get hero layout by wedding style
export function getHeroLayoutByStyle(style: 'modern' | 'classic' | 'rustic') {
  return heroLayoutsByStyle[style]
}

// Helper function to get hero layout by type (backward compatibility)
export function getHeroLayoutConfig(layoutType: 'fullscreen' | 'split-right' | 'split-left') {
  switch (layoutType) {
    case 'fullscreen':
      return heroLayoutsByStyle.modern
    case 'split-right':
      return heroLayoutsByStyle.classic
    case 'split-left':
      return heroLayoutsByStyle.rustic
    default:
      return heroLayoutsByStyle.modern
  }
}