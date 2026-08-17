"use client"

import { Camera } from "lucide-react"
import { UploadArea } from "./upload-area"
import { GalleryArea } from "./gallery-area"
import type { BaseVariantProps } from "./types"
import { getContrastSet } from "./types"

export function HeroVariant(props: BaseVariantProps) {
  const { theme, primary, title, subtitle, galleryLayout, useColorBackground, backgroundColorChoice, photos, photosLoading, uploadsEnabled, submitted, moderationEnabled } = props
  const c = getContrastSet(theme, useColorBackground, backgroundColorChoice, primary)
  const headerBg = c.bgColor ?? `${primary}18`

  return (
    <section>
      {/* Full-width colored header */}
      <div className="py-20 px-4 text-center" style={{ background: headerBg }}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5" style={{ background: c.iconBg }}>
          <Camera className="w-6 h-6" style={{ color: c.iconColor }} />
        </div>
        <h2 className="text-4xl sm:text-5xl font-serif mb-4" style={{ color: c.titleColor }}>{title}</h2>
        <p className="text-base max-w-md mx-auto" style={{ color: c.subColor }}>{subtitle}</p>
      </div>

      {/* White body — upload area constrained */}
      {(uploadsEnabled || submitted) && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-10">
          <UploadArea
            {...props}
            zoneBg="#fafaf9"
            zoneBorder="rgba(0,0,0,0.1)"
            zoneBorderDragging={primary}
            inputBg="#fff"
            inputBorder="rgba(0,0,0,0.1)"
            textColor="#374151"
            mutedColor="#9ca3af"
          />
        </div>
      )}
      {!uploadsEnabled && !submitted && <div style={{ height: 32 }} />}

      {/* Gallery — full-width */}
      <GalleryArea
        photos={photos}
        photosLoading={photosLoading}
        galleryLayout={galleryLayout}
        primary={primary}
        submitted={submitted}
        moderationEnabled={moderationEnabled}
      />
      <div style={{ height: 48 }} />
    </section>
  )
}
