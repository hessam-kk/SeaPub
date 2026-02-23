import { Drawer } from '@/components/ui/Drawer'
import { Toggle } from '@/components/ui/controls'
import type { ReaderSettings, SettingsPatch } from '@/types/settings'
import { ThemeSection } from './sections/ThemeSection'
import { TypographySection } from './sections/TypographySection'
import { LayoutSection } from './sections/LayoutSection'
import { ReadingSection } from './sections/ReadingSection'
import { AdvancedSection } from './sections/AdvancedSection'

export function SettingsDrawer({
  scope,
  open,
  onClose,
  settings,
  update,
  useBookOverride,
  onToggleBookOverride,
  onResetBook,
  onResetGlobal,
}: {
  scope: 'global' | 'book'
  open: boolean
  onClose: () => void
  settings: ReaderSettings
  update: (patch: SettingsPatch) => void
  useBookOverride?: boolean
  onToggleBookOverride?: (on: boolean) => void
  onResetBook?: () => void
  onResetGlobal: () => void
}) {
  return (
    <Drawer side="right" open={open} onClose={onClose} title="Reading settings" width={372}>
      {scope === 'book' && onToggleBookOverride && (
        <div className="mb-4 rounded-xl bg-surface-2 px-3 py-2">
          <Toggle
            checked={!!useBookOverride}
            onChange={onToggleBookOverride}
            label="Custom settings for this book"
            description="Kept separately from your global defaults"
          />
        </div>
      )}

      <ThemeSection appearance={settings.appearance} update={update} />
      <TypographySection typography={settings.typography} update={update} />
      <LayoutSection
        typography={settings.typography}
        layout={settings.layout}
        update={update}
      />
      <ReadingSection
        layout={settings.layout}
        typography={settings.typography}
        view={settings.view}
        update={update}
      />
      <AdvancedSection
        typography={settings.typography}
        scope={scope}
        update={update}
        onResetBook={onResetBook}
        onResetGlobal={onResetGlobal}
      />
    </Drawer>
  )
}
