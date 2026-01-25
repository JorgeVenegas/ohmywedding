// Pre-designed page templates for wedding websites
import { COLOR_THEMES, FONT_PAIRINGS } from './theme-config'

export interface DemoCouple {
  partner1FirstName: string
  partner1LastName: string
  partner2FirstName: string
  partner2LastName: string
  weddingDate: string
  weddingTime: string
  tagline: string
  howWeMetText: string
  proposalText: string
  ceremonyVenue: string
  ceremonyAddress: string
  receptionVenue: string
  receptionAddress: string
  dressCode: string
}

export interface PageTemplate {
  id: string
  name: string
  description: string
  preview: string // Preview image URL or placeholder
  category: 'classic' | 'modern' | 'rustic' | 'romantic' | 'minimalist' | 'elegant'
  colorThemeId: string
  fontPairingId: string
  demoCouple: DemoCouple
  components: Array<{
    id: string
    type: string
    enabled: boolean
    order: number
    props?: Record<string, any>
  }>
}

// Demo couples for each template style
const DEMO_COUPLES: Record<string, DemoCouple> = {
  'classic-elegance': {
    partner1FirstName: 'James',
    partner1LastName: 'Wellington',
    partner2FirstName: 'Victoria',
    partner2LastName: 'Ashford',
    weddingDate: '2026-06-20',
    weddingTime: '16:00',
    tagline: 'Two hearts, one love, forever',
    howWeMetText: 'We met at a charity gala in Manhattan, where James was immediately captivated by Victoria\'s grace and wit. A shared love for classical music and fine art brought us together.',
    proposalText: 'On a crisp autumn evening in Central Park, surrounded by golden leaves and the soft glow of fairy lights, James got down on one knee with his grandmother\'s vintage ring.',
    ceremonyVenue: 'St. Patrick\'s Cathedral',
    ceremonyAddress: '5th Avenue, New York, NY',
    receptionVenue: 'The Plaza Hotel',
    receptionAddress: '768 5th Avenue, New York, NY',
    dressCode: 'Black Tie'
  },
  'modern-minimal': {
    partner1FirstName: 'Alex',
    partner1LastName: 'Chen',
    partner2FirstName: 'Jordan',
    partner2LastName: 'Park',
    weddingDate: '2026-09-12',
    weddingTime: '18:00',
    tagline: 'Simply us',
    howWeMetText: 'We met at a design conference in San Francisco. Both of us reached for the last cold brew at the coffee bar—and decided to share.',
    proposalText: 'During a quiet morning at home, surrounded by our favorite plants and the soft light of sunrise, Jordan asked Alex with a ring designed by a local jeweler.',
    ceremonyVenue: 'SFMOMA Rooftop',
    ceremonyAddress: '151 Third Street, San Francisco, CA',
    receptionVenue: 'SFMOMA Rooftop',
    receptionAddress: '151 Third Street, San Francisco, CA',
    dressCode: 'Contemporary Chic'
  },
  'romantic-garden': {
    partner1FirstName: 'Sebastian',
    partner1LastName: 'Rose',
    partner2FirstName: 'Isabella',
    partner2LastName: 'Bloom',
    weddingDate: '2026-05-15',
    weddingTime: '15:00',
    tagline: 'Where love blooms eternal',
    howWeMetText: 'We met at a botanical garden during a spring festival. Sebastian was sketching the flowers when Isabella stopped to admire his work. Coffee turned into dinner, and dinner turned into forever.',
    proposalText: 'Under a canopy of wisteria in the same garden where we first met, Sebastian surprised Isabella with a picnic at sunset and a ring hidden inside a flower bouquet.',
    ceremonyVenue: 'Longwood Gardens',
    ceremonyAddress: 'Kennett Square, Pennsylvania',
    receptionVenue: 'The Conservatory',
    receptionAddress: 'Longwood Gardens, PA',
    dressCode: 'Garden Formal'
  },
  'rustic-charm': {
    partner1FirstName: 'Mason',
    partner1LastName: 'Brooks',
    partner2FirstName: 'Savannah',
    partner2LastName: 'Fields',
    weddingDate: '2026-10-03',
    weddingTime: '17:00',
    tagline: 'Our love story, written in the stars',
    howWeMetText: 'We met at a farmers market in Nashville. Mason was selling honey from his family\'s farm, and Savannah couldn\'t resist coming back every week. Eventually, she asked for more than just honey.',
    proposalText: 'On his family\'s farm, under a sky full of stars and surrounded by fireflies, Mason asked Savannah to be his forever. The ring was crafted from gold passed down three generations.',
    ceremonyVenue: 'Brooks Family Farm',
    ceremonyAddress: 'Franklin, Tennessee',
    receptionVenue: 'The Red Barn',
    receptionAddress: 'Brooks Family Farm, Franklin, TN',
    dressCode: 'Rustic Elegant'
  },
  'luxury-noir': {
    partner1FirstName: 'Alexander',
    partner1LastName: 'Sterling',
    partner2FirstName: 'Camille',
    partner2LastName: 'Laurent',
    weddingDate: '2026-12-31',
    weddingTime: '20:00',
    tagline: 'A celebration of extraordinary love',
    howWeMetText: 'We met at an exclusive art auction in Monaco. Alexander was bidding on a rare sculpture, but found something far more valuable when he saw Camille across the room.',
    proposalText: 'Aboard a private yacht under the Monaco skyline, Alexander proposed with a custom Harry Winston ring as fireworks lit up the midnight sky.',
    ceremonyVenue: 'Opéra de Monte-Carlo',
    ceremonyAddress: 'Place du Casino, Monaco',
    receptionVenue: 'Hôtel de Paris',
    receptionAddress: 'Place du Casino, Monte-Carlo',
    dressCode: 'Black Tie Gala'
  },
  'simple-love': {
    partner1FirstName: 'Sam',
    partner1LastName: 'Taylor',
    partner2FirstName: 'Riley',
    partner2LastName: 'Morgan',
    weddingDate: '2026-08-08',
    weddingTime: '14:00',
    tagline: 'Love, simply',
    howWeMetText: 'We met through mutual friends at a backyard barbecue. Neither of us expected to find love that day, but life had other plans.',
    proposalText: 'During a morning hike at our favorite trail, Sam turned around, pulled out a ring, and asked the simplest question with the biggest meaning.',
    ceremonyVenue: 'City Hall',
    ceremonyAddress: 'Downtown, Austin, TX',
    receptionVenue: 'Backyard Celebration',
    receptionAddress: 'Our Home, Austin, TX',
    dressCode: 'Casual Elegant'
  }
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'classic-elegance',
    name: 'Classic Elegance',
    description: 'Timeless design with serif fonts and warm tones. Perfect for traditional ceremonies.',
    preview: '/images/templates/classic-elegance.jpg',
    category: 'classic',
    colorThemeId: 'mauve-taupe',
    fontPairingId: 'classic-serif',
    demoCouple: DEMO_COUPLES['classic-elegance'],
    components: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        order: 0,
        props: {
          variant: 'side-by-side',
          showTagline: true,
          showCountdown: true,
          showRSVPButton: true,
          backgroundGradient: true,
          gradientColor1: 'palette:primary',
          gradientColor2: 'palette:accent-light',
          overlayOpacity: 18
        }
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        order: 1,
        props: {
          variant: 'elegant',
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'event-details',
        type: 'event-details',
        enabled: true,
        order: 2,
        props: {
          variant: 'elegant',
          showCeremony: true,
          showReception: true,
          showMapLinks: true,
          showPhotos: true
        }
      },
      {
        id: 'our-story',
        type: 'our-story',
        enabled: true,
        order: 3,
        props: {
          variant: 'timeline',
          showHowWeMet: true,
          showProposal: true,
          showPhotos: true,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        enabled: true,
        order: 4,
        props: {
          variant: 'masonry',
          backgroundColorChoice: 'primary'
        }
      },
      {
        id: 'rsvp',
        type: 'rsvp',
        enabled: true,
        order: 5,
        props: {
          variant: 'elegant',
          embedForm: true,
          useColorBackground: true,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'faq',
        type: 'faq',
        enabled: true,
        order: 6,
        props: {
          variant: 'elegant',
          backgroundColorChoice: 'primary'
        }
      }
    ]
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean lines and sans-serif fonts. For the contemporary couple.',
    preview: '/images/templates/modern-minimal.jpg',
    category: 'modern',
    colorThemeId: 'black-white',
    fontPairingId: 'minimalist',
    demoCouple: DEMO_COUPLES['modern-minimal'],
    components: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        order: 0,
        props: {
          variant: 'stacked',
          showTagline: false,
          showCountdown: false,
          showRSVPButton: true,
          imageWidth: 'full',
          imageHeight: 'large'
        }
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        order: 1,
        props: {
          variant: 'modern',
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'event-details',
        type: 'event-details',
        enabled: true,
        order: 2,
        props: {
          variant: 'minimal',
          showCeremony: true,
          showReception: true,
          showPhotos: true,
          showMap: false,
          showMapLinks: false,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'our-story',
        type: 'our-story',
        enabled: true,
        order: 3,
        props: {
          variant: 'minimal',
          showHowWeMet: true,
          showProposal: true,
          showPhotos: true,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        enabled: true,
        order: 4,
        props: {
          variant: 'collage',
          gridColumns: 3
        }
      },
      {
        id: 'rsvp',
        type: 'rsvp',
        enabled: true,
        order: 5,
        props: {
          variant: 'minimalistic',
          embedForm: true,
          useColorBackground: true,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'faq',
        type: 'faq',
        enabled: true,
        order: 6,
        props: {
          variant: 'minimal',
          backgroundColorChoice: 'primary'
        }
      }
    ]
  },
  {
    id: 'romantic-garden',
    name: 'Romantic Garden',
    description: 'Soft colors and flowing fonts. Ideal for garden and outdoor weddings.',
    preview: '/images/templates/romantic-garden.jpg',
    category: 'romantic',
    colorThemeId: 'sage-blush',
    fontPairingId: 'romantic-script',
    demoCouple: DEMO_COUPLES['romantic-garden'],
    components: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        order: 0,
        props: {
          variant: 'framed',
          showTagline: true,
          showCountdown: true,
          showRSVPButton: true,
          imageSize: 'large',
          frameStyle: 'polaroid',
          imageWidth: 'centered',
          imageHeight: 'large'
        }
      },
      {
        id: 'our-story',
        type: 'our-story',
        enabled: true,
        order: 1,
        props: {
          variant: 'zigzag',
          showHowWeMet: true,
          showProposal: true,
          showPhotos: true
        }
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        order: 2,
        props: {
          variant: 'elegant',
          backgroundColorChoice: 'primary'
        }
      },
      {
        id: 'event-details',
        type: 'event-details',
        enabled: true,
        order: 3,
        props: {
          variant: 'split',
          showCeremony: true,
          showReception: true,
          showMapLinks: true,
          showPhotos: true,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        enabled: true,
        order: 4,
        props: {
          variant: 'collage',
          gridColumns: 6,
          backgroundColorChoice: 'primary'
        }
      },
      {
        id: 'rsvp',
        type: 'rsvp',
        enabled: true,
        order: 5,
        props: {
          variant: 'elegant',
          embedForm: true,
          useColorBackground: true,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'faq',
        type: 'faq',
        enabled: true,
        order: 6,
        props: {
          variant: 'cards',
          backgroundColorChoice: 'primary'
        }
      }
    ]
  },
  {
    id: 'rustic-charm',
    name: 'Rustic Charm',
    description: 'Warm, earthy tones with natural elements. Perfect for barn or countryside weddings.',
    preview: '/images/templates/rustic-charm.jpg',
    category: 'rustic',
    colorThemeId: 'terracotta',
    fontPairingId: 'rustic-handwritten',
    demoCouple: DEMO_COUPLES['rustic-charm'],
    components: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        order: 0,
        props: {
          variant: 'background',
          showTagline: true,
          showCountdown: false,
          showRSVPButton: true
        }
      },
      {
        id: 'our-story',
        type: 'our-story',
        enabled: true,
        order: 1,
        props: {
          variant: 'cards',
          showHowWeMet: true,
          showProposal: true,
          showPhotos: true,
          showHowWeMetPhoto: true,
          showProposalPhoto: true,
          backgroundColorChoice: 'primary-light'
        }
      },
      {
        id: 'event-details',
        type: 'event-details',
        enabled: true,
        order: 2,
        props: {
          variant: 'split',
          showCeremony: true,
          showReception: true,
          showPhotos: true,
          showMap: false,
          showMapLinks: true,
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        order: 3,
        props: {
          variant: 'classic',
          backgroundColorChoice: 'primary-light'
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        enabled: true,
        order: 4,
        props: {
          variant: 'masonry',
          backgroundColorChoice: 'primary-lighter'
        }
      },
      {
        id: 'rsvp',
        type: 'rsvp',
        enabled: true,
        order: 5,
        props: {
          variant: 'minimalistic',
          embedForm: true,
          useColorBackground: true,
          backgroundColorChoice: 'primary-light'
        }
      },
      {
        id: 'faq',
        type: 'faq',
        enabled: true,
        order: 6,
        props: {
          variant: 'accordion',
          backgroundColorChoice: 'primary-lighter'
        }
      }
    ]
  },
  {
    id: 'luxury-noir',
    name: 'Luxury Noir',
    description: 'Sophisticated dark theme with gold accents. For glamorous evening events.',
    preview: '/images/templates/luxury-noir.jpg',
    category: 'elegant',
    colorThemeId: 'navy-gold',
    fontPairingId: 'elegant-formal',
    demoCouple: DEMO_COUPLES['luxury-noir'],
    components: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        order: 0,
        props: {
          variant: 'background',
          showTagline: true,
          showCountdown: false,
          showRSVPButton: true
        }
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        order: 1,
        props: {
          variant: 'elegant',
          backgroundColorChoice: 'primary'
        }
      },
      {
        id: 'event-details',
        type: 'event-details',
        enabled: true,
        order: 2,
        props: {
          variant: 'split',
          showCeremony: true,
          showReception: true,
          showPhotos: true,
          showMap: false,
          showMapLinks: false,
          backgroundColorChoice: 'accent-lighter'
        }
      },
      {
        id: 'our-story',
        type: 'our-story',
        enabled: true,
        order: 3,
        props: {
          variant: 'booklet',
          showHowWeMet: true,
          showProposal: true,
          showPhotos: true
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        enabled: true,
        order: 4,
        props: {
          variant: 'collage',
          useGradientOverlay: true,
          gradientColor1: 'palette:primary',
          gradientColor2: 'palette:primary',
          overlayOpacity: 32,
          backgroundColorChoice: 'primary'
        }
      },
      {
        id: 'rsvp',
        type: 'rsvp',
        enabled: true,
        order: 5,
        props: {
          variant: 'elegant',
          embedForm: true,
          useColorBackground: true,
          backgroundColorChoice: 'accent-lighter'
        }
      },
      {
        id: 'faq',
        type: 'faq',
        enabled: true,
        order: 6,
        props: {
          variant: 'elegant',
          backgroundColorChoice: 'primary'
        }
      }
    ]
  },
  {
    id: 'simple-love',
    name: 'Simple Love',
    description: 'Just the essentials. Quick setup with minimal sections for practical couples.',
    preview: '/images/templates/simple-love.jpg',
    category: 'minimalist',
    colorThemeId: 'dusty-blue',
    fontPairingId: 'modern-sans',
    demoCouple: DEMO_COUPLES['simple-love'],
    components: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        order: 0,
        props: {
          variant: 'stacked',
          showTagline: false,
          showCountdown: true,
          showRSVPButton: true
        }
      },
      {
        id: 'countdown',
        type: 'countdown',
        enabled: true,
        order: 1,
        props: {
          variant: 'minimal'
        }
      },
      {
        id: 'event-details',
        type: 'event-details',
        enabled: true,
        order: 2,
        props: {
          variant: 'minimal',
          showCeremony: true,
          showReception: true,
          showPhotos: true
        }
      },
      {
        id: 'our-story',
        type: 'our-story',
        enabled: true,
        order: 3,
        props: {
          variant: 'minimal',
          showHowWeMet: true,
          showProposal: true,
          showPhotos: true
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        enabled: true,
        order: 4,
        props: {
          variant: 'grid'
        }
      },
      {
        id: 'rsvp',
        type: 'rsvp',
        enabled: true,
        order: 5,
        props: {
          variant: 'minimalistic',
          embedForm: true
        }
      },
      {
        id: 'faq',
        type: 'faq',
        enabled: true,
        order: 6,
        props: {
          variant: 'accordion'
        }
      }
    ]
  }
]

export const TEMPLATE_CATEGORIES = [
  { id: 'classic', name: 'Classic', description: 'Timeless and traditional designs' },
  { id: 'modern', name: 'Modern', description: 'Contemporary and clean aesthetics' },
  { id: 'romantic', name: 'Romantic', description: 'Soft, dreamy, and intimate' },
  { id: 'rustic', name: 'Rustic', description: 'Warm and natural country style' },
  { id: 'elegant', name: 'Elegant', description: 'Sophisticated and luxurious' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple and essential' }
]

export function getTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(template => template.id === id)
}

export function getTemplatesByCategory(category: string): PageTemplate[] {
  return PAGE_TEMPLATES.filter(template => template.category === category)
}
