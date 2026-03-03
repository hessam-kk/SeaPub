import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { validateEpub } from './validate'
import { EpubImportError } from '@/types'

const CONTAINER = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`

const OPF = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test Book</dc:title>
    <dc:creator>Test Author</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/></manifest>
  <spine><itemref idref="c1"/></spine>
</package>`

async function makeEpubFile(extra: Record<string, string> = {}): Promise<File> {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip')
  zip.file('META-INF/container.xml', CONTAINER)
  zip.file('OEBPS/content.opf', OPF)
  zip.file('OEBPS/c1.xhtml', '<html><body><p>Hello</p></body></html>')
  for (const [path, content] of Object.entries(extra)) {
    zip.file(path, content)
  }
  const buffer = await zip.generateAsync({ type: 'arraybuffer' })
  return new File([buffer], 'test.epub', { type: 'application/epub+zip' })
}

function expectCode(fn: () => Promise<unknown>, code: string): Promise<void> {
  return fn().then(
    () => {
      throw new Error(`expected EpubImportError with code ${code}`)
    },
    (e) => {
      expect(e).toBeInstanceOf(EpubImportError)
      expect((e as EpubImportError).code).toBe(code)
    },
  )
}

describe('validateEpub', () => {
  it('accepts a well-formed DRM-free EPUB', async () => {
    const file = await makeEpubFile()
    const { buffer } = await validateEpub(file)
    expect(buffer.byteLength).toBeGreaterThan(0)
  })

  it('rejects non-EPUB files', async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'notes.txt', { type: 'text/plain' })
    await expectCode(() => validateEpub(file), 'invalid')
  })

  it('rejects zip files without EPUB structure', async () => {
    const zip = new JSZip()
    zip.file('hello.txt', 'hi')
    const buffer = await zip.generateAsync({ type: 'arraybuffer' })
    const file = new File([buffer], 'not-a-book.epub', { type: 'application/epub+zip' })
    await expectCode(() => validateEpub(file), 'invalid')
  })

  it('rejects corrupted archives', async () => {
    const file = await makeEpubFile()
    const buffer = await file.arrayBuffer()
    const broken = new Uint8Array(buffer.slice(0, Math.floor(buffer.byteLength / 2)))
    const brokenFile = new File([broken], 'broken.epub', { type: 'application/epub+zip' })
    await expectCode(() => validateEpub(brokenFile), 'corrupt')
  })

  it('rejects DRM-protected EPUBs with a friendly code', async () => {
    const file = await makeEpubFile({
      'META-INF/encryption.xml': `<?xml version="1.0"?>
<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#">
  <enc:EncryptedData>
    <enc:EncryptionMethod Algorithm="http://www.adobe.com/2005/adele"/>
  </enc:EncryptedData>
</encryption>`,
    })
    await expectCode(() => validateEpub(file), 'drm')
  })

  it('allows font-obfuscation encryption (not DRM)', async () => {
    const file = await makeEpubFile({
      'META-INF/encryption.xml': `<?xml version="1.0"?>
<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#">
  <enc:EncryptedData>
    <enc:EncryptionMethod Algorithm="http://www.idpf.org/2008/embedding"/>
  </enc:EncryptedData>
</encryption>`,
    })
    await expect(validateEpub(file)).resolves.toBeDefined()
  })
})
