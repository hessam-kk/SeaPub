import { ArrowUpDown, BookPlus, LayoutGrid, List, Loader2, Settings2 } from 'lucide-react'
import { Logo, Wordmark } from '@/components/ui/brand'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Menu } from '@/components/ui/Menu'
import { SearchField } from '@/components/ui/controls'
import { useLibraryStore, type SortId } from '@/state/libraryStore'

const SORTS: { value: SortId; label: string }[] = [
  { value: 'recent', label: 'Recently opened' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'progress', label: 'Reading progress' },
]

export function LibraryHeader({
  importing,
  onOpenPicker,
  onOpenSettings,
}: {
  importing: boolean
  onOpenPicker: () => void
  onOpenSettings: () => void
}) {
  const view = useLibraryStore((s) => s.view)
  const setView = useLibraryStore((s) => s.setView)
  const sort = useLibraryStore((s) => s.sort)
  const setSort = useLibraryStore((s) => s.setSort)
  const query = useLibraryStore((s) => s.query)
  const setQuery = useLibraryStore((s) => s.setQuery)

  return (
    <header className="z-20 shrink-0 border-b border-edge bg-app/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <Wordmark />
        </div>

        <div className="ml-auto flex w-full items-center justify-end gap-2">
          <div className="w-full max-w-[240px]">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search title or author"
              ariaLabel="Search your library"
            />
          </div>

          <Menu
            ariaLabel="Sort books"
            trigger={
              <IconButton label="Sort books">
                <ArrowUpDown size={16} />
              </IconButton>
            }
            items={SORTS.map((s) => ({
              label: s.label,
              onSelect: () => setSort(s.value),
              checked: s.value === sort,
            }))}
          />

          <div role="radiogroup" aria-label="Library view" className="flex rounded-[10px] bg-surface-2 p-0.5">
            <button
              role="radio"
              aria-checked={view === 'grid'}
              aria-label="Grid view"
              onClick={() => setView('grid')}
              className={
                'flex h-7 w-8 items-center justify-center rounded-[8px] transition-all duration-150 ' +
                (view === 'grid' ? 'bg-surface text-ink shadow-soft' : 'text-ink-2 hover:text-ink')
              }
            >
              <LayoutGrid size={14} />
            </button>
            <button
              role="radio"
              aria-checked={view === 'list'}
              aria-label="List view"
              onClick={() => setView('list')}
              className={
                'flex h-7 w-8 items-center justify-center rounded-[8px] transition-all duration-150 ' +
                (view === 'list' ? 'bg-surface text-ink shadow-soft' : 'text-ink-2 hover:text-ink')
              }
            >
              <List size={14} />
            </button>
          </div>

          <Button variant="primary" onClick={onOpenPicker} disabled={importing}>
            {importing ? <Loader2 size={15} className="animate-spin" /> : <BookPlus size={15} />}
            Open Book
          </Button>

          <IconButton label="Reading settings" onClick={onOpenSettings}>
            <Settings2 size={16} />
          </IconButton>
        </div>
      </div>
    </header>
  )
}
