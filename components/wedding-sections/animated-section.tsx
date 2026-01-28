"use client"

import React, { ReactNode } from 'react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface AnimatedSectionProps {
  index?: number
  className?: string
  style?: React.CSSProperties
  children: ReactNode
  delay?: number
  onClick?: () => void
}

export function AnimatedSection({ index = 0, className, style, children, delay, onClick }: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })

  return (
    <div
      ref={ref}
      className={`${className || ''} transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ ...style, transitionDelay: `${delay ?? index * 100}ms` }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
