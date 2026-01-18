export type ThemeMode = 'light' | 'dark' | 'system'
export type AlignMode = 'left' | 'center' | 'right' | 'justify'
export type ReadingFlow = 'paginated' | 'scrolled'
export type PresetId =
  | 'paper'
  | 'sepia'
  | 'warm-sand'
  | 'ocean-mist'
  | 'slate'
  | 'midnight'
  | 'deep-sea'
  | 'custom'

export type FontId = 'literata' | 'inter' | 'atkinson' | 'rounded' | 'serif' | 'sans' | 'custom'

export interface TypographySettings {
  fontFamily: FontId
  /** Free-form font stack used when fontFamily === 'custom'. */
  customFontFamily: string
  /** px */
  fontSize: number
  /** 300–700 */
  fontWeight: number
  /** unitless */
  lineHeight: number
  /** px */
  wordSpacing: number
  /** px */
  letterSpacing: number
  /** em, space below each paragraph */
  paragraphSpacing: number
  align: AlignMode
  hyphenation: boolean
  /** maximum line length in characters */
  maxLineCh: number
  /** honor the book's own stylesheets (true) or apply SeaPub overrides (false) */
  publisherStyles: boolean
  customCss: string
  customCssEnabled: boolean
}

export interface LayoutSettings {
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  /** link all four margins together */
  linkMargins: boolean
  flow: ReadingFlow
}

export interface AppearanceSettings {
  mode: ThemeMode
  preset: PresetId
  /** custom background color (overrides preset) */
  customBg: string | null
  /** custom text color; null = auto-contrast from background */
  customText: string | null
  highContrast: boolean
}

export interface ViewSettings {
  autoHideChrome: boolean
}

export interface ReaderSettings {
  typography: TypographySettings
  layout: LayoutSettings
  appearance: AppearanceSettings
  view: ViewSettings
}

/** A partial update routed to global settings or a per-book override. */
export interface SettingsPatch {
  typography?: Partial<TypographySettings>
  layout?: Partial<LayoutSettings>
  appearance?: Partial<AppearanceSettings>
  view?: Partial<ViewSettings>
}
