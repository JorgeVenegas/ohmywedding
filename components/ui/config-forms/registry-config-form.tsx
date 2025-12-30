"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { useI18n } from '@/components/contexts/i18n-context'
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink, Gift } from 'lucide-react'
import { DEFAULT_PROVIDERS, RegistryProvider, CustomRegistryItem } from '@/components/wedding-sections/registry-variants/types'
import { BackgroundColorPicker, type BackgroundColorChoice } from '@/components/ui/config-forms/shared'

interface RegistryConfigFormProps {
  config: {
    variant?: string
    sectionTitle?: string
    sectionSubtitle?: string
    message?: string
    registries?: RegistryProvider[]
    customItems?: CustomRegistryItem[]
    showCustomRegistry?: boolean
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: any) => void
}

export function RegistryConfigForm({ config, onChange }: RegistryConfigFormProps) {
  const [expandedRegistry, setExpandedRegistry] = useState<number | null>(null)
  const [expandedItem, setExpandedItem] = useState<number | null>(null)
  const [showProviderSelector, setShowProviderSelector] = useState(false)
  const { t } = useI18n()

  const registries = config.registries || []
  const customItems = config.customItems || []

  // Add a registry from a provider
  const addRegistry = (providerId: string) => {
    const provider = DEFAULT_PROVIDERS.find(p => p.id === providerId)
    if (!provider) return

    const newRegistry: RegistryProvider = {
      id: `registry-${Date.now()}`,
      name: provider.name,
      logoUrl: provider.logoUrl,
      url: '',
      description: provider.descriptionKey,
      isCustom: providerId === 'custom'
    }
    onChange('registries', [...registries, newRegistry])
    setExpandedRegistry(registries.length)
    setShowProviderSelector(false)
  }

  const updateRegistry = (index: number, field: keyof RegistryProvider, value: string) => {
    const updated = [...registries]
    updated[index] = { ...updated[index], [field]: value }
    onChange('registries', updated)
  }

  const removeRegistry = (index: number) => {
    const updated = registries.filter((_, i) => i !== index)
    onChange('registries', updated)
    setExpandedRegistry(null)
  }

  // Custom items management
  const addCustomItem = () => {
    const newItem: CustomRegistryItem = {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      price: undefined,
      quantity: 1,
      isFulfilled: false
    }
    onChange('customItems', [...customItems, newItem])
    setExpandedItem(customItems.length)
  }

  const updateCustomItem = (index: number, field: keyof CustomRegistryItem, value: any) => {
    const updated = [...customItems]
    updated[index] = { ...updated[index], [field]: value }
    onChange('customItems', updated)
  }

  const removeCustomItem = (index: number) => {
    const updated = customItems.filter((_, i) => i !== index)
    onChange('customItems', updated)
    setExpandedItem(null)
  }

  const variants = [
    { value: 'cards', label: 'Cards', description: 'Classic card-based layout' },
    { value: 'minimal', label: 'Minimal', description: 'Clean and simple list style' },
    { value: 'elegant', label: 'Elegant', description: 'Romantic style with decorations' },
    { value: 'grid', label: 'Grid', description: 'Compact grid for many items' }
  ]

  // Filter out providers that are already added
  const availableProviders = DEFAULT_PROVIDERS.filter(
    provider => !registries.some(r => r.name === provider.name && !r.isCustom)
  )

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <VariantDropdown
        label="Registry Style"
        value={config.variant || 'cards'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder="Select style"
      />

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
            placeholder={t('registry.title')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.sectionSubtitle')}
          </label>
          <Input
            type="text"
            value={config.sectionSubtitle || ''}
            onChange={(e) => onChange('sectionSubtitle', e.target.value)}
            placeholder={t('registry.subtitle')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <Textarea
            value={config.message || ''}
            onChange={(e) => onChange('message', e.target.value)}
            placeholder={t('registry.message')}
            rows={3}
          />
        </div>
      </div>

      {/* Registry Links */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Registry Links
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowProviderSelector(!showProviderSelector)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            {t('registry.addRegistry')}
          </Button>
        </div>

        {/* Provider Selector */}
        {showProviderSelector && (
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <p className="text-xs text-gray-600 mb-3">{t('registry.selectProvider')}</p>
            <div className="grid grid-cols-2 gap-2">
              {availableProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => addRegistry(provider.id)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-white transition-colors text-left"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-100">
                    <img 
                      src={provider.logoUrl}
                      alt={provider.name}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-xs font-bold text-gray-600">${provider.name.charAt(0)}</span>`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{provider.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Registry List */}
        {registries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {t('registry.noRegistriesYet')}
          </p>
        ) : (
          <div className="space-y-2">
            {registries.map((registry, index) => (
              <div 
                key={registry.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedRegistry(expandedRegistry === index ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-100">
                      {registry.logoUrl ? (
                        <img 
                          src={registry.logoUrl}
                          alt={registry.name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-600">{registry.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{registry.name}</p>
                      {registry.url && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{registry.url}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRegistry(index)
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedRegistry === index ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedRegistry === index && (
                  <div className="p-3 space-y-3 border-t border-gray-200">
                    {registry.isCustom && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('registry.registryName')}
                        </label>
                        <Input
                          type="text"
                          value={registry.name}
                          onChange={(e) => updateRegistry(index, 'name', e.target.value)}
                          placeholder="Registry name"
                          className="text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('registry.registryUrl')}
                      </label>
                      <Input
                        type="url"
                        value={registry.url}
                        onChange={(e) => updateRegistry(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('registry.itemDescription')}
                      </label>
                      <Input
                        type="text"
                        value={registry.description || ''}
                        onChange={(e) => updateRegistry(index, 'description', e.target.value)}
                        placeholder="Optional description"
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Wishlist Section */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {t('registry.ourWishlist')}
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.showCustomRegistry || false}
                onCheckedChange={(checked) => onChange('showCustomRegistry', checked)}
              />
              <span className="text-xs text-gray-600">{t('registry.showCustomRegistry')}</span>
            </div>
          </div>
        </div>

        {config.showCustomRegistry && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomItem}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {t('registry.addItem')}
            </Button>

            {customItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No items yet. Add items to your wishlist!
              </p>
            ) : (
              <div className="space-y-2">
                {customItems.map((item, index) => (
                  <div 
                    key={item.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                    >
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                            <Gift className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.name || 'Untitled Item'}
                          </p>
                          {item.price && (
                            <p className="text-xs text-gray-500">${item.price.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isFulfilled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {t('registry.fulfilled')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomItem(index)
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {expandedItem === index ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedItem === index && (
                      <div className="p-3 space-y-3 border-t border-gray-200">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {t('registry.itemName')}
                          </label>
                          <Input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateCustomItem(index, 'name', e.target.value)}
                            placeholder="Item name"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {t('registry.itemDescription')}
                          </label>
                          <Textarea
                            value={item.description || ''}
                            onChange={(e) => updateCustomItem(index, 'description', e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {t('registry.itemPrice')}
                            </label>
                            <Input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => updateCustomItem(index, 'price', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="0.00"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {t('registry.quantity')}
                            </label>
                            <Input
                              type="number"
                              value={item.quantityNeeded || ''}
                              onChange={(e) => updateCustomItem(index, 'quantityNeeded', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="1"
                              className="text-sm"
                              min={1}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isFulfilled || false}
                            onCheckedChange={(checked) => updateCustomItem(index, 'isFulfilled', checked)}
                          />
                          <span className="text-xs text-gray-600">{t('registry.fulfilled')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Color Background Selection */}
      <BackgroundColorPicker
        useColorBackground={config.useColorBackground}
        backgroundColorChoice={config.backgroundColorChoice}
        onUseColorBackgroundChange={(value) => onChange('useColorBackground', value)}
        onBackgroundColorChoiceChange={(value) => onChange('backgroundColorChoice', value)}
      />
    </div>
  )
}
