import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/core/utils/cn'
import { IconButton } from './IconButton'

export function Drawer({
  side,
  open,
  onClose,
  title,
  children,
  width = 360,
}: {
  side: 'left' | 'right'
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}) {
  return (
    <div className={cn('fixed inset-0 z-40', !open && 'pointer-events-none')} aria-hidden={!open}>
      <div
        className={cn(
          'absolute inset-0 bg-[rgba(11,18,32,0.32)] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label={title}
        style={{ width }}
        className={cn(
          'absolute top-0 bottom-0 flex flex-col bg-surface shadow-elevated',
          'transition-transform duration-300 ease-out',
          side === 'right' ? 'right-0 rounded-l-2xl' : 'left-0 rounded-r-2xl',
          open
            ? 'translate-x-0'
            : side === 'right'
              ? 'translate-x-full'
              : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <IconButton label="Close panel" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
        <div className="sp-scroll flex-1 overflow-y-auto px-4 pb-6">{children}</div>
      </div>
    </div>
  )
}
