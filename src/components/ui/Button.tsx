import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/core/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover shadow-soft disabled:hover:bg-accent',
  secondary:
    'bg-surface text-ink border border-edge hover:border-edge-strong hover:bg-surface-2 shadow-soft',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'text-danger hover:bg-danger-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-[38px] px-4 text-[13.5px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-[10px] font-medium',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})
