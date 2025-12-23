"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { Check, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { CustomEvent, EventType } from '@/components/wedding-sections/event-details-variants/types'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

// Helper functions
function isLightColor(color: string): boolean {
  if (color.startsWith('rgb')) {
    const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1])
      const g = parseInt(match[2])
      const b = parseInt(match[3])
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.5
    }
  }
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

interface EventDetailsConfigFormProps {
  config: {
    variant?: string
    sectionTitle?: string
    sectionSubtitle?: string
    events?: CustomEvent[]
    showMapLinks?: boolean
    showMap?: boolean
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
    // Legacy props that might exist in config
    showCeremony?: boolean
    showReception?: boolean
    ceremonyImageUrl?: string
    receptionImageUrl?: string
    ceremonyDescription?: string
    receptionDescription?: string
  }
  wedding?: {
    partner1_first_name?: string
    partner1_last_name?: string
    partner2_first_name?: string
    partner2_last_name?: string
    wedding_date?: string | null
    wedding_time?: string | null
    reception_time?: string | null
    ceremony_venue_name?: string | null
    ceremony_venue_address?: string | null
    reception_venue_name?: string | null
    reception_venue_address?: string | null
  }
  onChange: (key: string, value: any) => void
}

export function EventDetailsConfigForm({ config, wedding, onChange }: EventDetailsConfigFormProps) {
  const { t } = useI18n()
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)
  
  // Get colors from page config
  const { config: pageConfig } = usePageConfig()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

  const weddingDate = wedding?.wedding_date || undefined

  // Initialize events from legacy wedding data if no events exist yet
  React.useEffect(() => {
    if (!initialized && (!config.events || config.events.length === 0) && wedding) {
      const legacyEvents: CustomEvent[] = []
      
      // Check if there's ceremony data in wedding (venue name OR time)
      if ((wedding.ceremony_venue_name || wedding.wedding_time) && config.showCeremony !== false) {
        legacyEvents.push({
          id: 'ceremony',
          type: 'religiousCeremony',
          title: t('eventDetails.eventTypes.religiousCeremony'),
          time: wedding.wedding_time || '16:00',
          venue: wedding.ceremony_venue_name || '',
          address: wedding.ceremony_venue_address || '',
          description: config.ceremonyDescription || '',
          imageUrl: config.ceremonyImageUrl,
          order: 0,
          useWeddingDate: true,
          date: weddingDate
        })
      }
      
      // Check if there's reception data in wedding (venue name OR time)
      if ((wedding.reception_venue_name || wedding.reception_time) && config.showReception !== false) {
        legacyEvents.push({
          id: 'reception',
          type: 'reception',
          title: t('eventDetails.eventTypes.reception'),
          time: wedding.reception_time || '18:00',
          venue: wedding.reception_venue_name || '',
          address: wedding.reception_venue_address || '',
          description: config.receptionDescription || '',
          imageUrl: config.receptionImageUrl,
          order: 1,
          useWeddingDate: true,
          date: weddingDate
        })
      }
      
      if (legacyEvents.length > 0) {
        onChange('events', legacyEvents)
      }
      setInitialized(true)
    }
  }, [initialized, config.events, wedding, config.showCeremony, config.showReception, config.ceremonyDescription, config.receptionDescription, config.ceremonyImageUrl, config.receptionImageUrl, weddingDate, onChange])

  const events = config.events || []

  // Color groups for background selection
  const colorGroups: { label: string; colors: { value: BackgroundColorChoice; color: string | null }[] }[] = [
    {
      label: t('config.none'),
      colors: [{ value: 'none', color: null }]
    },
    {
      label: t('config.primary'),
      colors: [
        { value: 'primary', color: primaryColor },
        { value: 'primary-light', color: getLightTint(primaryColor, 0.5) },
        { value: 'primary-lighter', color: getLightTint(primaryColor, 0.88) },
      ]
    },
    {
      label: t('config.secondary'),
      colors: [
        { value: 'secondary', color: secondaryColor },
        { value: 'secondary-light', color: getLightTint(secondaryColor, 0.5) },
        { value: 'secondary-lighter', color: getLightTint(secondaryColor, 0.88) },
      ]
    },
    {
      label: t('config.accent'),
      colors: [
        { value: 'accent', color: accentColor },
        { value: 'accent-light', color: getLightTint(accentColor, 0.5) },
        { value: 'accent-lighter', color: getLightTint(accentColor, 0.88) },
      ]
    }
  ]

  const currentBgChoice = config.backgroundColorChoice || 'none'

  // Event management functions
  const addEvent = (type: EventType) => {
    const newEvent: CustomEvent = {
      id: `event-${Date.now()}`,
      type,
      title: t(`eventDetails.eventTypes.${type}`),
      time: '16:00',
      venue: '',
      address: '',
      description: '',
      imageUrl: undefined,
      order: events.length,
      useWeddingDate: true,
      date: weddingDate
    }
    onChange('events', [...events, newEvent])
    setExpandedEvent(events.length)
  }

  const updateEvent = (index: number, field: keyof CustomEvent, value: any) => {
    const updated = [...events]
    updated[index] = { ...updated[index], [field]: value }
    onChange('events', updated)
  }

  const removeEvent = (index: number) => {
    const updated = events.filter((_, i) => i !== index)
    onChange('events', updated)
    setExpandedEvent(null)
  }

  const moveEvent = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === events.length - 1)
    ) {
      return
    }

    const updated = [...events]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
    
    // Update order values
    updated.forEach((event, idx) => {
      event.order = idx
    })

    onChange('events', updated)
    setExpandedEvent(targetIndex)
  }

  const eventTypeOptions: { value: EventType; label: string }[] = [
    { value: 'civilCeremony', label: t('eventDetails.eventTypes.civilCeremony') },
    { value: 'religiousCeremony', label: t('eventDetails.eventTypes.religiousCeremony') },
    { value: 'cocktail', label: t('eventDetails.eventTypes.cocktail') },
    { value: 'reception', label: t('eventDetails.eventTypes.reception') },
    { value: 'afterParty', label: t('eventDetails.eventTypes.afterParty') },
    { value: 'custom', label: t('eventDetails.eventTypes.custom') }
  ]

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t('config.style')}</label>
        <VariantDropdown
          value={config.variant || 'classic'}
          onChange={(value) => onChange('variant', value)}
          options={[
            { value: 'classic', label: t('config.classicCards'), description: t('config.classicCardsDesc') },
            { value: 'elegant', label: t('config.elegantScript'), description: t('config.elegantScriptDesc') },
            { value: 'timeline', label: t('config.timeline'), description: t('config.timelineDesc') },
            { value: 'minimal', label: t('config.minimalClean'), description: t('config.minimalCleanDesc') },
            { value: 'split', label: t('config.splitLayout'), description: t('config.splitLayoutDesc') },
          ]}
        />
      </div>

      {/* Section Title & Subtitle */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">{t('config.sectionContent')}</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.sectionTitle')}
          </label>
          <Input
            type="text"
            value={config.sectionTitle || ''}
            onChange={(e) => onChange('sectionTitle', e.target.value)}
            placeholder={t('eventDetails.title')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.sectionSubtitle')}
          </label>
          <Input
            value={config.sectionSubtitle ?? ''}
            onChange={(e) => onChange('sectionSubtitle', e.target.value)}
            placeholder={t('eventDetails.subtitle')}
          />
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">{t('config.backgroundColor')}</label>
        <div className="space-y-2">
          {colorGroups.map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">{group.label}</span>
              <div className="flex gap-1">
                {group.colors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => onChange('backgroundColorChoice', colorOption.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      currentBgChoice === colorOption.value 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      backgroundColor: colorOption.color || '#ffffff',
                      backgroundImage: colorOption.color === null ? 'linear-gradient(135deg, #fff 45%, #f0f0f0 45%, #f0f0f0 55%, #fff 55%)' : undefined
                    }}
                    title={colorOption.value === 'none' ? 'No background' : colorOption.value}
                  >
                    {currentBgChoice === colorOption.value && (
                      <Check 
                        className="w-4 h-4" 
                        style={{ 
                          color: colorOption.color && !isLightColor(colorOption.color) ? 'white' : '#1f2937'
                        }} 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700">{t('config.displayOptions')}</label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('config.showEmbeddedMap')}</span>
          <Switch
            checked={config.showMap ?? true}
            onCheckedChange={(checked) => onChange('showMap', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('config.showMapLinks')}</span>
          <Switch
            checked={config.showMapLinks ?? true}
            onCheckedChange={(checked) => onChange('showMapLinks', checked)}
          />
        </div>
      </div>

      {/* Events Management */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 text-sm">{t('eventDetails.title')}</h4>
          <div className="relative group">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {t('eventDetails.addEvent')}
            </Button>
            {/* Dropdown menu for event types */}
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
              {eventTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => addEvent(option.value)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {t('eventDetails.addEvent')}
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div 
                key={event.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Event Header */}
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedEvent(expandedEvent === index ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {event.title || t(`eventDetails.eventTypes.${event.type}`) || 'Event'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {event.time && <span>{event.time}</span>}
                        {event.venue && (
                          <>
                            {event.time && <span>•</span>}
                            <span>{event.venue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); moveEvent(index, 'up'); }}
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); moveEvent(index, 'down'); }}
                      disabled={index === events.length - 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removeEvent(index); }}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Event Details (Expanded) */}
                {expandedEvent === index && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Type
                      </label>
                      <select
                        value={event.type}
                        onChange={(e) => updateEvent(index, 'type', e.target.value as EventType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        {eventTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Event Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Name
                      </label>
                      <Input
                        type="text"
                        value={event.title}
                        onChange={(e) => updateEvent(index, 'title', e.target.value)}
                        placeholder={t(`eventDetails.eventTypes.${event.type}`)}
                      />
                    </div>

                    {/* Use Wedding Date Toggle */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">{t('eventDetails.useWeddingDate')}</label>
                      <Switch
                        checked={event.useWeddingDate !== false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateEvent(index, 'date', weddingDate)
                          }
                          updateEvent(index, 'useWeddingDate', checked)
                        }}
                      />
                    </div>

                    {/* Custom Date (if not using wedding date) */}
                    {event.useWeddingDate === false && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('eventDetails.eventDate')}
                        </label>
                        <Input
                          type="date"
                          value={event.date || ''}
                          onChange={(e) => updateEvent(index, 'date', e.target.value)}
                        />
                      </div>
                    )}

                    {/* Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <Input
                        type="time"
                        value={event.time}
                        onChange={(e) => updateEvent(index, 'time', e.target.value)}
                      />
                    </div>

                    {/* Venue */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Venue
                      </label>
                      <Input
                        type="text"
                        value={event.venue}
                        onChange={(e) => updateEvent(index, 'venue', e.target.value)}
                        placeholder="Venue name"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <Input
                        type="text"
                        value={event.address || ''}
                        onChange={(e) => updateEvent(index, 'address', e.target.value)}
                        placeholder="Full address"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Textarea
                        value={event.description || ''}
                        onChange={(e) => updateEvent(index, 'description', e.target.value)}
                        placeholder="Additional details for guests (optional)"
                        rows={3}
                      />
                    </div>

                    {/* Event Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Image
                      </label>
                      <ImageUpload
                        currentImageUrl={event.imageUrl || ''}
                        onUpload={(url) => updateEvent(index, 'imageUrl', url)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
