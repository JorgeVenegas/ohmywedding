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
    partner1FirstName: 'Carlos',
    partner1LastName: 'Ramirez',
    partner2FirstName: 'Andrea',
    partner2LastName: 'Sanchez',
    weddingDate: '2026-06-20',
    weddingTime: '16:00',
    tagline: 'Dos corazones, un solo amor',
    howWeMetText: 'Nos conocimos en una gala de beneficencia en la Ciudad de Mexico. Carlos quedo cautivado por la gracia y el ingenio de Andrea. Un amor compartido por la musica clasica y el arte nos unio.',
    proposalText: 'En una fresca tarde de otono en el Bosque de Chapultepec, rodeados de hojas doradas y la suave luz del atardecer, Carlos se arrodillo con el anillo de su abuela.',
    ceremonyVenue: 'Parroquia de San Fernando',
    ceremonyAddress: 'Centro Historico, Ciudad de Mexico',
    receptionVenue: 'Hacienda de los Morales',
    receptionAddress: 'Vazquez de Mella 525, Polanco, CDMX',
    dressCode: 'Etiqueta'
  },
  'modern-minimal': {
    partner1FirstName: 'Diego',
    partner1LastName: 'Torres',
    partner2FirstName: 'Mariana',
    partner2LastName: 'Lopez',
    weddingDate: '2026-09-12',
    weddingTime: '18:00',
    tagline: 'Simplemente nosotros',
    howWeMetText: 'Nos conocimos en una conferencia de diseno en Monterrey. Los dos alcanzamos el ultimo cafe frio del bar al mismo tiempo y decidimos compartirlo.',
    proposalText: 'En una manana tranquila en casa, rodeados de nuestras plantas favoritas y la suave luz del amanecer, Diego le propuso matrimonio a Mariana con un anillo hecho por un joyero local.',
    ceremonyVenue: 'Museo MARCO',
    ceremonyAddress: 'Zuazua y Jardon, Centro, Monterrey, NL',
    receptionVenue: 'Museo MARCO',
    receptionAddress: 'Zuazua y Jardon, Centro, Monterrey, NL',
    dressCode: 'Contemporaneo Chic'
  },
  'romantic-garden': {
    partner1FirstName: 'Sebastian',
    partner1LastName: 'Flores',
    partner2FirstName: 'Isabella',
    partner2LastName: 'Reyes',
    weddingDate: '2026-05-15',
    weddingTime: '15:00',
    tagline: 'Donde el amor florece eternamente',
    howWeMetText: 'Nos conocimos en Jardines de Mexico durante un festival de primavera. Sebastian estaba dibujando las flores cuando Isabella se detuvo a admirar su trabajo. Un cafe se convirtio en cena, y la cena en para siempre.',
    proposalText: 'Bajo un arco de buganvilias en el mismo jardin donde nos conocimos, Sebastian sorprendio a Isabella con un picnic al atardecer y un anillo escondido dentro de un ramo de flores.',
    ceremonyVenue: 'Jardines de Mexico',
    ceremonyAddress: 'Tequesquitengo, Morelos',
    receptionVenue: 'El Invernadero',
    receptionAddress: 'Jardines de Mexico, Morelos',
    dressCode: 'Formal de Jardin'
  },
  'rustic-charm': {
    partner1FirstName: 'Emiliano',
    partner1LastName: 'Castillo',
    partner2FirstName: 'Camila',
    partner2LastName: 'Herrera',
    weddingDate: '2026-10-03',
    weddingTime: '17:00',
    tagline: 'Nuestra historia de amor, escrita en las estrellas',
    howWeMetText: 'Nos conocimos en un mercado organico en Oaxaca. Emiliano vendia miel de la granja de su familia, y Camila no podia resistirse a volver cada semana. Al final, ella pidio algo mas que solo miel.',
    proposalText: 'En la hacienda de su familia, bajo un cielo lleno de estrellas y rodeados de luciernagas, Emiliano le pidio a Camila que fuera su para siempre. El anillo fue hecho con oro heredado por tres generaciones.',
    ceremonyVenue: 'Hacienda San Jose',
    ceremonyAddress: 'Tixkokob, Yucatan',
    receptionVenue: 'El Granero',
    receptionAddress: 'Hacienda San Jose, Tixkokob, Yucatan',
    dressCode: 'Rustico Elegante'
  },
  'luxury-noir': {
    partner1FirstName: 'Ricardo',
    partner1LastName: 'Montoya',
    partner2FirstName: 'Valentina',
    partner2LastName: 'del Valle',
    weddingDate: '2026-12-31',
    weddingTime: '20:00',
    tagline: 'Una celebracion de amor extraordinario',
    howWeMetText: 'Nos conocimos en una exclusiva subasta de arte en la Ciudad de Mexico. Ricardo estaba pujando por una escultura poco comun, pero encontro algo mucho mas valioso cuando vio a Valentina al otro lado de la sala.',
    proposalText: 'A bordo de un yate privado bajo el cielo estrellado de Los Cabos, Ricardo le propuso matrimonio a Valentina con un anillo personalizado mientras los fuegos artificiales iluminaban el cielo de medianoche.',
    ceremonyVenue: 'Parroquia de la Santa Veracruz',
    ceremonyAddress: 'Av. Hidalgo 19, Centro Historico, CDMX',
    receptionVenue: 'Castillo de Chapultepec',
    receptionAddress: 'Bosque de Chapultepec, CDMX',
    dressCode: 'Etiqueta Rigurosa'
  },
  'simple-love': {
    partner1FirstName: 'Daniel',
    partner1LastName: 'Ortega',
    partner2FirstName: 'Sofia',
    partner2LastName: 'Morales',
    weddingDate: '2026-08-08',
    weddingTime: '14:00',
    tagline: 'Amor, simplemente',
    howWeMetText: 'Nos conocimos en la reuncion de unos amigos en comun. Ninguno de los dos esperaba encontrar el amor ese dia, pero la vida tenia otros planes.',
    proposalText: 'Durante una caminata matutina en nuestro sendero favorito, Daniel se volteo, saco un anillo y le hizo a Sofia la pregunta mas simple con el significado mas grande.',
    ceremonyVenue: 'Registro Civil',
    ceremonyAddress: 'Centro, Merida, Yucatan',
    receptionVenue: 'Celebracion en Casa',
    receptionAddress: 'Nuestra Casa, Merida, Yucatan',
    dressCode: 'Casual Elegante'
  }
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'classic-elegance',
    name: 'Elegancia Clasica',
    description: 'Diseno atemporal con fuentes serif y tonos calidos. Perfecto para ceremonias tradicionales.',
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
    name: 'Moderno Minimal',
    description: 'Lineas limpias y fuentes sans-serif. Para la pareja contemporanea.',
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
    name: 'Jardin Romantico',
    description: 'Colores suaves y fuentes fluidas. Ideal para bodas en jardin y al aire libre.',
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
    name: 'Encanto Rustico',
    description: 'Tonos calidos y terrosos con elementos naturales. Perfecto para bodas en hacienda o campo.',
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
    name: 'Lujo Noir',
    description: 'Tema oscuro sofisticado con acentos dorados. Para eventos nocturnos glamurosos.',
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
    name: 'Amor Simple',
    description: 'Solo lo esencial. Configuracion rapida con secciones minimas para parejas practicas.',
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
  { id: 'classic', name: 'Clasico', description: 'Disenos atemporales y tradicionales' },
  { id: 'modern', name: 'Moderno', description: 'Estetica contemporanea y limpia' },
  { id: 'romantic', name: 'Romantico', description: 'Suave, sonador e intimo' },
  { id: 'rustic', name: 'Rustico', description: 'Estilo campestre calido y natural' },
  { id: 'elegant', name: 'Elegante', description: 'Sofisticado y lujoso' },
  { id: 'minimalist', name: 'Minimalista', description: 'Simple y esencial' }
]

export function getTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(template => template.id === id)
}

export function getTemplatesByCategory(category: string): PageTemplate[] {
  return PAGE_TEMPLATES.filter(template => template.category === category)
}
