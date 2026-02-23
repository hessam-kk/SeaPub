import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { createEpubRenderer, type EpubRenderer } from '@/core/epub/renderer/types'
import { getBook, updateBookMeta } from '@/core/storage/books'
import { useReaderStore } from '@/state/readerStore'
import { useAnnotationStore } from '@/state/annotationStore'
import { debounce } from '@/core/utils/misc'
import type { BookRecord, ReadingProgress, TocItem } from '@/types'

export type ReaderError = 'missing' | 'open' | null

/**
 * Owns the renderer lifecycle for one book. Recreates when the book or the
 * flow (paginated/scrolled) changes; preserves position through the CFI.
 */
export function useEpubBook(
  containerRef: RefObject<HTMLDivElement | null>,
  bookId: string,
  flow: 'paginated' | 'scrolled',
  getCss: () => string,
) {
  const [record, setRecord] = useState<BookRecord | null>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [error, setError] = useState<ReaderError>(null)
  const [attempt, setAttempt] = useState(0)
  const rendererRef = useRef<EpubRenderer | null>(null)

  useEffect(() => {
    let cancelled = false
    let renderer: EpubRenderer | null = null

    const save = debounce((id: string, progress: ReadingProgress) => {
      void updateBookMeta(id, { progress, lastOpenedAt: Date.now() })
    }, 400)

    void (async () => {
      try {
        const rec = await getBook(bookId)
        if (cancelled) return
        if (!rec) {
          setError('missing')
          return
        }
        setRecord(rec)
        setError(null)

        const rs = useReaderStore.getState()
        rs.setActiveBook(bookId)
        rs.setUseBookOverride(!!rec.themeOverride)
        void useAnnotationStore.getState().load(bookId)

        renderer = await createEpubRenderer(rec.blob)
        if (cancelled) {
          renderer.destroy()
          return
        }
        rendererRef.current = renderer

        renderer.onRelocated((loc) => {
          const s = useReaderStore.getState()
          s.setLocation(loc)
          if (s.selection) s.setSelection(null)
          save(bookId, {
            cfi: loc.cfi,
            percent: loc.percent,
            section: loc.section,
            sectionIndex: loc.sectionIndex,
          })
        })
        renderer.onSelection((sel) => useReaderStore.getState().setSelection(sel))
        renderer.onReady(() => {
          renderer!.applyStyles(getCssRef.current())
          const highlights = useAnnotationStore
            .getState()
            .annotations.filter((a) => a.kind === 'highlight')
          for (const a of highlights) renderer!.addHighlight(a.cfi, a.color)
        })

        const el = containerRef.current
        if (!el) return
        await renderer.mount(el, { flow })
        renderer.applyStyles(getCssRef.current())
        await renderer.open(rec.progress?.cfi || undefined)
        try {
          setToc(await renderer.getToc())
        } catch {
          /* TOC is optional */
        }
      } catch (e) {
        console.error('[seapub] failed to open book', e)
        if (!cancelled) setError('open')
      }
    })()

    return () => {
      cancelled = true
      save.cancel()
      renderer?.destroy()
      rendererRef.current = null
    }
  }, [bookId, flow, attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  const getCssRef = useRef<() => string>(getCss)
  getCssRef.current = getCss

  const retry = useCallback(() => {
    setError(null)
    setAttempt((a) => a + 1)
  }, [])

  return { record, toc, error, rendererRef, retry }
}
