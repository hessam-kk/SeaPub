import { type RefObject, useEffect, useRef } from 'react'
import type { EpubRenderer } from '@/core/epub/renderer/types'
import { useReaderStore } from '@/state/readerStore'
import { usePlatform } from '@/hooks/usePlatform'

/**
 * Page navigation (paginated and scrolled modes alike — the rendition turns
 * a page in paginated flow and scrolls a full viewport in scrolled flow):
 * Right/Down/Space/PgDn forward, Left/Up/Shift+Space/PgUp back.
 * F fullscreen; Esc closes panels; B bookmark; S settings; T contents;
 * / search.
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
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault()
          renderer?.next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          renderer?.prev()
          break
        case ' ':
        case 'Spacebar':
          // Let focused buttons/links keep their native Space activation.
          if (target?.closest?.('button, a[href], [role="button"], [role="switch"]')) {
            return
          }
          e.preventDefault()
          if (e.shiftKey) {
            renderer?.prev()
          } else {
            renderer?.next()
          }
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
