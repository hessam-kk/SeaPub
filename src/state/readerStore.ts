import { create } from 'zustand'
import type { SelectionInfo } from '@/core/epub/renderer/types'

export type LeftTab = 'toc' | 'bookmarks' | 'search'

interface ReaderState {
  activeBookId: string | null
  cfi: string
  percent: number
  section: string
  sectionIndex: number
  href: string
  locationsReady: boolean
  chromeVisible: boolean
  leftOpen: boolean
  leftTab: LeftTab
  settingsOpen: boolean
  /** per-book override active while reading */
  useBookOverride: boolean
  selection: SelectionInfo | null
  /** a margin drag handle is active — pause chrome auto-hide */
  marginDragging: boolean

  setActiveBook: (id: string | null) => void
  setLocation: (loc: {
    cfi: string
    percent: number
    section: string
    sectionIndex: number
    href: string
  }) => void
  setLocationsReady: (ready: boolean) => void
  showChrome: () => void
  hideChrome: () => void
  toggleLeft: (tab?: LeftTab) => void
  setLeftTab: (tab: LeftTab) => void
  toggleSettings: (open?: boolean) => void
  setUseBookOverride: (on: boolean) => void
  setSelection: (sel: SelectionInfo | null) => void
  setMarginDragging: (v: boolean) => void
  closePanels: () => void
}

export const useReaderStore = create<ReaderState>()((set, get) => ({
  activeBookId: null,
  cfi: '',
  percent: 0,
  section: '',
  sectionIndex: 0,
  href: '',
  locationsReady: false,
  chromeVisible: true,
  leftOpen: false,
  leftTab: 'toc',
  settingsOpen: false,
  useBookOverride: false,
  selection: null,
  marginDragging: false,

  setActiveBook: (id) =>
    set({
      activeBookId: id,
      cfi: '',
      percent: 0,
      section: '',
      sectionIndex: 0,
      locationsReady: false,
      leftOpen: false,
      settingsOpen: false,
      selection: null,
      chromeVisible: true,
    }),
  setLocation: (loc) => set(loc),
  setLocationsReady: (ready) => set({ locationsReady: ready }),
  showChrome: () => set((s) => (s.chromeVisible ? s : { chromeVisible: true })),
  hideChrome: () => set((s) => (!s.chromeVisible ? s : { chromeVisible: false })),
  toggleLeft: (tab) =>
    set((s) => {
      const nextTab = tab ?? s.leftTab
      const opening = tab ? !s.leftOpen || s.leftTab !== tab : !s.leftOpen
      return { leftOpen: opening, leftTab: nextTab, settingsOpen: false, selection: null }
    }),
  setLeftTab: (tab) => set({ leftTab: tab }),
  toggleSettings: (open) =>
    set((s) => ({
      settingsOpen: open ?? !s.settingsOpen,
      leftOpen: false,
      selection: null,
    })),
  setUseBookOverride: (on) => set({ useBookOverride: on }),
  setSelection: (sel) => set({ selection: sel }),
  setMarginDragging: (v) => set((s) => (s.marginDragging === v ? s : { marginDragging: v })),
  closePanels: () =>
    set({ leftOpen: false, settingsOpen: false, selection: null, chromeVisible: get().chromeVisible }),
}))
