import type { AppearanceSettings, PresetId } from '@/types/settings'
import { suggestTextColor } from './contrast'

export interface ReadingPreset {
  id: PresetId
  name: string
  bg: string
  text: string
  dark: boolean
}

export const READING_PRESETS: ReadingPreset[] = [
  { id: 'paper', name: 'Paper', bg: '#FBF9F4', text: '#26303B', dark: false },
  { id: 'sepia', name: 'Sepia', bg: '#F4E8D1', text: '#433422', dark: false },
  { id: 'warm-sand', name: 'Warm sand', bg: '#EFE6D8', text: '#3E3428', dark: false },
  { id: 'ocean-mist', name: 'Ocean mist', bg: '#E8F0F2', text: '#1F3A43', dark: false },
  { id: 'slate', name: 'Slate', bg: '#3B4652', text: '#E6E9EC', dark: true },
  { id: 'midnight', name: 'Midnight', bg: '#151C2C', text: '#DCE2EA', dark: true },
  { id: 'deep-sea', name: 'Deep sea', bg: '#0C1A22', text: '#C9D8DC', dark: true },
]

export function getPreset(id: PresetId): ReadingPreset | undefined {
  return READING_PRESETS.find((p) => p.id === id)
}

export interface ResolvedReadingColors {
  bg: string
  text: string
  /** true when the surface is a dark tone (drives chrome accents) */
  dark: boolean
}

/** Resolve the reading surface colors from appearance settings. */
export function resolveReadingColors(appearance: AppearanceSettings): ResolvedReadingColors {
  if (appearance.preset === 'custom' || appearance.customBg) {
    const bg = appearance.customBg ?? '#FBF9F4'
    const text = appearance.customText ?? suggestTextColor(bg)
    return { bg, text, dark: relativeLuma(bg) < 0.28 }
  }
  const preset = getPreset(appearance.preset) ?? READING_PRESETS[0]
  return { bg: preset.bg, text: preset.text, dark: preset.dark }
}

function relativeLuma(hex: string): number {
  // Local import would create a cycle-free but redundant import; inline luma.
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return 0
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255)
}
