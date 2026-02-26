import { useEffect, useRef, useState } from 'react'
import { BookmarkPlus, Trash2 } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { SegmentedControl, SearchField } from '@/components/ui/controls'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Spinner } from '@/components/ui/misc'
import type { EpubRenderer } from '@/core/epub/renderer/types'
import type { Annotation, SearchHit, TocItem } from '@/types'
import { useAnnotationStore } from '@/state/annotationStore'
import { useReaderStore, type LeftTab } from '@/state/readerStore'
import { formatDate } from '@/core/utils/misc'
import { cn } from '@/core/utils/cn'

function lastSegment(href: string): string {
  const clean = href.split('#')[0].split('?')[0]
  return clean.slice(clean.lastIndexOf('/') + 1).toLowerCase()
}

export function LeftDrawer({
  open,
  tab,
  onClose,
  toc,
  currentHref,
  rendererRef,
  onAddBookmark,
}: {
  open: boolean
  tab: LeftTab
  onClose: () => void
  toc: TocItem[]
  currentHref: string
  rendererRef: React.RefObject<EpubRenderer | null>
  onAddBookmark: () => void
}) {
  const setLeftTab = useReaderStore((s) => s.setLeftTab)
  const annotations = useAnnotationStore((s) => s.annotations)

  const titles: Record<LeftTab, string> = {
    toc: 'Contents',
    bookmarks: 'Bookmarks',
    search: 'Search in book',
  }

  return (
    <Drawer side="left" open={open} onClose={onClose} title={titles[tab]} width={340}>
      <SegmentedControl<LeftTab>
        label="Book panel"
        value={tab}
        onChange={setLeftTab}
        options={[
          { value: 'toc', label: 'Contents' },
          { value: 'bookmarks', label: 'Bookmarks' },
          { value: 'search', label: 'Search' },
        ]}
        className="mb-4"
      />

      {tab === 'toc' && (
        <ContentsPanel toc={toc} currentHref={currentHref} rendererRef={rendererRef} onClose={onClose} />
      )}
      {tab === 'bookmarks' && (
        <BookmarksPanel annotations={annotations} rendererRef={rendererRef} onClose={onClose} onAdd={onAddBookmark} />
      )}
      {tab === 'search' && <SearchPanel rendererRef={rendererRef} onClose={onClose} />}
    </Drawer>
  )
}

/* ---------------- Contents ---------------- */

function ContentsPanel({
  toc,
  currentHref,
  rendererRef,
  onClose,
}: {
  toc: TocItem[]
  currentHref: string
  rendererRef: React.RefObject<EpubRenderer | null>
  onClose: () => void
}) {
  const activeSeg = lastSegment(currentHref)
  if (toc.length === 0) {
    return <p className="px-1 py-6 text-center text-[13px] text-ink-2">This book has no table of contents.</p>
  }
  return (
    <nav aria-label="Table of contents" className="flex flex-col">
      {toc.map((item) => {
        const active = activeSeg !== '' && lastSegment(item.href) === activeSeg
        return (
          <button
            key={item.id}
            onClick={() => {
              void rendererRef.current?.goToHref(item.href)
              onClose()
            }}
            className={cn(
              'rounded-[8px] py-1.5 pr-2 text-left text-[13px] leading-snug transition-colors',
              'hover:bg-surface-2',
              active ? 'font-medium text-accent' : 'text-ink',
            )}
            style={{ paddingLeft: 8 + item.depth * 14 }}
            aria-current={active ? 'location' : undefined}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

/* ---------------- Bookmarks ---------------- */

function BookmarksPanel({
  annotations,
  rendererRef,
  onClose,
  onAdd,
}: {
  annotations: Annotation[]
  rendererRef: React.RefObject<EpubRenderer | null>
  onClose: () => void
  onAdd: () => void
}) {
  const remove = useAnnotationStore((s) => s.remove)
  const bookmarks = annotations.filter((a) => a.kind === 'bookmark')

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" size="sm" onClick={onAdd} className="self-start">
        <BookmarkPlus size={13} />
        Bookmark this page
      </Button>

      {bookmarks.length === 0 ? (
        <p className="px-1 py-6 text-center text-[13px] text-ink-2">
          No bookmarks yet. Press <kbd className="rounded border border-edge bg-surface-2 px-1 text-[10.5px]">B</kbd> while reading to add one.
        </p>
      ) : (
        bookmarks.map((b) => (
          <div
            key={b.id}
            className="group flex items-center gap-2 rounded-[10px] px-2 py-2 transition-colors hover:bg-surface-2"
          >
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                void rendererRef.current?.goTo(b.cfi)
                onClose()
              }}
            >
              <div className="truncate text-[13px] text-ink">{b.section || 'Bookmark'}</div>
              <div className="text-[11.5px] text-ink-2">{formatDate(b.createdAt)}</div>
            </button>
            <IconButton label="Remove bookmark" onClick={() => void remove(b.id)} className="opacity-0 group-hover:opacity-100">
              <Trash2 size={14} />
            </IconButton>
          </div>
        ))
      )}
    </div>
  )
}

/* ---------------- Search ---------------- */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'))
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded-[3px] bg-accent-soft px-0.5 text-inherit">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

function SearchPanel({
  rendererRef,
  onClose,
}: {
  rendererRef: React.RefObject<EpubRenderer | null>
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const runIdRef = useRef(0)

  useEffect(() => {
    const q = query.trim()
    const runId = ++runIdRef.current
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      setTruncated(false)
      return
    }
    setSearching(true)
    setHits([])
    const t = setTimeout(() => {
      void rendererRef.current?.search(
        q,
        (hit) => {
          if (runIdRef.current === runId) setHits((prev) => [...prev, hit])
        },
        (wasTruncated) => {
          if (runIdRef.current === runId) {
            setSearching(false)
            setTruncated(wasTruncated)
          }
        },
      )
    }, 300)
    return () => clearTimeout(t)
  }, [query, rendererRef])

  return (
    <div className="flex flex-col gap-3">
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search this book…"
        ariaLabel="Search in book"
        autoFocus
        onEscape={onClose}
      />
      <div className="flex items-center gap-2 text-[12px] text-ink-2">
        {searching ? (
          <>
            <Spinner className="h-3.5 w-3.5" />
            Searching…
          </>
        ) : query.trim().length >= 2 ? (
          <span>
            {hits.length === 0
              ? 'No matches found.'
              : `${hits.length} result${hits.length === 1 ? '' : 's'}${truncated ? ' (stopped early — try a more specific search)' : ''}`}
          </span>
        ) : (
          <span>Type at least two characters.</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {hits.map((hit, i) => (
          <button
            key={`${hit.cfi}-${i}`}
            onClick={() => {
              void rendererRef.current?.goTo(hit.cfi)
              onClose()
            }}
            className="rounded-[8px] px-2 py-1.5 text-left text-[12.5px] leading-relaxed text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Highlighted text={hit.excerpt} query={query.trim()} />
          </button>
        ))}
      </div>
    </div>
  )
}
