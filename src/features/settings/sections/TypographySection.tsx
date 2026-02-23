import { SelectField, SliderRow } from '@/components/ui/controls'
import { DEFAULT_SETTINGS } from '@/state/settingsStore'
import type { FontId, SettingsPatch, TypographySettings } from '@/types/settings'
import { Section } from './shared'

const WEIGHT_NAMES: Record<number, string> = {
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semibold',
  700: 'Bold',
}

export function TypographySection({
  typography,
  update,
}: {
  typography: TypographySettings
  update: (patch: SettingsPatch) => void
}) {
  const setT = (patch: Partial<TypographySettings>) => update({ typography: patch })
  // When publisher styles are honored, the book controls its own typography;
  // these controls would have no visible effect, so they're disabled.
  const pub = typography.publisherStyles
  const pubHint = 'Disabled while Publisher styles is on'

  return (
    <Section title="Typography">
      <SelectField<FontId>
        label="Font"
        value={typography.fontFamily}
        onChange={(fontFamily) => setT({ fontFamily })}
        disabled={pub}
        disabledHint={pubHint}
        options={[
          { value: 'literata', label: 'Literata (serif)' },
          { value: 'inter', label: 'Inter (sans)' },
          { value: 'atkinson', label: 'Atkinson Hyperlegible' },
          { value: 'rounded', label: 'Rounded (system)' },
          { value: 'serif', label: 'Serif (system)' },
          { value: 'sans', label: 'Sans (system)' },
          { value: 'custom', label: 'Custom…' },
        ]}
      />
      {typography.fontFamily === 'custom' && (
        <input
          className="sp-input font-mono text-[12px] disabled:pointer-events-none disabled:opacity-40"
          placeholder="e.g. 'Charter', Georgia, serif"
          value={typography.customFontFamily}
          onChange={(e) => setT({ customFontFamily: e.target.value })}
          aria-label="Custom font family"
          spellCheck={false}
          disabled={pub}
          aria-disabled={pub || undefined}
          title={pub ? pubHint : undefined}
        />
      )}

      <SliderRow
        label="Font size"
        value={typography.fontSize}
        min={10}
        max={200}
        step={1}
        disabled={pub}
        disabledHint={pubHint}
        defaultValue={DEFAULT_SETTINGS.typography.fontSize}
        format={(v) => `${v}px`}
        onChange={(fontSize) => setT({ fontSize })}
      />
      <SliderRow
        label="Font weight"
        value={typography.fontWeight}
        min={300}
        max={700}
        step={100}
        disabled={pub}
        disabledHint={pubHint}
        defaultValue={DEFAULT_SETTINGS.typography.fontWeight}
        format={(v) => WEIGHT_NAMES[v] ?? String(v)}
        onChange={(fontWeight) => setT({ fontWeight })}
      />
      <SliderRow
        label="Line spacing"
        value={typography.lineHeight}
        min={1.0}
        max={3.0}
        step={0.05}
        disabled={pub}
        disabledHint={pubHint}
        defaultValue={DEFAULT_SETTINGS.typography.lineHeight}
        format={(v) => v.toFixed(2)}
        onChange={(lineHeight) => setT({ lineHeight })}
      />
      <SliderRow
        label="Word spacing"
        value={typography.wordSpacing}
        min={-4}
        max={32}
        step={0.5}
        disabled={pub}
        disabledHint={pubHint}
        defaultValue={DEFAULT_SETTINGS.typography.wordSpacing}
        format={(v) => `${v > 0 ? '+' : ''}${v}px`}
        onChange={(wordSpacing) => setT({ wordSpacing })}
      />
      <SliderRow
        label="Letter spacing"
        value={typography.letterSpacing}
        min={-1}
        max={6}
        step={0.1}
        disabled={pub}
        disabledHint={pubHint}
        defaultValue={DEFAULT_SETTINGS.typography.letterSpacing}
        format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}px`}
        onChange={(letterSpacing) => setT({ letterSpacing })}
      />
      <SliderRow
        label="Paragraph spacing"
        value={typography.paragraphSpacing}
        min={0}
        max={4}
        step={0.05}
        disabled={pub}
        disabledHint={pubHint}
        defaultValue={DEFAULT_SETTINGS.typography.paragraphSpacing}
        format={(v) => `${v.toFixed(2)}em`}
        onChange={(paragraphSpacing) => setT({ paragraphSpacing })}
      />
    </Section>
  )
}
