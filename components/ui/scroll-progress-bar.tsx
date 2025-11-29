"use client"

import { useEffect, useRef, useState } from 'react'

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
      
      // Direct DOM manipulation for instant updates, no React re-render
      progressBarRef.current.style.width = `${scrollPercent}%`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
        className="h-full"
        style={{ 
          width: '0%',
          background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
        }}
      />
    </div>
  )
}
