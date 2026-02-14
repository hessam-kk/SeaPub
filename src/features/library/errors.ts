import { EpubImportError } from '@/types'

export function friendlyImportError(e: unknown): string {
  if (e instanceof EpubImportError) {
    switch (e.code) {
      case 'invalid':
        return 'That file doesn’t look like an EPUB. Please choose a .epub book.'
      case 'drm':
        return 'This book is protected by DRM, so SeaPub can’t open it. DRM-free EPUBs work beautifully.'
      case 'corrupt':
        return 'This book appears to be damaged and couldn’t be opened.'
      case 'unknown':
        return 'Something interrupted the import. Please try again.'
    }
  }
  const name = (e as { name?: string })?.name ?? ''
  if (name === 'QuotaExceededError' || name === 'DOMException') {
    return 'There isn’t enough storage space for this book. Try freeing up some space.'
  }
  return 'Something went wrong while adding this book. Please try again.'
}
