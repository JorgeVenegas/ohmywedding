"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Heart } from "lucide-react"
import type React from "react"

interface HeaderProps {
  showBackButton?: boolean
  backHref?: string
  title?: string
  rightContent?: React.ReactNode
  hideLogoText?: boolean
}

export function Header({
  showBackButton = false,
  backHref = "/",
  title,
  rightContent,
  hideLogoText = false,
}: HeaderProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Left: Logo + Back Button */}
        <div className="flex items-center gap-4">
          {showBackButton && backHref && (
            <Link href={backHref} className="flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-light">Back</span>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/images/logos/OMW Logo Gold.png"
              alt="OhMyWedding Logo"
              width={24}
              height={24}
              className="h-6 w-auto flex-shrink-0"
              priority
            />
            {!hideLogoText && <span className="font-serif text-xl font-light text-foreground">OhMyWedding</span>}
          </Link>
        </div>

        {/* Center: Title */}
        {title && (
          <div className="hidden sm:flex items-center gap-2 flex-1 justify-center">
            <span className="font-serif text-lg font-light text-foreground">{title}</span>
          </div>
        )}

        {/* Right: Custom Content */}
        <div className="flex items-center gap-3">{rightContent}</div>
      </div>
    </div>
  )
}
