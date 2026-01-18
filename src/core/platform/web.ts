import type { PlatformAdapter } from './adapter'

export class WebAdapter implements PlatformAdapter {
  readonly kind = 'web' as const

  pickFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.epub,application/epub+zip'
      input.style.display = 'none'
      input.addEventListener('change', () => {
        resolve(input.files && input.files.length > 0 ? input.files[0] : null)
        input.remove()
      })
      // If the dialog is dismissed without a change event, resolve null after
      // a generous timeout (focus returning to the window with no file).
      const onFocus = () => {
        setTimeout(() => {
          if (document.body.contains(input) && (!input.files || input.files.length === 0)) {
            resolve(null)
            input.remove()
          }
          window.removeEventListener('focus', onFocus)
        }, 400)
      }
      window.addEventListener('focus', onFocus)
      document.body.appendChild(input)
      input.click()
    })
  }

  async setFullscreen(on: boolean): Promise<void> {
    try {
      if (on) {
        await document.documentElement.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // User gesture requirements or unsupported — fail quietly.
    }
  }

  isFullscreen(): boolean {
    return Boolean(document.fullscreenElement)
  }
}
