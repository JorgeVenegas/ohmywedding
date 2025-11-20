"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface VariantOption {
  value: string
  label: string
  description: string
}

interface VariantDropdownProps {
  value: string
  options: VariantOption[]
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function VariantDropdown({ 
  value, 
  options, 
  onChange, 
  placeholder = "Select variant",
  label
}: VariantDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400 hover:shadow-sm"
        >
          {selectedOption ? (
            <div className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center justify-between w-full">
                <span className="text-gray-700 text-left font-medium">{selectedOption.label}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-xs text-gray-500 text-left">
                {selectedOption.description}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-500 text-xs">{placeholder}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          )}
        </button>
        
        {/* Dropdown Content */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[52]" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[53] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex flex-col gap-1 p-3 hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 last:border-b-0 text-left ${
                    value === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-gray-700 font-medium">{option.label}</span>
                    {value === option.value && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                        <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
