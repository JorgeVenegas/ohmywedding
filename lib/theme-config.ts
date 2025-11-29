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

// Font pairings - Curated combinations for wedding sites (Display / Heading / Body)
export const FONT_PAIRINGS: FontPairing[] = [
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
    id: 'minimalist',
    name: 'Minimalist',
    display: 'Raleway',
    heading: 'Lato',
    body: 'Open Sans',
    displayFamily: '"Raleway", sans-serif',
    headingFamily: '"Lato", sans-serif',
    bodyFamily: '"Open Sans", sans-serif',
    googleFonts: 'Raleway:wght@400;600;700&family=Lato:wght@400;600&family=Open+Sans:wght@300;400;600'
  }
]

// Available fonts list for individual selection
export const AVAILABLE_FONTS: AvailableFont[] = [
  // Custom fonts
  { name: 'Beacon Aesthetic', family: '"Beacon Aesthetic", serif', category: 'Custom' },
  { name: 'Macker', family: '"Macker", sans-serif', category: 'Custom' },
  { name: 'Milven', family: '"Milven", serif', category: 'Custom' },
  { name: 'Stanley', family: '"Stanley", serif', category: 'Custom' },
  { name: 'Sinera', family: '"Sinera", serif', category: 'Custom' },
  // Google fonts
  { name: 'Playfair Display', family: '"Playfair Display", serif', category: 'Serif' },
  { name: 'Cormorant Garamond', family: '"Cormorant Garamond", serif', category: 'Serif' },
  { name: 'Lora', family: '"Lora", serif', category: 'Serif' },
  { name: 'Crimson Text', family: '"Crimson Text", serif', category: 'Serif' },
  { name: 'Merriweather', family: '"Merriweather", serif', category: 'Serif' },
  { name: 'Great Vibes', family: '"Great Vibes", cursive', category: 'Script' },
  { name: 'Dancing Script', family: '"Dancing Script", cursive', category: 'Script' },
  { name: 'Poppins', family: '"Poppins", sans-serif', category: 'Sans-Serif' },
  { name: 'Raleway', family: '"Raleway", sans-serif', category: 'Sans-Serif' },
  { name: 'Lato', family: '"Lato", sans-serif', category: 'Sans-Serif' },
  { name: 'Inter', family: '"Inter", sans-serif', category: 'Sans-Serif' },
  { name: 'Montserrat', family: '"Montserrat", sans-serif', category: 'Sans-Serif' },
  { name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'Sans-Serif' },
  { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif', category: 'Sans-Serif' },
  { name: 'Quicksand', family: '"Quicksand", sans-serif', category: 'Sans-Serif' }
]

// Color themes - Wedding-optimized color palettes
export const COLOR_THEMES: ColorTheme[] = [
  { 
    id: 'sage-blush', 
    name: 'Sage & Blush', 
    colors: { primary: '#9CAF88', secondary: '#F4C2C2', accent: '#D4A574' } 
  },
  { 
    id: 'dusty-rose', 
    name: 'Dusty Rose', 
    colors: { primary: '#D4A5A5', secondary: '#E8C5C5', accent: '#B8A5A5' } 
  },
  { 
    id: 'navy-gold', 
    name: 'Navy & Gold', 
    colors: { primary: '#1E3A5F', secondary: '#D4AF37', accent: '#2C5F8D' } 
  },
  { 
    id: 'lavender-sage', 
    name: 'Lavender & Sage', 
    colors: { primary: '#B8A5D1', secondary: '#9CAF88', accent: '#D1C4E9' } 
  },
  { 
    id: 'burgundy-ivory', 
    name: 'Burgundy & Ivory', 
    colors: { primary: '#800020', secondary: '#FFFFF0', accent: '#A0522D' } 
  },
  { 
    id: 'eucalyptus', 
    name: 'Eucalyptus Green', 
    colors: { primary: '#8B9A7A', secondary: '#B8C5A6', accent: '#6B7A5F' } 
  },
  { 
    id: 'terracotta', 
    name: 'Terracotta & Cream', 
    colors: { primary: '#C4715C', secondary: '#F5E6D3', accent: '#A55843' } 
  },
  { 
    id: 'mauve-taupe', 
    name: 'Mauve & Taupe', 
    colors: { primary: '#9F8189', secondary: '#B8A99A', accent: '#8B7E74' } 
  },
  { 
    id: 'forest-gold', 
    name: 'Forest & Gold', 
    colors: { primary: '#2C5530', secondary: '#D4AF37', accent: '#4A7C4E' } 
  },
  { 
    id: 'coral-mint', 
    name: 'Coral & Mint', 
    colors: { primary: '#FF7F7F', secondary: '#98D8C8', accent: '#FF6B6B' } 
  },
  { 
    id: 'midnight-rose', 
    name: 'Midnight & Rose', 
    colors: { primary: '#2C3E50', secondary: '#E8A5A5', accent: '#556B7A' } 
  },
  { 
    id: 'champagne', 
    name: 'Champagne Dreams', 
    colors: { primary: '#E8D5B7', secondary: '#F5E6D3', accent: '#C9A66B' } 
  }
]

// Default font pairing (Classic Serif)
export const DEFAULT_FONT_PAIRING = FONT_PAIRINGS.find(p => p.id === 'classic-serif') || FONT_PAIRINGS[0]

// Default color theme (Sage & Blush)
export const DEFAULT_COLOR_THEME = COLOR_THEMES.find(t => t.id === 'sage-blush') || COLOR_THEMES[0]
