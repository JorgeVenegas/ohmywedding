// Example usage of the modular wedding components with different configurations

import { WeddingPageConfig } from '@/lib/wedding-config'
import { classicWeddingConfig, modernWeddingConfig, rusticWeddingConfig } from '@/lib/wedding-configs'

// Example 1: Minimal Configuration - Only Essential Components
export const minimalConfig: WeddingPageConfig = {
  theme: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#cccccc',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#666666'
    },
    fonts: {
      heading: 'sans-serif',
      body: 'sans-serif',
      script: 'serif'
    },
    spacing: {
      section: 'py-12 px-4',
      container: 'max-w-3xl mx-auto'
    }
  },
  components: [
    {
      id: 'hero-minimal',
      type: 'hero',
      enabled: true,
      order: 0,
      props: {
        showCoverImage: false,
        showTagline: false,
        showCountdown: false,
        showRSVPButton: true
      },
      alignment: { text: 'center', content: 'center', image: 'center' }
    },
    {
      id: 'event-details-minimal',
      type: 'event-details',
      enabled: true,
      order: 1,
      props: {
        showCeremony: true,
        showReception: false,
        showDressCode: false,
        showMapLinks: true
      }
    },
    {
      id: 'rsvp-minimal',
      type: 'rsvp',
      enabled: true,
      order: 2,
      props: {
        embedForm: false,
        showMealPreferences: false,
        showCustomQuestions: false
      }
    }
  ],
  meta: {
    title: 'Wedding Invitation',
    description: 'Join us for our celebration'
  }
}

// Example 2: Full-Featured Configuration - All Components Enabled
export const fullFeaturedConfig: WeddingPageConfig = {
  theme: {
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
    },
    spacing: {
      section: 'py-20 px-6',
      container: 'max-w-6xl mx-auto'
    }
  },
  components: [
    {
      id: 'hero-full',
      type: 'hero',
      enabled: true,
      order: 0,
      props: {
        showCoverImage: true,
        showTagline: true,
        tagline: 'Two hearts becoming one',
        showCountdown: true,
        showRSVPButton: true
      }
    },
    {
      id: 'countdown-full',
      type: 'countdown',
      enabled: true,
      order: 1,
      props: {
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
        message: 'Until our forever begins'
      }
    },
    {
      id: 'our-story-full',
      type: 'our-story',
      enabled: true,
      order: 2,
      props: {
        showHowWeMet: true,
        showProposal: true,
        showPhotos: true,
        timeline: [
          {
            date: 'June 2021',
            title: 'First Meeting',
            description: 'A chance encounter at the coffee shop...',
            photo: 'https://picsum.photos/400/300?random=23'
          },
          {
            date: 'December 2022', 
            title: 'First Date',
            description: 'Dinner under the city lights...',
            photo: 'https://picsum.photos/400/300?random=24'
          },
          {
            date: 'September 2023',
            title: 'The Proposal',
            description: 'A perfect moment in Paris...',
            photo: 'https://picsum.photos/400/300?random=25'
          }
        ]
      }
    },
    {
      id: 'event-details-full',
      type: 'event-details',
      enabled: true,
      order: 3,
      props: {
        showCeremony: true,
        showReception: true,
        showDressCode: true,
        showMapLinks: true,
        dressCode: 'Cocktail attire - no jeans please!',
        customEvents: [
          {
            title: 'Rehearsal Dinner',
            time: '7:00 PM',
            venue: 'Private Dining Room',
            address: '123 Restaurant St',
            description: 'Join us for an intimate dinner with the wedding party'
          }
        ]
      }
    },
    {
      id: 'gallery-full',
      type: 'gallery',
      enabled: true,
      order: 4,
      props: {
        showEngagementPhotos: true,
        showVideoSupport: true,
        maxDisplayPhotos: 9,
        showViewAllButton: true
      }
    },
    {
      id: 'rsvp-full',
      type: 'rsvp',
      enabled: true,
      order: 5,
      props: {
        embedForm: true,
        showMealPreferences: true,
        showCustomQuestions: true,
        customQuestions: [
          {
            id: 'song-request',
            question: 'Song requests for the reception?',
            type: 'text',
            required: false
          },
          {
            id: 'accommodations',
            question: 'Will you need accommodations?',
            type: 'select',
            options: ['No thanks', 'Yes, please send hotel info', 'I\'ve already booked'],
            required: false
          },
          {
            id: 'special-message',
            question: 'Any special message for the couple?',
            type: 'textarea',
            required: false
          }
        ]
      }
    },
    {
      id: 'faq-full',
      type: 'faq',
      enabled: true,
      order: 6,
      props: {
        allowMultipleOpen: true,
        questions: [
          {
            question: 'What is the dress code?',
            answer: 'Cocktail attire! Think semi-formal - dresses, suits, but no jeans or sneakers please.'
          },
          {
            question: 'Can I bring a plus one?',
            answer: 'Due to venue capacity, we can only accommodate those listed on your invitation.'
          },
          {
            question: 'Is the venue kid-friendly?',
            answer: 'We love your little ones! The venue is child-friendly and we\'ll have activities for kids.'
          },
          {
            question: 'What about parking?',
            answer: 'Free parking is available on-site. Valet service will be provided for the reception.'
          },
          {
            question: 'Is the ceremony indoors or outdoors?',
            answer: 'The ceremony will be outdoors in our beautiful garden. We have a backup indoor location in case of rain.'
          },
          {
            question: 'Will you have a vegetarian menu option?',
            answer: 'Absolutely! Please indicate dietary preferences in your RSVP and we\'ll take care of you.'
          }
        ]
      }
    }
  ],
  meta: {
    title: 'Sarah & Michael - Wedding Celebration',
    description: 'Join us for our wedding celebration filled with love, laughter, and dancing!'
  }
}

// Example 3: Photo-Heavy Configuration - Focus on Visual Storytelling
export const visualConfig: WeddingPageConfig = {
  theme: {
    colors: {
      primary: '#2C5F2D',
      secondary: '#97BC62', 
      accent: '#FAC748',
      background: '#FEFEFE',
      foreground: '#1B1B1B',
      muted: '#6B6B6B'
    },
    fonts: {
      heading: 'script',
      body: 'serif',
      script: 'cursive'
    },
    spacing: {
      section: 'py-24 px-4',
      container: 'max-w-7xl mx-auto'
    }
  },
  components: [
    {
      id: 'hero-visual',
      type: 'hero',
      enabled: true,
      order: 0,
      props: {
        showCoverImage: true,
        coverImageUrl: '/hero-bg.jpg',
        showTagline: true,
        tagline: 'Our love story in pictures',
        showCountdown: false,
        showRSVPButton: false
      }
    },
    {
      id: 'gallery-hero',
      type: 'gallery',
      enabled: true,
      order: 1,
      props: {
        showEngagementPhotos: true,
        showVideoSupport: true,
        maxDisplayPhotos: 12,
        showViewAllButton: true
      }
    },
    {
      id: 'our-story-visual',
      type: 'our-story',
      enabled: true,
      order: 2,
      props: {
        showHowWeMet: false,
        showProposal: false,
        showPhotos: false,
        timeline: [
          {
            date: 'Spring 2019',
            title: 'First Glance',
            description: 'Across a crowded bookstore...',
            photo: '/timeline-1.jpg'
          },
          {
            date: 'Summer 2019',  
            title: 'First Adventure',
            description: 'Our first hiking trip together...',
            photo: '/timeline-2.jpg'
          },
          {
            date: 'Fall 2021',
            title: 'Moving In',
            description: 'Making a home together...',
            photo: '/timeline-3.jpg'
          },
          {
            date: 'Winter 2023',
            title: 'The Question',
            description: 'Under the Christmas lights...',
            photo: '/timeline-4.jpg'
          }
        ]
      }
    },
    {
      id: 'event-details-visual',
      type: 'event-details',
      enabled: true,
      order: 3,
      props: {
        showCeremony: true,
        showReception: true,
        showDressCode: true,
        dressCode: 'Garden party elegant - florals encouraged!'
      }
    },
    {
      id: 'rsvp-visual',
      type: 'rsvp', 
      enabled: true,
      order: 4,
      props: {
        embedForm: false
      }
    }
  ],
  meta: {
    title: 'Emma & James - A Visual Love Story',
    description: 'Follow our journey through photos and join our celebration'
  }
}

// Usage examples in comments:
/*
// In your wedding page component:

// Option 1: Use a pre-built config
const config = classicWeddingConfig

// Option 2: Create from wedding data with style
const config = createConfigFromWedding(wedding, 'rustic')

// Option 3: Use a custom config
const config = minimalConfig

// Option 4: Customize an existing config
const config = {
  ...modernWeddingConfig,
  theme: {
    ...modernWeddingConfig.theme,
    colors: {
      ...modernWeddingConfig.theme.colors,
      primary: wedding.primary_color
    }
  },
  components: modernWeddingConfig.components.map(comp => 
    comp.type === 'hero' 
      ? { ...comp, props: { ...comp.props, tagline: 'Our custom tagline!' }}
      : comp
  )
}

// Then render with:
<WeddingPageRenderer 
  wedding={wedding}
  dateId={dateId}
  weddingNameId={weddingNameId}
  config={config}
/>
*/