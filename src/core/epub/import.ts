import type { BookRecord, EpubImportError as EpubImportErrorT } from '@/types'
import { EpubImportError } from '@/types'
import { validateEpub } from './validate'
import { makeCoverThumb, parseEpubMetadata } from './metadata'
import { saveBook } from '@/core/storage/books'
import { uid } from '@/core/utils/misc'

/**
 * Import a local EPUB file: validate, extract metadata + cover, persist.
 * Throws EpubImportError with a user-friendly code; the UI maps codes to copy.
 */
export async function importEpubFile(file: File): Promise<BookRecord> {
  const { buffer } = await validateEpub(file)
  const meta = await parseEpubMetadata(buffer)
  const cover = meta.cover ? await makeCoverThumb(meta.cover) : null

  const record: BookRecord = {
    id: uid(),
    title: meta.title,
    author: meta.author,
    description: meta.description,
    language: meta.language,
    publisher: meta.publisher,
    cover,
    addedAt: Date.now(),
    lastOpenedAt: Date.now(),
    fileSize: file.size,
    progress: { cfi: '', percent: 0, section: '', sectionIndex: 0 },
    themeOverride: null,
    blob: buffer,
  }
  await saveBook(record)
  return record
}

export { EpubImportError }
export type { EpubImportErrorT }
