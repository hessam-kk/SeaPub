import { BOOKS, idbDel, idbEntries, idbGet, idbSet } from './db'
import type { BookMeta, BookRecord } from '@/types'

export async function saveBook(record: BookRecord): Promise<void> {
  await idbSet(BOOKS, record.id, record)
}

export async function getBook(id: string): Promise<BookRecord | null> {
  const rec = await idbGet<BookRecord>(BOOKS, id)
  return rec ?? null
}

/** Library listing — metadata only, never the EPUB payload. */
export async function listBookMeta(): Promise<BookMeta[]> {
  const all = await idbEntries<BookRecord>(BOOKS)
  return all.map(([, rec]) => stripBlob(rec))
}

export function stripBlob(rec: BookRecord): BookMeta {
  const { blob: _blob, ...meta } = rec
  return meta
}

export async function updateBookMeta(id: string, patch: Partial<BookMeta>): Promise<void> {
  const rec = await getBook(id)
  if (!rec) return
  await idbSet(BOOKS, id, { ...rec, ...patch })
}

export async function deleteBook(id: string): Promise<void> {
  await idbDel(BOOKS, id)
}
