import ePub, { type Book, type Rendition } from 'epubjs'
import type { LocationInfo, SearchHit, TocItem } from '@/types'
import type { EpubRenderer, SelectionInfo } from './types'

/* Loose shapes for epub.js internals that are not (well) typed. */
interface SpineItem {
  index: number
  href: string
  load(req: unknown): Promise<Document>
  unload(): void
  cfiFromElement(el: Element): string
  cfiFromRange(range: Range): string
}
interface RelocatedPayload {
  start: {
    cfi: string
    href: string
    index: number
    percentage: number | null
  }
  atStart?: boolean
  atEnd?: boolean
}
interface NavItem {
  label?: string
  href?: string
  subitems?: NavItem[]
}

const MAX_SEARCH_HITS = 300

function lastSegment(href: string): string {
  const clean = href.split('#')[0].split('?')[0]
  return clean.slice(clean.lastIndexOf('/') + 1).toLowerCase()
}

function humanizeFilename(href: string): string {
  const seg = lastSegment(href)
  const base = seg.replace(/\.x?html?$/i, '').replace(/[-_]+/g, ' ').trim()
  if (!base) return ''
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export class EpubJsRenderer implements EpubRenderer {
  private book: Book
  private rendition: Rendition | null = null
  private container: HTMLElement | null = null

  private css = ''
  private docs = new Set<Document>()

  private relocatedCb: ((loc: LocationInfo) => void) | null = null
  private selectionCb: ((sel: SelectionInfo | null) => void) | null = null
  private readyCb: (() => void) | null = null

  private tocFlat: { label: string; href: string }[] | null = null
  private currentIndex = 0
  private currentHref = ''
  private lastSpineCount = 1
  private locationsReady = false
  private highlights = new Map<string, string>()

  /** Accepts the raw EPUB bytes — epub.js auto-detects binary input. */
  constructor(data: ArrayBuffer) {
    this.book = ePub(data)
  }

  async mount(el: HTMLElement, opts: { flow: 'paginated' | 'scrolled' }): Promise<void> {
    this.container = el
    // epub.js's internal queue starts the rendition before the zip has
    // finished parsing, which intermittently bricks the view (manager never
    // created). Wait for the book to fully open first.
    await Promise.race([
      this.book.opened as Promise<unknown>,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timed out while opening the book')), 15000),
      ),
    ])
    this.rendition = this.book.renderTo(el, {
      width: '100%',
      height: '100%',
      flow: opts.flow === 'scrolled' ? 'scrolled-doc' : 'paginated',
      spread: 'none',
      allowScriptedContent: false,
    })

    this.rendition.on('rendered', (_section: unknown, view: unknown) => {
      const doc = (view as { document?: Document }).document
      if (doc) {
        this.docs.add(doc)
        if (this.css) this.paint(doc)
      }
    })
    this.rendition.on('relocated', (payload: RelocatedPayload) => {
      this.handleRelocated(payload)
    })
    this.rendition.on('selected', (cfi: string, contents: unknown) => {
      this.handleSelected(cfi, contents)
    })
  }

  async open(cfi?: string): Promise<void> {
    if (!this.rendition) return
    try {
      await this.rendition.display(cfi && cfi.length > 0 ? cfi : undefined)
    } catch {
      // Stale/invalid CFI (edited book, old format) — start from the top
      // rather than failing the whole open.
      await this.rendition.display(undefined)
    }
    this.readyCb?.()

    // Accurate percentages need the location index; build it in the
    // background and re-emit the current position when ready.
    void this.book.locations
      .generate(1200)
      .then(() => {
        this.locationsReady = true
        this.emitCurrentLocation()
      })
      .catch(() => {
        /* estimates remain */
      })
  }

  applyStyles(css: string): void {
    this.css = css
    for (const doc of [...this.docs]) {
      if (!doc.isConnected) {
        this.docs.delete(doc)
        continue
      }
      this.paint(doc)
    }
  }

  applyLayout(): void {
    if (!this.rendition || !this.container) return
    const { clientWidth, clientHeight } = this.container
    if (clientWidth <= 0 || clientHeight <= 0) return

    let restoreCfi = ''
    try {
      const loc = this.rendition.currentLocation() as unknown as { start?: { cfi?: string } }
      restoreCfi = loc?.start?.cfi ?? ''
    } catch {
      /* manager not started yet */
    }

    try {
      this.rendition.resize(clientWidth, clientHeight)
    } catch {
      /* not yet displayed */
    }

    // Rapid resizes (e.g. dragging a margin handle) can leave epub.js's
    // internal queue without any rendered view. Restore the position if
    // nothing is on screen shortly after the relayout.
    window.setTimeout(() => {
      const rendition = this.rendition as (Rendition & { manager?: unknown }) | null
      if (!rendition || !rendition.manager) return
      let viewCount = 0
      try {
        viewCount = rendition.views().length
      } catch {
        return
      }
      if (viewCount === 0) {
        rendition
          .display(restoreCfi || undefined)
          .catch(() => rendition.display(undefined).catch(() => {}))
      }
    }, 150)
  }

  next(): void {
    void this.rendition?.next()
  }

  prev(): void {
    void this.rendition?.prev()
  }

  async nextSection(): Promise<void> {
    await this.goToSection(1)
  }

  async prevSection(): Promise<void> {
    await this.goToSection(-1)
  }

  private async goToSection(delta: number): Promise<void> {
    if (!this.rendition) return
    const spine = this.book.spine as unknown as { spineItems?: SpineItem[]; get: (t: number | string) => SpineItem | null }
    const count = spine.spineItems?.length ?? this.lastSpineCount
    const target = Math.min(count - 1, Math.max(0, this.currentIndex + delta))
    const section = spine.get(target)
    if (section) {
      await this.rendition.display(section.href)
    }
  }

  async goTo(cfi: string): Promise<void> {
    await this.rendition?.display(cfi)
  }

  async goToHref(href: string): Promise<void> {
    await this.rendition?.display(href)
  }

  async goToPercent(percent: number): Promise<void> {
    if (!this.rendition) return
    const p = Math.min(100, Math.max(0, percent)) / 100
    const cfi = this.locationsReady
      ? this.book.locations.cfiFromPercentage(p)
      : null
    if (cfi && typeof cfi === 'string') {
      await this.rendition.display(cfi)
      return
    }
    const spine = this.book.spine as unknown as { spineItems?: SpineItem[]; get: (t: number | string) => SpineItem | null }
    const count = spine.spineItems?.length ?? 1
    const section = spine.get(Math.min(count - 1, Math.floor(p * count)))
    if (section) await this.rendition.display(section.href)
  }

  onRelocated(cb: (loc: LocationInfo) => void): void {
    this.relocatedCb = cb
  }

  onSelection(cb: (sel: SelectionInfo | null) => void): void {
    this.selectionCb = cb
  }

  onReady(cb: () => void): void {
    this.readyCb = cb
  }

  async getToc(): Promise<TocItem[]> {
    const nav = (await this.book.loaded.navigation) as { toc?: NavItem[] }
    const out: TocItem[] = []
    const walk = (items: NavItem[], depth: number) => {
      for (const [i, item] of (items ?? []).entries()) {
        const href = item.href ?? ''
        const label = (item.label ?? '').trim() || humanizeFilename(href) || `Section ${i + 1}`
        const node: TocItem = {
          id: `${depth}-${i}-${href}`,
          label,
          href,
          depth,
          sub: [],
        }
        out.push(node)
        if (item.subitems?.length) {
          node.sub = []
          walk(item.subitems, depth + 1)
        }
      }
    }
    walk(nav?.toc ?? [], 0)
    this.tocFlat = out.map((t) => ({ label: t.label, href: t.href }))
    return out
  }

  async search(
    query: string,
    onHit: (hit: SearchHit) => void,
    onDone: (truncated: boolean) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const q = query.trim().toLowerCase()
    if (!q) {
      onDone(false)
      return
    }
    const spine = this.book.spine as unknown as { spineItems?: SpineItem[] }
    const items = spine.spineItems ?? []
    let hits = 0
    let truncated = false

    for (const section of items) {
      if (signal?.aborted) return
      if (hits >= MAX_SEARCH_HITS) {
        truncated = true
        break
      }
      let doc: Document | null = null
      try {
        // Section.load resolves with the document *element*, not the Document.
        const root = await section.load(this.book.load.bind(this.book))
        doc = (root?.ownerDocument as Document | null) ?? (root as Document | null)
      } catch {
        continue
      }
      try {
        if (!doc?.body) continue
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
        const textNodes: Text[] = []
        while (walker.nextNode()) textNodes.push(walker.currentNode as Text)

        for (const node of textNodes) {
          const data = node.data
          if (!data || data.length < q.length) continue
          const lower = data.toLowerCase()
          let idx = lower.indexOf(q)
          while (idx !== -1) {
            if (signal?.aborted) return
            if (hits >= MAX_SEARCH_HITS) {
              truncated = true
              break
            }
            const excerpt = excerptAround(data, idx, q.length)
            let cfi = ''
            try {
              const range = doc.createRange()
              range.setStart(node, idx)
              range.setEnd(node, idx + q.length)
              cfi = section.cfiFromRange(range)
            } catch {
              try {
                cfi = section.cfiFromElement(node.parentElement ?? sectionAnchor(doc))
              } catch {
                cfi = section.href
              }
            }
            onHit({ cfi: cfi || section.href, excerpt, sectionIndex: section.index })
            hits++
            idx = lower.indexOf(q, idx + q.length)
          }
          if (truncated) break
        }
      } finally {
        try {
          section.unload()
        } catch {
          /* ignore */
        }
      }
      // Yield to the UI thread so the panel stays responsive.
      await new Promise((r) => setTimeout(r, 0))
    }
    onDone(truncated)
  }

  addHighlight(cfi: string, color: string): void {
    if (!this.rendition || this.highlights.has(cfi)) return
    try {
      this.rendition.annotations.add(
        'highlight',
        cfi,
        {},
        undefined,
        'seapub-hl',
        { fill: color, 'fill-opacity': '0.28' },
      )
      this.highlights.set(cfi, color)
    } catch {
      /* invalid CFI — ignore */
    }
  }

  removeHighlight(cfi: string): void {
    if (!this.rendition || !this.highlights.has(cfi)) return
    try {
      this.rendition.annotations.remove('highlight', cfi)
      this.highlights.delete(cfi)
    } catch {
      /* ignore */
    }
  }

  destroy(): void {
    try {
      this.rendition?.destroy()
      this.book.destroy()
    } catch {
      /* ignore */
    }
    this.docs.clear()
    this.rendition = null
  }

  // ---- internals ----

  private paint(doc: Document): void {
    const head = doc.head ?? doc.documentElement
    if (!head) return
    let style = head.querySelector('style[data-seapub]') as HTMLStyleElement | null
    if (!style) {
      style = doc.createElement('style')
      style.setAttribute('data-seapub', '')
      head.appendChild(style)
    }
    style.textContent = this.css
  }

  private handleRelocated(payload: RelocatedPayload): void {
    const start = payload?.start
    if (!start) return
    this.currentIndex = start.index ?? this.currentIndex
    this.currentHref = start.href ?? this.currentHref
    const spine = this.book.spine as unknown as { spineItems?: SpineItem[] }
    this.lastSpineCount = spine.spineItems?.length ?? this.lastSpineCount

    const percent =
      start.percentage != null
        ? Math.round(start.percentage * 100)
        : Math.round(((this.currentIndex + 0.5) / Math.max(1, this.lastSpineCount)) * 100)

    this.relocatedCb?.({
      cfi: start.cfi,
      percent: Math.min(100, Math.max(0, percent)),
      section: this.sectionLabel(),
      sectionIndex: this.currentIndex,
      href: this.currentHref,
    })
  }

  private sectionLabel(): string {
    const seg = lastSegment(this.currentHref)
    const fromToc = this.tocFlat?.find((t) => lastSegment(t.href) === seg)
    return fromToc?.label ?? humanizeFilename(this.currentHref)
  }

  private emitCurrentLocation(): void {
    if (!this.rendition) return
    try {
      const loc = this.rendition.currentLocation() as unknown as RelocatedPayload
      if (loc?.start) this.handleRelocated(loc)
    } catch {
      /* ignore */
    }
  }

  private handleSelected(cfi: string, contents: unknown): void {
    const c = contents as {
      document?: Document
      window?: Window
    }
    const win = c?.window
    const sel = win?.getSelection()
    const text = sel?.toString().trim() ?? ''
    if (!text) {
      this.selectionCb?.(null)
      return
    }
    let rect: DOMRect | null = null
    try {
      const range = sel!.getRangeAt(0)
      const inner = range.getBoundingClientRect()
      const frame = (win as Window).frameElement as HTMLElement | null
      const frameRect = frame?.getBoundingClientRect()
      if (inner && frameRect) {
        rect = new DOMRect(
          frameRect.left + inner.left,
          frameRect.top + inner.top,
          inner.width,
          inner.height,
        )
      } else if (inner) {
        rect = inner
      }
    } catch {
      rect = null
    }
    this.selectionCb?.({ cfi, text, rect })
  }
}

function excerptAround(text: string, start: number, length: number): string {
  const from = Math.max(0, start - 40)
  const to = Math.min(text.length, start + length + 40)
  return `${from > 0 ? '…' : ''}${text.slice(from, to).replace(/\s+/g, ' ').trim()}${to < text.length ? '…' : ''}`
}

function sectionAnchor(doc: Document): Element {
  return doc.body
}
