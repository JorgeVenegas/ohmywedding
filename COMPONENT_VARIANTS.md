# Wedding Component Variants System

This document explains the modular wedding component system that allows for different visual presentations of each component type.

## Overview

Each wedding component now supports multiple variants, allowing you to choose different layouts and styles for the same content. This provides flexibility in creating unique wedding websites while maintaining consistency and reusability.

## Available Components and Their Variants

### 1. Hero Section

The hero section supports 4 different variants:

#### **Background Variant** (`variant: 'background'`)
- Full-screen background image with overlay text
- Text overlaid on the image with dark overlay for readability
- Perfect for dramatic, cinematic presentations
- **Props:**
  - `heroImageUrl`: Background image URL
  - `showTagline`, `tagline`: Custom tagline text
  - `showCountdown`: Display countdown to wedding
  - `showRSVPButton`: Show RSVP call-to-action

#### **Side-by-Side Variant** (`variant: 'side-by-side'`)
- Split layout with image on one side, text on the other
- **Props:**
  - `imagePosition`: `'left'` or `'right'` 
  - `heroImageUrl`: Portrait or couple image
  - All standard hero props

#### **Framed Variant** (`variant: 'framed'`)
- Featured image in a decorative frame with text below
- **Props:**
  - `frameStyle`: `'circular'`, `'rounded'`, `'square'`, `'polaroid'`
  - `imageSize`: `'small'`, `'medium'`, `'large'`
  - `heroImageUrl`: Featured image (usually engagement photo)

#### **Minimal Variant** (`variant: 'minimal'`)
- Text-focused design with subtle decorative elements
- **Props:**
  - `backgroundColor`: Custom background color
  - `showDecorations`: Toggle decorative elements

### 2. Our Story Section

The our story section supports 3 different variants:

#### **Timeline Variant** (`variant: 'timeline'`)
- Vertical timeline layout showing relationship milestones
- Alternating left/right content blocks
- **Props:**
  - `timeline`: Array of timeline events with dates, titles, descriptions, and optional photos
  - `howWeMetText`, `proposalText`: Story text blocks

#### **Cards Variant** (`variant: 'cards'`)
- Card-based layout with images and story sections
- Photo gallery grid for additional images
- **Props:**
  - `photos`: Array of photo objects with URLs and captions
  - `showPhotos`: Toggle photo gallery display

#### **Minimal Variant** (`variant: 'minimal'`)
- Simple text-focused layout
- Clean typography with minimal visual elements
- **Props:**
  - Standard story text props only

## Configuration Examples

### Hero Variants

```typescript
// Background Hero
{
  type: 'hero',
  props: {
    variant: 'background',
    heroImageUrl: '/images/hero-bg.jpg',
    tagline: 'Two hearts become one',
    showCountdown: true
  }
}

// Side-by-Side Hero
{
  type: 'hero',
  props: {
    variant: 'side-by-side',
    imagePosition: 'left',
    heroImageUrl: '/images/couple-portrait.jpg'
  }
}

// Framed Hero
{
  type: 'hero',
  props: {
    variant: 'framed',
    frameStyle: 'circular',
    imageSize: 'large',
    heroImageUrl: '/images/engagement.jpg'
  }
}

// Minimal Hero
{
  type: 'hero',
  props: {
    variant: 'minimal',
    showDecorations: true,
    backgroundColor: '#F8FAFC'
  }
}
```

### Our Story Variants

```typescript
// Timeline Story
{
  type: 'our-story',
  props: {
    variant: 'timeline',
    timeline: [
      {
        date: 'January 2020',
        title: 'First Date',
        description: 'Our first official date...',
        photo: '/images/first-date.jpg'
      }
    ]
  }
}

// Cards Story
{
  type: 'our-story',
  props: {
    variant: 'cards',
    showPhotos: true,
    photos: [
      { id: '1', url: '/images/photo1.jpg', caption: 'Caption text' }
    ]
  }
}

// Minimal Story
{
  type: 'our-story',
  props: {
    variant: 'minimal',
    howWeMetText: 'Simple story text...',
    proposalText: 'Simple proposal text...'
  }
}
```

## Usage in Component Configuration

In your `WeddingPageConfig`, specify the variant in the component props:

```typescript
const config: WeddingPageConfig = {
  theme: { /* theme config */ },
  components: [
    {
      id: 'hero-1',
      type: 'hero',
      enabled: true,
      order: 0,
      props: {
        variant: 'background',  // Specify the variant here
        heroImageUrl: '/path/to/image.jpg',
        // ... other variant-specific props
      }
    },
    {
      id: 'story-1', 
      type: 'our-story',
      enabled: true,
      order: 1,
      props: {
        variant: 'timeline',  // Specify the variant here
        timeline: [/* timeline data */]
      }
    }
  ]
}
```

## Adding New Variants

To add a new variant to an existing component:

1. **Create the variant component** in the appropriate variants folder:
   ```
   components/wedding-sections/[component-name]-variants/
   ```

2. **Export it** from the variants `index.ts` file

3. **Update the main component** to handle the new variant in its switch statement

4. **Update the props interface** if new props are needed

5. **Document the variant** in this README

## File Structure

```
components/wedding-sections/
├── hero-variants/
│   ├── index.ts
│   ├── types.ts
│   ├── hero-text-content.tsx
│   ├── hero-background-variant.tsx
│   ├── hero-side-by-side-variant.tsx
│   ├── hero-framed-variant.tsx
│   └── hero-minimal-variant.tsx
├── our-story-variants/
│   ├── index.ts
│   ├── types.ts
│   ├── our-story-timeline-variant.tsx
│   ├── our-story-cards-variant.tsx
│   └── our-story-minimal-variant.tsx
├── hero-section.tsx (main component)
├── our-story-section.tsx (main component)
└── ...
```

## Benefits

1. **Flexibility**: Mix and match different variants for unique layouts
2. **Consistency**: Shared components and themes ensure visual coherence
3. **Maintainability**: Isolated variant components are easier to update
4. **Reusability**: Variants can be reused across different wedding sites
5. **Extensibility**: Easy to add new variants without affecting existing ones

## Best Practices

1. **Keep variants focused**: Each variant should serve a specific design purpose
2. **Share common logic**: Use shared components for repeated functionality
3. **Maintain consistency**: Follow established patterns when creating new variants
4. **Test thoroughly**: Ensure variants work well with different content lengths and themes
5. **Document props**: Clearly document what props each variant accepts