import { useEffect } from 'react'
import { useReaderStore } from '@/state/readerStore'

const IDLE_MS = 2500

/** Chrome hides after a short idle; any movement or keypress brings it back. */
export function useAutoHideChrome(enabled: boolean, blocked: boolean): boolean {
  const chromeVisible = useReaderStore((s) => s.chromeVisible)

  useEffect(() => {
    let timer: number | undefined

    const arm = () => {
      window.clearTimeout(timer)
      if (!enabled || blocked) {
        useReaderStore.getState().showChrome()
        return
      }
      timer = window.setTimeout(() => useReaderStore.getState().hideChrome(), IDLE_MS)
    }
    const onActivity = () => {
      // A margin drag is in progress — don't pop the chrome over the handle.
      if (useReaderStore.getState().marginDragging) return
      useReaderStore.getState().showChrome()
      arm()
    }

    arm()
    window.addEventListener('mousemove', onActivity)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('mousedown', onActivity)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('mousedown', onActivity)
    }
  }, [enabled, blocked])

  return chromeVisible
}
