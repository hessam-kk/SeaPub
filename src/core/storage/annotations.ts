import { ANNOTATIONS, idbDel, idbEntries, idbGet, idbSet } from './db'
import type { Annotation } from '@/types'

export async function listAnnotations(bookId: string): Promise<Annotation[]> {
  const all = await idbEntries<Annotation>(ANNOTATIONS)
  return all
    .map(([, a]) => a)
    .filter((a) => a.bookId === bookId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export async function saveAnnotation(a: Annotation): Promise<void> {
  await idbSet(ANNOTATIONS, a.id, a)
}

export async function deleteAnnotation(id: string): Promise<void> {
  await idbDel(ANNOTATIONS, id)
}

export async function deleteAnnotationsForBook(bookId: string): Promise<void> {
  const all = await idbEntries<Annotation>(ANNOTATIONS)
  await Promise.all(
    all.filter(([, a]) => a.bookId === bookId).map(([id]) => idbDel(ANNOTATIONS, id)),
  )
}

export async function getAnnotation(id: string): Promise<Annotation | null> {
  return (await idbGet<Annotation>(ANNOTATIONS, id)) ?? null
}
