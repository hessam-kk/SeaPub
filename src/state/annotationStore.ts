import { create } from 'zustand'
import type { Annotation, AnnotationKind } from '@/types'
import {
  deleteAnnotation,
  listAnnotations,
  saveAnnotation,
} from '@/core/storage/annotations'
import { uid } from '@/core/utils/misc'

interface AnnotationState {
  bookId: string | null
  annotations: Annotation[]
  load: (bookId: string) => Promise<void>
  add: (
    input: Pick<Annotation, 'kind' | 'cfi' | 'excerpt'> &
      Partial<Pick<Annotation, 'section' | 'note' | 'color'>>,
  ) => Promise<Annotation | null>
  remove: (id: string) => Promise<void>
}

const DEFAULT_HIGHLIGHT_COLOR = '#FFE9A8'

export const useAnnotationStore = create<AnnotationState>()((set, get) => ({
  bookId: null,
  annotations: [],

  load: async (bookId) => {
    const annotations = await listAnnotations(bookId)
    set({ bookId, annotations })
  },

  add: async (input) => {
    const bookId = get().bookId
    if (!bookId) return null
    const annotation: Annotation = {
      id: uid(),
      bookId,
      kind: input.kind,
      cfi: input.cfi,
      section: input.section ?? '',
      excerpt: input.excerpt,
      note: input.note ?? '',
      color: input.color ?? DEFAULT_HIGHLIGHT_COLOR,
      createdAt: Date.now(),
    }
    await saveAnnotation(annotation)
    set((s) => ({ annotations: [...s.annotations, annotation] }))
    return annotation
  },

  remove: async (id) => {
    await deleteAnnotation(id)
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) }))
  },
}))

export function annotationsOfKind(
  annotations: Annotation[],
  kind: AnnotationKind,
): Annotation[] {
  return annotations.filter((a) => a.kind === kind)
}
