import { describe, expect, it } from 'vitest'
import { contrastRatio, relativeLuminance, suggestTextColor, isDarkColor } from './contrast'

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('handles 3-digit hex', () => {
    expect(relativeLuminance('#FFF')).toBeCloseTo(1, 5)
    expect(relativeLuminance('#000')).toBeCloseTo(0, 5)
  })
})

describe('contrastRatio', () => {
  it('gives 21:1 for black vs white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#26303B', '#FBF9F4')).toBeCloseTo(
      contrastRatio('#FBF9F4', '#26303B'),
      10,
    )
  })

  it('paper preset text meets WCAG AA (4.5:1)', () => {
    expect(contrastRatio('#26303B', '#FBF9F4')).toBeGreaterThanOrEqual(4.5)
  })

  it('deep sea preset text meets WCAG AA (4.5:1)', () => {
    expect(contrastRatio('#C9D8DC', '#0C1A22')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('suggestTextColor', () => {
  it('suggests light ink on dark backgrounds', () => {
    expect(suggestTextColor('#0C1A22')).toBe('#E8E4D9')
  })

  it('suggests dark ink on light backgrounds', () => {
    expect(suggestTextColor('#FBF9F4')).toBe('#26303B')
  })

  it('suggestions always meet 4.5:1 against the background', () => {
    for (const bg of ['#F4E8D1', '#3B4652', '#151C2C', '#E8F0F2', '#123456', '#ABCDEF']) {
      const text = suggestTextColor(bg)
      expect(contrastRatio(bg, text)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('isDarkColor', () => {
  it('classifies dark and light surfaces', () => {
    expect(isDarkColor('#151C2C')).toBe(true)
    expect(isDarkColor('#FBF9F4')).toBe(false)
  })
})
