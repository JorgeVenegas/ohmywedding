import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import { type Wedding } from '@/lib/wedding-data'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export type EventType = 'civilCeremony' | 'religiousCeremony' | 'cocktail' | 'reception' | 'afterParty' | 'custom'

export interface CustomEvent {
  id: string
  type: EventType
  title: string
  date?: string // ISO date string, defaults to wedding date if not provided
  time: string
  venue: string
  address?: string
  description?: string
  imageUrl?: string // Optional image for the event
  order: number // For custom ordering
  useWeddingDate?: boolean // If true, use wedding date instead of custom date
}

export interface BaseEventDetailsProps {
  wedding: Wedding
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  events?: CustomEvent[] // New primary way to manage events
  showMapLinks?: boolean
  showMap?: boolean
  sectionTitle?: string
  sectionSubtitle?: string
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  // Legacy props for backward compatibility
  showCeremony?: boolean
  showReception?: boolean
  showPhotos?: boolean
  ceremonyImageUrl?: string
  receptionImageUrl?: string
  ceremonyDescription?: string
  receptionDescription?: string
  customEvents?: CustomEvent[]
  ceremonyTextAlignment?: 'left' | 'center' | 'right'
  receptionTextAlignment?: 'left' | 'center' | 'right'
}

export interface EventItem {
  title: string
  time: string
  venue: string
  address?: string
  description?: string
  imageUrl?: string
  iconType: 'ceremony' | 'reception' | 'custom'
}

// Helper to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent / 100)))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100)))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(255 * percent / 100)))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Helper to add transparency to a color
function withOpacity(hex: string, opacity: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Helper to create a very light tint of a color (close to white)
function getLightTint(hex: string, tintAmount: number = 0.95): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

// Helper to get relative luminance
function getLuminance(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

// Helper to find the darkest color
function getDarkestColor(...colors: string[]): string {
  let darkest = colors[0]
  let lowestLuminance = getLuminance(colors[0])
  
  for (const color of colors) {
    const luminance = getLuminance(color)
    if (luminance < lowestLuminance) {
      lowestLuminance = luminance
      darkest = color
    }
  }
  return darkest
}

// Helper to get second darkest color
function getSecondDarkestColor(...colors: string[]): string {
  const sorted = [...colors].sort((a, b) => getLuminance(a) - getLuminance(b))
  return sorted[1] || sorted[0]
}

// Helper to check if a color is light
function isLightColor(hex: string): boolean {
  const luminance = getLuminance(hex)
  return luminance > 0.5
}

// Helper to find the lightest color from the palette
function getLightestColor(...colors: string[]): string {
  let lightest = colors[0]
  let highestLuminance = getLuminance(colors[0])
  
  for (const color of colors) {
    const luminance = getLuminance(color)
    if (luminance > highestLuminance) {
      highestLuminance = luminance
      lightest = color
    }
  }
  return lightest
}

// Helper to get second lightest color
function getSecondLightestColor(...colors: string[]): string {
  const sorted = [...colors].sort((a, b) => getLuminance(b) - getLuminance(a))
  return sorted[1] || sorted[0]
}

// Helper to get colors based on background choice
export function getColorScheme(
  theme: Partial<ThemeConfig> | undefined,
  backgroundColorChoice: BackgroundColorChoice | undefined,
  useColorBackground: boolean | undefined
): { 
  bgColor: string | undefined
  titleColor: string | undefined
  subtitleColor: string | undefined
  sectionTextColor: string | undefined
  sectionTextColorAlt: string | undefined
  accentColor: string | undefined
  contrastColor: string | undefined
  colorLight: string | undefined
  colorDark: string | undefined
  colorMuted: string | undefined
  cardBg: string | undefined
  bodyTextColor: string
  isColored: boolean
  isLightBg: boolean
} {
  const choice = backgroundColorChoice || (useColorBackground ? 'primary' : 'none')
  
  if (choice === 'none' || !theme?.colors) {
    return { 
      bgColor: undefined, 
      titleColor: theme?.colors?.primary,
      subtitleColor: theme?.colors?.secondary,
      sectionTextColor: theme?.colors?.foreground,
      sectionTextColorAlt: theme?.colors?.accent,
      accentColor: theme?.colors?.accent,
      contrastColor: undefined,
      colorLight: undefined, 
      colorDark: undefined, 
      colorMuted: undefined,
      cardBg: undefined,
      bodyTextColor: '#4B5563',
      isColored: false,
      isLightBg: false
    }
  }
  
  const { primary, secondary, accent } = theme.colors
  
  const darkestColor = getDarkestColor(primary, secondary, accent)
  const secondDarkest = getSecondDarkestColor(primary, secondary, accent)
  
  let baseColor: string
  let accentColor: string
  let contrastColor: string
  
  const getBaseColorChoice = (c: string) => c.replace('-lighter', '').replace('-light', '') as 'primary' | 'secondary' | 'accent'
  const isLightVariant = choice.endsWith('-light') && !choice.endsWith('-lighter')
  const isLighterVariant = choice.endsWith('-lighter')
  
  const baseChoice = getBaseColorChoice(choice)
  
  switch (baseChoice) {
    case 'primary':
      baseColor = primary
      accentColor = accent
      contrastColor = secondary
      break
    case 'secondary':
      baseColor = secondary
      accentColor = primary
      contrastColor = accent
      break
    case 'accent':
      baseColor = accent
      accentColor = primary
      contrastColor = secondary
      break
    default:
      return { 
        bgColor: undefined, 
        titleColor: theme?.colors?.primary,
        subtitleColor: theme?.colors?.secondary,
        sectionTextColor: theme?.colors?.foreground,
        sectionTextColorAlt: theme?.colors?.accent,
        accentColor: undefined,
        contrastColor: undefined,
        colorLight: undefined, 
        colorDark: undefined, 
        colorMuted: undefined,
        cardBg: undefined,
        bodyTextColor: '#4B5563',
        isColored: false,
        isLightBg: false
      }
  }
  
  let finalBgColor = baseColor
  if (isLightVariant) {
    finalBgColor = getLightTint(baseColor, 0.5)
  } else if (isLighterVariant) {
    finalBgColor = getLightTint(baseColor, 0.88)
  }
  
  const bgIsLight = isLightColor(baseColor) || isLightVariant || isLighterVariant
  
  const lightestColor = getLightestColor(primary, secondary, accent)
  const secondLightest = getSecondLightestColor(primary, secondary, accent)
  
  const creamyLight = getLightTint(lightestColor, 0.7)
  const creamyLightAlt = getLightTint(secondLightest, 0.6)
  
  const sectionText = bgIsLight ? darkestColor : creamyLight
  const sectionTextAlt = bgIsLight ? secondDarkest : creamyLightAlt
  
  return { 
    bgColor: finalBgColor,
    titleColor: darkestColor,
    subtitleColor: secondDarkest,
    sectionTextColor: sectionText,
    sectionTextColorAlt: sectionTextAlt,
    accentColor: accentColor,
    contrastColor: contrastColor,
    colorLight: adjustColorBrightness(baseColor, 20),
    colorDark: adjustColorBrightness(baseColor, -20),
    colorMuted: withOpacity(baseColor, 0.25),
    cardBg: getLightTint(baseColor, 0.97),
    bodyTextColor: '#4B5563',
    isColored: true,
    isLightBg: bgIsLight
  }
}

// Helper to format wedding time
export function formatWeddingTime(time: string | null): string {
  if (!time) return 'TBD'
  try {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  } catch {
    return time
  }
}

// Translation function type for buildEventsList
type TranslateFunction = (key: string) => string

// Helper to build events list
// Note: ceremonyDescription/receptionDescription can be:
//   - undefined: use default translated text
//   - empty string "": show no description
//   - non-empty string: use custom description
export function buildEventsList(
  wedding: Wedding,
  showCeremony: boolean,
  showReception: boolean,
  customEvents: CustomEvent[],
  ceremonyImageUrl?: string,
  receptionImageUrl?: string,
  ceremonyDescription?: string,
  receptionDescription?: string,
  t?: TranslateFunction
): EventItem[] {
  const ceremonyTime = formatWeddingTime(wedding.wedding_time)
  const receptionTime = wedding.reception_time 
    ? formatWeddingTime(wedding.reception_time) 
    : (t ? t('eventDetails.followingCeremony') : 'Following ceremony')
  
  // Get description: if undefined use default, if empty string use undefined (no description), otherwise use the value
  const getCeremonyDescription = () => {
    if (ceremonyDescription === undefined) {
      return t ? t('eventDetails.ceremonyDescriptionDefault') : "Join us as we exchange vows"
    }
    return ceremonyDescription || undefined // empty string becomes undefined
  }
  
  const getReceptionDescription = () => {
    if (receptionDescription === undefined) {
      return t ? t('eventDetails.receptionDescriptionDefault') : "Dinner, dancing, and celebration"
    }
    return receptionDescription || undefined // empty string becomes undefined
  }
  
  return [
    ...(showCeremony && (wedding.ceremony_venue_name || wedding.wedding_time) ? [{
      title: t ? t('eventDetails.ceremony') : "Ceremony",
      time: ceremonyTime,
      venue: wedding.ceremony_venue_name || '',
      address: wedding.ceremony_venue_address || undefined,
      description: getCeremonyDescription(),
      imageUrl: ceremonyImageUrl,
      iconType: "ceremony" as const
    }] : []),
    ...(showReception && (wedding.reception_venue_name || wedding.reception_time) ? [{
      title: t ? t('eventDetails.reception') : "Reception",
      time: receptionTime,
      venue: wedding.reception_venue_name || '',
      address: wedding.reception_venue_address || undefined,
      description: getReceptionDescription(),
      imageUrl: receptionImageUrl,
      iconType: "reception" as const
    }] : []),
    ...customEvents.map(event => ({
      ...event,
      iconType: "custom" as const
    }))
  ]
}

// Helper to get icon name for event type
export function getEventIconType(type: EventType): 'ceremony' | 'reception' | 'custom' {
  switch (type) {
    case 'civilCeremony':
    case 'religiousCeremony':
      return 'ceremony'
    case 'reception':
      return 'reception'
    default:
      return 'custom'
  }
}

// Helper to sort events by date and time
export function sortEventsByDateTime(events: CustomEvent[], weddingDate?: string): CustomEvent[] {
  return [...events].sort((a, b) => {
    const dateA = a.useWeddingDate ? (weddingDate || a.date || '') : (a.date || weddingDate || '')
    const dateB = b.useWeddingDate ? (weddingDate || b.date || '') : (b.date || weddingDate || '')
    
    // If dates are different, sort by date
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB)
    }
    
    // If dates are same, sort by time
    const timeA = a.time || '00:00'
    const timeB = b.time || '00:00'
    if (timeA !== timeB) {
      return timeA.localeCompare(timeB)
    }
    
    // If date and time are same, sort by order property
    return (a.order || 0) - (b.order || 0)
  })
}

// Helper to build unified event list (supports both new events array and legacy ceremony/reception props)
export function buildEventList(props: BaseEventDetailsProps): CustomEvent[] {
  const { 
    events, 
    wedding,
    showCeremony, 
    showReception, 
    customEvents,
    ceremonyDescription,
    receptionDescription,
    ceremonyImageUrl,
    receptionImageUrl
  } = props

  // If events array is provided, use it (new approach)
  if (events && events.length > 0) {
    return sortEventsByDateTime(events, wedding.wedding_date || undefined)
  }

  // Otherwise, build from legacy props for backward compatibility
  const legacyEvents: CustomEvent[] = []

  // Show ceremony if enabled and has either venue name or time
  if (showCeremony && (wedding.ceremony_venue_name || wedding.wedding_time)) {
    legacyEvents.push({
      id: 'ceremony',
      type: 'religiousCeremony',
      title: wedding.ceremony_venue_name || 'Ceremony',
      date: wedding.wedding_date || '',
      time: wedding.wedding_time || '',
      venue: wedding.ceremony_venue_name || '',
      address: wedding.ceremony_venue_address || '',
      description: ceremonyDescription || '',
      imageUrl: ceremonyImageUrl,
      order: 0,
      useWeddingDate: true
    })
  }

  // Show reception if enabled and has either venue name or time
  if (showReception && (wedding.reception_venue_name || wedding.reception_time)) {
    legacyEvents.push({
      id: 'reception',
      type: 'reception',
      title: wedding.reception_venue_name || 'Reception',
      date: wedding.wedding_date || '',
      time: wedding.reception_time || '',
      venue: wedding.reception_venue_name || '',
      address: wedding.reception_venue_address || '',
      description: receptionDescription || '',
      imageUrl: receptionImageUrl,
      order: 1,
      useWeddingDate: true
    })
  }

  // Add any custom events
  if (customEvents) {
    legacyEvents.push(...customEvents.map((event, index) => ({
      ...event,
      id: event.id || `custom-${index}`,
      type: (event.type || 'custom') as EventType,
      order: legacyEvents.length + index,
      useWeddingDate: event.useWeddingDate ?? true,
      date: event.date || wedding.wedding_date || ''
    })))
  }

  return sortEventsByDateTime(legacyEvents, wedding.wedding_date || undefined)
}

// Helper to get map URL
export function getMapUrl(address: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`
}
