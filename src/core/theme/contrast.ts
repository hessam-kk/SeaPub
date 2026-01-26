function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n) || h.length !== 6) return [38, 48, 59]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function channelLuminance(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function isDarkColor(hex: string): boolean {
  return relativeLuminance(hex) < 0.28
}

/**
 * Suggest a readable text color for a background: prefers the light "ink"
 * on dark backgrounds and the dark "ink" on light ones, verifying WCAG AA.
 */
export function suggestTextColor(bg: string, darkInk = '#26303B', lightInk = '#E8E4D9'): string {
  return contrastRatio(bg, lightInk) >= contrastRatio(bg, darkInk) ? lightInk : darkInk
}
