import { create } from 'zustand'
import type { BookMeta, BookRecord } from '@/types'
import {
  deleteBook,
  getBook,
  listBookMeta,
  saveBook,
} from '@/core/storage/books'
import { deleteAnnotationsForBook, listAnnotations, saveAnnotation } from '@/core/storage/annotations'

export type SortId = 'recent' | 'title' | 'author' | 'progress'

interface LibraryState {
  books: BookMeta[]
  loaded: boolean
  sort: SortId
  view: 'grid' | 'list'
  query: string
  init: () => Promise<void>
  refresh: () => Promise<void>
  remove: (id: string) => Promise<void>
  undoRemove: () => Promise<void>
  setSort: (sort: SortId) => void
  setView: (view: 'grid' | 'list') => void
  setQuery: (query: string) => void
}

let lastRemoved: { record: BookRecord; annotations: unknown[] } | null = null

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  books: [],
  loaded: false,
  sort: 'recent',
  view: 'grid',
  query: '',

  init: async () => {
    if (get().loaded) return
    await get().refresh()
  },

  refresh: async () => {
    const books = await listBookMeta()
    set({ books, loaded: true })
  },

  remove: async (id) => {
    const record = await getBook(id)
    if (!record) return
    const annotations = await listAnnotations(id)
    lastRemoved = { record, annotations }
    await deleteBook(id)
    await deleteAnnotationsForBook(id)
    set((s) => ({ books: s.books.filter((b) => b.id !== id) }))
  },

  undoRemove: async () => {
    const removed = lastRemoved
    if (!removed) return
    lastRemoved = null
    await saveBook(removed.record)
    await Promise.all(removed.annotations.map((a) => saveAnnotation(a as never)))
    await get().refresh()
  },

  setSort: (sort) => set({ sort }),
  setView: (view) => set({ view }),
  setQuery: (query) => set({ query }),
}))
