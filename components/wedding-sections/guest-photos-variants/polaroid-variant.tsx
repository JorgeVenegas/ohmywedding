"use client"

import { Camera } from "lucide-react"
import { UploadArea } from "./upload-area"
import type { BaseVariantProps } from "./types"
import { getContrastSet } from "./types"

export function PolaroidVariant(props: BaseVariantProps) {
  const { theme, primary, title, subtitle, useColorBackground, backgroundColorChoice, uploadsEnabled } = props
  const c = getContrastSet(theme, useColorBackground, backgroundColorChoice, primary)
  const bg = c.bgColor ?? '#f5f2eb'

  return (
    <section style={{ background: bg }}>
      {/* Header + upload — constrained */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
            style={{
              background: c.bgColor ? c.iconBg : 'rgba(255,255,255,0.7)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Camera className="w-5 h-5" style={{ color: c.bgColor ? c.iconColor : primary }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif mb-3" style={{ color: c.titleColor }}>{title}</h2>
          <p className="text-sm max-w-sm mx-auto" style={{ color: c.subColor }}>{subtitle}</p>
        </div>

        {uploadsEnabled && (
          <UploadArea
            {...props}
            zoneBg={c.bgColor ? c.zoneBg : 'rgba(255,255,255,0.5)'}
            zoneBorder={c.bgColor ? c.zoneBorder : 'rgba(0,0,0,0.1)'}
            zoneBorderDragging={primary}
            inputBg={c.bgColor ? c.inputBg : 'rgba(255,255,255,0.7)'}
            inputBorder={c.bgColor ? c.inputBorder : 'rgba(0,0,0,0.1)'}
            textColor={c.bgColor ? c.textColor : '#374151'}
            mutedColor={c.bgColor ? c.mutedColor : '#9ca3af'}
          />
        )}
      </div>

      <div style={{ height: 48 }} />
    </section>
  )
}
