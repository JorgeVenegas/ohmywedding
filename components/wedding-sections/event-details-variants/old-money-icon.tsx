"use client"

import React, { useState, useEffect, useRef } from 'react'

interface OldMoneyIconProps {
  src: string
  color: string
  size: number
  strokeWidth: number
}

// Cache fetched SVG content to avoid repeated network requests
const svgCache: Record<string, string> = {}

export function OldMoneyIcon({ src, color, size, strokeWidth }: OldMoneyIconProps) {
  const [svgHtml, setSvgHtml] = useState<string | null>(svgCache[`${src}-${strokeWidth}`] ?? null)
  const prevKey = useRef(`${src}-${strokeWidth}`)

  useEffect(() => {
    const key = `${src}-${strokeWidth}`
    if (svgCache[key]) {
      setSvgHtml(svgCache[key])
      return
    }
    let cancelled = false
    fetch(src)
      .then(r => r.text())
      .then(text => {
        if (cancelled) return
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'image/svg+xml')
        const svg = doc.querySelector('svg')
        if (!svg) return

        // Remove hardcoded width/height so CSS size controls it
        svg.removeAttribute('width')
        svg.removeAttribute('height')
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')

        // Inject overriding <style> as the first child
        const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style')
        style.textContent = [
          'path,line,polyline,circle,rect,ellipse,polygon{',
          `  stroke:currentColor!important;`,
          `  stroke-width:${strokeWidth}px!important;`,
          '  fill:none!important;',
          '  stroke-linecap:round!important;',
          '  stroke-linejoin:round!important;',
          '}',
        ].join('')
        svg.insertBefore(style, svg.firstChild)

        const html = svg.outerHTML
        svgCache[key] = html
        setSvgHtml(html)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [src, strokeWidth])

  return (
    <div
      style={{ color, width: size, height: size, flexShrink: 0 }}
      dangerouslySetInnerHTML={svgHtml ? { __html: svgHtml } : undefined}
    />
  )
}
