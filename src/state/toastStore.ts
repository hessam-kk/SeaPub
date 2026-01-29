import { create } from 'zustand'
import { uid } from '@/core/utils/misc'

export type ToastKind = 'info' | 'success' | 'error'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
  action?: { label: string; run: () => void }
}

interface ToastState {
  toasts: Toast[]
  push: (kind: ToastKind, message: string, action?: Toast['action']) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (kind, message, action) => {
    const toast: Toast = { id: uid(), kind, message, action }
    set((s) => ({ toasts: [...s.toasts.slice(-2), toast] }))
    const ttl = action ? 6000 : 3800
    setTimeout(() => get().dismiss(toast.id), ttl)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  info: (message: string, action?: Toast['action']) => useToastStore.getState().push('info', message, action),
  success: (message: string, action?: Toast['action']) => useToastStore.getState().push('success', message, action),
  error: (message: string) => useToastStore.getState().push('error', message),
}
