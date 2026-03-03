import { describe, expect, it } from 'vitest'
import { generateReaderCss, FONT_STACKS } from './stylegen'
import { DEFAULT_SETTINGS } from '@/state/settingsStore'
import type { TypographySettings } from '@/types/settings'

function withTypography(patch: Partial<TypographySettings>): TypographySettings {
  return { ...DEFAULT_SETTINGS.typography, ...patch }
}

describe('generateReaderCss', () => {
  it('always includes font faces and theme colors', () => {
    const css = generateReaderCss({
      typography: DEFAULT_SETTINGS.typography,
      colors: { bg: '#FBF9F4', text: '#26303B', dark: false },
    })
    expect(css).toContain('@font-face')
    expect(css).toContain('background: #FBF9F4')
  })

  it('emits typography rules only when publisher styles are off', () => {
    const overridden = generateReaderCss({
      typography: withTypography({ publisherStyles: false, fontSize: 21 }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(overridden).toContain(FONT_STACKS.literata)
    expect(overridden).toContain('font-size: 21px')

    const honoring = generateReaderCss({
      typography: withTypography({ publisherStyles: true, fontSize: 21 }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(honoring).not.toContain('font-size:')
    expect(honoring).not.toContain('word-spacing:')
    expect(honoring).not.toContain('text-align:')
  })

  it('enables auto hyphenation only for justified text', () => {
    const justify = generateReaderCss({
      typography: withTypography({ align: 'justify', hyphenation: true, publisherStyles: false }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(justify).toContain('hyphens: auto')

    const left = generateReaderCss({
      typography: withTypography({ align: 'left', hyphenation: true, publisherStyles: false }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(left).not.toContain('hyphens: auto')
  })

  it('applies word and letter spacing independently', () => {
    const css = generateReaderCss({
      typography: withTypography({ wordSpacing: 4, letterSpacing: 1.5, publisherStyles: false }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(css).toContain('word-spacing: 4px')
    expect(css).toContain('letter-spacing: 1.5px')
  })

  it('sets line-height on content elements, not just body', () => {
    const css = generateReaderCss({
      typography: withTypography({ lineHeight: 2.1, publisherStyles: false }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    // Publisher styles often set line-height on p/li directly; the user's
    // line spacing must target the same elements to win.
    expect(css).toMatch(/p, li, blockquote[^{]*\{[^}]*line-height: 2\.1/s)
  })

  it('emits the publisher override layer only when disabled', () => {
    const withOverride = generateReaderCss({
      typography: withTypography({ publisherStyles: false }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(withOverride).toContain('background-color: transparent')

    const honoring = generateReaderCss({
      typography: withTypography({ publisherStyles: true }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(honoring).not.toContain('background-color: transparent')
  })

  it('marks body typography !important so it beats publisher body classes', () => {
    // Real books (e.g. Calibre conversions) style `body.calibre` (0,1,0),
    // which beats a plain `body` rule (0,0,1) on the same element.
    const css = generateReaderCss({
      typography: withTypography({ publisherStyles: false, fontSize: 21 }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(css).toContain(`${FONT_STACKS.literata} !important`)
    expect(css).toContain('font-size: 21px !important')
  })

  it('never resets the body element itself in the override layer', () => {
    // The override must only neutralize descendants; resetting bare `body`
    // (same specificity, later in source order) would clobber SeaPub's own
    // font/color/line-height set above and make font changes do nothing.
    const css = generateReaderCss({
      typography: withTypography({ publisherStyles: false }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(css).not.toContain('body, body *')
    expect(css).toContain('body *:not(img)')
    expect(css).toContain('font-family: inherit')
  })

  it('appends custom CSS when enabled', () => {
    const css = generateReaderCss({
      typography: withTypography({ customCssEnabled: true, customCss: 'p { text-indent: 2em; }' }),
      colors: { bg: '#fff', text: '#000', dark: false },
    })
    expect(css).toContain('p { text-indent: 2em; }')
  })
})
