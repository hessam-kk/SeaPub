import { useCallback } from 'react'
import { usePlatform } from '@/hooks/usePlatform'
import type { BookRecord } from '@/types'

export function useOpenBookPicker(
  importFile: (file: File) => Promise<BookRecord | null>,
): () => Promise<void> {
  const platform = usePlatform()
  return useCallback(async () => {
    if (!platform) return
    const file = await platform.pickFile()
    if (file) await importFile(file)
  }, [platform, importFile])
}
