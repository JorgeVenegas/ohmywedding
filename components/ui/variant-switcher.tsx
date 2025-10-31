"use client"

import React from 'react'

interface VariantOption {
  value: string
  label: string
  description: string
}

interface VariantSwitcherProps {
  componentType: string
  currentVariant: string
  variants: VariantOption[]
  onVariantChange: (variant: string) => void
  className?: string
}

export function VariantSwitcher({
  componentType,
  currentVariant,
  variants,
  onVariantChange,
  className = ''
}: VariantSwitcherProps) {
  return (
    <div className={`py-2 ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">{componentType}:</span>
        {variants.map((variant) => (
          <button
            key={variant.value}
            onClick={() => onVariantChange(variant.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              currentVariant === variant.value
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            {variant.label}
          </button>
        ))}
      </div>
    </div>
  )
}