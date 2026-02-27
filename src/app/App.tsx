import { useCallback } from 'react'
import { BookOpen } from 'lucide-react'
import { LibraryView } from '@/features/library/LibraryView'
import { ReaderView } from '@/features/reader/ReaderView'
import { useImportBook } from '@/features/library/useImportBook'
import { useGlobalDrop } from '@/features/library/useGlobalDrop'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { Toaster } from '@/components/ui/Toaster'
import { useHashRoute } from '@/hooks/useHashRoute'
import { toast } from '@/state/toastStore'
import { friendlyImportError } from '@/features/library/errors'

function DropOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(11,18,32,0.35)] backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-edge bg-surface px-10 py-8 text-center shadow-elevated">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <BookOpen size={22} />
        </span>
        <div>
          <div className="text-[15px] font-semibold text-ink">Drop an EPUB anywhere</div>
          <div className="mt-0.5 text-[12.5px] text-ink-2">Release to add it to your library</div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const route = useHashRoute()
  const { importFile } = useImportBook()

  const onFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const isEpub =
          file.name.toLowerCase().endsWith('.epub') || file.type === 'application/epub+zip'
        if (!isEpub) {
          toast.error(`“${file.name}” isn’t an EPUB book.`)
          continue
        }
        try {
          await importFile(file)
        } catch (e) {
          // importFile already reports friendly errors; this guards the guard.
          toast.error(friendlyImportError(e))
        }
      }
    },
    [importFile],
  )

  const dragging = useGlobalDrop(onFiles)

  return (
    <ThemeProvider>
      {route.view === 'library' ? <LibraryView /> : <ReaderView key={route.id} bookId={route.id} />}
      <Toaster />
      {dragging && <DropOverlay />}
    </ThemeProvider>
  )
}
