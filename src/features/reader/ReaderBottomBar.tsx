import { useMemo, useRef, useState } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import type { EpubRenderer } from '@/core/epub/renderer/types'
import type { ResolvedReadingColors } from '@/core/theme/presets'
import { cn } from '@/core/utils/cn'

export function ReaderBottomBar({
  visible,
  percent,
  colors,
  rendererRef,
}: {
  visible: boolean
  percent: number
  colors: ResolvedReadingColors
  rendererRef: React.RefObject<EpubRenderer | null>
}) {
  const [dragValue, setDragValue] = useState<number | null>(null)
  const sliderRef = useRef<HTMLInputElement>(null)

  const seek = useMemo(
    () =>
      debounceSeek((v: number) => {
        void rendererRef.current?.goToPercent(v)
      }, 140),
    [rendererRef],
  )

  const shown = dragValue ?? percent

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}
      style={{ color: colors.text }}
    >
      <div
        className="flex h-14 items-center gap-2 px-4 backdrop-blur-md"
        style={{
          background: `color-mix(in srgb, ${colors.bg} 82%, transparent)`,
          borderTop: `1px solid color-mix(in srgb, ${colors.text} 8%, transparent)`,
        }}
      >
        <IconButton
          label="Previous chapter"
          onClick={() => void rendererRef.current?.prevSection()}
          className="hover:bg-black/5"
        >
          <ChevronsLeft size={17} />
        </IconButton>

        <input
          ref={sliderRef}
          type="range"
          className="sp-range flex-1"
          min={0}
          max={100}
          step={0.5}
          value={shown}
          aria-label="Reading progress"
          style={{ '--sp-range-fill': `${shown}%` } as React.CSSProperties}
          onChange={(e) => {
            const v = Number(e.target.value)
            setDragValue(v)
            seek(v)
          }}
          onPointerUp={() => setDragValue(null)}
          onKeyUp={() => setDragValue(null)}
          onBlur={() => setDragValue(null)}
        />

        <span className="w-12 text-center text-[12px] tabular-nums" style={{ opacity: 0.7 }}>
          {Math.round(shown)}%
        </span>

        <IconButton
          label="Next chapter"
          onClick={() => void rendererRef.current?.nextSection()}
          className="hover:bg-black/5"
        >
          <ChevronsRight size={17} />
        </IconButton>
      </div>
    </div>
  )
}

function debounceSeek(fn: (v: number) => void, ms: number): (v: number) => void {
  let t: ReturnType<typeof setTimeout> | undefined
  return (v: number) => {
    clearTimeout(t)
    t = setTimeout(() => fn(v), ms)
  }
}
