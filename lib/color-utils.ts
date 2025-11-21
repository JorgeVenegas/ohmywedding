import { ThemeConfig } from './wedding-config'

/**
 * Resolves a color value that might be a palette reference or a direct hex color
 * @param colorValue - Either a palette reference (e.g., "palette:primary") or a hex color (e.g., "#9CAF88")
 * @param theme - The theme configuration containing palette colors
 * @returns The resolved hex color
 */
export function resolveColor(colorValue: string | undefined, theme: Partial<ThemeConfig> | undefined): string {
  if (!colorValue || !theme?.colors) return colorValue || ''
  
  // Check if it's a palette reference
  if (colorValue.startsWith('palette:')) {
    const paletteKey = colorValue.replace('palette:', '') as keyof ThemeConfig['colors']
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
