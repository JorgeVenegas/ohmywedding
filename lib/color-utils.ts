import { ThemeConfig } from './wedding-config'

/**
 * Creates a lighter tint of a hex color
 */
function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

/**
 * Resolves a color value that might be a palette reference or a direct hex color
 * @param colorValue - Either a palette reference (e.g., "palette:primary", "palette:primary-light") or a hex color (e.g., "#9CAF88")
 * @param theme - The theme configuration containing palette colors
 * @returns The resolved hex color
 */
export function resolveColor(colorValue: string | undefined, theme: Partial<ThemeConfig> | undefined): string {
  if (!colorValue || !theme?.colors) return colorValue || ''
  
  // Check if it's a palette reference
  if (colorValue.startsWith('palette:')) {
    const paletteRef = colorValue.replace('palette:', '')
    
    // Check for light/lighter variants
    if (paletteRef.endsWith('-lighter')) {
      const baseColor = paletteRef.replace('-lighter', '') as keyof ThemeConfig['colors']
      const hexColor = theme.colors[baseColor]
      if (hexColor) return getLightTint(hexColor, 0.88)
    }
    
    if (paletteRef.endsWith('-light')) {
      const baseColor = paletteRef.replace('-light', '') as keyof ThemeConfig['colors']
      const hexColor = theme.colors[baseColor]
      if (hexColor) return getLightTint(hexColor, 0.5)
    }
    
    // Standard palette reference
    const paletteKey = paletteRef as keyof ThemeConfig['colors']
    return theme.colors[paletteKey] || colorValue
  }
  
  // Otherwise it's a direct hex color
  return colorValue
}

/**
 * Resolves multiple color values at once
 */
export function resolveColors(
  colors: Record<string, string | undefined>, 
  theme: ThemeConfig
): Record<string, string> {
  const resolved: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(colors)) {
    resolved[key] = resolveColor(value, theme)
  }
  
  return resolved
}
