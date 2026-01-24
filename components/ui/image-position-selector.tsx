"use client"

import React, { useRef, useState } from 'react'
import { useI18n } from '@/components/contexts/i18n-context'

interface ImagePositionSelectorProps {
  imageUrl: string
  position?: { x: number; y: number } // percentage values 0-100
  onChange: (position: { x: number; y: number }) => void
}

export function ImagePositionSelector({ imageUrl, position = { x: 50, y: 50 }, onChange }: ImagePositionSelectorProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

    onChange({ x: Math.round(x), y: Math.round(y) })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    updatePosition(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    updatePosition(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Simplified 3x3 preset grid - just icons/dots, no text
  const presets = [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: 50 },
    { x: 50, y: 50 },
    { x: 100, y: 50 },
    { x: 0, y: 100 },
    { x: 50, y: 100 },
    { x: 100, y: 100 },
  ]

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t('config.imageFocalPoint')}
      </label>
      
      <div className="flex gap-3">
        {/* Compact 3x3 preset grid */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg shrink-0">
          {presets.map((preset, index) => {
            const isSelected = position.x === preset.x && position.y === preset.y
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange({ x: preset.x, y: preset.y })
                }}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-500 shadow-sm'
                    : 'bg-white hover:bg-gray-200'
                }`}
                title={`${preset.x}%, ${preset.y}%`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  isSelected ? 'bg-white' : 'bg-gray-400'
                }`} />
              </button>
            )
          })}
        </div>

        {/* Visual selector - click or drag to set position */}
        <div
          ref={containerRef}
          className="relative flex-1 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Position preview"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
          
          {/* Focal point indicator */}
          <div
            className="absolute w-6 h-6 -ml-3 -mt-3 pointer-events-none"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 rounded-full border-2 border-white shadow-md"></div>
              <div className="absolute inset-1.5 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
