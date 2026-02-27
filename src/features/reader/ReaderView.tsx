import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useEpubBook } from './useEpubBook'
import { useAutoHideChrome } from './useAutoHideChrome'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { ReaderTopBar } from './ReaderTopBar'
import { ReaderBottomBar } from './ReaderBottomBar'
import { LeftDrawer } from './LeftDrawer'
import { SelectionPopover } from './SelectionPopover'
import { MarginDragHandles } from './MarginDragHandles'
import { SettingsDrawer } from '@/features/settings/SettingsDrawer'
import { mergeOverride, useBookAwareSettingsUpdate } from '@/features/settings/useSettingsUpdate'
import { generateReaderCss } from '@/core/epub/stylegen'
import { resolveReadingColors } from '@/core/theme/presets'
import { navigate } from '@/hooks/useHashRoute'
import { usePlatform } from '@/hooks/usePlatform'
import { useSettingsStore } from '@/state/settingsStore'
import { useReaderStore } from '@/state/readerStore'
import { useAnnotationStore } from '@/state/annotationStore'
import { toast } from '@/state/toastStore'
import { updateBookMeta } from '@/core/storage/books'
import { LoadingScreen, Spinner } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import type { ReaderSettings } from '@/types/settings'
import { cn } from '@/core/utils/cn'

export function ReaderView({ bookId }: { bookId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)

  const global = useSettingsStore()
  const useOverride = useReaderStore((s) => s.useBookOverride)
  const [override, setOverride] = useState<Partial<ReaderSettings> | null>(null)

  const cssRef = useRef('')
  const getCss = useCallback(() => cssRef.current, [])
  const { record, toc, error, rendererRef, retry } = useEpubBook(
    containerRef,
    bookId,
    global.layout.flow,
    getCss,
  )

  // Sync the per-book override from the record once it loads.
  useEffect(() => {
    setOverride(record?.themeOverride ?? null)
  }, [record])

  const effective = useMemo(() => mergeOverride(global, override), [global, override])
  const update = useBookAwareSettingsUpdate(bookId, override, setOverride, useOverride, global)

  const colors = useMemo(() => resolveReadingColors(effective.appearance), [effective.appearance])
  const css = useMemo(
    () => generateReaderCss({ typography: effective.typography, colors }),
    [effective.typography, colors],
  )
  cssRef.current = css

  useEffect(() => {
    rendererRef.current?.applyStyles(css)
  }, [css, record, attempt, rendererRef])

  const { marginTop, marginRight, marginBottom, marginLeft, flow } = effective.layout
  const maxLineWidth = Math.round(effective.typography.maxLineCh * effective.typography.fontSize * 0.52)

  // Re-measure the rendition whenever page geometry changes (debounced so
  // drags and slider scrubs coalesce into one relayout).
  useEffect(() => {
    const t = window.setTimeout(() => rendererRef.current?.applyLayout(), 250)
    return () => window.clearTimeout(t)
  }, [marginTop, marginRight, marginBottom, marginLeft, maxLineWidth, flow, record, attempt, rendererRef])

  const leftOpen = useReaderStore((s) => s.leftOpen)
  const leftTab = useReaderStore((s) => s.leftTab)
  const settingsOpen = useReaderStore((s) => s.settingsOpen)
  const percent = useReaderStore((s) => s.percent)
  const section = useReaderStore((s) => s.section)
  const href = useReaderStore((s) => s.href)

  const chromeVisible = useAutoHideChrome(effective.view.autoHideChrome, leftOpen || settingsOpen)

  const platform = usePlatform()
  const [fullscreen, setFullscreen] = useState(false)
  const toggleFullscreen = useCallback(() => {
    setFullscreen((fs) => {
      void platform?.setFullscreen(!fs)
      return !fs
    })
  }, [platform])

  const addBookmark = useCallback(() => {
    const rs = useReaderStore.getState()
    if (!rs.cfi) return
    void useAnnotationStore
      .getState()
      .add({ kind: 'bookmark', cfi: rs.cfi, section: rs.section, excerpt: '' })
      .then(() => toast.success('Bookmark added.'))
  }, [])
  useKeyboardShortcuts(rendererRef, addBookmark)

  const toggleBookOverride = useCallback(
    (on: boolean) => {
      useReaderStore.getState().setUseBookOverride(on)
      if (on) {
        const snapshot: Partial<ReaderSettings> = {
          typography: effective.typography,
          layout: effective.layout,
          appearance: effective.appearance,
          view: effective.view,
        }
        setOverride(snapshot)
        void updateBookMeta(bookId, { themeOverride: snapshot })
      } else {
        setOverride(null)
        void updateBookMeta(bookId, { themeOverride: null })
      }
    },
    [bookId, effective],
  )

  const resetBook = useCallback(() => {
    setOverride(null)
    useReaderStore.getState().setUseBookOverride(false)
    void updateBookMeta(bookId, { themeOverride: null })
    toast.success('This book now follows your global settings.')
  }, [bookId])

  const loading = !record && !error

  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ background: colors.bg }}>
      <div className="relative min-h-0 flex-1">
        {/* Reading canvas — reserved strips top/bottom hold the chrome.
            overflow-hidden keeps EPUB content from leaking under the bars
            or creating stray horizontal scroll. */}
        <div
          className="absolute inset-x-0 top-14 bottom-14 overflow-hidden"
          style={{
            paddingTop: marginTop,
            paddingRight: marginRight,
            paddingBottom: marginBottom,
            paddingLeft: marginLeft,
          }}
        >
          <div
            className="mx-auto h-full w-full overflow-hidden"
            style={{ maxWidth: `min(100%, ${maxLineWidth}px)` }}
          >
            <div ref={containerRef} className="sp-reader-canvas h-full w-full" />
          </div>
        </div>

        {record && !error && import.meta.env.DEV && (
          <MarginDragHandles
            layout={effective.layout}
            update={update}
            maxWidthPx={maxLineWidth}
            fontSize={effective.typography.fontSize}
          />
        )}

        <ReaderTopBar
          visible={chromeVisible}
          title={record?.title ?? 'SeaPub'}
          section={section}
          colors={colors}
          fullscreen={fullscreen}
          onBack={() => navigate('#/library')}
          onToggleFullscreen={toggleFullscreen}
        />
        <ReaderBottomBar
          visible={chromeVisible}
          percent={percent}
          colors={colors}
          rendererRef={rendererRef}
        />

        {loading && (
          <div className="absolute inset-0 z-40" style={{ background: colors.bg }}>
            <LoadingScreen />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: colors.bg }}>
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <AlertCircle size={28} className="text-danger" />
              <h2 className="text-[16px] font-semibold" style={{ color: colors.text }}>
                {error === 'missing'
                  ? 'This book is no longer in your library.'
                  : 'Something interrupted while opening this book.'}
              </h2>
              <p className="text-[13px]" style={{ color: colors.text, opacity: 0.65 }}>
                {error === 'missing'
                  ? 'It may have been removed from another window.'
                  : 'The file might be damaged, or the book uses features SeaPub can’t render yet.'}
              </p>
              <div className="mt-1 flex gap-2">
                <Button variant="secondary" onClick={() => navigate('#/library')}>
                  Back to library
                </Button>
                {error === 'open' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setAttempt((a) => a + 1)
                      retry()
                    }}
                  >
                    Try again
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <LeftDrawer
        open={leftOpen}
        tab={leftTab}
        onClose={() => useReaderStore.getState().toggleLeft()}
        toc={toc}
        currentHref={href}
        rendererRef={rendererRef}
        onAddBookmark={addBookmark}
      />

      <SettingsDrawer
        scope="book"
        open={settingsOpen}
        onClose={() => useReaderStore.getState().toggleSettings(false)}
        settings={effective}
        update={update}
        useBookOverride={useOverride}
        onToggleBookOverride={toggleBookOverride}
        onResetBook={resetBook}
        onResetGlobal={() => {
          global.resetAll()
          toast.success('Global defaults restored.')
        }}
      />

      <SelectionPopover rendererRef={rendererRef} />

      {/* Importing indicator is global; here we only keep an aria-live region. */}
      <div className={cn('sr-only')} aria-live="polite">
        {loading ? 'Opening your book' : ''}
        {loading ? <Spinner className="hidden" /> : null}
      </div>
    </div>
  )
}
