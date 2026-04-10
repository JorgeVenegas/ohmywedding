"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { useI18n } from '@/components/contexts/i18n-context'
import { BackgroundColorPicker, type BackgroundColorChoice } from './shared'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HotelItem {
  name: string
  description?: string
  imageUrl?: string
  websiteUrl?: string
  phone?: string
  address?: string
  priceRange?: string
  distanceToVenue?: string
  bookingCode?: string
}

interface HotelSuggestionsConfigFormProps {
  config: {
    sectionTitle?: string
    sectionSubtitle?: string
    hotels?: HotelItem[]
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: unknown) => void
}

export function HotelSuggestionsConfigForm({ config, onChange }: HotelSuggestionsConfigFormProps) {
  const { t } = useI18n()
  const hotels = config.hotels || []
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(hotels.length > 0 ? 0 : null)

  const addHotel = () => {
    const newHotel: HotelItem = { name: '' }
    const updated = [...hotels, newHotel]
    onChange('hotels', updated)
    setExpandedIndex(updated.length - 1)
  }

  const removeHotel = (index: number) => {
    const updated = hotels.filter((_, i) => i !== index)
    onChange('hotels', updated)
    if (expandedIndex === index) setExpandedIndex(null)
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1)
  }

  const updateHotel = (index: number, key: keyof HotelItem, value: string) => {
    const updated = hotels.map((h, i) => i === index ? { ...h, [key]: value } : h)
    onChange('hotels', updated)
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('config.sectionTitle')}
        </label>
        <Input
          value={config.sectionTitle || ''}
          onChange={(e) => onChange('sectionTitle', e.target.value)}
          placeholder={t('hotelSuggestions.title')}
        />
      </div>

      {/* Section Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('config.sectionSubtitle')}
        </label>
        <Input
          value={config.sectionSubtitle || ''}
          onChange={(e) => onChange('sectionSubtitle', e.target.value)}
          placeholder={t('hotelSuggestions.subtitle')}
        />
      </div>

      {/* Hotels List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('hotelSuggestions.hotels')}
        </label>
        <div className="space-y-3">
          {hotels.map((hotel, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <span className="text-sm font-medium text-gray-700 truncate">
                  {hotel.name || t('hotelSuggestions.newHotel')}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); removeHotel(index) }}
                    className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {expandedIndex === index ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedIndex === index && (
                <div className="p-3 space-y-3 border-t">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t('hotelSuggestions.hotelName')} *
                    </label>
                    <Input
                      value={hotel.name}
                      onChange={(e) => updateHotel(index, 'name', e.target.value)}
                      placeholder={t('hotelSuggestions.hotelNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t('config.description')}
                    </label>
                    <Textarea
                      value={hotel.description || ''}
                      onChange={(e) => updateHotel(index, 'description', e.target.value)}
                      rows={2}
                      placeholder={t('hotelSuggestions.descriptionPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t('hotelSuggestions.address')}
                    </label>
                    <Input
                      value={hotel.address || ''}
                      onChange={(e) => updateHotel(index, 'address', e.target.value)}
                      placeholder={t('hotelSuggestions.addressPlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t('hotelSuggestions.distanceToVenue')}
                      </label>
                      <Input
                        value={hotel.distanceToVenue || ''}
                        onChange={(e) => updateHotel(index, 'distanceToVenue', e.target.value)}
                        placeholder={t('hotelSuggestions.distancePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t('hotelSuggestions.priceRange')}
                      </label>
                      <Input
                        value={hotel.priceRange || ''}
                        onChange={(e) => updateHotel(index, 'priceRange', e.target.value)}
                        placeholder={t('hotelSuggestions.priceRangePlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t('hotelSuggestions.phone')}
                      </label>
                      <Input
                        value={hotel.phone || ''}
                        onChange={(e) => updateHotel(index, 'phone', e.target.value)}
                        placeholder="+52 123 456 7890"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t('hotelSuggestions.bookingCode')}
                      </label>
                      <Input
                        value={hotel.bookingCode || ''}
                        onChange={(e) => updateHotel(index, 'bookingCode', e.target.value)}
                        placeholder={t('hotelSuggestions.bookingCodePlaceholder')}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t('hotelSuggestions.websiteUrl')}
                    </label>
                    <Input
                      value={hotel.websiteUrl || ''}
                      onChange={(e) => updateHotel(index, 'websiteUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t('config.image')}
                    </label>
                    {hotel.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-14 rounded overflow-hidden border flex-shrink-0">
                          <img src={hotel.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateHotel(index, 'imageUrl', '')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <ImageUpload
                        onUpload={(url) => updateHotel(index, 'imageUrl', url)}
                        placeholder={t('config.addPhoto')}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addHotel}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('hotelSuggestions.addHotel')}
          </Button>
        </div>
      </div>

      {/* Background Color Picker */}
      <BackgroundColorPicker
        useColorBackground={config.useColorBackground}
        backgroundColorChoice={config.backgroundColorChoice}
        onUseColorBackgroundChange={(v) => onChange('useColorBackground', v)}
        onBackgroundColorChoiceChange={(v) => onChange('backgroundColorChoice', v)}
      />
    </div>
  )
}
