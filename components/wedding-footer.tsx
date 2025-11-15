"use client"

import Link from "next/link"
import { Heart } from "lucide-react"

export function WeddingFooter() {
  return (
    <footer className="border-t border-border/30 bg-background/80 backdrop-blur-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Created with text */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Created with</span>
            <Link 
              href="https://ohmywedding.com" 
              className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Heart className="w-4 h-4 text-primary fill-primary" />
              <span>OhMyWedding</span>
            </Link>
          </div>

          {/* Right: Additional links or content */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link 
              href="https://ohmywedding.com/create" 
              className="hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Create your wedding site
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}