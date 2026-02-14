import { BookOpen, MoreVertical, Trash2 } from 'lucide-react'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { navigate } from '@/hooks/useHashRoute'
import { Menu } from '@/components/ui/Menu'
import { IconButton } from '@/components/ui/IconButton'
import { ProgressBar } from '@/components/ui/misc'
import { useLibraryStore } from '@/state/libraryStore'
import { toast } from '@/state/toastStore'
import { updateBookMeta } from '@/core/storage/books'
import { formatDate } from '@/core/utils/misc'
import type { BookMeta } from '@/types'

export function BookCard({ book }: { book: BookMeta }) {
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
    <div className="group relative">
      <button
        onClick={open}
        aria-label={started ? `Continue reading ${book.title}` : `Read ${book.title}`}
        className="block w-full rounded-lg text-left"
      >
        <div
          className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-2 shadow-soft transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-elevated"
        >
          {url ? (
            <img
              src={url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent-soft via-surface-2 to-surface p-3">
              <span className="font-reading line-clamp-4 text-center text-[13px] leading-snug text-ink-2">
                {book.title}
              </span>
            </div>
          )}
          {percent > 0 && (
            <div className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5">
              <ProgressBar value={percent} className="h-[3px]" />
            </div>
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-center group-hover:flex">
            <span className="rounded-full bg-[rgba(11,18,32,0.55)] px-3 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">
              {started ? 'Continue reading' : 'Start reading'}
            </span>
          </span>
        </div>
        <div className="mt-2 px-0.5">
          <div className="line-clamp-2 text-[13px] leading-snug font-medium text-ink">
            {book.title}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-ink-2">{book.author}</div>
          <div className="mt-1 text-[11.5px] text-ink-2">
            {percent > 0 ? `${percent}% · ` : ''}
            {formatDate(book.lastOpenedAt)}
          </div>
        </div>
      </button>

      <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
        <Menu
          ariaLabel={`Actions for ${book.title}`}
          trigger={
            <IconButton
              label={`Actions for ${book.title}`}
              className="border border-edge bg-surface/90 shadow-soft backdrop-blur-sm"
            >
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
    </div>
  )
}
