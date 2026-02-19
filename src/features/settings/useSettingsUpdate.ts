import { useCallback } from 'react'
import type { ReaderSettings, SettingsPatch } from '@/types/settings'
import { useSettingsStore } from '@/state/settingsStore'
import { updateBookMeta } from '@/core/storage/books'

/** Route a patch to the global settings store. */
export function useGlobalSettingsUpdate(): (patch: SettingsPatch) => void {
  return useCallback((patch) => {
    const s = useSettingsStore.getState()
    if (patch.typography) s.setTypography(patch.typography)
    if (patch.layout) s.setLayout(patch.layout)
    if (patch.appearance) s.setAppearance(patch.appearance)
    if (patch.view) s.setView(patch.view)
  }, [])
}

/** Effective settings = global defaults with a per-book override merged in. */
export function mergeOverride(
  global: ReaderSettings,
  override: Partial<ReaderSettings> | null,
): ReaderSettings {
  if (!override) return global
  return {
    typography: override.typography ?? global.typography,
    layout: override.layout ?? global.layout,
    appearance: override.appearance ?? global.appearance,
    view: override.view ?? global.view,
  }
}

/** Per-book overrides are always stored as complete section snapshots. */
function snapshotPatch(
  global: ReaderSettings,
  base: Partial<ReaderSettings> | null,
  patch: SettingsPatch,
): Partial<ReaderSettings> {
  const current = mergeOverride(global, base)
  return {
    typography: { ...current.typography, ...(patch.typography ?? {}) },
    layout: { ...current.layout, ...(patch.layout ?? {}) },
    appearance: { ...current.appearance, ...(patch.appearance ?? {}) },
    view: { ...current.view, ...(patch.view ?? {}) },
  }
}

/**
 * When a per-book override is active, patches go to the book record;
 * otherwise they fall through to the global store.
 */
export function useBookAwareSettingsUpdate(
  bookId: string,
  override: Partial<ReaderSettings> | null,
  setOverride: (o: Partial<ReaderSettings> | null) => void,
  useOverride: boolean,
  global: ReaderSettings,
): (patch: SettingsPatch) => void {
  return useCallback(
    (patch) => {
      if (!useOverride) {
        const s = useSettingsStore.getState()
        if (patch.typography) s.setTypography(patch.typography)
        if (patch.layout) s.setLayout(patch.layout)
        if (patch.appearance) s.setAppearance(patch.appearance)
        if (patch.view) s.setView(patch.view)
        return
      }
      const next = snapshotPatch(global, override, patch)
      setOverride(next)
      void updateBookMeta(bookId, { themeOverride: next })
    },
    [bookId, override, setOverride, useOverride, global],
  )
}
