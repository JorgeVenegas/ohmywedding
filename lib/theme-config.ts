// Shared configuration for fonts and color themes
// Used in create wedding page and site settings menu

export interface FontPairing {
  id: string
  name: string
  display: string
  heading: string
  body: string
  displayFamily: string
  headingFamily: string
  bodyFamily: string
  googleFonts: string
}

export interface FontPairingCategory {
  id: string
  name: string
  description: string
  pairings: FontPairing[]
}

export interface ColorTheme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

export interface AvailableFont {
  name: string
  family: string
  category: string
}

// Font pairings organized by category
export const FONT_PAIRING_CATEGORIES: FontPairingCategory[] = [
  {
    id: 'popular',
    name: 'Popular',
    description: 'Most loved combinations',
    pairings: [
      {
        id: 'elegant-script',
        name: 'Elegant Script',
        display: 'Great Vibes',
        heading: 'Cormorant Garamond',
        body: 'Montserrat',
        displayFamily: '"Great Vibes", cursive',
        headingFamily: '"Cormorant Garamond", serif',
        bodyFamily: '"Montserrat", sans-serif',
        googleFonts: 'Great+Vibes&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;600'
      },
      {
        id: 'classic-serif',
        name: 'Classic Serif',
        display: 'Playfair Display',
        heading: 'Cormorant Garamond',
        body: 'Lato',
        displayFamily: '"Playfair Display", serif',
        headingFamily: '"Cormorant Garamond", serif',
        bodyFamily: '"Lato", sans-serif',
        googleFonts: 'Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@400;600&family=Lato:wght@300;400;700'
      },
      {
        id: 'romantic-script',
        name: 'Romantic Script',
        display: 'Parisienne',
        heading: 'Playfair Display',
        body: 'Lato',
        displayFamily: '"Parisienne", cursive',
        headingFamily: '"Playfair Display", serif',
        bodyFamily: '"Lato", sans-serif',
        googleFonts: 'Parisienne&family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700'
      },
      {
        id: 'french-elegance',
        name: 'French Elegance',
        display: 'Alex Brush',
        heading: 'Libre Baskerville',
        body: 'Open Sans',
        displayFamily: '"Alex Brush", cursive',
        headingFamily: '"Libre Baskerville", serif',
        bodyFamily: '"Open Sans", sans-serif',
        googleFonts: 'Alex+Brush&family=Libre+Baskerville:wght@400;700&family=Open+Sans:wght@300;400;600'
      },
      {
        id: 'modern-romantic',
        name: 'Modern Romantic',
        display: 'Allura',
        heading: 'Montserrat',
        body: 'Open Sans',
        displayFamily: '"Allura", cursive',
        headingFamily: '"Montserrat", sans-serif',
        bodyFamily: '"Open Sans", sans-serif',
        googleFonts: 'Allura&family=Montserrat:wght@400;600&family=Open+Sans:wght@300;400;600'
      },
      {
        id: 'minimalist',
        name: 'Minimalist',
        display: 'Raleway',
        heading: 'Lato',
        body: 'Open Sans',
        displayFamily: '"Raleway", sans-serif',
        headingFamily: '"Lato", sans-serif',
        bodyFamily: '"Open Sans", sans-serif',
        googleFonts: 'Raleway:wght@400;600;700&family=Lato:wght@400;600&family=Open+Sans:wght@300;400;600'
      },
    ]
  },
  {
    id: 'calligraphic',
    name: 'Calligraphic',
    description: 'Elegant script & handwritten styles',
    pairings: [
      {
        id: 'elegant-script',
        name: 'Elegant Script',
        display: 'Great Vibes',
        heading: 'Cormorant Garamond',
        body: 'Montserrat',
        displayFamily: '"Great Vibes", cursive',
        headingFamily: '"Cormorant Garamond", serif',
        bodyFamily: '"Montserrat", sans-serif',
        googleFonts: 'Great+Vibes&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;600'
      },
      {
        id: 'rustic-handwritten',
        name: 'Rustic Handwritten',
        display: 'Dancing Script',
        heading: 'Raleway',
        body: 'Quicksand',
        displayFamily: '"Dancing Script", cursive',
        headingFamily: '"Raleway", sans-serif',
        bodyFamily: '"Quicksand", sans-serif',
        googleFonts: 'Dancing+Script:wght@400;700&family=Raleway:wght@400;600&family=Quicksand:wght@300;400;600'
      },
      {
        id: 'romantic-script',
        name: 'Romantic Script',
        display: 'Parisienne',
        heading: 'Playfair Display',
        body: 'Lato',
        displayFamily: '"Parisienne", cursive',
        headingFamily: '"Playfair Display", serif',
        bodyFamily: '"Lato", sans-serif',
        googleFonts: 'Parisienne&family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700'
      },
      {
        id: 'whimsical-charm',
        name: 'Whimsical Charm',
        display: 'Tangerine',
        heading: 'Josefin Sans',
        body: 'Source Sans Pro',
        displayFamily: '"Tangerine", cursive',
        headingFamily: '"Josefin Sans", sans-serif',
        bodyFamily: '"Source Sans Pro", sans-serif',
        googleFonts: 'Tangerine:wght@400;700&family=Josefin+Sans:wght@400;600&family=Source+Sans+Pro:wght@300;400;600'
      },
      {
        id: 'french-elegance',
        name: 'French Elegance',
        display: 'Alex Brush',
        heading: 'Libre Baskerville',
        body: 'Open Sans',
        displayFamily: '"Alex Brush", cursive',
        headingFamily: '"Libre Baskerville", serif',
        bodyFamily: '"Open Sans", sans-serif',
        googleFonts: 'Alex+Brush&family=Libre+Baskerville:wght@400;700&family=Open+Sans:wght@300;400;600'
      },
      {
        id: 'vintage-calligraphy',
        name: 'Vintage Calligraphy',
        display: 'Pinyon Script',
        heading: 'Crimson Text',
        body: 'Lora',
        displayFamily: '"Pinyon Script", cursive',
        headingFamily: '"Crimson Text", serif',
        bodyFamily: '"Lora", serif',
        googleFonts: 'Pinyon+Script&family=Crimson+Text:wght@400;600&family=Lora:wght@400;600'
      },
    ]
  },
  {
    id: 'serif',
    name: 'Serif',
    description: 'Classic & timeless typography',
    pairings: [
      {
        id: 'classic-serif',
        name: 'Classic Serif',
        display: 'Playfair Display',
        heading: 'Cormorant Garamond',
        body: 'Lato',
        displayFamily: '"Playfair Display", serif',
        headingFamily: '"Cormorant Garamond", serif',
        bodyFamily: '"Lato", sans-serif',
        googleFonts: 'Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@400;600&family=Lato:wght@300;400;700'
      },
      {
        id: 'romantic-serif',
        name: 'Romantic Serif',
        display: 'Cormorant Garamond',
        heading: 'Lora',
        body: 'Crimson Text',
        displayFamily: '"Cormorant Garamond", serif',
        headingFamily: '"Lora", serif',
        bodyFamily: '"Crimson Text", serif',
        googleFonts: 'Cormorant+Garamond:wght@400;600;700&family=Lora:wght@400;600&family=Crimson+Text:wght@400;600'
      },
      {
        id: 'literary-classic',
        name: 'Literary Classic',
        display: 'Libre Baskerville',
        heading: 'Merriweather',
        body: 'Source Serif Pro',
        displayFamily: '"Libre Baskerville", serif',
        headingFamily: '"Merriweather", serif',
        bodyFamily: '"Source Serif Pro", serif',
        googleFonts: 'Libre+Baskerville:wght@400;700&family=Merriweather:wght@400;700&family=Source+Serif+Pro:wght@300;400;600'
      },
      {
        id: 'old-world',
        name: 'Old World',
        display: 'EB Garamond',
        heading: 'Spectral',
        body: 'Gentium Book Basic',
        displayFamily: '"EB Garamond", serif',
        headingFamily: '"Spectral", serif',
        bodyFamily: '"Gentium Book Basic", serif',
        googleFonts: 'EB+Garamond:wght@400;600;700&family=Spectral:wght@400;600&family=Gentium+Book+Basic:wght@400;700'
      },
      {
        id: 'refined-tradition',
        name: 'Refined Tradition',
        display: 'Cinzel',
        heading: 'Cormorant',
        body: 'Crimson Pro',
        displayFamily: '"Cinzel", serif',
        headingFamily: '"Cormorant", serif',
        bodyFamily: '"Crimson Pro", serif',
        googleFonts: 'Cinzel:wght@400;600;700&family=Cormorant:wght@400;600&family=Crimson+Pro:wght@300;400;600'
      },
      {
        id: 'elegant-formal',
        name: 'Elegant Formal',
        display: 'Bodoni Moda',
        heading: 'Playfair Display',
        body: 'Lora',
        displayFamily: '"Bodoni Moda", serif',
        headingFamily: '"Playfair Display", serif',
        bodyFamily: '"Lora", serif',
        googleFonts: 'Bodoni+Moda:wght@400;600;700&family=Playfair+Display:wght@400;600&family=Lora:wght@400;600'
      },
    ]
  },
  {
    id: 'sans-serif',
    name: 'Sans Serif',
    description: 'Clean & modern looks',
    pairings: [
      {
        id: 'modern-sans',
        name: 'Modern Sans',
        display: 'Poppins',
        heading: 'Raleway',
        body: 'Inter',
        displayFamily: '"Poppins", sans-serif',
        headingFamily: '"Raleway", sans-serif',
        bodyFamily: '"Inter", sans-serif',
        googleFonts: 'Poppins:wght@400;600;700&family=Raleway:wght@400;600&family=Inter:wght@300;400;600'
      },
      {
        id: 'minimalist',
        name: 'Minimalist',
        display: 'Raleway',
        heading: 'Lato',
        body: 'Open Sans',
        displayFamily: '"Raleway", sans-serif',
        headingFamily: '"Lato", sans-serif',
        bodyFamily: '"Open Sans", sans-serif',
        googleFonts: 'Raleway:wght@400;600;700&family=Lato:wght@400;600&family=Open+Sans:wght@300;400;600'
      },
      {
        id: 'contemporary-clean',
        name: 'Contemporary Clean',
        display: 'Montserrat',
        heading: 'Nunito',
        body: 'Work Sans',
        displayFamily: '"Montserrat", sans-serif',
        headingFamily: '"Nunito", sans-serif',
        bodyFamily: '"Work Sans", sans-serif',
        googleFonts: 'Montserrat:wght@400;600;700&family=Nunito:wght@400;600&family=Work+Sans:wght@300;400;600'
      },
      {
        id: 'scandinavian',
        name: 'Scandinavian',
        display: 'DM Sans',
        heading: 'Outfit',
        body: 'Inter',
        displayFamily: '"DM Sans", sans-serif',
        headingFamily: '"Outfit", sans-serif',
        bodyFamily: '"Inter", sans-serif',
        googleFonts: 'DM+Sans:wght@400;600;700&family=Outfit:wght@400;600&family=Inter:wght@300;400;600'
      },
      {
        id: 'soft-geometric',
        name: 'Soft Geometric',
        display: 'Quicksand',
        heading: 'Nunito Sans',
        body: 'Open Sans',
        displayFamily: '"Quicksand", sans-serif',
        headingFamily: '"Nunito Sans", sans-serif',
        bodyFamily: '"Open Sans", sans-serif',
        googleFonts: 'Quicksand:wght@400;600;700&family=Nunito+Sans:wght@400;600&family=Open+Sans:wght@300;400;600'
      },
      {
        id: 'urban-chic',
        name: 'Urban Chic',
        display: 'Urbanist',
        heading: 'Manrope',
        body: 'Plus Jakarta Sans',
        displayFamily: '"Urbanist", sans-serif',
        headingFamily: '"Manrope", sans-serif',
        bodyFamily: '"Plus Jakarta Sans", sans-serif',
        googleFonts: 'Urbanist:wght@400;600;700&family=Manrope:wght@400;600&family=Plus+Jakarta+Sans:wght@300;400;600'
      },
    ]
  },
  {
    id: 'display',
    name: 'Display',
    description: 'Statement & decorative fonts',
    pairings: [
      {
        id: 'beacon-elegant',
        name: 'Beacon Elegant',
        display: 'Beacon Aesthetic',
        heading: 'Cormorant Garamond',
        body: 'Crimson Text',
        displayFamily: '"Beacon Aesthetic", serif',
        headingFamily: '"Cormorant Garamond", serif',
        bodyFamily: '"Crimson Text", serif',
        googleFonts: 'Cormorant+Garamond:wght@400;600&family=Crimson+Text:wght@400;600'
      },
      {
        id: 'macker-modern',
        name: 'Macker Modern',
        display: 'Macker',
        heading: 'Poppins',
        body: 'Inter',
        displayFamily: '"Macker", sans-serif',
        headingFamily: '"Poppins", sans-serif',
        bodyFamily: '"Inter", sans-serif',
        googleFonts: 'Poppins:wght@400;600&family=Inter:wght@300;400;600'
      },
      {
        id: 'milven-refined',
        name: 'Milven Refined',
        display: 'Milven',
        heading: 'Crimson Text',
        body: 'Lora',
        displayFamily: '"Milven", serif',
        headingFamily: '"Crimson Text", serif',
        bodyFamily: '"Lora", serif',
        googleFonts: 'Crimson+Text:wght@400;600&family=Lora:wght@400;600'
      },
      {
        id: 'stanley-classic',
        name: 'Stanley Classic',
        display: 'Stanley',
        heading: 'Playfair Display',
        body: 'Source Sans Pro',
        displayFamily: '"Stanley", serif',
        headingFamily: '"Playfair Display", serif',
        bodyFamily: '"Source Sans Pro", sans-serif',
        googleFonts: 'Playfair+Display:wght@400;700&family=Source+Sans+Pro:wght@300;400;600'
      },
      {
        id: 'sinera-timeless',
        name: 'Sinera Timeless',
        display: 'Sinera',
        heading: 'Lora',
        body: 'Merriweather',
        displayFamily: '"Sinera", serif',
        headingFamily: '"Lora", serif',
        bodyFamily: '"Merriweather", serif',
        googleFonts: 'Lora:wght@400;600&family=Merriweather:wght@300;400;700'
      },
      {
        id: 'artistic-bold',
        name: 'Artistic Bold',
        display: 'Abril Fatface',
        heading: 'Josefin Sans',
        body: 'Raleway',
        displayFamily: '"Abril Fatface", cursive',
        headingFamily: '"Josefin Sans", sans-serif',
        bodyFamily: '"Raleway", sans-serif',
        googleFonts: 'Abril+Fatface&family=Josefin+Sans:wght@400;600&family=Raleway:wght@300;400;600'
      },
    ]
  },
  {
    id: 'mixed',
    name: 'Mixed Styles',
    description: 'Creative combinations',
    pairings: [
      {
        id: 'script-serif-blend',
        name: 'Script Serif Blend',
        display: 'Sacramento',
        heading: 'Playfair Display',
        body: 'Lato',
        displayFamily: '"Sacramento", cursive',
        headingFamily: '"Playfair Display", serif',
        bodyFamily: '"Lato", sans-serif',
        googleFonts: 'Sacramento&family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700'
      },
      {
        id: 'modern-romantic',
        name: 'Modern Romantic',
        display: 'Allura',
        heading: 'Montserrat',
        body: 'Open Sans',
        displayFamily: '"Allura", cursive',
        headingFamily: '"Montserrat", sans-serif',
        bodyFamily: '"Open Sans", sans-serif',
        googleFonts: 'Allura&family=Montserrat:wght@400;600&family=Open+Sans:wght@300;400;600'
      },
      {
        id: 'classic-contemporary',
        name: 'Classic Contemporary',
        display: 'Cormorant Garamond',
        heading: 'Poppins',
        body: 'Inter',
        displayFamily: '"Cormorant Garamond", serif',
        headingFamily: '"Poppins", sans-serif',
        bodyFamily: '"Inter", sans-serif',
        googleFonts: 'Cormorant+Garamond:wght@400;600;700&family=Poppins:wght@400;600&family=Inter:wght@300;400;600'
      },
      {
        id: 'bohemian-blend',
        name: 'Bohemian Blend',
        display: 'Amatic SC',
        heading: 'Josefin Sans',
        body: 'Quicksand',
        displayFamily: '"Amatic SC", cursive',
        headingFamily: '"Josefin Sans", sans-serif',
        bodyFamily: '"Quicksand", sans-serif',
        googleFonts: 'Amatic+SC:wght@400;700&family=Josefin+Sans:wght@400;600&family=Quicksand:wght@300;400;600'
      },
      {
        id: 'garden-party',
        name: 'Garden Party',
        display: 'Kaushan Script',
        heading: 'Lora',
        body: 'Nunito',
        displayFamily: '"Kaushan Script", cursive',
        headingFamily: '"Lora", serif',
        bodyFamily: '"Nunito", sans-serif',
        googleFonts: 'Kaushan+Script&family=Lora:wght@400;600&family=Nunito:wght@300;400;600'
      },
      {
        id: 'editorial-chic',
        name: 'Editorial Chic',
        display: 'Playfair Display',
        heading: 'Raleway',
        body: 'Source Sans Pro',
        displayFamily: '"Playfair Display", serif',
        headingFamily: '"Raleway", sans-serif',
        bodyFamily: '"Source Sans Pro", sans-serif',
        googleFonts: 'Playfair+Display:wght@400;700&family=Raleway:wght@400;600&family=Source+Sans+Pro:wght@300;400;600'
      },
    ]
  },
]

// Flatten all font pairings for backward compatibility
export const FONT_PAIRINGS: FontPairing[] = FONT_PAIRING_CATEGORIES.flatMap(cat => cat.pairings)

// Available fonts list for individual selection
export const AVAILABLE_FONTS: AvailableFont[] = [
  // Custom/Display fonts
  { name: 'Beacon Aesthetic', family: '"Beacon Aesthetic", serif', category: 'Display' },
  { name: 'Macker', family: '"Macker", sans-serif', category: 'Display' },
  { name: 'Milven', family: '"Milven", serif', category: 'Display' },
  { name: 'Stanley', family: '"Stanley", serif', category: 'Display' },
  { name: 'Sinera', family: '"Sinera", serif', category: 'Display' },
  { name: 'Abril Fatface', family: '"Abril Fatface", cursive', category: 'Display' },
  { name: 'Bodoni Moda', family: '"Bodoni Moda", serif', category: 'Display' },
  { name: 'Cinzel', family: '"Cinzel", serif', category: 'Display' },
  // Calligraphic/Script fonts
  { name: 'Great Vibes', family: '"Great Vibes", cursive', category: 'Calligraphic' },
  { name: 'Dancing Script', family: '"Dancing Script", cursive', category: 'Calligraphic' },
  { name: 'Parisienne', family: '"Parisienne", cursive', category: 'Calligraphic' },
  { name: 'Tangerine', family: '"Tangerine", cursive', category: 'Calligraphic' },
  { name: 'Alex Brush', family: '"Alex Brush", cursive', category: 'Calligraphic' },
  { name: 'Pinyon Script', family: '"Pinyon Script", cursive', category: 'Calligraphic' },
  { name: 'Sacramento', family: '"Sacramento", cursive', category: 'Calligraphic' },
  { name: 'Allura', family: '"Allura", cursive', category: 'Calligraphic' },
  { name: 'Kaushan Script', family: '"Kaushan Script", cursive', category: 'Calligraphic' },
  { name: 'Amatic SC', family: '"Amatic SC", cursive', category: 'Calligraphic' },
  // Serif fonts
  { name: 'Playfair Display', family: '"Playfair Display", serif', category: 'Serif' },
  { name: 'Cormorant Garamond', family: '"Cormorant Garamond", serif', category: 'Serif' },
  { name: 'Cormorant', family: '"Cormorant", serif', category: 'Serif' },
  { name: 'Lora', family: '"Lora", serif', category: 'Serif' },
  { name: 'Crimson Text', family: '"Crimson Text", serif', category: 'Serif' },
  { name: 'Crimson Pro', family: '"Crimson Pro", serif', category: 'Serif' },
  { name: 'Merriweather', family: '"Merriweather", serif', category: 'Serif' },
  { name: 'Libre Baskerville', family: '"Libre Baskerville", serif', category: 'Serif' },
  { name: 'EB Garamond', family: '"EB Garamond", serif', category: 'Serif' },
  { name: 'Spectral', family: '"Spectral", serif', category: 'Serif' },
  { name: 'Source Serif Pro', family: '"Source Serif Pro", serif', category: 'Serif' },
  { name: 'Gentium Book Basic', family: '"Gentium Book Basic", serif', category: 'Serif' },
  // Sans-Serif fonts
  { name: 'Poppins', family: '"Poppins", sans-serif', category: 'Sans-Serif' },
  { name: 'Raleway', family: '"Raleway", sans-serif', category: 'Sans-Serif' },
  { name: 'Lato', family: '"Lato", sans-serif', category: 'Sans-Serif' },
  { name: 'Inter', family: '"Inter", sans-serif', category: 'Sans-Serif' },
  { name: 'Montserrat', family: '"Montserrat", sans-serif', category: 'Sans-Serif' },
  { name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'Sans-Serif' },
  { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif', category: 'Sans-Serif' },
  { name: 'Quicksand', family: '"Quicksand", sans-serif', category: 'Sans-Serif' },
  { name: 'Josefin Sans', family: '"Josefin Sans", sans-serif', category: 'Sans-Serif' },
  { name: 'Nunito', family: '"Nunito", sans-serif', category: 'Sans-Serif' },
  { name: 'Nunito Sans', family: '"Nunito Sans", sans-serif', category: 'Sans-Serif' },
  { name: 'Work Sans', family: '"Work Sans", sans-serif', category: 'Sans-Serif' },
  { name: 'DM Sans', family: '"DM Sans", sans-serif', category: 'Sans-Serif' },
  { name: 'Outfit', family: '"Outfit", sans-serif', category: 'Sans-Serif' },
  { name: 'Urbanist', family: '"Urbanist", sans-serif', category: 'Sans-Serif' },
  { name: 'Manrope', family: '"Manrope", sans-serif', category: 'Sans-Serif' },
  { name: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", sans-serif', category: 'Sans-Serif' },
]

// Color themes - Wedding-optimized color palettes organized by category
export interface ColorThemeCategory {
  id: string
  name: string
  description: string
  themes: ColorTheme[]
}

export const COLOR_THEME_CATEGORIES: ColorThemeCategory[] = [
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Love & elegance',
    themes: [
      { id: 'dusty-rose', name: 'Dusty Rose', colors: { primary: '#B07878', secondary: '#FAF2F2', accent: '#D4AF37' } },
      { id: 'sage-blush', name: 'Sage & Blush', colors: { primary: '#7A9A68', secondary: '#F8F2F0', accent: '#E8B4B8' } },
      { id: 'rose-gold', name: 'Rose Gold', colors: { primary: '#C4848A', secondary: '#FDF5F5', accent: '#B76E79' } },
      { id: 'mauve-taupe', name: 'Mauve & Taupe', colors: { primary: '#7A5A62', secondary: '#F8F5F5', accent: '#D4AF37' } },
      { id: 'blush-wine', name: 'Blush & Wine', colors: { primary: '#8A3A42', secondary: '#FDF5F5', accent: '#D4AF37' } },
      { id: 'wisteria-dreams', name: 'Wisteria Dreams', colors: { primary: '#8A6A9C', secondary: '#F8F5FA', accent: '#C0C0C0' } },
      { id: 'blush-cream', name: 'Blush & Cream', colors: { primary: '#D4949A', secondary: '#FDF8F5', accent: '#C9B037' } },
    ]
  },
  {
    id: 'pastels',
    name: 'Pastels',
    description: 'Soft & dreamy tones',
    themes: [
      { id: 'lavender-mist', name: 'Lavender Mist', colors: { primary: '#9A8AB8', secondary: '#F8F5FC', accent: '#C9A0DC' } },
      { id: 'mint-whisper', name: 'Mint Whisper', colors: { primary: '#6AAA94', secondary: '#F2FAF7', accent: '#D4AF37' } },
      { id: 'peach-sorbet', name: 'Peach Sorbet', colors: { primary: '#E8A878', secondary: '#FFF8F2', accent: '#CD7F32' } },
      { id: 'baby-blue', name: 'Baby Blue', colors: { primary: '#6A9AB8', secondary: '#F2F7FC', accent: '#C0C0C0' } },
      { id: 'buttercream', name: 'Buttercream', colors: { primary: '#D4B870', secondary: '#FFFCF5', accent: '#8B4513' } },
    ]
  },
  {
    id: 'earthy',
    name: 'Earthy',
    description: 'Natural & organic',
    themes: [
      { id: 'eucalyptus', name: 'Eucalyptus', colors: { primary: '#6B8A6A', secondary: '#F5F8F2', accent: '#CD7F32' } },
      { id: 'terracotta', name: 'Terracotta & Cream', colors: { primary: '#B86A50', secondary: '#FAF5F0', accent: '#D4AF37' } },
      { id: 'olive-grove', name: 'Olive Grove', colors: { primary: '#6A7A4A', secondary: '#F5F7F0', accent: '#B8860B' } },
      { id: 'desert-sand', name: 'Desert Sand', colors: { primary: '#B8956A', secondary: '#FAF7F2', accent: '#8B4513' } },
      { id: 'moss-fern', name: 'Moss & Fern', colors: { primary: '#5A7A58', secondary: '#F2F7F2', accent: '#CD7F32' } },
      { id: 'clay-linen', name: 'Clay & Linen', colors: { primary: '#9A6050', secondary: '#FAF5F0', accent: '#D4AF37' } },
    ]
  },
  {
    id: 'golden',
    name: 'Golden',
    description: 'Warm & luxurious',
    themes: [
      { id: 'champagne', name: 'Champagne Dreams', colors: { primary: '#C8A060', secondary: '#FFFAF2', accent: '#722F37' } },
      { id: 'gold-ivory', name: 'Gold & Ivory', colors: { primary: '#C8A030', secondary: '#FFFCF5', accent: '#1E3A5F' } },
      { id: 'honey-amber', name: 'Honey & Amber', colors: { primary: '#C89040', secondary: '#FFF8F0', accent: '#8B4513' } },
      { id: 'bronze-cream', name: 'Bronze & Cream', colors: { primary: '#9A7A50', secondary: '#FAF7F2', accent: '#722F37' } },
      { id: 'sunset-glow', name: 'Sunset Glow', colors: { primary: '#D87850', secondary: '#FFF5F0', accent: '#D4AF37' } },
      { id: 'golden-hour', name: 'Golden Hour', colors: { primary: '#C89020', secondary: '#FFFAF2', accent: '#8B4513' } },
    ]
  },
  {
    id: 'vivid',
    name: 'Vivid',
    description: 'Bold & vibrant',
    themes: [
      { id: 'coral-mint', name: 'Coral & Mint', colors: { primary: '#E86868', secondary: '#FFF5F5', accent: '#D4AF37' } },
      { id: 'fuchsia-teal', name: 'Fuchsia & Teal', colors: { primary: '#C82868', secondary: '#FFF2F8', accent: '#2A9D8F' } },
      { id: 'tropical-sunset', name: 'Tropical Sunset', colors: { primary: '#E86040', secondary: '#FFF5F2', accent: '#D4AF37' } },
      { id: 'ocean-coral', name: 'Ocean & Coral', colors: { primary: '#20A0B0', secondary: '#F0FAFA', accent: '#E86868' } },
      { id: 'citrus-splash', name: 'Citrus Splash', colors: { primary: '#E89020', secondary: '#FFF8F0', accent: '#722F37' } },
      { id: 'berry-punch', name: 'Berry Punch', colors: { primary: '#9848A8', secondary: '#FAF5FC', accent: '#D4AF37' } },
    ]
  },
  {
    id: 'dusty',
    name: 'Dusty',
    description: 'Muted & vintage',
    themes: [
      { id: 'dusty-blue', name: 'Dusty Blue', colors: { primary: '#6890A0', secondary: '#F5F8FA', accent: '#D4AF37' } },
      { id: 'lavender-sage', name: 'Lavender & Sage', colors: { primary: '#9080A8', secondary: '#F8F5FA', accent: '#7A9A68' } },
      { id: 'dusty-mauve', name: 'Dusty Mauve', colors: { primary: '#A08088', secondary: '#FAF5F7', accent: '#C9B037' } },
      { id: 'vintage-rose', name: 'Vintage Rose', colors: { primary: '#B08080', secondary: '#FAF5F5', accent: '#D4AF37' } },
      { id: 'muted-sage', name: 'Muted Sage', colors: { primary: '#789878', secondary: '#F5F8F5', accent: '#E8B4B8' } },
      { id: 'powder-thistle', name: 'Powder & Thistle', colors: { primary: '#7898A8', secondary: '#F5F8FA', accent: '#C0C0C0' } },
    ]
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless & elegant',
    themes: [
      { id: 'navy-gold', name: 'Navy & Gold', colors: { primary: '#1E3A5F', secondary: '#F5F7FA', accent: '#D4AF37' } },
      { id: 'burgundy-ivory', name: 'Burgundy & Ivory', colors: { primary: '#782030', secondary: '#FAF5F2', accent: '#D4AF37' } },
      { id: 'black-white', name: 'Black & White', colors: { primary: '#303030', secondary: '#F8F8F8', accent: '#D4AF37' } },
      { id: 'midnight-rose', name: 'Midnight & Rose', colors: { primary: '#203848', secondary: '#F5F8FA', accent: '#E8B4B8' } },
      { id: 'charcoal-blush', name: 'Charcoal & Blush', colors: { primary: '#404048', secondary: '#FAF5F7', accent: '#D4949A' } },
      { id: 'ivory-black', name: 'Ivory & Black', colors: { primary: '#383838', secondary: '#FAF8F5', accent: '#C0C0C0' } },
    ]
  },
  {
    id: 'jewel',
    name: 'Jewel Tones',
    description: 'Rich & regal',
    themes: [
      { id: 'emerald-gold', name: 'Emerald & Gold', colors: { primary: '#286838', secondary: '#F2F8F2', accent: '#D4AF37' } },
      { id: 'sapphire-silver', name: 'Sapphire & Silver', colors: { primary: '#284878', secondary: '#F5F7FA', accent: '#C0C0C0' } },
      { id: 'ruby-cream', name: 'Ruby & Cream', colors: { primary: '#A03040', secondary: '#FAF5F5', accent: '#D4AF37' } },
      { id: 'amethyst-gold', name: 'Amethyst & Gold', colors: { primary: '#603878', secondary: '#F8F5FA', accent: '#D4AF37' } },
      { id: 'forest-gold', name: 'Forest & Gold', colors: { primary: '#285830', secondary: '#F2F7F2', accent: '#D4AF37' } },
      { id: 'plum-champagne', name: 'Plum & Champagne', colors: { primary: '#684058', secondary: '#FAF5F8', accent: '#C9B037' } },
    ]
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Beach & ocean inspired',
    themes: [
      { id: 'ocean-sand', name: 'Ocean & Sand', colors: { primary: '#4090A0', secondary: '#F5FAFA', accent: '#D4AF37' } },
      { id: 'seafoam', name: 'Seafoam', colors: { primary: '#58A898', secondary: '#F2FAF8', accent: '#E8B4B8' } },
      { id: 'coral-reef', name: 'Coral Reef', colors: { primary: '#D87068', secondary: '#FFF5F5', accent: '#2A9D8F' } },
      { id: 'nautical', name: 'Nautical', colors: { primary: '#285080', secondary: '#F5F7FA', accent: '#D4AF37' } },
      { id: 'driftwood', name: 'Driftwood', colors: { primary: '#8A7860', secondary: '#FAF8F5', accent: '#4090A0' } },
      { id: 'sunset-beach', name: 'Sunset Beach', colors: { primary: '#D88050', secondary: '#FFF8F5', accent: '#D4AF37' } },
    ]
  },
  {
    id: 'garden',
    name: 'Garden',
    description: 'Floral & botanical',
    themes: [
      { id: 'english-rose', name: 'English Rose', colors: { primary: '#C88898', secondary: '#FFF5F7', accent: '#7A9A68' } },
      { id: 'lavender-field', name: 'Lavender Field', colors: { primary: '#7858A0', secondary: '#F8F5FA', accent: '#D4AF37' } },
      { id: 'peony-garden', name: 'Peony Garden', colors: { primary: '#D86898', secondary: '#FFF5F8', accent: '#7A9A68' } },
      { id: 'wildflower', name: 'Wildflower', colors: { primary: '#A878A8', secondary: '#FAF5FA', accent: '#D4AF37' } },
      { id: 'sunflower', name: 'Sunflower', colors: { primary: '#D89040', secondary: '#FFFAF2', accent: '#285830' } },
      { id: 'spring-bloom', name: 'Spring Bloom', colors: { primary: '#D88898', secondary: '#FFF5F7', accent: '#D4AF37' } },
    ]
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Special palettes',
    themes: [
      { id: 'yulis-wedding', name: 'Yulis Wedding', colors: { primary: '#5F5420', secondary: '#F8F8F5', accent: '#D4AF37' } },
    ]
  },
]

// Flatten all themes for backward compatibility
export const COLOR_THEMES: ColorTheme[] = COLOR_THEME_CATEGORIES.flatMap(cat => cat.themes)

// Default font pairing (Classic Serif)
export const DEFAULT_FONT_PAIRING = FONT_PAIRINGS.find(p => p.id === 'classic-serif') || FONT_PAIRINGS[0]

// Default color theme (Sage & Blush)
export const DEFAULT_COLOR_THEME = COLOR_THEMES.find(t => t.id === 'sage-blush') || COLOR_THEMES[0]
