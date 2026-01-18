/** Reading progress for a book, persisted per book. */
export interface ReadingProgress {
  /** Canonical Fragment Identifier of the last read position. */
  cfi: string
  /** 0–100 */
  percent: number
  /** Human label of the current section (chapter title if known). */
  section: string
  sectionIndex: number
}

export interface BookMeta {
  id: string
  title: string
  author: string
  description: string
  language: string
  publisher: string
  cover: Blob | null
  addedAt: number
  lastOpenedAt: number
  fileSize: number
  progress: ReadingProgress
  /** Per-book settings override (partial, merged over global settings). */
  themeOverride: Partial<ReaderSettings> | null
}

/** What is actually stored in IndexedDB, including the EPUB payload. */
export interface BookRecord extends BookMeta {
  blob: ArrayBuffer
}

export type AnnotationKind = 'bookmark' | 'highlight' | 'note'

export interface Annotation {
  id: string
  bookId: string
  kind: AnnotationKind
  cfi: string
  section: string
  /** Selected text (excerpt for highlights, full for notes context). */
  excerpt: string
  /** User note text. */
  note: string
  color: string
  createdAt: number
}

export interface TocItem {
  id: string
  label: string
  href: string
  depth: number
  sub: TocItem[]
}

export interface SearchHit {
  cfi: string
  excerpt: string
  sectionIndex: number
}

export interface LocationInfo {
  cfi: string
  percent: number
  section: string
  sectionIndex: number
  /** Spine href of the current section (for TOC highlighting). */
  href: string
}

export type ImportErrorCode = 'invalid' | 'drm' | 'corrupt' | 'unknown'

export class EpubImportError extends Error {
  code: ImportErrorCode
  constructor(code: ImportErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

// Imported late to avoid a cycle: settings types live in types/settings.ts.
import type { ReaderSettings } from './settings'
export type { ReaderSettings }
