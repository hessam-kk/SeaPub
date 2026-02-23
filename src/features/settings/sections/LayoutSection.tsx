import { type ReactNode } from 'react'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Link2, Link2Off } from 'lucide-react'
import { SegmentedControl, SliderRow, Toggle } from '@/components/ui/controls'
import { DEFAULT_SETTINGS } from '@/state/settingsStore'
import { useWindowWidth } from '@/hooks/useWindowWidth'
import type {
  AlignMode,
  LayoutSettings,
  SettingsPatch,
  TypographySettings,
} from '@/types/settings'
import { Section } from './shared'

const ALIGNMENTS: { value: AlignMode; label: string; icon: ReactNode }[] = [
  { value: 'left', label: 'Left', icon: <AlignLeft size={13} /> },
  { value: 'center', label: 'Center', icon: <AlignCenter size={13} /> },
  { value: 'right', label: 'Right', icon: <AlignRight size={13} /> },
  { value: 'justify', label: 'Justify', icon: <AlignJustify size={13} /> },
]

export function LayoutSection({
  typography,
  layout,
  update,
}: {
  typography: TypographySettings
  layout: LayoutSettings
  update: (patch: SettingsPatch) => void
}) {
  const setT = (patch: Partial<TypographySettings>) => update({ typography: patch })
  const setL = (patch: Partial<LayoutSettings>) => update({ layout: patch })

  // Horizontal margins may each consume up to 45% of the viewport, so both
  // maxed leaves a 10%-wide text column.
  const winWidth = useWindowWidth()
  const maxH = Math.max(120, Math.floor(winWidth * 0.45))
  // Publisher styles control typography (including alignment), not layout.
  const pub = typography.publisherStyles
  const pubHint = 'Disabled while Publisher styles is on'

  const setMargin = (side: 'Top' | 'Right' | 'Bottom' | 'Left', value: number) => {
    if (layout.linkMargins) {
      // Linked in pairs: horizontal sides together, vertical sides together.
      if (side === 'Left' || side === 'Right') {
        setL({ marginLeft: value, marginRight: value })
      } else {
        setL({ marginTop: value, marginBottom: value })
      }
    } else {
      setL({ [`margin${side}`]: value } as Partial<LayoutSettings>)
    }
  }

  const toggleLink = () => {
    if (layout.linkMargins) {
      setL({ linkMargins: false })
    } else {
      // Pair-average on enable: left=right, top=bottom.
      const h = Math.round((layout.marginLeft + layout.marginRight) / 2)
      const v = Math.round((layout.marginTop + layout.marginBottom) / 2)
      setL({
        linkMargins: true,
        marginLeft: h,
        marginRight: h,
        marginTop: v,
        marginBottom: v,
      })
    }
  }

  return (
    <Section title="Layout">
      <div>
        <div className="mb-1.5 text-[13px] text-ink">Text alignment</div>
        <SegmentedControl<AlignMode>
          label="Text alignment"
          value={typography.align}
          options={ALIGNMENTS}
          onChange={(align) => setT({ align })}
          className="w-full"
          disabled={pub}
          disabledHint={pubHint}
        />
      </div>

      <Toggle
        checked={typography.hyphenation}
        onChange={(hyphenation) => setT({ hyphenation })}
        label="Hyphenation"
        description="Break long words gracefully — best with justified text"
        disabled={pub}
        disabledHint={pubHint}
      />

      <SliderRow
        label="Maximum line width"
        value={typography.maxLineCh}
        min={20}
        max={140}
        defaultValue={DEFAULT_SETTINGS.typography.maxLineCh}
        format={(v) => `${v} ch`}
        onChange={(maxLineCh) => setT({ maxLineCh })}
      />

      <div className="flex items-center justify-between rounded-[10px] bg-surface-2 px-3 py-2">
        <span>
          <span className="block text-[13px] text-ink">Link margin pairs</span>
          <span className="block text-[12px] text-ink-2">Left + right and top + bottom move together</span>
        </span>
        <button
          role="switch"
          aria-checked={layout.linkMargins}
          aria-label="Link margin pairs"
          onClick={toggleLink}
          className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          {layout.linkMargins ? <Link2 size={13} /> : <Link2Off size={13} />}
          {layout.linkMargins ? 'Linked' : 'Independent'}
        </button>
      </div>

      <SliderRow
        label="Top margin"
        value={layout.marginTop}
        min={0}
        max={320}
        step={2}
        defaultValue={DEFAULT_SETTINGS.layout.marginTop}
        unit="px"
        onChange={(v) => setMargin('Top', v)}
      />
      <SliderRow
        label="Right margin"
        value={layout.marginRight}
        min={0}
        max={maxH}
        step={2}
        defaultValue={DEFAULT_SETTINGS.layout.marginRight}
        unit="px"
        onChange={(v) => setMargin('Right', v)}
      />
      <SliderRow
        label="Bottom margin"
        value={layout.marginBottom}
        min={0}
        max={320}
        step={2}
        defaultValue={DEFAULT_SETTINGS.layout.marginBottom}
        unit="px"
        onChange={(v) => setMargin('Bottom', v)}
      />
      <SliderRow
        label="Left margin"
        value={layout.marginLeft}
        min={0}
        max={maxH}
        step={2}
        defaultValue={DEFAULT_SETTINGS.layout.marginLeft}
        unit="px"
        onChange={(v) => setMargin('Left', v)}
      />
      {import.meta.env.DEV && (
        <p className="text-[11.5px] text-ink-2">
          Tip: you can also drag the margin edges directly in the reading view.
        </p>
      )}
    </Section>
  )
}
