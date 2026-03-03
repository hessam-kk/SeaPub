/**
 * Generates public/demo/a-voyage-by-the-sea.epub — a small, valid,
 * DRM-free EPUB used for manual testing and demos. Run: node scripts/make-demo-epub.mjs
 */
import JSZip from 'jszip'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = path.join(root, 'public', 'demo')
mkdirSync(outDir, { recursive: true })

const paragraph = (text) => `<p>${text}</p>`

const lorem = [
  'The harbour woke slowly that morning, gulls trading insults above the masts while the tide slid gray-green beneath the pilings. Mira counted the boats from the seawall out of habit, though she could have named each one blind.',
  'There is a particular quality of light that belongs only to the hour after sunrise on open water — thin, honest, and slightly cold. It shows you the sea exactly as it is, without the flattering haze of afternoon or the drama of dusk.',
  'She had brought a book, as she always did, wrapped in oilcloth against the spray. Reading on the water was a ceremony: first the page, then the horizon, then the page again, each glance outward resetting the eye like a metronome.',
  'The lighthouse keeper, when they had still kept lighthouses, was said to read one paragraph of a novel each night and no more — rationing the story the way he rationed lamp oil. Some people called it madness. Mira called it wisdom with a wick.',
  'Words, like waves, arrive in sets. Every seventh sentence seems to carry more weight than it strictly earned, and every paragraph recedes before you are quite done with it, leaving only the taste of salt and syntax.',
  'By noon the wind had steadied from the southwest, and the little sloop leaned into it with the pleased, obedient air of an animal that knows its work. Mira trimmed the sail one hand-width and let the world tilt.',
  'Chapter by chapter, the coast fell behind them. The map said there was a bay past the point where the water turned to hammered pewter, and the map had not lied to her yet — though charts, like promises, are best checked against the sky.',
  'In the evening she anchored in the lee of the point and read until the letters swam. The stars came out the way they only do at sea: all at once, and much too close, as if the whole catalogue had been waiting just offshore.',
]

const chapter = (n, title, seed) => `
<section epub:type="chapter">
  <h1 id="ch${n}">${title}</h1>
  ${Array.from({ length: 8 }, (_, i) => paragraph(lorem[(seed + i) % lorem.length])).join('\n  ')}
  ${n === 1 ? '<p>A word you might wonder about<sup><a id="ref1" href="#note1">1</a></sup> appears here, quietly footnoted.</p>' : ''}
  ${Array.from({ length: 4 }, (_, i) => paragraph(lorem[(seed + i + 3) % lorem.length])).join('\n  ')}
</section>`

const notes = `
<section epub:type="endnotes">
  <h1>Notes</h1>
  <p><a id="note1" href="#ref1">1.</a> The word was “sea-room”: enough water under the keel to sail without fear.</p>
</section>`

const zip = new JSZip()
zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
zip.file(
  'META-INF/container.xml',
  `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
)

zip.file(
  'OEBPS/content.opf',
  `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:seapub-demo-0001</dc:identifier>
    <dc:title>A Voyage by the Sea</dc:title>
    <dc:creator>M. Halloway</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>Harbourlight Press</dc:publisher>
    <dc:description>Short chapters on tides, tide-rooms, and the habit of reading with the horizon in the corner of your eye.</dc:description>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="cover-image" href="cover.svg" media-type="image/svg+xml" properties="cover-image"/>
    <item id="c1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
    <item id="c2" href="ch2.xhtml" media-type="application/xhtml+xml"/>
    <item id="c3" href="ch3.xhtml" media-type="application/xhtml+xml"/>
    <item id="c4" href="notes.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="c1"/><itemref idref="c2"/><itemref idref="c3"/><itemref idref="c4"/>
  </spine>
</package>`,
)

zip.file(
  'OEBPS/nav.xhtml',
  `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body>
  <nav epub:type="toc" id="toc"><h1>Contents</h1><ol>
    <li><a href="ch1.xhtml">I. The Harbour Wakes</a></li>
    <li><a href="ch2.xhtml">II. A Steady Wind</a></li>
    <li><a href="ch3.xhtml">III. Hammered Pewter</a></li>
    <li><a href="notes.xhtml">Notes</a></li>
  </ol></nav>
</body></html>`,
)

zip.file(
  'OEBPS/cover.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E7490"/><stop offset="1" stop-color="#0C1A22"/></linearGradient></defs><rect width="600" height="900" fill="url(#g)"/><circle cx="440" cy="240" r="90" fill="#F0C98C" opacity="0.9"/><path d="M60 560c50-30 100-30 150 0s100 30 150 0 100-30 150 0" stroke="#FBF9F4" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.85"/><path d="M80 640c50-30 100-30 150 0s100 30 150 0 100-30 150 0" stroke="#FBF9F4" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.5"/><text x="300" y="130" font-family="Georgia, serif" font-size="52" fill="#FBF9F4" text-anchor="middle">A Voyage by the Sea</text><text x="300" y="820" font-family="Georgia, serif" font-size="30" fill="#FBF9F4" opacity="0.75" text-anchor="middle">M. Halloway</text></svg>`,
)

const page = (title, body) => `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><title>${title}</title></head>
<body>${body}</body></html>`

zip.file('OEBPS/ch1.xhtml', page('I. The Harbour Wakes', chapter(1, 'I. The Harbour Wakes', 0)))
zip.file('OEBPS/ch2.xhtml', page('II. A Steady Wind', chapter(2, 'II. A Steady Wind', 2)))
zip.file('OEBPS/ch3.xhtml', page('III. Hammered Pewter', chapter(3, 'III. Hammered Pewter', 4)))
zip.file('OEBPS/notes.xhtml', page('Notes', notes))

const buffer = await zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' })
const out = path.join(outDir, 'a-voyage-by-the-sea.epub')
writeFileSync(out, buffer)
console.log(`wrote ${out} (${(buffer.length / 1024).toFixed(1)} KB)`)
