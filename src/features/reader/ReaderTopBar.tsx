import {
  Bookmark,
  ChevronLeft,
  List,
  Maximize2,
  Minimize2,
  Search,
  Settings2,
} from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import type { ResolvedReadingColors } from '@/core/theme/presets'
import { useReaderStore } from '@/state/readerStore'
import { cn } from '@/core/utils/cn'

export function ReaderTopBar({
  visible,
  title,
  section,
  colors,
  fullscreen,
  onBack,
  onToggleFullscreen,
}: {
  visible: boolean
  title: string
  section: string
  colors: ResolvedReadingColors
  fullscreen: boolean
  onBack: () => void
  onToggleFullscreen: () => void
}) {
  const toggleLeft = useReaderStore((s) => s.toggleLeft)
  const toggleSettings = useReaderStore((s) => s.toggleSettings)

  return (
    <div
      className={cn(
        'absolute inset-x-0 top-0 z-30 transition-all duration-300 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
      )}
      style={{ color: colors.text }}
    >
      <div
        className="flex h-14 items-center gap-1 px-3 backdrop-blur-md"
        style={{
          background: `color-mix(in srgb, ${colors.bg} 82%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${colors.text} 8%, transparent)`,
        }}
      >
        <IconButton label="Back to library" onClick={onBack} className="hover:bg-black/5">
          <ChevronLeft size={17} />
        </IconButton>

        <div className="min-w-0 flex-1 px-1 text-center">
          <div className="truncate text-[13.5px] font-medium" style={{ opacity: 0.9 }}>
            {title}
          </div>
          {section && (
            <div className="truncate text-[11.5px]" style={{ opacity: 0.55 }}>
              {section}
            </div>
          )}
        </div>

        <IconButton label="Search in book ( / )" onClick={() => toggleLeft('search')} className="hover:bg-black/5">
          <Search size={16} />
        </IconButton>
        <IconButton label="Bookmarks ( B )" onClick={() => toggleLeft('bookmarks')} className="hover:bg-black/5">
          <Bookmark size={16} />
        </IconButton>
        <IconButton label="Contents ( T )" onClick={() => toggleLeft('toc')} className="hover:bg-black/5">
          <List size={16} />
        </IconButton>
        <IconButton label="Fullscreen ( F )" onClick={onToggleFullscreen} className="hover:bg-black/5">
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </IconButton>
        <IconButton label="Reading settings ( S )" onClick={() => toggleSettings()} className="hover:bg-black/5">
          <Settings2 size={16} />
        </IconButton>
      </div>
    </div>
  )
}
