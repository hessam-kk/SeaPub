import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/core/utils/cn'

export function Tooltip({
  label,
  children,
  side = 'bottom',
}: {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
}) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap',
          'rounded-md border border-edge bg-surface px-2 py-1 text-[11.5px] text-ink',
          'shadow-soft opacity-0 transition-opacity duration-150',
          'group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
        )}
      >
        {label}
      </span>
    </span>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  side?: 'top' | 'bottom'
  children: ReactNode
}

/** Icon-only button — requires a visible tooltip + accessible label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, side = 'bottom', children, className, type, ...props },
  ref,
) {
  return (
    <Tooltip label={label} side={side}>
      <button
        ref={ref}
        type={type ?? 'button'}
        aria-label={label}
        className={cn(
          'inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px]',
          'text-ink-2 transition-[background-color,color,transform] duration-150',
          'hover:bg-surface-2 hover:text-ink active:scale-[0.96]',
          'disabled:pointer-events-none disabled:opacity-40',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  )
})
