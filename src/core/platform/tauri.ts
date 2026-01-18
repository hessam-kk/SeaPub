import type { PlatformAdapter } from './adapter'

/** Desktop adapter. Dynamically imported so the web bundle never pulls Tauri. */
export class TauriAdapter implements PlatformAdapter {
  readonly kind = 'tauri' as const

  async pickFile(): Promise<File | null> {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readFile } = await import('@tauri-apps/plugin-fs')
    const path = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'EPUB book', extensions: ['epub'] }],
    })
    if (!path || typeof path !== 'string') return null
    const data = await readFile(path)
    const name = path.split(/[\\/]/).pop() ?? 'book.epub'
    return new File([new Uint8Array(data)], name, { type: 'application/epub+zip' })
  }

  async setFullscreen(on: boolean): Promise<void> {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().setFullscreen(on)
  }

  isFullscreen(): boolean {
    // Synchronous best-effort; the window API is async. Fullscreen state is
    // also toggled via setFullscreen so stale reads self-correct on toggle.
    return false
  }
}
