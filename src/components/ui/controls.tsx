import type { ReactNode } from 'react'
import { Check, ChevronDown, RotateCcw, Search, X } from 'lucide-react'
import { cn } from '@/core/utils/cn'

/* ---------- SegmentedControl ---------- */

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  disabled,
  disabledHint,
}: {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex rounded-[10px] bg-surface-2 p-0.5 transition-opacity',
        disabled && 'pointer-events-none select-none opacity-40',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[8px] px-2.5 text-[12.5px] font-medium',
              'transition-[background-color,color,box-shadow] duration-150',
              active
                ? 'bg-surface text-ink shadow-soft'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
      {disabled && disabledHint && (
        <span className="sr-only">{disabledHint}</span>
      )}
    </div>
  )
}

/* ---------- SliderRow ---------- */

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  defaultValue,
  format,
  onChange,
  disabled,
  disabledHint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  defaultValue?: number
  format?: (v: number) => string
  onChange: (v: number) => void
  disabled?: boolean
  disabledHint?: string
}) {
  const dirty = defaultValue !== undefined && value !== defaultValue
  return (
    <div className={cn(disabled && 'pointer-events-none select-none opacity-40')}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] text-ink">{label}</span>
        <span className="flex items-center gap-1">
          {dirty && !disabled && (
            <button
              aria-label={`Reset ${label}`}
              onClick={() => onChange(defaultValue!)}
              className="rounded p-0.5 text-ink-2 transition-colors hover:text-accent"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <span className="min-w-10 text-right text-[12.5px] tabular-nums text-ink-2">
            {format ? format(value) : `${value}${unit}`}
          </span>
        </span>
      </div>
      <input
        type="range"
        className="sp-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        style={{
          '--sp-range-fill': `${((value - min) / (max - min)) * 100}%`,
        } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {disabled && disabledHint && (
        <p className="-mt-1 text-[11.5px] text-ink-2">{disabledHint}</p>
      )}
    </div>
  )
}

/* ---------- Toggle ---------- */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  disabledHint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-[10px] py-1 text-left transition-opacity',
        disabled && 'pointer-events-none select-none opacity-40',
      )}
    >
      <span>
        <span className="block text-[13px] text-ink">{label}</span>
        {description && <span className="block text-[12px] text-ink-2">{description}</span>}
        {disabled && disabledHint && (
          <span className="block text-[11.5px] text-ink-2">{disabledHint}</span>
        )}
      </span>
      <span
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-accent' : 'bg-[var(--sp-border-strong)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow-soft',
            'transition-transform duration-200',
            checked && 'translate-x-4',
          )}
        />
      </span>
    </button>
  )
}

/* ---------- ColorField ---------- */

export function ColorField({
  label,
  value,
  onChange,
  onAuto,
}: {
  label: string
  value: string | null
  onChange: (hex: string | null) => void
  onAuto?: () => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] text-ink">{label}</span>
        {value && onAuto && (
          <button
            onClick={() => onChange(null)}
            className="text-[12px] text-ink-2 underline-offset-2 transition-colors hover:text-accent hover:underline"
          >
            Auto
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label
          className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-[8px] border border-edge"
          style={{ background: value ?? 'transparent' }}
          aria-label={`${label} color picker`}
        >
          <input
            type="color"
            value={value ?? '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <input
          type="text"
          className="sp-input font-mono text-[12.5px]"
          placeholder="Auto"
          value={value ?? ''}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.trim()
            onChange(v === '' ? null : /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : v)
          }}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  )
}

/* ---------- SelectField ---------- */

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  disabledHint,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <div className={cn(disabled && 'pointer-events-none select-none opacity-40')}>
      <label className="mb-1 block text-[13px] text-ink" htmlFor={`select-${label}`}>
        {label}
      </label>
      <div className="relative">
        <select
          id={`select-${label}`}
          className="sp-input appearance-none pr-8"
          value={value}
          disabled={disabled}
          aria-disabled={disabled || undefined}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-2"
        />
      </div>
      {disabled && disabledHint && (
        <p className="mt-1 text-[11.5px] text-ink-2">{disabledHint}</p>
      )}
    </div>
  )
}

/* ---------- SearchField ---------- */

export function SearchField({
  value,
  onChange,
  placeholder,
  onEscape,
  autoFocus,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  onEscape?: () => void
  autoFocus?: boolean
  ariaLabel: string
}) {
  return (
    <div className="relative flex-1">
      <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-2" />
      <input
        className="sp-input pl-8.5"
        style={{ paddingLeft: 32 }}
        type="text"
        role="searchbox"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            if (value) onChange('')
            onEscape?.()
          }
          e.stopPropagation()
        }}
      />
      {value && (
        <button
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-2 hover:text-ink"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

/* ---------- Setting row (label + control stack) ---------- */

export function SettingRow({
  label,
  description,
  children,
  stacked,
}: {
  label?: string
  description?: string
  children: ReactNode
  stacked?: boolean
}) {
  return (
    <div className={cn(stacked ? 'block' : 'flex items-center justify-between gap-3')}>
      {label && (
        <div className="min-w-0">
          <div className="text-[13px] text-ink">{label}</div>
          {description && <div className="text-[12px] text-ink-2">{description}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-full border',
          checked ? 'border-accent bg-accent text-on-accent' : 'border-edge-strong',
        )}
      >
        {checked && <Check size={10} />}
      </span>
      {label}
    </span>
  )
}
