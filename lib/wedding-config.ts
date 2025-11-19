// Wedding site configuration types and interfaces

export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
  }
  fonts: {
    heading: string
    body: string
    script: string
  }
  spacing: {
    section: string
    container: string
  }
}

export interface AlignmentConfig {
  text: 'left' | 'center' | 'right'
  content: 'left' | 'center' | 'right'
  image: 'left' | 'center' | 'right'
  // Additional alignment options for hero section
  vertical?: 'top' | 'center' | 'bottom'
  horizontal?: 'left' | 'center' | 'right'
  imagePosition?: 'background' | 'left' | 'right' | 'top' | 'bottom' | 'featured' | 'fullscreen' | 'split-left' | 'split-right' | 'overlay'
}

export interface ComponentConfig {
  id: string
  type: ComponentType
  enabled: boolean
  order: number
  props: Record<string, any>
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
}

export type ComponentType = 
  | 'hero'
  | 'our-story'
  | 'event-details'
  | 'rsvp'
  | 'gallery'
  | 'wedding-party'
  | 'schedule'
  | 'travel'
  | 'registry'
  | 'faq'
  | 'guestbook'
  | 'countdown'
  | 'contact'
  | 'livestream'
  | 'thank-you'

export interface WeddingPageConfig {
  theme: ThemeConfig
  components: ComponentConfig[]
  meta: {
    title: string
    description: string
    image?: string
  }
}

// Default theme
export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#a86b8f',
    secondary: '#8b9d6f',
    accent: '#e8a76a',
    background: '#ffffff',
    foreground: '#1f2937',
    muted: '#6b7280'
  },
  fonts: {
    heading: 'serif',
    body: 'sans-serif',
    script: 'cursive'
  },
  spacing: {
    section: 'py-16 px-4',
    container: 'max-w-4xl mx-auto'
  }
}

// Default component configurations
export const defaultComponentConfigs: Record<ComponentType, Omit<ComponentConfig, 'id' | 'order'>> = {
  hero: {
    type: 'hero',
    enabled: true,
    props: {
      showCoverImage: true,
      showTagline: true,
      tagline: 'Join us as we tie the knot!',
      coverImageUrl: null,
      showCountdown: true,
      showRSVPButton: true,
      heroImageUrl: null // Main hero photo
    },
    alignment: { 
      text: 'center', 
      content: 'center', 
      image: 'center',
      vertical: 'center',
      horizontal: 'center',
      imagePosition: 'background' // Options: 'background' | 'fullscreen' | 'overlay' | 'split-left' | 'split-right' | 'featured' | 'left' | 'right' | 'top' | 'bottom'
    }
  },
  'our-story': {
    type: 'our-story',
    enabled: true,
    props: {
      showHowWeMet: true,
      showProposal: true,
      showPhotos: true,
      howWeMetText: 'Our love story began in the most unexpected way. From the moment we met, we knew there was something special between us. What started as a chance encounter blossomed into a beautiful friendship, and eventually, a love that we knew would last forever.',
      proposalText: 'The proposal was a magical moment we\'ll cherish forever. Surrounded by the beauty of nature and the warmth of our love, the question was asked and answered with tears of joy. It was the perfect beginning to our next chapter together.',
      photos: []
    },
    alignment: { text: 'left', content: 'center', image: 'center' }
  },
  'event-details': {
    type: 'event-details',
    enabled: true,
    props: {
      showCeremony: true,
      showReception: true,
      showDressCode: true,
      showMapLinks: true,
      dressCode: 'Black tie optional'
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  rsvp: {
    type: 'rsvp',
    enabled: true,
    props: {
      showMealPreferences: true,
      showCustomQuestions: true,
      customQuestions: [
        { id: 'song-request', question: 'Song requests?', type: 'text' },
        { id: 'dietary', question: 'Dietary restrictions?', type: 'text' }
      ]
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  gallery: {
    type: 'gallery',
    enabled: true,
    props: {
      showEngagementPhotos: true,
      showVideoSupport: false,
      photos: [],
      videos: [],
      showDemoPhotos: true // Show demo photos for a better demo experience
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  'wedding-party': {
    type: 'wedding-party',
    enabled: false,
    props: {
      bridesmaids: [],
      groomsmen: [],
      showBios: true
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  schedule: {
    type: 'schedule',
    enabled: false,
    props: {
      events: [
        { time: '3:30 PM', title: 'Guest Arrival', description: 'Welcome drinks and mingling' },
        { time: '4:00 PM', title: 'Ceremony', description: 'Exchange of vows' },
        { time: '5:00 PM', title: 'Cocktail Hour', description: 'Photos and celebration' },
        { time: '6:30 PM', title: 'Reception', description: 'Dinner and dancing' }
      ]
    },
    alignment: { text: 'left', content: 'center', image: 'center' }
  },
  travel: {
    type: 'travel',
    enabled: false,
    props: {
      hotels: [],
      airports: [],
      carRentals: [],
      showMaps: true
    },
    alignment: { text: 'left', content: 'center', image: 'center' }
  },
  registry: {
    type: 'registry',
    enabled: false,
    props: {
      registries: [],
      showQRCodes: true,
      message: 'Your presence is the greatest gift, but if you wish to honor us with a gift, we have registered at:'
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  faq: {
    type: 'faq',
    enabled: true,
    props: {
      questions: [
        { question: 'What is the dress code?', answer: 'Black tie optional. We want you to feel comfortable and look your best!' },
        { question: 'Can I bring a plus one?', answer: 'Please refer to your invitation. If a plus one is invited, their name will be listed.' },
        { question: 'Is there parking available?', answer: 'Yes, complimentary parking is available at both venues.' }
      ]
    },
    alignment: { text: 'left', content: 'center', image: 'center' }
  },
  guestbook: {
    type: 'guestbook',
    enabled: false,
    props: {
      allowPhotos: true,
      allowText: true,
      moderationEnabled: false
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  countdown: {
    type: 'countdown',
    enabled: true,
    props: {
      showDays: true,
      showHours: true,
      showMinutes: true,
      message: 'Until we say "I do"'
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  contact: {
    type: 'contact',
    enabled: false,
    props: {
      showContactForm: true,
      email: '',
      phone: '',
      socialLinks: []
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  livestream: {
    type: 'livestream',
    enabled: false,
    props: {
      platform: 'youtube',
      embedUrl: '',
      showBeforeEvent: false,
      message: 'Can\'t be there in person? Join us virtually!'
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  },
  'thank-you': {
    type: 'thank-you',
    enabled: false,
    props: {
      message: 'Thank you for making our special day unforgettable!',
      showPhotos: true,
      photos: []
    },
    alignment: { text: 'center', content: 'center', image: 'center' }
  }
}

// Helper function to create a default wedding page config
export function createDefaultWeddingConfig(wedding: any): WeddingPageConfig {
  const enabledComponents: ComponentType[] = ['hero', 'our-story', 'event-details', 'rsvp', 'gallery', 'faq', 'countdown']
  
  return {
    theme: {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: wedding.primary_color || defaultTheme.colors.primary,
        secondary: wedding.secondary_color || defaultTheme.colors.secondary,
        accent: wedding.accent_color || defaultTheme.colors.accent
      }
    },
    components: enabledComponents.map((type, index) => ({
      id: `${type}-${index}`,
      order: index,
      ...defaultComponentConfigs[type],
      enabled: true
    })),
    meta: {
      title: `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`,
      description: `Join us for our wedding celebration!`
    }
  }
}