import { Loader2 } from 'lucide-react'
import { cn } from '@/core/utils/cn'

export function Kbd({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px]',
        'border border-edge bg-surface-2 px-1 font-ui text-[10.5px] font-medium text-ink-2',
      )}
    >
      {children}
    </kbd>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 size={18} className={cn('animate-spin text-accent', className)} />
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-[var(--sp-border-strong)]', className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function LoadingScreen({ label = 'Opening your book…' }: { label?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-reading">
      <Spinner />
      <p className="text-[13px] text-ink-2">{label}</p>
    </div>
  )
}
