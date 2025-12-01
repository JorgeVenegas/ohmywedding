"use client"

import { useEffect, useRef, useState } from 'react'

// Helper to interpolate between two hex colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')
  
  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)
  
  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)
  
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  
  return `rgb(${r}, ${g}, ${b})`
}

export function ScrollProgressBar() {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [colors, setColors] = useState({
    primary: '#d4a574',
    secondary: '#9ba082',
    accent: '#e6b5a3'
  })

  useEffect(() => {
    const handleScroll = () => {
      if (!progressBarRef.current) return
      
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      const scrollFraction = scrollPercent / 100
      
      // Interpolate color based on scroll position
      // 0-50%: primary -> accent, 50-100%: accent -> secondary
      let currentColor: string
      if (scrollFraction <= 0.5) {
        currentColor = interpolateColor(colors.primary, colors.accent, scrollFraction * 2)
      } else {
        currentColor = interpolateColor(colors.accent, colors.secondary, (scrollFraction - 0.5) * 2)
      }
      
      // Direct DOM manipulation for instant updates, no React re-render
      progressBarRef.current.style.width = `${scrollPercent}%`
      progressBarRef.current.style.backgroundColor = currentColor
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll)
  }, [colors])

  // Listen for CSS variable changes and update gradient colors
  useEffect(() => {
    const updateColors = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      const primary = computedStyle.getPropertyValue('--theme-primary').trim() || '#d4a574'
      const secondary = computedStyle.getPropertyValue('--theme-secondary').trim() || '#9ba082'
      const accent = computedStyle.getPropertyValue('--theme-accent').trim() || '#e6b5a3'
      
      setColors({ primary, secondary, accent })
    }

    // Initial update
    updateColors()

    // Use MutationObserver to detect style attribute changes on documentElement
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          updateColors()
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      <div 
        ref={progressBarRef}
        className="h-full transition-colors duration-150"
        style={{ 
          width: '0%',
          backgroundColor: colors.primary
        }}
      />
    </div>
  )
}
