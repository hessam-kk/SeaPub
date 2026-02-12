import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/core/utils/cn'

export interface MenuItem {
  label: string
  icon?: ReactNode
  danger?: boolean
  checked?: boolean
  onSelect: () => void
}

export function Menu({
  trigger,
  items,
  align = 'end',
  ariaLabel,
}: {
  trigger: ReactElement
  items: MenuItem[]
  align?: 'start' | 'end'
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex">
      {isValidElement(trigger)
        ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
            onClick: () => setOpen((v) => !v),
            'aria-expanded': open,
            'aria-haspopup': 'menu',
          })
        : trigger}
      {open && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={cn(
            'absolute top-[calc(100%+4px)] z-40 min-w-44 rounded-[10px] border border-edge',
            'bg-surface py-1 shadow-elevated',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px]',
                'transition-colors hover:bg-surface-2',
                item.danger ? 'text-danger' : 'text-ink',
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.checked && <Check size={13} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
