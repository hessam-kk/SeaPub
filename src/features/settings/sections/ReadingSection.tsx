import { BookOpen, ScrollText } from 'lucide-react'
import { SegmentedControl, Toggle } from '@/components/ui/controls'
import type {
  LayoutSettings,
  ReadingFlow,
  SettingsPatch,
  TypographySettings,
  ViewSettings,
} from '@/types/settings'
import { Section } from './shared'

export function ReadingSection({
  layout,
  typography,
  view,
  update,
}: {
  layout: LayoutSettings
  typography: TypographySettings
  view: ViewSettings
  update: (patch: SettingsPatch) => void
}) {
  return (
    <Section title="Reading">
      <div>
        <div className="mb-1.5 text-[13px] text-ink">Reading mode</div>
        <SegmentedControl<ReadingFlow>
          label="Reading mode"
          value={layout.flow}
          options={[
            { value: 'paginated', label: 'Pages', icon: <BookOpen size={13} /> },
            { value: 'scrolled', label: 'Scroll', icon: <ScrollText size={13} /> },
          ]}
          onChange={(flow) => update({ layout: { flow } })}
        />
      </div>

      <Toggle
        checked={view.autoHideChrome}
        onChange={(autoHideChrome) => update({ view: { autoHideChrome } })}
        label="Auto-hide controls"
        description="Bars fade away while you read and return on movement"
      />

      <Toggle
        checked={typography.publisherStyles}
        onChange={(publisherStyles) => update({ typography: { publisherStyles } })}
        label="Publisher styles"
        description="Use the book's own typography instead of SeaPub settings"
      />
    </Section>
  )
}
