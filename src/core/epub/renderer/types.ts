import type { LocationInfo, SearchHit, TocItem } from '@/types'

export interface SelectionInfo {
  cfi: string
  text: string
  /** Bounding box of the selection in viewport coordinates. */
  rect: DOMRect | null
}

export interface EpubRenderer {
  /** Create the rendition inside the given element. */
  mount(el: HTMLElement, opts: { flow: 'paginated' | 'scrolled' }): Promise<void>
  /** Open at a CFI (or the beginning). */
  open(cfi?: string): Promise<void>
  /** Apply a generated stylesheet to all (and future) section iframes. */
  applyStyles(css: string): void
  /** Re-measure after container size changes (e.g. margin changes). */
  applyLayout(): void
  /** Page turn within the current section. */
  next(): void
  prev(): void
  /** Jump a whole section (chapter). */
  nextSection(): Promise<void>
  prevSection(): Promise<void>
  goTo(cfi: string): Promise<void>
  goToHref(href: string): Promise<void>
  goToPercent(percent: number): Promise<void>
  onRelocated(cb: (loc: LocationInfo) => void): void
  onSelection(cb: (sel: SelectionInfo | null) => void): void
  onReady(cb: () => void): void
  getToc(): Promise<TocItem[]>
  search(
    query: string,
    onHit: (hit: SearchHit) => void,
    onDone: (truncated: boolean) => void,
    signal?: AbortSignal,
  ): Promise<void>
  addHighlight(cfi: string, color: string): void
  removeHighlight(cfi: string): void
  destroy(): void
}

export async function createEpubRenderer(data: ArrayBuffer): Promise<EpubRenderer> {
  const { EpubJsRenderer } = await import('./epubjs')
  return new EpubJsRenderer(data)
}
