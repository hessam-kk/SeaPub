import { type ReactNode, useEffect, useState } from 'react'
import { useSettingsStore } from '@/state/settingsStore'

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Applies the UI theme (light / dark / system) to <html data-theme> and
 * mirrors the mode to localStorage so index.html can set it before paint.
 * Reading-surface colors (presets/custom) are handled separately in the
 * reader canvas — the chrome follows this resolved mode.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSettingsStore((s) => s.appearance.mode)
  const highContrast = useSettingsStore((s) => s.appearance.highContrast)
  const [systemDark, setSystemDark] = useState(prefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    try {
      localStorage.setItem('seapub-theme', mode)
    } catch {
      /* private mode etc. */
    }
  }, [resolved, mode])

  useEffect(() => {
    if (highContrast) {
      document.documentElement.dataset.contrast = 'high'
    } else {
      delete document.documentElement.dataset.contrast
    }
  }, [highContrast])

  return <>{children}</>
}

export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useSettingsStore((s) => s.appearance.mode)
  const [systemDark] = useState(prefersDark)
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
}
