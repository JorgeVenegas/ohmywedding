"use client"

import { Camera } from "lucide-react"
import { UploadArea } from "./upload-area"
import type { BaseVariantProps } from "./types"
import { getContrastSet } from "./types"

export function MinimalVariant(props: BaseVariantProps) {
  const { theme, primary, title, subtitle, useColorBackground, backgroundColorChoice, uploadsEnabled } = props
  const c = getContrastSet(theme, useColorBackground, backgroundColorChoice, primary)

  return (
    <section style={{ background: c.bgColor ?? 'var(--background, #fefdfb)' }}>
      {/* Header + upload — constrained */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5" style={{ background: c.iconBg }}>
            <Camera className="w-5 h-5" style={{ color: c.iconColor }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif mb-3" style={{ color: c.titleColor }}>{title}</h2>
          <p className="text-base max-w-sm mx-auto" style={{ color: c.subColor }}>{subtitle}</p>
        </div>

        {uploadsEnabled && (
          <UploadArea
            {...props}
            zoneBg={c.zoneBg}
            zoneBorder={c.zoneBorder}
            zoneBorderDragging={primary}
            inputBg={c.inputBg}
            inputBorder={c.inputBorder}
            textColor={c.textColor}
            mutedColor={c.mutedColor}
            buttonBg={c.buttonBg}
            buttonText={c.buttonText}
          />
        )}
      </div>

      <div style={{ height: 48 }} />
    </section>
  )
}
