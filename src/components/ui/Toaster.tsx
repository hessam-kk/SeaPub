import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/state/toastStore'
import { cn } from '@/core/utils/cn'

const icons = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <AlertCircle size={16} className="text-danger" />,
  info: <Info size={16} className="text-accent" />,
}

function ToastRow({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex max-w-96 items-center gap-2.5 rounded-xl border border-edge',
        'bg-surface px-4 py-2.5 text-[13px] text-ink shadow-elevated',
        'animate-[toast-in_220ms_ease-out]',
      )}
    >
      {icons[toast.kind]}
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.run()
            dismiss(toast.id)
          }}
          className="rounded px-1.5 py-0.5 font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {toast.action.label}
        </button>
      )}
      <button
        aria-label="Dismiss notification"
        onClick={() => dismiss(toast.id)}
        className="rounded p-1 text-ink-2 transition-colors hover:text-ink"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} />
      ))}
    </div>
  )
}
