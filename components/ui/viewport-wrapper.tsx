"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useViewportSafe } from '@/components/contexts/viewport-context'
import { createPortal } from 'react-dom'

interface ViewportWrapperProps {
  children: React.ReactNode
}

export function ViewportWrapper({ children }: ViewportWrapperProps) {
  const viewportContext = useViewportSafe()
  const viewportMode = viewportContext?.viewportMode || 'desktop'
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeReady, setIframeReady] = useState(false)

  useEffect(() => {
    if (viewportMode !== 'mobile' || !iframeRef.current) {
      setIframeReady(false)
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
          <meta name="viewport" content="width=375, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 375px;
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
              width: 375px;
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

    // Wait a bit for styles to load, then mark as ready
    setTimeout(() => {
      setIframeReady(true)
    }, 100)

  }, [viewportMode])

  if (viewportMode === 'desktop') {
    return <>{children}</>
  }

  // Mobile preview with iframe
  const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document
  const root = iframeDoc?.getElementById('root')

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="relative">
        {/* Mobile frame */}
        <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ width: '375px', height: '812px' }}>
            <iframe
              ref={iframeRef}
              title="Mobile Preview"
              style={{
                width: '375px',
                height: '812px',
                border: 'none',
                display: 'block',
                background: 'white'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Portal content into iframe */}
      {iframeReady && root && createPortal(children, root)}
    </div>
  )
}
