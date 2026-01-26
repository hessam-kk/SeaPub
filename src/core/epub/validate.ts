import JSZip from 'jszip'
import { EpubImportError } from '@/types'

export interface ValidatedEpub {
  buffer: ArrayBuffer
}

// Font-obfuscation algorithms are legitimate parts of the EPUB spec —
// anything else encrypted means DRM.
const ALLOWED_ENCRYPTION_ALGOS = new Set([
  'http://www.idpf.org/2008/embedding',
  'http://ns.adobe.com/pdf/enc#RC',
])

/**
 * Validate a candidate EPUB file. Throws EpubImportError with a friendly
 * code on failure; resolves with the file bytes on success.
 */
export async function validateEpub(file: File): Promise<ValidatedEpub> {
  const name = file.name.toLowerCase()
  const typeOk =
    name.endsWith('.epub') ||
    file.type === 'application/epub+zip' ||
    file.type === 'application/zip'
  if (!typeOk) {
    throw new EpubImportError('invalid', 'This file is not an EPUB book.')
  }

  let buffer: ArrayBuffer
  try {
    buffer = await file.arrayBuffer()
  } catch {
    throw new EpubImportError('unknown', 'SeaPub could not read this file.')
  }

  const bytes = new Uint8Array(buffer.slice(0, 4))
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new EpubImportError('invalid', 'This file is not an EPUB book.')
  }

  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new EpubImportError('corrupt', 'This book appears to be damaged.')
  }

  const container = zipFile(zip, 'META-INF/container.xml')
  if (!container) {
    throw new EpubImportError('invalid', 'This file is not an EPUB book.')
  }

  const encryption = zipFile(zip, 'META-INF/encryption.xml')
  if (encryption) {
    const doc = new DOMParser().parseFromString(await encryption.async('string'), 'application/xml')
    // Match by localName: encryption.xml commonly uses the enc: prefix, and
    // getElementsByTagName on XML documents matches qualified names only.
    const all = Array.from(doc.getElementsByTagName('*'))
    for (const el of all) {
      if (el.localName !== 'EncryptedData') continue
      const method = Array.from(el.getElementsByTagName('*')).find(
        (n) => n.localName === 'EncryptionMethod',
      )
      const algo = method?.getAttribute('Algorithm') ?? 'unknown'
      if (!ALLOWED_ENCRYPTION_ALGOS.has(algo)) {
        throw new EpubImportError(
          'drm',
          'This book is protected (DRM). SeaPub only opens DRM-free EPUBs.',
        )
      }
    }
  }

  return { buffer }
}

/** Case-insensitive zip entry lookup. */
export function zipFile(zip: JSZip, path: string): JSZip.JSZipObject | null {
  const direct = zip.file(path)
  if (direct) return direct
  const lower = path.toLowerCase()
  const match = Object.keys(zip.files).find((k) => k.toLowerCase() === lower)
  return match ? zip.file(match) : null
}
