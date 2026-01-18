/**
 * Platform abstraction — the only seam where desktop (Tauri) and web
 * differ. Feature code must use this, never Tauri APIs directly.
 */
export interface PlatformAdapter {
  readonly kind: 'web' | 'tauri'
  /** Native file dialog (desktop) or <input type="file"> (web). */
  pickFile(): Promise<File | null>
  /** Enter/leave window fullscreen. */
  setFullscreen(on: boolean): Promise<void>
  isFullscreen(): boolean
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

let adapterPromise: Promise<PlatformAdapter> | null = null

export function getPlatform(): Promise<PlatformAdapter> {
  if (!adapterPromise) {
    adapterPromise = (async () => {
      if (isTauriRuntime()) {
        const { TauriAdapter } = await import('./tauri')
        return new TauriAdapter()
      }
      const { WebAdapter } = await import('./web')
      return new WebAdapter()
    })()
  }
  return adapterPromise
}
