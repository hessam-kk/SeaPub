import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStateStorage } from '@/core/storage/settingsStorage'
import type {
  AppearanceSettings,
  LayoutSettings,
  ReaderSettings,
  TypographySettings,
  ViewSettings,
} from '@/types/settings'

export const DEFAULT_SETTINGS: ReaderSettings = {
  typography: {
    fontFamily: 'literata',
    customFontFamily: '',
    fontSize: 19,
    fontWeight: 400,
    lineHeight: 1.7,
    wordSpacing: 0,
    letterSpacing: 0,
    paragraphSpacing: 0.6,
    align: 'left',
    hyphenation: false,
    maxLineCh: 68,
    publisherStyles: true,
    customCss: '',
    customCssEnabled: false,
  },
  layout: {
    marginTop: 24,
    marginRight: 48,
    marginBottom: 28,
    marginLeft: 48,
    linkMargins: false,
    flow: 'paginated',
  },
  appearance: {
    mode: 'system',
    preset: 'paper',
    customBg: null,
    customText: null,
    highContrast: false,
  },
  view: {
    autoHideChrome: true,
  },
}

interface SettingsState extends ReaderSettings {
  setTypography: (patch: Partial<TypographySettings>) => void
  setLayout: (patch: Partial<LayoutSettings>) => void
  setAppearance: (patch: Partial<AppearanceSettings>) => void
  setView: (patch: Partial<ViewSettings>) => void
  resetAll: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...structuredClone(DEFAULT_SETTINGS),

      setTypography: (patch) =>
        set((s) => ({ typography: { ...s.typography, ...patch } })),
      // Pair-linking (left+right, top+bottom) is applied by the settings UI
      // so it also works for per-book override snapshots.
      setLayout: (patch) => set((s) => ({ layout: { ...s.layout, ...patch } })),
      setAppearance: (patch) =>
        set((s) => ({ appearance: { ...s.appearance, ...patch } })),
      setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),
      resetAll: () => set(structuredClone(DEFAULT_SETTINGS)),
    }),
    {
      name: 'seapub-settings',
      storage: createJSONStorage(() => idbStateStorage),
      partialize: (s) => ({
        typography: s.typography,
        layout: s.layout,
        appearance: s.appearance,
        view: s.view,
      }),
    },
  ),
)
