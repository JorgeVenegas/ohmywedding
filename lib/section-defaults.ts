export function getDefaultPropsForSection(sectionType: string): Record<string, any> {
  switch (sectionType) {
    case 'hero':
      return {
        showCoverImage: false,
        showTagline: true,
        tagline: 'Join us as we tie the knot!',
        showCountdown: true,
        showRSVPButton: true,
      }
    case 'banner':
      return {
        imageUrl: '',
        bannerHeight: 'large',
        showText: true,
        title: '',
        subtitle: '',
        overlayOpacity: 40,
        backgroundGradient: false,
        gradientColor1: 'palette:primary',
        gradientColor2: 'palette:accent',
        imageBrightness: 100,
      }
    case 'our-story':
      return {
        variant: 'cards',
        showHowWeMet: true,
        showProposal: true,
        showPhotos: false,
      }
    case 'countdown':
      return {
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      }
    case 'event-details':
      return {
        showCeremony: true,
        showReception: true,
        showDressCode: true,
        showMapLinks: true,
      }
    case 'gallery':
      return {
        showEngagementPhotos: true,
        showVideoSupport: false,
        showDemoPhotos: true,
      }
    case 'rsvp':
      return {
        variant: 'cta',
        showMealPreferences: true,
      }
    case 'faq':
      return {
        questions: [],
      }
    case 'registry':
      return {
        variant: 'cards',
        registries: [],
        customItems: [],
        showCustomRegistry: false,
      }
    case 'dress-code':
      return {
        dressCodeType: '',
        description: '',
        images: [],
      }
    case 'special-guests':
      return {
        showTitle: true,
        showSubtitle: true,
        showIntroText: true,
        showParents: true,
        brideParents: [
          { id: 'bp-1', name: '', role: '' },
          { id: 'bp-2', name: '', role: '' },
        ],
        showBrideParents: true,
        groomParents: [
          { id: 'gp-1', name: '', role: '' },
          { id: 'gp-2', name: '', role: '' },
        ],
        showGroomParents: true,
        partyGroups: [
          { id: 'group-1', title: '', show: true, people: [{ id: 'bm-1', name: '', role: '' }] },
          { id: 'group-2', title: '', show: true, people: [{ id: 'gm-1', name: '', role: '' }] },
        ],
        useColorBackground: false,
        backgroundColorChoice: 'none',
      }
    case 'notes':
      return {
        sectionTitle: 'A Note From Us',
        sectionSubtitle: 'Just a thought',
        bodyText: "We're so grateful you'll be celebrating with us. This is a space to share anything you'd like your guests to know.",
        showTitle: true,
        showSubtitle: true,
        showBodyText: true,
        sectionHeight: 'normal',
        useColorBackground: false,
        backgroundColorChoice: 'none',
      }
    case 'guest-photos':
      return {
        title: 'Share Your Photos',
        subtitle: 'Upload your favorite moments from our celebration',
        uploaderPlaceholder: 'Your name',
        variant: 'minimal',
        galleryLayout: 'masonry',
        useColorBackground: false,
        backgroundColorChoice: 'none',
      }
    case 'hotel-suggestions':
      return {
        hotels: [],
      }
    case 'music':
      return {}
    default:
      return {}
  }
}
