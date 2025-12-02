"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useViewportSafe, MOBILE_DEVICES } from '@/components/contexts/viewport-context'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { createPortal } from 'react-dom'

interface ViewportWrapperProps {
  children: React.ReactNode
}

export function ViewportWrapper({ children }: ViewportWrapperProps) {
  const viewportContext = useViewportSafe()
  const customizeContext = useCustomizeSafe()
  const viewportMode = viewportContext?.viewportMode || 'desktop'
  const mobileDeviceId = viewportContext?.mobileDevice || 'iphone-13'
  const device = MOBILE_DEVICES[mobileDeviceId]
  const isPanelOpen = customizeContext?.state.isOpen || false
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeReady, setIframeReady] = useState(false)
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    // Reset ready state when device changes
    setIframeReady(false)
    
    if (viewportMode !== 'mobile' || !iframeRef.current) {
      return
    }

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

    if (!iframeDoc) return

    // Write the initial HTML structure
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=${device.width}, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: ${device.width}px;
              overflow-x: hidden;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            body {
              overflow-y: auto;
              height: 100%;
            }
            /* Hide scrollbar - all browsers */
            html::-webkit-scrollbar,
            body::-webkit-scrollbar,
            *::-webkit-scrollbar {
              display: none;
              width: 0;
              height: 0;
            }
            html, body, * {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            #root {
              width: ${device.width}px;
              min-height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>
    `)
    iframeDoc.close()

    // Copy all stylesheets from parent document
    const styleSheets = Array.from(document.styleSheets)
    const head = iframeDoc.head

    // Copy Google Fonts links first
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"], link[id="custom-google-fonts"]')
    fontLinks.forEach(link => {
      const newLink = iframeDoc.createElement('link')
      newLink.rel = 'stylesheet'
      newLink.href = (link as HTMLLinkElement).href
      if (link.id) newLink.id = link.id
      head.appendChild(newLink)
    })

    // Function to copy CSS rules
    const copyStyleSheet = (styleSheet: CSSStyleSheet) => {
      try {
        // For inline styles or same-origin stylesheets
        if (styleSheet.href === null || styleSheet.href.startsWith(window.location.origin)) {
          const rules = Array.from(styleSheet.cssRules)
          const style = iframeDoc.createElement('style')
          
          rules.forEach(rule => {
            style.appendChild(iframeDoc.createTextNode(rule.cssText))
          })
          
          head.appendChild(style)
        } else {
          // For external stylesheets, create a link element
          const link = iframeDoc.createElement('link')
          link.rel = 'stylesheet'
          link.href = styleSheet.href
          head.appendChild(link)
        }
      } catch (e) {
        // If we can't access rules (CORS), just link to the stylesheet
        if (styleSheet.href) {
          const link = iframeDoc.createElement('link')
          link.rel = 'stylesheet'
          link.href = styleSheet.href
          head.appendChild(link)
        }
      }
    }

    // Copy all stylesheets
    styleSheets.forEach(copyStyleSheet)

    // Also copy any inline style tags
    const styleTags = document.querySelectorAll('style')
    styleTags.forEach(styleTag => {
      const newStyle = iframeDoc.createElement('style')
      newStyle.textContent = styleTag.textContent
      head.appendChild(newStyle)
    })

    // Watch for style changes in parent document (for font updates)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target instanceof HTMLElement) {
          // Check if new style tags or font links were added
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLStyleElement) {
              const newStyle = iframeDoc.createElement('style')
              newStyle.textContent = node.textContent
              head.appendChild(newStyle)
            } else if (node instanceof HTMLLinkElement && (node.href.includes('fonts.googleapis.com') || node.id === 'custom-google-fonts')) {
              // Copy new font link
              const existingFontLink = iframeDoc.getElementById(node.id)
              if (existingFontLink) {
                existingFontLink.remove()
              }
              const newLink = iframeDoc.createElement('link')
              newLink.rel = 'stylesheet'
              newLink.href = node.href
              if (node.id) newLink.id = node.id
              head.appendChild(newLink)
              
              // Also copy CSS variables from parent
              setTimeout(() => {
                const parentDocElement = document.documentElement
                const iframeDocElement = iframeDoc.documentElement
                const fontDisplay = parentDocElement.style.getPropertyValue('--font-display')
                const fontHeading = parentDocElement.style.getPropertyValue('--font-heading')
                const fontBody = parentDocElement.style.getPropertyValue('--font-body')
                
                if (fontDisplay) iframeDocElement.style.setProperty('--font-display', fontDisplay)
                if (fontHeading) iframeDocElement.style.setProperty('--font-heading', fontHeading)
                if (fontBody) iframeDocElement.style.setProperty('--font-body', fontBody)
              }, 100)
            }
          })
        } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
          // Style content changed, re-copy all styles
          const currentStyleTags = document.querySelectorAll('style')
          // Clear old inline styles from iframe
          const iframeStyles = iframeDoc.querySelectorAll('style')
          iframeStyles.forEach(s => s.remove())
          // Re-copy all styles
          currentStyleTags.forEach(styleTag => {
            const newStyle = iframeDoc.createElement('style')
            newStyle.textContent = styleTag.textContent
            head.appendChild(newStyle)
          })
          
          // Also update CSS variables when style attributes change
          if (mutation.target === document.documentElement && mutation.attributeName === 'style') {
            const parentDocElement = document.documentElement
            const iframeDocElement = iframeDoc.documentElement
            const fontDisplay = parentDocElement.style.getPropertyValue('--font-display')
            const fontHeading = parentDocElement.style.getPropertyValue('--font-heading')
            const fontBody = parentDocElement.style.getPropertyValue('--font-body')
            
            if (fontDisplay) iframeDocElement.style.setProperty('--font-display', fontDisplay)
            if (fontHeading) iframeDocElement.style.setProperty('--font-heading', fontHeading)
            if (fontBody) iframeDocElement.style.setProperty('--font-body', fontBody)
          }
        }
      })
    })

    // Observe the document head for style changes
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style']
    })

    // Wait a bit for styles to load, then mark as ready
    setTimeout(() => {
      // Copy CSS variables from parent
      const parentDocElement = document.documentElement
      const iframeDocElement = iframeDoc.documentElement
      const fontDisplay = parentDocElement.style.getPropertyValue('--font-display')
      const fontHeading = parentDocElement.style.getPropertyValue('--font-heading')
      const fontBody = parentDocElement.style.getPropertyValue('--font-body')
      
      if (fontDisplay) iframeDocElement.style.setProperty('--font-display', fontDisplay)
      if (fontHeading) iframeDocElement.style.setProperty('--font-heading', fontHeading)
      if (fontBody) iframeDocElement.style.setProperty('--font-body', fontBody)
      
      setIframeReady(true)
      // Restore scroll position
      if (iframeDoc.documentElement) {
        setTimeout(() => {
          iframeDoc.documentElement.scrollTop = scrollPositionRef.current
        }, 50)
      }
    }, 100)

    // Save scroll position before unmount
    return () => {
      observer.disconnect()
      if (iframeDoc?.documentElement) {
        scrollPositionRef.current = iframeDoc.documentElement.scrollTop
      }
    }
  }, [viewportMode, device.width, device.height])

  if (viewportMode === 'desktop') {
    return <>{children}</>
  }

  // Mobile preview with iframe
  const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document
  const root = iframeDoc?.getElementById('root')

  return (
    <div className={`min-h-screen bg-gray-100 flex items-center py-8 transition-all duration-300 ${
      isPanelOpen ? 'justify-center pr-96' : 'justify-center'
    }`}>
      <div className="relative">
        {/* Mobile frame */}
        <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-white rounded-[2.5rem] overflow-hidden relative" style={{ width: `${device.width}px`, height: `${device.height}px` }}>
            {/* Loading skeleton */}
            {!iframeReady && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-10 animate-pulse">
                <div className="flex flex-col items-center gap-4">
                  {/* Spinner */}
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-gray-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  {/* Loading text */}
                  <p className="text-sm text-gray-600 font-medium">Loading preview...</p>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              title="Mobile Preview"
              className={`${iframeReady ? 'animate-fadeIn' : 'opacity-0'}`}
              style={{
                width: `${device.width}px`,
                height: `${device.height}px`,
                border: 'none',
                display: 'block',
                background: 'white'
              }}
            />
          </div>
        </div>
        
        {/* Device indicator */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
          {device.name}
        </div>
      </div>
      
      {/* Portal content into iframe */}
      {iframeReady && root && createPortal(children, root)}
    </div>
  )
}
