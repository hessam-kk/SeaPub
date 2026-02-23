import { type RefObject, useEffect, useRef } from 'react'
import type { EpubRenderer } from '@/core/epub/renderer/types'
import { useReaderStore } from '@/state/readerStore'
import { usePlatform } from '@/hooks/usePlatform'

/**
 * Arrow keys / PgUp/PgDn turn pages; F fullscreen; Esc closes panels;
 * B bookmark; S settings; T contents; / search.
 */
export function useKeyboardShortcuts(
  rendererRef: RefObject<EpubRenderer | null>,
  addBookmark: () => void,
): void {
  const platform = usePlatform()
  const fullscreenRef = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      const rs = useReaderStore.getState()
      const renderer = rendererRef.current

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault()
          renderer?.next()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          renderer?.prev()
          break
        case 'f':
        case 'F': {
          fullscreenRef.current = !fullscreenRef.current
          void platform?.setFullscreen(fullscreenRef.current)
          break
        }
        case 'Escape':
          if (rs.selection) {
            rs.setSelection(null)
          } else if (rs.leftOpen || rs.settingsOpen) {
            rs.closePanels()
          } else if (document.fullscreenElement) {
            void document.exitFullscreen()
            fullscreenRef.current = false
          }
          break
        case 'b':
        case 'B':
          addBookmark()
          break
        case 's':
        case 'S':
          rs.toggleSettings()
          break
        case 't':
        case 'T':
          rs.toggleLeft('toc')
          break
        case '/':
          e.preventDefault()
          rs.toggleLeft('search')
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rendererRef, addBookmark, platform])
}
