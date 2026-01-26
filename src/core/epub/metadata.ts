import JSZip from 'jszip'
import DOMPurify from 'dompurify'
import { zipFile } from './validate'

export interface ParsedEpubMeta {
  title: string
  author: string
  description: string
  language: string
  publisher: string
  cover: Blob | null
}

function textOf(parent: Element | Document, tag: string): string {
  const el = parent.getElementsByTagName(tag)[0]
  return (el?.textContent ?? '').trim()
}

/** Parse OPF metadata + extract a (thumbnail-sized) cover. */
export async function parseEpubMetadata(buffer: ArrayBuffer): Promise<ParsedEpubMeta> {
  const zip = await JSZip.loadAsync(buffer)

  let title = 'Untitled book'
  let author = 'Unknown author'
  let description = ''
  let language = ''
  let publisher = ''
  let cover: Blob | null = null

  try {
    const containerEntry = zipFile(zip, 'META-INF/container.xml')
    const containerXml = await containerEntry?.async('string')
    if (containerXml) {
      const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml')
      const opfPath =
        containerDoc.getElementsByTagName('rootfile')[0]?.getAttribute('full-path') ?? ''
      const opfEntry = opfPath ? zipFile(zip, opfPath) : null
      const opfXml = await opfEntry?.async('string')
      if (opfXml) {
        const opf = new DOMParser().parseFromString(opfXml, 'application/xml')
        title = textOf(opf, 'dc:title') || title
        author = textOf(opf, 'dc:creator') || author
        language = textOf(opf, 'dc:language')
        publisher = textOf(opf, 'dc:publisher')
        const rawDescription = textOf(opf, 'dc:description')
        description = cleanDescription(rawDescription)

        cover = await extractCover(zip, opf, opfPath)
      }
    }
  } catch {
    // Metadata is best-effort; a missing title/cover is fine.
  }

  return { title, author, description, language, publisher, cover }
}

function cleanDescription(raw: string): string {
  if (!raw) return ''
  const sanitized = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  return sanitized.replace(/\s+/g, ' ').trim()
}

async function extractCover(
  zip: JSZip,
  opf: Document,
  opfPath: string,
): Promise<Blob | null> {
  try {
    let itemId: string | null = null

    // Preferred: manifest item with properties~="cover-image".
    const items = Array.from(opf.getElementsByTagName('item'))
    const propsItem = items.find((i) =>
      (i.getAttribute('properties') ?? '').split(/\s+/).includes('cover-image'),
    )
    if (propsItem) itemId = propsItem.getAttribute('id')

    // Fallback: <meta name="cover" content="item-id">.
    if (!itemId) {
      const metas = Array.from(opf.getElementsByTagName('meta'))
      const coverMeta = metas.find((m) => m.getAttribute('name') === 'cover')
      itemId = coverMeta?.getAttribute('content') ?? null
    }

    // Last resort: any manifest item whose id/href mentions "cover".
    if (!itemId) {
      const guess = items.find(
        (i) =>
          /cover/i.test(i.getAttribute('id') ?? '') &&
          /^image\//.test(i.getAttribute('media-type') ?? ''),
      )
      itemId = guess?.getAttribute('id') ?? null
    }

    if (!itemId) return null

    const item = items.find((i) => i.getAttribute('id') === itemId)
    const href = item?.getAttribute('href')
    const mediaType = item?.getAttribute('media-type') ?? 'image/jpeg'
    if (!href) return null

    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
    const entry = zipFile(zip, opfDir + href)
    if (!entry) return null

    const blob = await entry.async('blob')
    return new Blob([blob], { type: mediaType })
  } catch {
    return null
  }
}

/** Resize a cover image to a manageable thumbnail for library performance. */
export async function makeCoverThumb(cover: Blob, max = 600): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(cover)
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85),
    )
  } catch {
    return null
  }
}
