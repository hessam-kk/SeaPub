/**
 * Generates SeaPub app icons (PNG/ICO/ICNS) from the logo SVG using
 * @resvg/resvg-js. Run once before the first `tauri build`:
 *
 *   npm run icons
 */
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const svgPath = path.join(root, 'public', 'favicon.svg')
const outDir = path.join(root, 'src-tauri', 'icons')

if (!existsSync(svgPath)) {
  console.error('favicon.svg not found — run from the project root.')
  process.exit(1)
}

const svg = readFileSync(svgPath, 'utf8')

mkdirSync(outDir, { recursive: true })

const sizes = [32, 128, 256]
for (const size of sizes) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  const name = size === 256 ? '128x128@2x.png' : `${size}x${size}.png`
  writeFileSync(path.join(outDir, name), png)
  console.log('wrote', name)
}

// Square padding for .ico / .icns (rounded rect already inside the SVG).
const resvg512 = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } })
const png512 = resvg512.render().asPng()
writeFileSync(path.join(outDir, 'icon.png'), png512)
console.log('wrote icon.png (512)')

// Minimal ICO wrapping the 32px and 256px PNGs (valid, uncompressed BMP-style).
function pngToIco(pngBuffers) {
  const count = pngBuffers.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)

  const entries = []
  let offset = 6 + 16 * count
  for (const { size, data } of pngBuffers) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    entries.push(entry)
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.data)])
}

const ico = pngToIco([
  { size: 32, data: readFileSync(path.join(outDir, '32x32.png')) },
  { size: 256, data: readFileSync(path.join(outDir, 'icon.png')) },
])
writeFileSync(path.join(outDir, 'icon.ico'), ico)
console.log('wrote icon.ico')

// Minimal ICNS wrapping the 512px PNG (ic07 type).
const icnsPng = readFileSync(path.join(outDir, 'icon.png'))
const type = Buffer.from('ic07', 'ascii')
const len = Buffer.alloc(4)
len.writeUInt32BE(icnsPng.length + 8, 0)
const header = Buffer.from('icns', 'ascii')
writeFileSync(path.join(outDir, 'icon.icns'), Buffer.concat([header, len, type, len, icnsPng]))
console.log('wrote icon.icns')

console.log('\nDone. Icons are in src-tauri/icons/.')
