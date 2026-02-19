import { useEffect, useMemo, useState } from 'react'
import { BookCard } from './BookCard'
import { BookListItem } from './BookListItem'
import { LibraryEmptyState } from './LibraryEmptyState'
import { LibraryHeader } from './LibraryHeader'
import { useImportBook } from './useImportBook'
import { useOpenBookPicker } from './useOpenBookPicker'
import { useLibraryStore } from '@/state/libraryStore'
import { Spinner } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { SettingsDrawer } from '@/features/settings/SettingsDrawer'
import { useGlobalSettingsUpdate } from '@/features/settings/useSettingsUpdate'
import { useSettingsStore } from '@/state/settingsStore'
import { matchesQuery } from '@/core/utils/misc'

export function LibraryView() {
  const books = useLibraryStore((s) => s.books)
  const loaded = useLibraryStore((s) => s.loaded)
  const refresh = useLibraryStore((s) => s.refresh)
  const sort = useLibraryStore((s) => s.sort)
  const view = useLibraryStore((s) => s.view)
  const query = useLibraryStore((s) => s.query)
  const setQuery = useLibraryStore((s) => s.setQuery)

  const { importing, importFile } = useImportBook()
  const openPicker = useOpenBookPicker(importFile)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Refresh on every mount so progress badges update after reading.
  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const list = books.filter(
      (b) => matchesQuery(b.title, query) || matchesQuery(b.author, query),
    )
    const sorted = [...list]
    switch (sort) {
      case 'recent':
        sorted.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'author':
        sorted.sort((a, b) => a.author.localeCompare(b.author))
        break
      case 'progress':
        sorted.sort((a, b) => b.progress.percent - a.progress.percent)
        break
    }
    return sorted
  }, [books, sort, query])

  const globalSettings = useSettingsStore()
  const globalUpdate = useGlobalSettingsUpdate()
  return (
    <div className="flex h-full flex-col">
      <LibraryHeader
        importing={importing}
        onOpenPicker={() => void openPicker()}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="sp-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-7">
          {!loaded ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : books.length === 0 ? (
            <LibraryEmptyState onOpenPicker={() => void openPicker()} />
          ) : filtered.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <p className="text-[14px] text-ink">No books match “{query}”.</p>
              <Button variant="ghost" size="sm" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((b) => (
                <BookListItem key={b.id} book={b} />
              ))}
            </div>
          )}
        </div>
      </main>

      <SettingsDrawer
        scope="global"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={globalSettings}
        update={globalUpdate}
        onResetGlobal={() => globalSettings.resetAll()}
      />
    </div>
  )
}
