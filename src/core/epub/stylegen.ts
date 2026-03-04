import type { TypographySettings } from '@/types/settings'
import type { ResolvedReadingColors } from '@/core/theme/presets'

// Self-hosted fonts; also injected into EPUB iframes (which do not inherit
// parent-document fonts).
import literataUrl from '@fontsource-variable/literata/files/literata-latin-wght-normal.woff2?url'
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import atkinson400Url from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2?url'
import atkinson700Url from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2?url'

export const FONT_STACKS: Record<string, string> = {
  literata: `'Literata Variable', Georgia, 'Iowan Old Style', 'Times New Roman', serif`,
  inter: `'Inter Variable', ui-sans-serif, system-ui, 'Segoe UI', sans-serif`,
  atkinson: `'Atkinson Hyperlegible', Verdana, Tahoma, sans-serif`,
  rounded: `ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, 'Segoe UI', sans-serif`,
  serif: `Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif`,
  sans: `system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`,
}

function fontFaces(): string {
  return `
@font-face {
  font-family: 'Literata Variable';
  src: url('${literataUrl}') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter Variable';
  src: url('${interUrl}') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Atkinson Hyperlegible';
  src: url('${atkinson400Url}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Atkinson Hyperlegible';
  src: url('${atkinson700Url}') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
`.trim()
}

export interface ReaderCssInput {
  typography: TypographySettings
  colors: ResolvedReadingColors
}

/**
 * Build the full stylesheet injected into every EPUB section iframe.
 *
 * Theme colors (background, text, links, selection) are always applied —
 * the reading theme is the app's domain, needed for dark mode etc. The
 * typography rules (font family/size/weight/spacing/alignment) are only
 * emitted when "publisher styles" is off; when it's on, the book's own
 * stylesheets control typography.
 */
export function generateReaderCss({ typography: t, colors }: ReaderCssInput): string {
  const stack =
    t.fontFamily === 'custom'
      ? t.customFontFamily.trim() || FONT_STACKS.serif
      : FONT_STACKS[t.fontFamily] ?? FONT_STACKS.serif

  const justify = t.align === 'justify'
  const align = t.align === 'justify' ? 'justify' : t.align

  const theme = `
${fontFaces()}

html {
  background: ${colors.bg};
  overflow-x: hidden;
}
body {
  color: ${colors.text};
  background: ${colors.bg};
  overflow-wrap: break-word;
  overflow-x: hidden;
  padding: 0 !important;
  margin: 0;
}
img, svg, video {
  max-width: 100%;
  height: auto;
}
a {
  color: ${colors.dark ? '#7dd3fc' : '#0e7490'};
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}
table {
  max-width: 100%;
}
::selection {
  background: ${colors.dark ? 'rgba(125, 211, 252, 0.35)' : 'rgba(14, 116, 144, 0.22)'};
}
`.trim()

  // !important on the body declarations: publisher stylesheets commonly
  // target the same element with a class (e.g. Calibre's `body.calibre`,
  // specificity 0,1,0), which would otherwise beat our plain `body` rule
  // (0,0,1) and make the Font/Size sliders appear to do nothing.
  const typographyCss = t.publisherStyles
    ? ''
    : `
body {
  font-family: ${stack} !important;
  font-size: ${t.fontSize}px !important;
  font-weight: ${t.fontWeight} !important;
  line-height: ${t.lineHeight} !important;
  word-spacing: ${t.wordSpacing}px !important;
  letter-spacing: ${t.letterSpacing}px !important;
  text-align: ${align} !important;
  -webkit-hyphens: ${justify && t.hyphenation ? 'auto' : 'manual'};
  hyphens: ${justify && t.hyphenation ? 'auto' : 'manual'};
  -webkit-hyphenate-limit-chars: 6 3 3;
}
p {
  margin-block: 0 ${t.paragraphSpacing}em;
  text-indent: 0;
}
/* Apply line-height to content elements directly, not just body: publisher
   styles commonly set line-height on p/li (often via classes, which beat a
   plain element selector), which would otherwise make the Line spacing
   slider appear to do nothing. */
p, li, blockquote, dd, dt, figcaption, td, th {
  line-height: ${t.lineHeight} !important;
}
h1, h2, h3, h4, h5, h6 {
  line-height: 1.25;
}
`.trim()

  // "Override publisher typography": neutralize embedded font/color styling
  // while keeping headings' sizes and the document structure intact.
  // NOTE: scoped to descendants (`body *`), never bare `body` — the body's
  // own font/color/line-height are SeaPub's typography + theme set above,
  // and resetting them here (same specificity, later in source order) would
  // clobber our own rules and make font changes appear to do nothing.
  const override = t.publisherStyles
    ? ''
    : `
body *:not(img):not(svg):not(image) {
  font-family: inherit;
  color: inherit !important;
  background-color: transparent !important;
  line-height: inherit;
}
h1, h2, h3, h4, h5, h6, p, li, blockquote, dd, dt, td, th, figcaption {
  font-family: inherit !important;
}
`.trim()

  const custom = t.customCssEnabled && t.customCss.trim() ? `\n\n${t.customCss.trim()}` : ''

  return [theme, typographyCss, override, custom].filter(Boolean).join('\n\n')
}
