import { useCallback, useState } from 'react'
import { importEpubFile } from '@/core/epub/import'
import { useLibraryStore } from '@/state/libraryStore'
import { toast } from '@/state/toastStore'
import type { BookRecord } from '@/types'
import { friendlyImportError } from './errors'

export function useImportBook() {
  const [importing, setImporting] = useState(false)
  const refresh = useLibraryStore((s) => s.refresh)

  const importFile = useCallback(
    async (file: File): Promise<BookRecord | null> => {
      setImporting(true)
      try {
        const record = await importEpubFile(file)
        await refresh()
        toast.success(`“${record.title}” added to your library.`)
        return record
      } catch (e) {
        toast.error(friendlyImportError(e))
        return null
      } finally {
        setImporting(false)
      }
    },
    [refresh],
  )

  return { importing, importFile }
}
