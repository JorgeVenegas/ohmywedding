"use client"

import React, { ReactNode } from 'react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface AnimatedCountdownUnitProps {
  index: number
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}

export function AnimatedCountdownUnit({ index, className, style, children }: AnimatedCountdownUnitProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })

  return (
    <div
      ref={ref}
      className={`${className || ''} transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ ...style, transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  )
}
