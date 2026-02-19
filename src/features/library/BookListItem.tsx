import { BookOpen, MoreVertical, Play, Trash2 } from 'lucide-react'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { navigate } from '@/hooks/useHashRoute'
import { Menu } from '@/components/ui/Menu'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/misc'
import { useLibraryStore } from '@/state/libraryStore'
import { toast } from '@/state/toastStore'
import { updateBookMeta } from '@/core/storage/books'
import { formatDate } from '@/core/utils/misc'
import type { BookMeta } from '@/types'

export function BookListItem({ book }: { book: BookMeta }) {
  const url = useBlobUrl(book.cover)
  const remove = useLibraryStore((s) => s.remove)
  const undoRemove = useLibraryStore((s) => s.undoRemove)
  const percent = Math.round(book.progress.percent)
  const started = percent > 0 && percent < 98

  const open = () => {
    void updateBookMeta(book.id, { lastOpenedAt: Date.now() })
    navigate(`#/book/${book.id}`)
  }

  const removeWithUndo = () => {
    void remove(book.id).then(() => {
      toast.info(`Removed “${book.title}”.`, {
        label: 'Undo',
        run: () => void undoRemove(),
      })
    })
  }

  return (
    <div className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface">
      <button
        onClick={open}
        aria-label={`Read ${book.title}`}
        className="h-[60px] w-[42px] shrink-0 overflow-hidden rounded-md bg-surface-2 shadow-soft"
      >
        {url ? (
          <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span className="font-reading flex h-full w-full items-center justify-center text-[11px] text-ink-2">
            {book.title.slice(0, 12)}
          </span>
        )}
      </button>

      <button onClick={open} className="min-w-0 flex-1 text-left">
        <div className="truncate text-[13.5px] font-medium text-ink">{book.title}</div>
        <div className="truncate text-[12px] text-ink-2">{book.author}</div>
      </button>

      <div className="hidden w-28 md:block">
        <ProgressBar value={percent} />
      </div>
      <div className="w-10 text-right text-[12px] tabular-nums text-ink-2">
        {percent > 0 ? `${percent}%` : 'New'}
      </div>
      <div className="hidden w-24 text-right text-[12px] text-ink-2 lg:block">
        {formatDate(book.lastOpenedAt)}
      </div>

      {started && (
        <Button size="sm" variant="secondary" onClick={open} className="shrink-0">
          <Play size={12} />
          Continue
        </Button>
      )}

      <Menu
        ariaLabel={`Actions for ${book.title}`}
        trigger={
          <IconButton label={`Actions for ${book.title}`}>
            <MoreVertical size={15} />
          </IconButton>
        }
        items={[
          { label: 'Open book', icon: <BookOpen size={14} />, onSelect: open },
          {
            label: 'Remove from library',
            icon: <Trash2 size={14} />,
            danger: true,
            onSelect: removeWithUndo,
          },
        ]}
      />
    </div>
  )
}
